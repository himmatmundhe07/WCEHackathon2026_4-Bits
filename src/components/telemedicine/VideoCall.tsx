import { useState, useEffect } from 'react';
import AgoraRTC, {
  AgoraRTCProvider,
  useJoin,
  useLocalCameraTrack,
  useLocalMicrophoneTrack,
  useRemoteUsers,
  RemoteUser,
  LocalVideoTrack,
  usePublish,
} from "agora-rtc-react";
import { Mic, MicOff, Video, VideoOff, PhoneOff, Maximize2, Minimize2, Loader2, Activity, ChevronRight, ChevronLeft, Heart, Droplets } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });

interface VideoCallProps {
  channelName: string;
  onClose: () => void;
  userName?: string;
  patientId?: string;
}

const VideoCallContent = ({ channelName, onClose, userName, patientId }: VideoCallProps) => {
  const [micOn, setMic] = useState(true);
  const [videoOn, setVideo] = useState(true);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showVitals, setShowVitals] = useState(true);
  const [vitals, setVitals] = useState<any[]>([]);
  const [loadingVitals, setLoadingVitals] = useState(false);
  
  const appId = import.meta.env.VITE_AGORA_APP_ID || "a0a40d7a5e6a44af8760267a2374ab0b";
  
  const { isLoading: isJoining, error: joinError } = useJoin({
    appid: appId,
    channel: channelName,
    token: null,
  });

  const { localMicrophoneTrack } = useLocalMicrophoneTrack(micOn);
  const { localCameraTrack } = useLocalCameraTrack(videoOn);
  usePublish([localMicrophoneTrack, localCameraTrack]);
  const remoteUsers = useRemoteUsers();

  useEffect(() => {
    if (patientId) {
      fetchVitals();
    }
  }, [patientId]);

  const fetchVitals = async () => {
    setLoadingVitals(true);
    const { data } = await supabase
      .from('patient_vitals')
      .select('*')
      .eq('patient_id', patientId)
      .order('recorded_at', { ascending: false })
      .limit(5);
    setVitals(data || []);
    setLoadingVitals(false);
  };

  return (
    <div className={`relative bg-slate-900 overflow-hidden flex flex-col ${isFullScreen ? 'fixed inset-0 z-[200]' : 'rounded-2xl h-[600px] w-full border border-slate-700 shadow-2xl'}`}>
      
      {/* Header */}
      <div className="absolute top-0 inset-x-0 p-4 z-20 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 bg-red-500/20 border border-red-500/30 rounded-full">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-white text-xs font-bold uppercase tracking-wider">Live Consult</span>
          </div>
          <span className="text-slate-300 text-sm font-medium border-l border-slate-700 pl-3">Room: {channelName}</span>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowVitals(!showVitals)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-bold hover:bg-cyan-500/20 transition-all"
          >
            <Activity size={14} />
            {showVitals ? 'Hide Vitals' : 'Show Vitals'}
          </button>
          <button onClick={() => setIsFullScreen(!isFullScreen)} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white transition-colors">
            {isFullScreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        {/* Main Video Area */}
        <div className="flex-1 relative grid grid-cols-1 gap-2 p-2 bg-slate-950 transition-all duration-300">
          {remoteUsers.length > 0 ? (
            <div className="relative rounded-xl overflow-hidden bg-slate-800 border border-slate-700 shadow-inner">
              <RemoteUser user={remoteUsers[0]} />
              <div className="absolute bottom-4 left-4 px-3 py-1.5 bg-black/60 backdrop-blur-md rounded-lg text-white text-xs font-medium border border-white/10">
                Patient (Remote)
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center bg-slate-900/50 rounded-xl border border-slate-800 border-dashed m-4">
              {isJoining ? (
                <Loader2 className="animate-spin text-cyan-500 mb-4" size={40} />
              ) : (
                <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center mb-4 ring-8 ring-slate-900">
                  <Video size={32} className="text-slate-600" />
                </div>
              )}
              <p className="text-slate-400 font-medium">Waiting for participant to join...</p>
              <p className="text-slate-600 text-xs mt-2">Secure P2P Connection Active</p>
            </div>
          )}

          {/* Local User PIP */}
          <div className="absolute bottom-6 right-6 w-48 h-32 rounded-xl overflow-hidden bg-slate-800 border-2 border-slate-700 shadow-2xl z-10 transition-all hover:scale-105">
            {videoOn ? (
              <LocalVideoTrack track={localCameraTrack} play />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
                <div className="w-12 h-12 rounded-full bg-cyan-600 flex items-center justify-center text-white text-lg font-bold">
                  {userName?.slice(0, 1).toUpperCase() || 'Y'}
                </div>
              </div>
            )}
            <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/50 rounded text-[10px] text-white font-medium backdrop-blur-sm">
              You
            </div>
          </div>
        </div>

        {/* Vitals Sidebar */}
        <div className={`bg-slate-900 border-l border-slate-800 transition-all duration-300 ease-in-out overflow-hidden flex flex-col ${showVitals ? 'w-80' : 'w-0'}`}>
          <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Activity size={16} className="text-cyan-400" />
              Patient Health Profile
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {loadingVitals ? (
              <div className="flex flex-col items-center py-10">
                <Loader2 className="animate-spin text-slate-600 mb-2" size={20} />
                <p className="text-xs text-slate-500">Syncing vitals...</p>
              </div>
            ) : vitals.length > 0 ? (
              vitals.map((v, i) => (
                <div key={i} className="bg-slate-800/50 border border-slate-700 rounded-xl p-3 hover:bg-slate-800 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                      {new Date(v.recorded_at).toLocaleDateString()} {new Date(v.recorded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {v.vital_type === 'blood_pressure' ? <Heart size={14} className="text-red-400" /> : <Droplets size={14} className="text-cyan-400" />}
                  </div>
                  <p className="text-xs text-slate-400 mb-1">{v.vital_type.replace('_', ' ').toUpperCase()}</p>
                  <p className="text-xl font-bold text-white tabular-nums">
                    {v.reading_value} <span className="text-[10px] text-slate-500 font-normal ml-1">{v.reading_unit || ''}</span>
                  </p>
                  {v.notes && <p className="text-[10px] text-slate-500 mt-2 italic">"{v.notes}"</p>}
                </div>
              ))
            ) : (
              <div className="text-center py-10 px-4">
                <Activity size={32} className="text-slate-800 mx-auto mb-2" />
                <p className="text-slate-500 text-xs">No recent vital readings found for this patient.</p>
              </div>
            )}
          </div>
          <div className="p-4 bg-slate-950/50 border-t border-slate-800">
             <div className="flex items-center gap-2 text-[11px] text-slate-500">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                Real-time Sync Active
             </div>
          </div>
        </div>
      </div>

      {/* Controls Overlay */}
      <div className="p-6 bg-slate-900/90 backdrop-blur-xl flex justify-center items-center gap-6 border-t border-slate-800/50 relative z-30">
        <button
          onClick={() => setMic(!micOn)}
          className={`group flex flex-col items-center gap-2 transition-all`}
        >
          <div className={`p-4 rounded-2xl transition-all ${micOn ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-red-500 text-white animate-pulse'}`}>
            {micOn ? <Mic size={22} /> : <MicOff size={22} />}
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{micOn ? 'Mute' : 'Unmute'}</span>
        </button>
        
        <button
          onClick={onClose}
          className="group flex flex-col items-center gap-2"
        >
          <div className="p-5 rounded-3xl bg-red-600 text-white hover:bg-red-700 transition-all shadow-xl shadow-red-900/40 hover:scale-110 active:scale-95">
            <PhoneOff size={26} />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-red-500">End Call</span>
        </button>

        <button
          onClick={() => setVideo(!videoOn)}
          className="group flex flex-col items-center gap-2"
        >
          <div className={`p-4 rounded-2xl transition-all ${videoOn ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-red-500 text-white'}`}>
            {videoOn ? <Video size={22} /> : <VideoOff size={22} />}
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{videoOn ? 'Stop Cam' : 'Start Cam'}</span>
        </button>
      </div>

      {joinError && (
        <div className="absolute top-20 inset-x-0 mx-auto w-fit px-6 py-2 bg-red-500 text-white text-xs font-bold rounded-full shadow-2xl z-50 animate-bounce">
          NETWORK ERROR: {joinError.message}
        </div>
      )}
    </div>
  );
};

export const VideoCall = (props: VideoCallProps) => (
  <AgoraRTCProvider client={client}>
    <VideoCallContent {...props} />
  </AgoraRTCProvider>
);

export default VideoCall;
