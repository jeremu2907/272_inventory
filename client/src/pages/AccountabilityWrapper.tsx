import { Outlet } from 'react-router-dom';
import { useParams } from "react-router";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { useEffect, useState } from 'react';
import AxiosInstance from '@/axios/AxiosInstance';
import type { Chest } from '@/types/Chest';
import { useChest } from '@/context/ChestContext';
import { pltSuffix } from '@/lib/utils';

export default function AppWrapper() {
    const { plt, chestSerial, chestSetNumber } = useParams();
    const { chest, setChest } = useChest();
    const [ setTotal, setSetTotal] = useState<number | null>(null);

    // TODO: Add number of chests in set to breadcrumb

    const fetchChestData = async () => {
         if(!chestSerial || !chestSetNumber) {
            return;
        }

        try{
            const data = (await AxiosInstance.get(
                `chest/chest/single?serial=${chestSerial}&set_number=${chestSetNumber}`)
            ).data;

            let chest: Chest;
            chest = {
                id: data.id,
                plt: data.plt,
                serial: data.serial,
                nsn: data.nsn,
                description: data.description,
                setNumber: data.set_number,
                setTotal: data.set_total
            };
            setChest(chest);
        } catch (error) {
            console.error('Error fetching chest data:', error);
        }
    }

    useEffect(() => {
        fetchChestData();
    }, [chestSerial, chestSetNumber]);

    useEffect(() => {
        if (chest) {
            setSetTotal(chest.setTotal);
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
                    {chestSerial && chestSetNumber && <><BreadcrumbItem>
                        <BreadcrumbLink href={`/${plt}/${chestSerial}`}><strong>{chestSetNumber} of {setTotal}</strong></BreadcrumbLink>
                    </BreadcrumbItem></>}
                </BreadcrumbList>
            </Breadcrumb>
            <Outlet />
        </div>
    );
}