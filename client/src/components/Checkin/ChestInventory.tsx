import type { Chest } from "@/types/Chest";
import type { CompiledRecord } from "@/types/CompiledRecord";
import InventoryItemDetail from "./InventoryItemDetail";
import { useState } from "react";
import { AxiosAuthInstance } from "@/axios/AxiosAuthInstance";
import { toast } from "react-toastify";
import type { AxiosError } from "axios";
import { Button } from "../ui/button";

type propType = {
    chest: Chest | null,
    compiledRecords: CompiledRecord[],
    loadingChest: boolean,
    loadingRecords: boolean,
}

export default function ChestInventory(props: propType) {
    const [inProgress, setInProgress] = useState<boolean>(false);
    const [dialogOpen, setDialogOpen] = useState<boolean>(false);

    const submitCheckin = async (e: React.FormEvent<HTMLFormElement>) => {
        setInProgress(true);
        e.preventDefault(); // prevent default page reload

        const formData = new FormData(e.currentTarget);

        const entries = Array.from(formData.entries());

        type tempType = {
            id: Number,
            qty: Number,
            note: String | ""
        };

        const order = entries.map(([key, value]) => {
            const itemId = Number(key.replace("quantity-", ""));
            const object: tempType = {
                id: itemId,
                qty: Number(value),
                note: (formData.get(`comment-item-${itemId}`)?.toString())??""
            };
            return object;
        }).filter(item => Number.isInteger(item.id));

        console.log(order);

        // try {
        //     await AxiosAuthInstance().post("accountability/checkin", { record_list: order });
        //     toast.success("Checkin successful!");
        //     setDialogOpen(false);
        // } catch (error: AxiosError | any) {
        //     if (error.response && error.response.status === 401) {
        //         toast.info("You need to login first. Then confirm Checkin again", { autoClose: 5000 });
        //         setDialogOpen(true);
        //         return;
        //     }
        //     console.error("Error during Checkin:", error);
        //     toast.error("Checkin failed. Please try again.");
        //     return;
        // } finally {
        //     setInProgress(false);
        // }
    }

    return (
        <div className='flex flex-col gap-4 align-start text-left'>
            {props.loadingChest ?
                <div>Loading chest info...</div>
                :
                <div>
                    <div>
                        <h1 className='text-lg font-bold'>{props.chest?.description}</h1>
                        <p className="text-sm text-muted-foreground">{props.chest?.nsn}</p>
                    </div>
                </div>
            }
            {props.loadingRecords ?
                <div>Loading item info...</div>
                :
                <div>
                    <h2 className="text-lg font-bold text-center">Inventorying the following items:</h2>
                    <form onSubmit={submitCheckin}>
                        {props.compiledRecords.map((compiledRecord, idx) => (
                            <InventoryItemDetail key={`inventory-item-detail-${idx}`} compiledRecord={compiledRecord} />
                        ))}
                        <Button
                            variant="outline"
                            type="submit"
                            className="w-full bg-[#B2FFC4] hover:bg-[#C3FFD5]"
                        >
                            <span>Complete Inventorying</span>
                        </Button>
                    </form>
                </div>
            }
        </div>
    )
}