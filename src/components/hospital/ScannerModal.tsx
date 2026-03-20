import { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';
import { X, Camera, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface ScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (decodedText: string) => void;
}

const ScannerModal = ({ isOpen, onClose, onScan }: ScannerModalProps) => {
  const [error, setError] = useState<string | null>(null);
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
  }, [isOpen, onScan]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex flex-col items-center justify-center p-6 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-t-xl -mx-6 -mt-6 rounded-b-none mb-4 shadow-inner relative overflow-hidden">
            <Camera size={32} className="mb-2" />
            <DialogTitle className="text-white text-xl font-black uppercase tracking-widest text-center relative z-10 m-0">
               Live Emergency Scanner
            </DialogTitle>
            <DialogDescription className="text-red-100 text-center font-medium text-sm mt-1 mb-0 relative z-10">
              Position the patient's Sanjeevani QR code within the frame to instantly retrieve their medical profile.
            </DialogDescription>
          </div>
        </DialogHeader>
        
        <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-b-xl border-t border-red-100 min-h-[350px]">
           {error && (
             <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-3 border border-red-200 mb-4 w-full">
                <AlertCircle size={24} />
                <p className="text-sm font-medium">{error}</p>
             </div>
           )}
           <div id="qr-reader" className="w-full max-w-[400px] overflow-hidden rounded-2xl shadow-xl transition-all border-4 border-white ring-4 ring-slate-100" />
           <p className="mt-6 text-[11px] text-slate-500 font-bold uppercase tracking-widest text-center max-w-xs leading-relaxed">
             If the camera fails to focus due to screen glare, click "Scan an Image File" inside the box above.
           </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ScannerModal;
