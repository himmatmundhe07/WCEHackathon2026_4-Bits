import React, { useState, useRef, useEffect } from 'react';
import { Camera, Square, UploadCloud, CheckCircle2, AlertCircle, X, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface PatientEvidenceRecorderProps {
  emergencyId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (videoUrl: string) => void;
}

const PatientEvidenceRecorder: React.FC<PatientEvidenceRecorderProps> = ({ emergencyId, isOpen, onClose, onSuccess }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [time, setTime] = useState(0);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
      setVideoBlob(null);
      setTime(0);
    }
  }, [isOpen]);

  const startCamera = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: true
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        setError('Camera/Microphone access was denied. Please allow permissions in your browser.');
      } else {
        setError('Camera not found or unavailable.');
      }
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
  };

  const startRecording = () => {
    if (!videoRef.current?.srcObject) return;
    chunksRef.current = [];
    
    // Choose the best available mimeType
    const mimeType = MediaRecorder.isTypeSupported('video/webm; codecs=vp9') 
      ? 'video/webm; codecs=vp9' 
      : 'video/mp4';

    const mediaRecorder = new MediaRecorder(videoRef.current.srcObject as MediaStream, { mimeType });
    
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeType });
      setVideoBlob(blob);
    };

    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start();
    setIsRecording(true);
    
    // Max 30 seconds
    timerRef.current = setInterval(() => {
      setTime(prev => {
        if (prev >= 29) {
          stopRecording();
          return 30;
        }
        return prev + 1;
      });
    }, 1000);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRecording(false);
  };

  const uploadVideo = async () => {
    if (!videoBlob || !emergencyId) return;
    setIsUploading(true);

    try {
      const fileName = `${emergencyId}-${Date.now()}`;
      const ext = videoBlob.type.includes('mp4') ? 'mp4' : 'webm';
      const filePath = `raw/${fileName}.${ext}`;

      const { data, error: uploadError } = await (supabase as any).storage
        .from('evidence')
        .upload(filePath, videoBlob, {
          contentType: videoBlob.type,
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = (supabase as any).storage
        .from('evidence')
        .getPublicUrl(filePath);

      const videoUrl = publicUrlData.publicUrl;

      // Update emergency table
      const { error: dbError } = await (supabase as any).from('emergencies')
        .update({ video_url: videoUrl })
        .eq('id', emergencyId);

      if (dbError) throw dbError;

      toast.success('Evidence uploaded securely to Hospital Command Center.');
      onSuccess(videoUrl);
      onClose();

    } catch (err: any) {
      toast.error(err.message || 'Failed to upload evidence');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-black border-none rounded-xl">
        <div className="relative w-full h-[500px] flex flex-col justify-end bg-black">
          
          {error ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-white">
              <AlertCircle size={48} className="text-red-500 mb-4" />
              <p>{error}</p>
            </div>
          ) : (
            <video 
              ref={videoRef}
              autoPlay 
              playsInline 
              muted 
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}

          {/* Top Bar */}
          <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center bg-gradient-to-b from-black/60 to-transparent z-10">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-gray-400'}`}></div>
              <span className="text-white font-mono">{time < 10 ? `00:0${time}` : `00:${time}`} / 00:30 MAX</span>
            </div>
            <button onClick={onClose} disabled={isUploading || isRecording} className="p-2 rounded-full bg-black/40 text-white backdrop-blur-sm">
              <X size={20} />
            </button>
          </div>

          {/* Bottom Controls */}
          <div className="relative z-10 p-6 flex flex-col items-center pb-8 bg-gradient-to-t from-black/80 to-transparent">
            {videoBlob ? (
              <div className="flex w-full gap-4">
                 <button onClick={() => { setVideoBlob(null); setTime(0); startCamera(); }} disabled={isUploading} className="flex-1 py-3 rounded-xl bg-gray-800 text-white font-bold border border-gray-600">
                   Retake
                 </button>
                 <button onClick={uploadVideo} disabled={isUploading} className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center justify-center gap-2">
                   {isUploading ? <Loader2 className="animate-spin" size={20} /> : <UploadCloud size={20} />}
                   {isUploading ? 'Uploading...' : 'Send Evidence'}
                 </button>
              </div>
            ) : (
              <button 
                onClick={isRecording ? stopRecording : startRecording}
                disabled={!!error}
                className="w-16 h-16 rounded-full border-[4px] border-white flex items-center justify-center overflow-hidden transition-all disabled:opacity-50"
              >
                {isRecording ? (
                  <div className="w-6 h-6 bg-red-500 rounded-sm"></div>
                ) : (
                  <div className="w-14 h-14 bg-red-500 rounded-full hover:bg-red-600 transition-colors"></div>
                )}
              </button>
            )}
            {!videoBlob && <p className="text-white/70 text-sm mt-4 font-medium">Record scene for Hospital ETA Assesment</p>}
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}

export default PatientEvidenceRecorder;
