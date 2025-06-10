import { AxiosAuthInstance } from "@/axios/AxiosAuthInstance";
import ChestInventory from "@/components/Checkin/ChestInventory";
import type { Chest } from "@/types/Chest";
import type { CompiledRecord } from "@/types/CompiledRecord";
import type { Item } from "@/types/Item";
import type { UserItemCustody } from "@/types/UserItemCustody";
import { useEffect, useState } from "react";
import { useParams } from "react-router";

export default function ChestInventoryPage() {
    const { chestSerial, chestcaseNumber } = useParams();
    const [chestInfo, setChestInfo] = useState<Chest | null>(null);
    const [compiledRecords, setCompiledRecords] = useState<CompiledRecord[]>([]);
    const [loadingChest, setLoadingChest] = useState<boolean>(true);
    const [loadingRecords, setLoadingRecords] = useState<boolean>(true);

    useEffect(() => {
        const fetchChestCheckedOutItems = async () => {
            try {
                const response = await AxiosAuthInstance().get(
                    `accountability/user/chest/item/log?${chestSerial}&case_number=${chestcaseNumber}`
                );
                const { compiled_log } = response.data || { compiled_log: [] };

                setCompiledRecords(compiled_log.map((log: any) => {
                    const item: Item = {
                        id: log.item.id,
                        chest: log.item.chest_id,
                        layer: log.item.layer,
                        name: log.item.name,
                        nameExt: log.item.name_ext,
                        nsn: log.item.nsn,
                        qtyTotal: log.item.qty_total,
                        qtyReal: log.item.qty_real
                    };
                    const record: UserItemCustody = {
                        id: log.record.id,
                        userId: log.record.user_id,
                        itemId: log.record.item_id,
                        originalQty: log.record.original_qty,
                        currentQty: log.record.current_qty,
                        createdAt: log.record.created_at
                    };
                    return {
                        record,
                        item
                    }
                }));
            } catch (error) {
                console.error(error);
            } finally {
                setLoadingRecords(false);
            }
        }

        const fetchChestInfo = async () => {
            try {
                const response = await AxiosAuthInstance().get(
                    `chest/chest/single?serial=${chestSerial}&case_number=${chestcaseNumber}`
                )

                const data = response.data;
                const chestTemp: Chest = {
                    plt: data.plt,
                    serial: data.serial,
                    nsn: data.nsn,
                    description: data.description,
                    caseNumber: data.case_number,
                    caseTotal: data.case_total,
                    id: data.id
                };

                setChestInfo(chestTemp);

            } catch (error) {
                console.error(error)
            } finally {
                setLoadingChest(false)
            }
        }

        fetchChestCheckedOutItems();
        fetchChestInfo();
    }, [])

    return (
        <ChestInventory
            chest={chestInfo}
            compiledRecords={compiledRecords}
            loadingChest={loadingChest}
            loadingRecords={loadingRecords}
        />
    )
}