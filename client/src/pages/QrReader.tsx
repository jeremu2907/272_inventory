import { Html5QrcodeScanner } from 'html5-qrcode';
import { useEffect, useRef } from 'react';

const QRCodeScanner = () => {
    const scannerRef = useRef<Html5QrcodeScanner | null>(null);
    const scanRegionId = 'html5qr-code-full-region';

    useEffect(() => {
        if (!scannerRef.current) {
            scannerRef.current = new Html5QrcodeScanner(
                scanRegionId,
                { fps: 5, qrbox: 250 },
                false
            );
        }

        const html5QrcodeScanner = scannerRef.current;
        const container = document.getElementById(scanRegionId);

        if (html5QrcodeScanner && container?.innerHTML === '') {
            html5QrcodeScanner.render(
                (decodedText, _) => {
                    console.log('Decoded text:', decodedText);
                },
                (_) => {}
            );
        }

        return () => {
            if (html5QrcodeScanner) {
                html5QrcodeScanner.clear();
            }
        };
    }, []);

    return (
        <div>
            <div id={scanRegionId} />;
        </div>
    )
};

export default QRCodeScanner;