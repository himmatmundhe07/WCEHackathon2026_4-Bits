import { Menu, User, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const NGOTopBar = ({ onMenuClick }: { onMenuClick: () => void }) => {
  const navigate = useNavigate();
  
  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login?role=ngo');
  };

  return (
    <header className="bg-white border-b border-slate-200 h-20 flex items-center justify-between px-4 lg:px-8 shadow-sm shadow-slate-200/50 relative z-10">
      <div className="flex items-center gap-4">
        {/* Mobile Menu Toggle */}
        <button 
          className="lg:hidden p-2 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors" 
          onClick={onMenuClick}
        >
          <Menu size={24} />
        </button>
        
        <h1 className="text-xl font-bold text-slate-800 hidden md:block">
          Welcome, NGO Partner
        </h1>
      </div>

      <div className="flex items-center gap-4">
        <button 
          onClick={handleLogout} 
          className="p-2 text-slate-600 hover:bg-rose-50 hover:text-rose-600 rounded-lg flex items-center gap-2 font-medium text-sm transition-colors duration-200 border border-transparent hover:border-rose-100"
        >
          <LogOut size={18} />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
};

export default NGOTopBar;
