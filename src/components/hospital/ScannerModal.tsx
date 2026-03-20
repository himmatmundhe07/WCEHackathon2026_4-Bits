import { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';
import { X, Camera, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import FaceScanner from '@/components/common/FaceScanner';
import * as faceapi from 'face-api.js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (decodedText: string) => void;
}

const ScannerModal = ({ isOpen, onClose, onScan }: ScannerModalProps) => {
  const [error, setError] = useState<string | null>(null);
  const [scanMode, setScanMode] = useState<'qr' | 'face'>('qr');
  const [isMatching, setIsMatching] = useState(false);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (!isOpen) {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
        scannerRef.current = null;
      }
      return;
    }

    // Initialize scanner only when modal is open
    setError(null);
    
    // Delay initialization to ensure the Dialog DOM node has mounted
    timer = setTimeout(() => {
      const scanner = new Html5QrcodeScanner(
        "qr-reader",
        { 
          fps: 10, 
          qrbox: { width: 250, height: 250 },
          supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA, Html5QrcodeScanType.SCAN_TYPE_FILE],
          rememberLastUsedCamera: true
        },
        false
      );

      scannerRef.current = scanner;

      scanner.render(
        (decodedText) => {
          // Stop scanning on success
          if (scannerRef.current) {
            scannerRef.current.clear().catch(console.error);
            scannerRef.current = null;
          }
          onScan(decodedText);
        },
        (err) => {
          // Ignore normal scan failure (not finding a QR code in the frame yet)
          // Set error only if permissions failed or camera is missing entirely
          if (typeof err === 'string' && err.includes('NotAllowedError')) {
             setError('Camera access denied. Please allow camera permissions.');
          } else if (typeof err === 'string' && err.includes('NotFoundError')) {
             setError('No camera device found.');
          }
        }
      );
    }, 200);

    return () => {
      clearTimeout(timer);
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
        scannerRef.current = null;
      }
    };
  }, [isOpen, onScan, scanMode]);

  const handleFaceScanSuccess = async (descriptor: Float32Array) => {
    setIsMatching(true);
    try {
      // 1. Fetch all patients with a face_descriptor (casting to any to handle runtime dynamic column)
      const { data: patients, error } = await (supabase as any).from('patients').select('id, face_descriptor').not('face_descriptor', 'is', null);
      if (error) throw error;
      
      if (!patients || patients.length === 0) {
         toast.error("No biometrics registered in the database yet.");
         setIsMatching(false);
         return;
      }

      // 2. Compute Euclidean distance locally
      let bestMatchId = null;
      let lowestDistance = Number.MAX_VALUE;

      for (const p of patients) {
         if (!p.face_descriptor) continue;
         const dbDesc = new Float32Array(JSON.parse(p.face_descriptor as string));
         const distance = faceapi.euclideanDistance(descriptor, dbDesc);
         
         if (distance < lowestDistance) {
            lowestDistance = distance;
            bestMatchId = p.id;
         }
      }

      // 3. Threshold check (0.6 is ideal for face-api)
      if (bestMatchId && lowestDistance < 0.6) {
         toast.success("Biometric Match Confirmed!");
         onScan(bestMatchId); // Pushing patient ID up, treating it like a QR scan
      } else {
         toast.error("No matching patient found in the database. Please try again.");
      }
      setIsMatching(false);

    } catch(err) {
      console.error(err);
      toast.error('Failed to match face against database.');
      setIsMatching(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex flex-col flex-wrap items-center justify-center p-6 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-t-xl -mx-6 -mt-6 rounded-b-none mb-4 shadow-inner relative overflow-hidden">
            <Camera size={32} className="mb-2" />
            <DialogTitle className="text-white text-xl font-black uppercase tracking-widest text-center relative z-10 m-0">
               Live Emergency Scanner
            </DialogTitle>
            <div className="flex gap-2 mt-4 relative z-10 bg-black/20 p-1 rounded-full w-full max-w-[300px]">
               <button onClick={() => setScanMode('qr')} className={`flex-1 py-1.5 rounded-full text-xs font-bold transition-all ${scanMode === 'qr' ? 'bg-white text-red-700 shadow-md' : 'text-white/70 hover:text-white'}`}>QR Code</button>
               <button onClick={() => setScanMode('face')} className={`flex-1 py-1.5 rounded-full text-xs font-bold transition-all ${scanMode === 'face' ? 'bg-white text-red-700 shadow-md' : 'text-white/70 hover:text-white'}`}>Face Biometrics</button>
            </div>
          </div>
        </DialogHeader>
        
        <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-b-xl border-t border-red-100 min-h-[350px]">
           {error && (
             <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-3 border border-red-200 mb-4 w-full">
                <AlertCircle size={24} />
                <p className="text-sm font-medium">{error}</p>
             </div>
           )}

           {scanMode === 'qr' ? (
             <>
               <div id="qr-reader" className="w-full max-w-[400px] overflow-hidden rounded-2xl shadow-xl transition-all border-4 border-white ring-4 ring-slate-100" />
               <p className="mt-6 text-[11px] text-slate-500 font-bold uppercase tracking-widest text-center max-w-xs leading-relaxed">
                 If the camera fails to focus due to screen glare, click "Scan an Image File" inside the box above.
               </p>
             </>
           ) : (
             <div className="w-full relative">
               {isMatching && <div className="absolute inset-0 z-50 bg-white/80 backdrop-blur-sm flex items-center justify-center rounded-2xl"><div className="animate-pulse font-black text-cyan-600">Matching Database...</div></div>}
               <FaceScanner mode="scan" onCancel={onClose} onScanSuccess={handleFaceScanSuccess} />
             </div>
           )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ScannerModal;
