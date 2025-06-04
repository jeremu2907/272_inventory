import type { Item } from "@/types/Item";
import { Link } from "react-router";
import { Button } from "../ui/button";

export default function ItemSearchResult({ item }: { item: Item }) {
    return (
        <div className="align-items-start flex border-b border-border p-2 hover:bg-accent hover:text-accent-foreground">
            <Link to={`detail/item/${item.id}`} state={item}>
                <Button variant="ghost" className="p-0 w-full h-fit">
                    <div className="text-left flex flex-col whitespace-normal">
                        <h1 className="text-base font-bold max-w-[70vw]">{item.name}</h1>
                        <p className="font-regular">{item.nameExt}</p>
                        <p className="text-muted-foreground">{item.nsn}</p>
                    </div>
                </Button>
            </Link>
        </div>
    );
}