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
import { Mic, MicOff, Video, VideoOff, PhoneOff, Maximize2, Minimize2, Loader2 } from 'lucide-react';

const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });

interface VideoCallProps {
  channelName: string;
  onClose: () => void;
  userName?: string;
}

const VideoCallContent = ({ channelName, onClose, userName }: VideoCallProps) => {
  const [micOn, setMic] = useState(true);
  const [videoOn, setVideo] = useState(true);
  const [isFullScreen, setIsFullScreen] = useState(false);
  
  // HARDCODED FALLBACK FOR HACKATHON RELIABILITY
  const appId = import.meta.env.VITE_AGORA_APP_ID || "a0a40d7a5e6a44af8760267a2374ab0b";
  
  // Join the channel
  const { isLoading: isJoining, error: joinError } = useJoin({
    appid: appId,
    channel: channelName,
    token: null,
  });

  // Local tracks
  const { localMicrophoneTrack } = useLocalMicrophoneTrack(micOn);
  const { localCameraTrack } = useLocalCameraTrack(videoOn);
  
  // Publish tracks
  usePublish([localMicrophoneTrack, localCameraTrack]);

  // Remote users
  const remoteUsers = useRemoteUsers();

  return (
    <div className={`relative bg-slate-900 overflow-hidden flex flex-col ${isFullScreen ? 'fixed inset-0 z-[200]' : 'rounded-2xl h-[500px] w-full border border-slate-700'}`}>
      
      {/* Header */}
      <div className="absolute top-0 inset-x-0 p-4 z-20 flex justify-between items-center bg-gradient-to-b from-black/60 to-transparent">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-white text-sm font-medium">Live Consultation: {channelName}</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setIsFullScreen(!isFullScreen)} className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors">
            {isFullScreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
        </div>
      </div>

      {/* Video Grid */}
      <div className="flex-1 relative grid grid-cols-1 md:grid-cols-2 gap-2 p-2 bg-slate-950">
        {/* Remote Users */}
        {remoteUsers.length > 0 ? (
          remoteUsers.map((user) => (
            <div key={user.uid} className="relative rounded-xl overflow-hidden bg-slate-800 border border-slate-700">
              <RemoteUser user={user} />
              <div className="absolute bottom-4 left-4 px-2 py-1 bg-black/50 rounded text-white text-xs">
                Remote Participant
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center bg-slate-800 rounded-xl border border-slate-700">
            {isJoining ? (
              <Loader2 className="animate-spin text-cyan-500 mb-2" size={32} />
            ) : (
              <div className="w-16 h-16 rounded-full bg-slate-700 flex items-center justify-center mb-3">
                <Video size={32} className="text-slate-500" />
              </div>
            )}
            <p className="text-slate-400 text-sm">Waiting for other participant...</p>
          </div>
        )}

        {/* Local User */}
        <div className="relative rounded-xl overflow-hidden bg-slate-800 border border-slate-700">
          {videoOn ? (
            <LocalVideoTrack track={localCameraTrack} play />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
              <div className="w-20 h-20 rounded-full bg-slate-700 flex items-center justify-center text-white text-2xl font-bold">
                {userName?.slice(0, 1).toUpperCase() || 'Y'}
              </div>
            </div>
          )}
          <div className="absolute bottom-4 left-4 px-2 py-1 bg-black/50 rounded text-white text-xs">
            You {userName ? `(${userName})` : ''}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="p-6 bg-slate-900 flex justify-center items-center gap-4 border-t border-slate-800">
        <button
          onClick={() => setMic(!micOn)}
          className={`p-4 rounded-full transition-all ${micOn ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-red-500 text-white hover:bg-red-600'}`}
        >
          {micOn ? <Mic size={24} /> : <MicOff size={24} />}
        </button>
        
        <button
          onClick={onClose}
          className="p-4 rounded-full bg-red-600 text-white hover:bg-red-700 transition-all shadow-lg shadow-red-900/20"
        >
          <PhoneOff size={24} />
        </button>

        <button
          onClick={() => setVideo(!videoOn)}
          className={`p-4 rounded-full transition-all ${videoOn ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-red-500 text-white hover:bg-red-600'}`}
        >
          {videoOn ? <Video size={24} /> : <VideoOff size={24} />}
        </button>
      </div>

      {joinError && (
        <div className="absolute bottom-24 inset-x-0 mx-auto w-fit px-4 py-2 bg-red-500 text-white text-xs rounded-full shadow-lg">
          Connection Error: {joinError.message}
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
