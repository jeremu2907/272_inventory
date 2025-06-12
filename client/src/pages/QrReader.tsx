import { AxiosAuthInstance } from '@/axios/AxiosAuthInstance';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';

type scanType = {
    serial: string, caseNumber: number
}

const QRCodeScanner: React.FC = () => {
    const scanRegionId = 'html5qr-code-full-region';
    const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
    const [serialCaseNumber, setSerialCaseNumber] = useState<scanType[]>([]);
    const serialCaseNumberRef = useRef<scanType[]>([]);

    const extractParams = (url: string): scanType | null => {
        try {
            const cleanedUrl = url.replace(/"/g, '').replace(/”/g, '').replace(/“/g, '');
            const parsedUrl = new URL(cleanedUrl);
            const params = parsedUrl.searchParams;

            const serial = params.get('serial');
            const caseNumberStr = params.get('caseNumber');
            const caseNumber = Number(caseNumberStr);

            if (serial && !isNaN(caseNumber)) {
                return {
                    serial,
                    caseNumber,
                };
            }
            return null;
        } catch (error) {
            console.error('Invalid URL:', error);
            return null;
        }
    };

    const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        console.log(formData)
        try {
            await AxiosAuthInstance().post(
                "chest/chest/location/update",
                {
                    location: formData.get('location') as string,
                    chest_list: serialCaseNumber.map((item: scanType) => ({
                        serial: item.serial,
                        case_number: item.caseNumber
                    }))
                }
            );
            toast.success("Success")
        } catch (e) {
            toast.error("Could not update location for chests")
            console.error("did not work")
        }
    }

    useEffect(() => {
        // Keep the ref in sync with latest state
        serialCaseNumberRef.current = serialCaseNumber;
    }, [serialCaseNumber]);

    useEffect(() => {
        if (html5QrCodeRef.current) return;
        html5QrCodeRef.current = new Html5Qrcode(scanRegionId);

        html5QrCodeRef.current.start(
            { facingMode: "environment" },
            {
                fps: 5,
                qrbox: { width: 300, height: 300 },
            },
            (decodedText: string) => {
                const params = extractParams(decodedText);
                if (params) {
                    const exists = serialCaseNumberRef.current.some(
                        item => item.serial === params.serial && item.caseNumber === params.caseNumber
                    );
                    if (exists) {
                        return;
                    }
                    setSerialCaseNumber(prev => [...prev, params]);
                    toast.success("Scan success");
                }
            },
            (_: string) => { }
        ).catch((err) => {
            console.error("QR scanner start error:", err);
        });

        return () => {
            if (html5QrCodeRef.current?.getState() === Html5QrcodeScannerState.SCANNING) {
                html5QrCodeRef.current.stop().then(() => {
                    html5QrCodeRef.current?.clear();
                    html5QrCodeRef.current = null;
                }).catch((err: any) => {
                    console.error("Failed to stop scanner", err);
                });
            }
        };
    }, [html5QrCodeRef]);

    return (
        <div className="flex flex-col items-center justify-center mt-8">
            <div className='w-full text-left'>
                <h1 className='text-2xl font-bold mb-4'>Relocate Chests</h1>
                <p className='mb-4 text-base'>
                    Scan all <span className='font-bold'>checkout QR codes</span> of relocated chests then specify
                    their new destination at the end of the page
                </p>
            </div>
            <div id={scanRegionId} style={{ width: "100%", maxWidth: "650px" }} />
            <div className='my-4 text-left w-full'>
                <h2 className='text-xl font-bold text-left mb-4'>Scanned Chests</h2>
                <div className="flex flex-col gap-4">
                    {serialCaseNumber.length > 0 && serialCaseNumber.map((item, idx) => (
                        <div key={idx}>
                            <h1 className='text-base font-bold'>{item.serial}</h1>
                            <p className='text-sm text-muted-foreground'>case #: {item.caseNumber}</p>
                        </div>
                    ))}
                </div>
            </div>
            <form onSubmit={onSubmit}>
                <Input type="text" placeholder='new location' className='mt-4' required  name='location'/>
                <Button className="w-full bg-[#B2FFC4] hover:bg-[#C3FFD5] text-[black] my-4" type='submit'>
                    <span>Update location for {serialCaseNumber.length} chests</span>
                </Button>
            </form>
        </div>
    );
};

export default QRCodeScanner;
