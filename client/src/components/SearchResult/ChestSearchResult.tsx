import type { Chest } from "@/types/Chest";
import { Link } from "react-router";
import { Button } from "../ui/button";
import Arrow from '@/assets/arrow-right.svg';

export default function ChestSearchResult({ chest }: { chest: Chest }) {
    return (
        <div className="align-items-start flex border-b border-border p-2 hover:bg-accent hover:text-accent-foreground mt-2">
            <Link to={`accountability/${chest.serial}/${chest.caseNumber}`} className="w-full">
                <Button variant="ghost" className="p-0 w-full h-fit flex items-between">
                    <div className="text-left flex flex-col whitespace-normal">
                        <h1 className="text-base font-bold max-w-[70vw]">{chest.description}</h1>
                        <p className="font-regular">{chest.serial}</p>
                        <p className="font-regular">Case {chest.caseNumber} of {chest.caseTotal} in set</p>
                        <p className="text-muted-foreground">{chest.nsn}</p>
                    </div>
                    <img src={Arrow} alt="Arrow" height={20} width={20} className="ml-auto text-muted-foreground" />
                </Button>
            </Link>
        </div>
    );
}