import { Html5Qrcode } from 'html5-qrcode';
import { useEffect, useRef } from 'react';

const QRScanner = () => {
  const qrCodeRegionId = "reader";
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    const html5QrCode = new Html5Qrcode(qrCodeRegionId);

    Html5Qrcode.getCameras().then((devices) => {
      if (devices && devices.length) {
        const cameraId = devices[0].id;
        html5QrCode
          .start(
            cameraId,
            {
              fps: 10,    // Optional frame per second
              qrbox: 250, // Optional scanner box size
            },
            (decodedText, _) => {
              console.log("Scanned:", decodedText);
              // handle your scanned data
            },
            (errorMessage) => {
              console.warn("Scan error", errorMessage);
            }
          )
          .catch((err) => {
            console.error("Failed to start scanning:", err);
          });

        scannerRef.current = html5QrCode;
      }
    });

    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().then(() => {
          if (scannerRef.current) {
            scannerRef.current.clear();
          }
        });
      }
    };
  }, []);

  return (
    <div>
      <h2>QR Code Scanner</h2>
      <div id={qrCodeRegionId} style={{ width: '300px', height: '300px' }} />
    </div>
  );
};

export default QRScanner;
