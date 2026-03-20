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
    if (!isOpen) {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
        scannerRef.current = null;
      }
      return;
    }

    // Initialize scanner only when modal is open
    setError(null);
    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      { 
        fps: 10, 
        qrbox: { width: 250, height: 250 },
        supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
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

    return () => {
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
          <div className="flex items-center gap-2 text-white bg-red-600 p-4 rounded-t-lg -mx-6 -mt-6 rounded-b-none mb-4">
            <Camera size={20} />
            <DialogTitle className="text-white text-lg font-bold uppercase tracking-tight m-0">
               Live Emergency Scanner
            </DialogTitle>
          </div>
          <DialogDescription className="text-center">
            Position the patient's QR code within the frame to scan.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col items-center justify-center p-2 min-h-[300px]">
           {error && (
             <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-3 border border-red-200 mb-4 w-full">
                <AlertCircle size={24} />
                <p className="text-sm font-medium">{error}</p>
             </div>
           )}
           <div id="qr-reader" className="w-full max-w-[400px] overflow-hidden rounded-xl border-4 border-slate-200" />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ScannerModal;
