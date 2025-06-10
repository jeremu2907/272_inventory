import type { Chest } from "@/types/Chest";
import type { CompiledRecord } from "@/types/CompiledRecord";
import InventoryItemDetail from "./InventoryItemDetail";
import { useState } from "react";
import { AxiosAuthInstance } from "@/axios/AxiosAuthInstance";
import { toast } from "react-toastify";
import type { AxiosError } from "axios";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";
import { useNavigate } from "react-router";

type propType = {
    chest: Chest | null,
    compiledRecords: CompiledRecord[],
    loadingChest: boolean,
    loadingRecords: boolean,
}

export default function ChestInventory(props: propType) {
    const [dialogOpen, setDialogOpen] = useState<boolean>(false);
    const navigate = useNavigate();

    const submitCheckin = async (e: React.FormEvent<HTMLFormElement>) => {
        setDialogOpen(true);
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
                note: (formData.get(`comment-item-${itemId}`)?.toString()) ?? ""
            };
            return object;
        }).filter(item => Number.isInteger(item.id));

        try {
            await AxiosAuthInstance().post("accountability/inventory/chest", { item_custody_id_qty_list: order });
            toast.success("Inventory submission successful!");
            setDialogOpen(false);
            setTimeout(() => {
                navigate('/accountability/checkin');
            }, 2000)
        } catch (error: AxiosError | any) {
            if (error.response && error.response.status === 401) {
                toast.info("You need to login first. Then confirm Checkin again", { autoClose: 5000 });
                setDialogOpen(true);
                return;
            }
            console.error("Error during Checkin:", error);
            toast.error("Checkin failed. Please try again.");
            return;
        } finally {
            setDialogOpen(false);
        }
    }

    if (props.compiledRecords.length === 0) {
        return (
            <div className="mt-4">
                <h1 className="font-bold">Nothing to be inventoried here</h1>
            </div>
        )
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
                            <span>Submit inventory</span>
                        </Button>
                    </form>
                </div>
            }
            <Dialog open={dialogOpen}>
                <DialogContent showCloseButton={false} className="outline-none">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold">Inventory</DialogTitle>
                        <DialogDescription>
                            <h1>{props.chest?.description}</h1>
                            <p className="text-base text-mute-foreground">
                                {props.chest?.serial} case {props.chest?.caseNumber} of {props.chest?.caseTotal}
                            </p>
                        </DialogDescription>
                    </DialogHeader>
                    <p className="text-[#0bad6a]">Updating database and saving inventory...
                        
                    </p>
                    <p className="font-bold">Please don't close or navigate away until done</p>
                </DialogContent>
            </Dialog>
        </div>
    )
}