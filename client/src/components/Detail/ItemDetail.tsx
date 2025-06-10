import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router";
import AxiosInstance from "@/axios/AxiosInstance";
import type { Chest } from "@/types/Chest";
import type { Item } from "@/types/Item";
import { pltSuffix } from "@/lib/utils";
import { Button } from "../ui/button";

export default function ItemDetail() {
    const location = useLocation();
    const item: Item = location.state;

    const [chest, setChest] = useState<Chest | null>(null);
    const [updatedItem, setUpdatedItem] = useState<Item>(item)

    useEffect(() => {
        const fetchChest = async () => {
            try {
                const { data } = await AxiosInstance.get(`chest/chest/single?id=${item.chest}`);
                setChest({
                    id: data.id,
                    plt: data.plt,
                    serial: data.serial,
                    nsn: data.nsn,
                    description: data.description,
                    caseNumber: data.case_number,
                    caseTotal: data.case_total
                });
            } catch (error) {
                console.error("Error fetching chest data:", error);
            }
        };

        fetchChest();
    }, [item.chest]);

    useEffect(() => {
        const fetchItem = async () => {
            try {
                const { data } = await AxiosInstance.get(
                    `chest/item/single?id=${item.id}`
                );
                setUpdatedItem({
                    ...item,
                    qtyReal: data.qty_real,
                    qtyTotal: data.qty_total
                });
            } catch (e) {
                console.error(e)
            }
        }
        fetchItem();
    }, []);

    return (
        <div className="flex flex-col gap-4 p-4 text-left">
            <h1 className="text-2xl font-bold text-center">{updatedItem.name}</h1>
            {updatedItem.nameExt && <h2 className="text-lg font-medium text-muted-foreground text-center">{updatedItem.nameExt}</h2>}
            {updatedItem.nsn && <p className="text-sm text-muted-foreground text-center">{updatedItem.nsn}</p>}

            <div className="flex items-center gap-4">
                <span className="font-semibold">Total Assigned:</span>
                <span>{updatedItem.qtyTotal}</span>
            </div>

            <div className="flex items-center gap-4">
                <span className="font-semibold">On-hand:</span>
                <span>{updatedItem.qtyReal}</span>
            </div>

            {chest ? (
                <>
                    <h1 className="mt-4 font-semibold">Found in the following Chest:</h1>
                    <Link to={`/accountability/checkout/${chest.serial}/${chest.caseNumber}`} className="w-full">
                        <p className="text-lg font-medium text-muted-foreground text-center underline">{chest.description}</p>
                    </Link>
                    <p className="text-sm text-muted-foreground text-center">{chest.nsn}</p>

                    <div className="flex items-center gap-4">
                        <span className="font-semibold">Serial:</span>
                        <span>{chest.serial}</span>
                    </div>

                    <div className="flex items-center gap-4">
                        <span className="font-semibold">Case:</span>
                        <span>{chest.caseNumber} of {chest.caseTotal}</span>
                    </div>

                    <div className="flex items-center gap-4">
                        <span className="font-semibold">Platoon:</span>
                        <span>{chest.plt}{pltSuffix(chest.plt)}</span>
                    </div>
                    <Link to={`/accountability/${chest.serial}/${chest.caseNumber}`} className="w-full" state={{ selectedItem: updatedItem }}>
                        <Button variant="secondary" className="w-full max-w-sm bg-[#B2FFC4]">
                            <span>Checkout this item</span>
                        </Button>
                    </Link>
                </>
            ) : (
                <p className="text-muted-foreground">Loading chest information...</p>
            )}
        </div>
    );
}
