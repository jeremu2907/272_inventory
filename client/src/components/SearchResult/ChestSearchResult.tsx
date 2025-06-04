import type { Chest } from "@/types/Chest";
import { Link } from "react-router";
import { Button } from "../ui/button";

export default function ChestSearchResult({ chest }: { chest: Chest }) {
    return (
        <div className="align-items-start flex border-b border-border p-2 hover:bg-accent hover:text-accent-foreground">
            <Link to={`detail/chest/${chest.id}`}>
                <Button variant="ghost" className="p-0 w-full h-fit">
                    <div className="text-left flex flex-col whitespace-normal">
                        <h1 className="text-base font-bold max-w-[70vw]">{chest.description}</h1>
                        <p className="font-regular">{chest.serial}</p>
                        <p className="font-regular">{chest.setNumber} of {chest.setTotal} in set</p>
                        <p className="text-muted-foreground">{chest.nsn}</p>
                    </div>
                </Button>
            </Link>
        </div>
    );
}