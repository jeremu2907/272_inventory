import type { CompiledRecord } from "@/types/CompiledRecord";
import { useState } from "react";
import { Input } from "../ui/input";

export default function IventoryItemDetail({ compiledRecord }: { compiledRecord: CompiledRecord }) {
    const { item, record } = compiledRecord;

    const [showTextbox, setShowTextbox] = useState<boolean>(false);

    const verify = (event: React.ChangeEvent<HTMLInputElement>) => {
        // if (event.currentTarget.value.length === 0) {
        //     setShowTextbox(false);
        //     return;
        // }

        const inputQty = Number(event.currentTarget.value);
        if (inputQty < record.currentQty) {
            setShowTextbox(true);
        } else {
            setShowTextbox(false);
        }
    }

    return (
        <div className="border-b border-border">
            <div className="align-items-start justify-between flex p-2 hover:bg-accent hover:text-accent-foreground mt-2">
                {/* <Link to={`/detail/item/${item.id}`} state={item} className="w-full"> */}
                    <div>
                        <div className="text-left flex flex-col whitespace-normal">
                            <h1 className="text-base font-bold max-w-[70vw]">{item.name}</h1>
                            <p className="text-sm font-regular">{item.nameExt}</p>
                            <p className="text-sm text-muted-foreground">{item.nsn}</p>
                            <p className="font-semibold">Original issued qty: {item.qtyTotal}</p>
                            <p className="font-semibold text-[#0bad6a]">Checked out qty: {record.currentQty}</p>
                        </div>
                    </div>
                {/* </Link> */}
                <div className="flex flex-col justify-center gap-2 items-end">
                    <p className="text-muted-foreground text-xs text-right whitespace-nowrap">Verify return qty</p>
                    <Input
                        type="number"
                        className="w-15 text-right"
                        min={0}
                        max={item.qtyTotal}
                        defaultValue={record.currentQty}
                        name={`quantity-${record.id}`}
                        autoFocus={false}
                        onChange={verify}
                        inputMode="numeric"
                    />
                </div>
            </div>
            {showTextbox &&
                <Input
                    type="text"
                    required
                    placeholder="justify return qty < borrowed qty"
                    className="mb-4 border-red-500 focus-visible:ring-red-500 focus-visible:ring-2 focus-visible:ring-offset-2"
                    name={`comment-item-${item.id}`}
                >
                </Input>}
        </div>
    );
}