import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Gift, Zap, Star, Award, ChevronRight, Copy, CheckCircle2, Lock } from 'lucide-react';
import JharokhaArch from '@/components/admin/JharokhaArch';

// ─── Types ────────────────────────────────────────────────────────────────────
interface CoinWallet {
  balance: number;
  lifetime_earned: number;
  tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
}

interface CoinTransaction {
  id: string;
  coins: number;
  reason: string;
  created_at: string;
}

interface Reward {
  id: string;
  reward_name: string;
  description: string;
  coins_required: number;
  discount_pct: number;
  discount_flat: number;
  reward_type: string;
}

interface RedeemedReward {
  id: string;
  coupon_code: string;
  coins_spent: number;
  is_used: boolean;
  expires_at: string;
  created_at: string;
  coin_rewards: { reward_name: string };
}

// ─── Tier Config ──────────────────────────────────────────────────────────────
const TIER_CONFIG = {
  Bronze:   { color: '#CD7F32', bg: '#FDF3E7', icon: '🥉', next: 'Silver',   nextAt: 100  },
  Silver:   { color: '#94A3B8', bg: '#F8FAFC', icon: '🥈', next: 'Gold',     nextAt: 200  },
  Gold:     { color: '#F59E0B', bg: '#FFFBEB', icon: '🥇', next: 'Platinum', nextAt: 500  },
  Platinum: { color: '#8B5CF6', bg: '#F5F3FF', icon: '💎', next: null,       nextAt: null },
};

const REASON_LABELS: Record<string, string> = {
  feedback_submitted:  '📋 Feedback submitted on time',
  reward_redeemed:     '🎁 Reward redeemed',
  bonus_ontime:        '⚡ On-time bonus',
  daily_login:         '🌅 Daily login',
};

// ─── Coin Wallet Component ─────────────────────────────────────────────────────
const CoinWallet = ({ patientId }: { patientId: string }) => {
  const [wallet, setWallet] = useState<CoinWallet | null>(null);
  const [transactions, setTransactions] = useState<CoinTransaction[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [redeemed, setRedeemed] = useState<RedeemedReward[]>([]);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const db = supabase as any;

  const fetchAll = async () => {
    const [walletRes, txRes, rewardsRes, redeemedRes] = await Promise.all([
      db.from('patient_coins').select('*').eq('patient_id', patientId).maybeSingle(),
      db.from('coin_transactions').select('*').eq('patient_id', patientId).order('created_at', { ascending: false }).limit(10),
      db.from('coin_rewards').select('*').eq('is_active', true).order('coins_required', { ascending: true }),
      db.from('redeemed_rewards').select('*, coin_rewards(reward_name)').eq('patient_id', patientId).eq('is_used', false).order('created_at', { ascending: false }).limit(5),
    ]);
    setWallet(walletRes.data ?? { balance: 0, lifetime_earned: 0, tier: 'Bronze' });
    setTransactions(txRes.data ?? []);
    setRewards(rewardsRes.data ?? []);
    setRedeemed(redeemedRes.data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, [patientId]);

  const handleRedeem = async (reward: Reward) => {
    if (!wallet || wallet.balance < reward.coins_required) {
      toast.error(`You need ${reward.coins_required - (wallet?.balance ?? 0)} more coins to redeem this.`);
      return;
    }
    setRedeeming(reward.id);
    try {
      // Generate coupon code
      const code = `SANJ-${reward.reward_type.toUpperCase().slice(0, 4)}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      // Deduct coins
      await db.from('patient_coins').update({
        balance: wallet.balance - reward.coins_required,
        updated_at: new Date().toISOString(),
      }).eq('patient_id', patientId);

      // Log transaction
      await db.from('coin_transactions').insert([{
        patient_id: patientId,
        coins: -reward.coins_required,
        reason: 'reward_redeemed',
        reference_id: reward.id,
      }]);

      // Create redeemed record
      await db.from('redeemed_rewards').insert([{
        patient_id: patientId,
        reward_id: reward.id,
        coupon_code: code,
        coins_spent: reward.coins_required,
        expires_at: expiresAt.toISOString(),
      }]);

      toast.success(`🎁 Reward redeemed! Your code: ${code}`);
      await fetchAll();
    } catch (e: any) {
      toast.error('Failed to redeem: ' + e.message);
    } finally {
      setRedeeming(null);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success('Coupon code copied!');
    setTimeout(() => setCopiedCode(null), 3000);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl overflow-hidden p-6 flex items-center justify-center" style={{ border: '1px solid #E2EEF1' }}>
        <Loader2 size={20} className="animate-spin" style={{ color: '#F59E0B' }} />
      </div>
    );
  }

  const tier = (wallet?.tier ?? 'Bronze') as keyof typeof TIER_CONFIG;
  const tierMeta = TIER_CONFIG[tier];
  const balance = wallet?.balance ?? 0;
  const lifetime = wallet?.lifetime_earned ?? 0;

  // Progress to next tier
  const prevAt = tier === 'Bronze' ? 0 : tier === 'Silver' ? 100 : tier === 'Gold' ? 200 : 500;
  const nextAt = tierMeta.nextAt ?? lifetime;
  const tierProgress = tierMeta.nextAt
    ? Math.min(((lifetime - prevAt) / (nextAt - prevAt)) * 100, 100)
    : 100;

  return (
    <div className="bg-white rounded-xl overflow-hidden" style={{ border: `1px solid ${tierMeta.color}40` }}>
      <JharokhaArch color={tierMeta.color} opacity={0.18} />

      <div className="p-5">
        {/* ── Header: balance + tier ───────────────────────── */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Zap size={16} style={{ color: tierMeta.color }} />
              <span className="text-[13px] font-semibold" style={{ color: '#64748B' }}>Sanjeevani Coins</span>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-extrabold" style={{ color: tierMeta.color, fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
                {balance.toLocaleString()}
              </span>
              <span className="text-[13px] font-medium text-[#94A3B8] mb-1">coins</span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-bold"
              style={{ background: tierMeta.bg, color: tierMeta.color, border: `1.5px solid ${tierMeta.color}40` }}>
              {tierMeta.icon} {tier}
            </div>
            <span className="text-[11px] text-[#94A3B8]">{lifetime.toLocaleString()} lifetime</span>
          </div>
        </div>

        {/* ── Tier progress bar ────────────────────────────── */}
        {tierMeta.next && (
          <div className="mb-4">
            <div className="flex justify-between text-[11px] mb-1" style={{ color: '#94A3B8' }}>
              <span>{tier}</span>
              <span>{tierMeta.next} at {tierMeta.nextAt} coins</span>
            </div>
            <div className="h-2 rounded-full" style={{ background: '#F1F5F9' }}>
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${tierProgress}%`, background: `linear-gradient(90deg, ${tierMeta.color}, ${tierMeta.color}aa)` }} />
            </div>
            <p className="text-[11px] mt-1" style={{ color: '#94A3B8' }}>
              {tierMeta.nextAt! - lifetime} coins to {tierMeta.next}
            </p>
          </div>
        )}
        {!tierMeta.next && (
          <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg"
            style={{ background: '#F5F3FF', border: '1px solid #DDD6FE' }}>
            <Award size={14} style={{ color: '#8B5CF6' }} />
            <span className="text-[12px] font-semibold" style={{ color: '#7C3AED' }}>💎 Platinum Member — Maximum Tier Reached!</span>
          </div>
        )}

        {/* ── How to earn banner ───────────────────────────── */}
        <div className="rounded-xl p-3 mb-4 flex items-start gap-2"
          style={{ background: '#FFFBEB', border: '1px solid #FDE68A' }}>
          <Star size={14} className="mt-0.5 flex-shrink-0" style={{ color: '#F59E0B' }} />
          <p className="text-[12px]" style={{ color: '#92400E' }}>
            <strong>Earn 10–20 coins</strong> every time you submit prescription feedback on time. More coins = bigger discounts!
          </p>
        </div>

        {/* ── Active coupons ───────────────────────────────── */}
        {redeemed.length > 0 && (
          <div className="mb-4">
            <p className="text-[12px] font-semibold text-[#1E293B] mb-2">🎟️ Your Active Coupons</p>
            <div className="space-y-2">
              {redeemed.map(r => (
                <div key={r.id} className="flex items-center justify-between px-3 py-2 rounded-lg"
                  style={{ background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
                  <div>
                    <p className="text-[12px] font-bold font-mono text-[#065F46]">{r.coupon_code}</p>
                    <p className="text-[11px] text-[#94A3B8]">{r.coin_rewards?.reward_name}</p>
                  </div>
                  <button onClick={() => copyCode(r.coupon_code)}
                    className="p-1.5 rounded-lg transition-all hover:bg-green-100">
                    {copiedCode === r.coupon_code
                      ? <CheckCircle2 size={15} style={{ color: '#10B981' }} />
                      : <Copy size={15} style={{ color: '#10B981' }} />}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Rewards catalog ──────────────────────────────── */}
        <div className="mb-4">
          <p className="text-[12px] font-semibold text-[#1E293B] mb-2">🎁 Redeem Coins for Rewards</p>
          <div className="space-y-2">
            {rewards.map(reward => {
              const canRedeem = balance >= reward.coins_required;
              const isRedeeming = redeeming === reward.id;
              return (
                <div key={reward.id}
                  className="flex items-center justify-between p-3 rounded-xl transition-all"
                  style={{
                    background: canRedeem ? '#F8FAFC' : '#FAFAFA',
                    border: `1px solid ${canRedeem ? '#E2EEF1' : '#F1F5F9'}`,
                    opacity: canRedeem ? 1 : 0.6,
                  }}>
                  <div className="flex-1 min-w-0 mr-3">
                    <p className="text-[13px] font-semibold text-[#1E293B]">{reward.reward_name}</p>
                    <p className="text-[11px] text-[#94A3B8]">{reward.description}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[12px] font-bold" style={{ color: tierMeta.color }}>
                      🪙 {reward.coins_required}
                    </span>
                    <button
                      onClick={() => canRedeem && handleRedeem(reward)}
                      disabled={!canRedeem || !!redeeming}
                      className="px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all flex items-center gap-1"
                      style={{
                        background: canRedeem ? tierMeta.color : '#E2EEF1',
                        color: canRedeem ? 'white' : '#94A3B8',
                      }}>
                      {isRedeeming
                        ? <Loader2 size={12} className="animate-spin" />
                        : canRedeem ? <><Gift size={12} /> Redeem</> : <><Lock size={12} /> Locked</>}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Transaction history toggle ───────────────────── */}
        <button onClick={() => setShowHistory(!showHistory)}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-[13px] font-medium transition-all hover:bg-gray-50"
          style={{ color: '#64748B', border: '1px solid #E2EEF1' }}>
          <span>📜 Coin History</span>
          <ChevronRight size={14} className={`transition-transform ${showHistory ? 'rotate-90' : ''}`} />
        </button>

        {showHistory && transactions.length > 0 && (
          <div className="mt-3 space-y-2">
            {transactions.map(tx => (
              <div key={tx.id} className="flex items-center justify-between px-3 py-2 rounded-lg"
                style={{ background: '#F8FAFC' }}>
                <span className="text-[12px] text-[#475569]">
                  {REASON_LABELS[tx.reason] || tx.reason}
                </span>
                <span className={`text-[13px] font-bold ${tx.coins > 0 ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                  {tx.coins > 0 ? `+${tx.coins}` : tx.coins} 🪙
                </span>
              </div>
            ))}
          </div>
        )}
        {showHistory && transactions.length === 0 && (
          <p className="text-center text-[12px] text-[#94A3B8] mt-3">No transactions yet. Submit feedback to start earning!</p>
        )}
      </div>
    </div>
  );
};

export default CoinWallet;
