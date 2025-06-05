import { Outlet } from 'react-router-dom';
import { useParams } from "react-router";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { useEffect, useState } from 'react';
import AxiosInstance from '@/axios/AxiosInstance';
import type { Chest } from '@/types/Chest';
import { useChest } from '@/context/ChestContext';

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
                caseTotal: data.case_total
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
                    {/* {plt && <><BreadcrumbItem>
                        <BreadcrumbLink href={`/${plt}`}>{plt}{pltSuffix(plt)}</BreadcrumbLink>
                    </BreadcrumbItem><BreadcrumbSeparator /></>
                    } */}
                    {chestSerial && <><BreadcrumbItem>
                        <BreadcrumbLink href={`/${plt}/${chestSerial}`}>{chestSerial}</BreadcrumbLink>
                    </BreadcrumbItem><BreadcrumbSeparator /></>
                    }
                    {chestSerial && chestcaseNumber && <><BreadcrumbItem>
                        <BreadcrumbLink href={`/${plt}/${chestSerial}`}><strong>{chestcaseNumber} of {caseTotal}</strong></BreadcrumbLink>
                    </BreadcrumbItem></>}
                </BreadcrumbList>
            </Breadcrumb>
            <Outlet />
        </div>
    );
}