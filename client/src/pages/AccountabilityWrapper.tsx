import AxiosInstance from '@/axios/AxiosInstance';
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { useChest } from '@/context/ChestContext';
import { pltSuffix } from '@/lib/utils';
import type { Chest } from '@/types/Chest';
import { useEffect, useState } from 'react';
import { useParams } from "react-router";
import { Outlet } from 'react-router-dom';

export default function AppWrapper() {
    const { plt, chestSerial, chestcaseNumber } = useParams();
    const { chest, setChest } = useChest();
    const [ caseTotal, setcaseTotal] = useState<number | null>(null);

    // TODO: Add number of chests in set to breadcrumb

    const fetchChestData = async () => {
         if(!chestSerial || !chestcaseNumber) {
            return;
        }

        try{
            const data = (await AxiosInstance.get(
                `chest/chest/single?serial=${chestSerial}&case_number=${chestcaseNumber}`)
            ).data;

            let chest: Chest;
            chest = {
                id: data.id,
                plt: data.plt,
                serial: data.serial,
                nsn: data.nsn,
                description: data.description,
                caseNumber: data.case_number,
                caseTotal: data.case_total,
                driveUrl: data.drive_url,
                location: data.location
            };
            setChest(chest);
        } catch (error) {
            console.error('Error fetching chest data:', error);
        }
    }

    useEffect(() => {
        fetchChestData();
    }, [chestSerial, chestcaseNumber]);

    useEffect(() => {
        if (chest) {
            setcaseTotal(chest.caseTotal);
        }
    }, [chest]);

    return (
        <div className='pt-4'>
            <Breadcrumb>
                <BreadcrumbList>
                    {plt && <><BreadcrumbItem>
                        {/* <BreadcrumbLink href={`/${plt}`}>{plt}{pltSuffix(plt)}</BreadcrumbLink> */}
                        <p className="text-sm text-muted-foreground">{plt}{pltSuffix(plt)}</p>
                    </BreadcrumbItem><BreadcrumbSeparator /></>
                    }
                    {chestSerial && <><BreadcrumbItem>
                        {/* <BreadcrumbLink href={`/${plt}/${chestSerial}`}>{chestSerial}</BreadcrumbLink> */}
                        <p className="text-sm text-muted-foreground">{chestSerial}</p>
                    </BreadcrumbItem><BreadcrumbSeparator /></>
                    }
                    {chestSerial && chestcaseNumber && <><BreadcrumbItem>
                        {/* <BreadcrumbLink href={`/${plt}/${chestSerial}`}><strong>{chestcaseNumber} of {caseTotal}</strong></BreadcrumbLink> */}
                        <p className="text-sm text-muted-foreground">case {chestcaseNumber} of {caseTotal}</p>
                    </BreadcrumbItem><BreadcrumbSeparator /></>}
                    {chestSerial && chestcaseNumber && <><BreadcrumbItem>
                        {/* <BreadcrumbLink href={`/${plt}/${chestSerial}`}><strong>{chestcaseNumber} of {caseTotal}</strong></BreadcrumbLink> */}
                        <p className="text-sm text-muted-foreground"><strong>@ {chest?.location}</strong></p>
                    </BreadcrumbItem></>}
                </BreadcrumbList>
            </Breadcrumb>
            <Outlet />
        </div>
    );
}