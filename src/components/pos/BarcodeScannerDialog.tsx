import { useEffect, useRef, useCallback } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { QrCode } from "lucide-react";

interface BarcodeScannerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScan: (barcode: string) => void;
}

export function BarcodeScannerDialog({ open, onOpenChange, onScan }: BarcodeScannerDialogProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const stoppedRef = useRef(false);
  const scannedRef = useRef(false);

  const stopScanner = useCallback(async () => {
    stoppedRef.current = true;
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
      } catch {
        /* ignore stop errors */
      }
      scannerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!open) {
      stopScanner();
      scannedRef.current = false;
      return;
    }

    scannedRef.current = false;

    const startScanner = async () => {
      try {
        const scanner = new Html5Qrcode("barcode-scanner-viewport", {
          verbose: false,
        });
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1,
          },
          (decodedText: string) => {
            if (stoppedRef.current || scannedRef.current) return;
            scannedRef.current = true;
            onScan(decodedText.trim());
            scanner.stop().catch(() => {});
            scannerRef.current = null;
            onOpenChange(false);
          },
          () => {
            /* ignore scan errors (frame with no barcode detected) */
          }
        );
      } catch {
        onOpenChange(false);
      }
    };

    const timer = setTimeout(startScanner, 400);
    return () => {
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) stopScanner(); onOpenChange(v); }}>
      <DialogContent dir="rtl" className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-blue-600" />
            مسح الباركود بالكاميرا
          </DialogTitle>
          <DialogDescription>وجّه كاميرا الهاتف نحو الباركود ليتم مسحه تلقائياً</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div
            id="barcode-scanner-viewport"
            className="w-full rounded-xl overflow-hidden bg-gradient-to-b from-slate-900 to-slate-800"
            style={{ minHeight: 300 }}
          />
          <p className="text-xs text-center text-slate-400">تأكد من وجود إضاءة كافية وثبّت الكاميرا على الباركود</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
