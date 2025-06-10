import type { Chest } from "@/types/Chest";
import { Link } from "react-router";
import { Button } from "../ui/button";

export default function ChestCheckinSelect({ chest }: { chest: Chest }) {
    return (
        <div className="align-items-start flex p-2 hover:bg-accent hover:text-accent-foreground mt-2 w-full">
            <Link to={`/accountability/inventory/chest/${chest.serial}/${chest.caseNumber}`} className="w-full">
                <Button variant="ghost" className="p-0 w-full h-fit flex justify-between">
                    <div className="text-left flex flex-col whitespace-normal">
                        <h1 className="text-base font-bold max-w-[70vw]">{chest.description}</h1>
                        <p className="font-regular">{chest.serial}</p>
                        <p className="font-regular">Case {chest.caseNumber} of {chest.caseTotal} in set</p>
                        <p className="text-muted-foreground">{chest.nsn}</p>
                    </div>
                    <p className="text-sm text-muted-foreground underline">inventory</p>
                </Button>
            </Link>
        </div>
    );
}