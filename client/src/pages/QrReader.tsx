import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';
import { useEffect, useRef } from 'react';

const QRScanner = () => {
    const qrCodeRegionId = "reader";
    const scannerRef = useRef<Html5Qrcode | null>(null);

    useEffect(() => {
        const html5QrCode = new Html5Qrcode(qrCodeRegionId);
        scannerRef.current = html5QrCode;

        Html5Qrcode.getCameras().then((devices) => {
            if (devices && devices.length) {
                const rearCamera = devices.find(device =>
                    /back|rear|environment/i.test(device.label)
                ) || devices[0];

                html5QrCode
                    .start(
                        rearCamera.id,
                        {
                            fps: 5,
                            qrbox: (vw, vh) => {
                                const size = Math.min(vw, vh) * 0.8;
                                return { width: size, height: size };
                            },
                        },
                        (decodedText) => {
                            console.log("Scanned:", decodedText);
                        },
                        (_) => {
                            // handle scan error if needed
                        }
                    )
                    .catch((err) => {
                        console.error("Failed to start scanning:", err);
                    });
            }
        });

        // ✅ Cleanup on unmount
        return () => {
            const scanner = scannerRef.current;
            if (scanner) {
                const state = scanner.getState();
                if (state !== Html5QrcodeScannerState.NOT_STARTED) {
                    scanner
                        .stop()
                        .then(() => scanner.clear())
                        .catch((err) => console.error("Failed to stop/clear scanner:", err));
                }
            }
        };
    }, []);

    return (
        <div>
            <h2>QR Code Scanner</h2>
            <div
                id={qrCodeRegionId}
                style={{ width: '100%', maxWidth: '400px', aspectRatio: '1 / 1' }}
            />
        </div>
    );
};

export default QRScanner;
