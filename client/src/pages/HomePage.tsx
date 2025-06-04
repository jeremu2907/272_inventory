import AxiosInstance from "@/axios/AxiosInstance";
import ChestSearchResult from "@/components/SearchResult/ChestSearchResult";
import ItemSearchResult from "@/components/SearchResult/ItemSearchResult";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Chest } from "@/types/Chest";
import type { Item } from "@/types/Item";
import { useState, useRef, useEffect } from "react";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"

export default function HomePage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [itemResults, setItemResults] = useState<Item[]>([]);
    const [chestResults, setChestResults] = useState<Chest[]>([]);
    const [initSearch, setInitSearch] = useState(false);
    const [searching, setSearching] = useState(false);

    const debounceRef = useRef<NodeJS.Timeout | null>(null);

    const searchApiCall = async () => {
        setSearching(true);
        if (searchTerm.trim() === "") {
            setItemResults([]);
            setChestResults([]);
            return;
        }

        try {
            const data = (await AxiosInstance.get(
                `chest/search?term=${encodeURIComponent(searchTerm)}`
            )).data;
            setChestResults(data.chests.map((element: any) => {
                return {
                    id: element.id,
                    plt: element.plt,
                    serial: element.serial,
                    nsn: element.nsn,
                    description: element.description,
                    setNumber: element.set_number,
                    setTotal: element.set_total
                } as Chest;
            }) || []);
            setItemResults(data.items.map((element: any) => {
                return {
                    id: element.id,
                    chest: element.chest_id,
                    layer: element.layer,
                    name: element.name,
                    nameExt: element.name_ext,
                    nsn: element.nsn,
                    qtyTotal: element.qty_total,
                    qtyReal: element.qty_real
                } as Item;
            }) || []);
        } catch (error) {
            console.error("Error fetching search results:", error);
        }
        setSearching(false);
    };

    const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
        if (e.target.value.trim() !== "") {
            setInitSearch(true);
        }
        else {
            setInitSearch(false);
        }
    }

    useEffect(() => {
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        debounceRef.current = setTimeout(() => {
            searchApiCall();
        }, 1000);

        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, [searchTerm]); // runs every time searchTerm changes

    return (
        <div className="p-4 flex flex-col gap-4">
            <Button
                variant="secondary"
                className="w-full max-w-sm"
                onClick={() => {
                }
                }
            >
                <span>Checkout Items</span>
            </Button>
            <Button
                variant="secondary"
                className="w-full max-w-sm"
                onClick={() => {
                }
                }
            >
                <span>Checkin Items</span>
            </Button>
            <Input
                value={searchTerm}
                onChange={onChange}
                placeholder="Search by serial, name, size, or NSN"
            />
            {initSearch && searching && <p>Searching...</p>}
            <Accordion type="single" collapsible className="mt-4">
                {chestResults.length > 0 ? (
                    <AccordionItem value="item-1">
                        <AccordionTrigger><h2 className="text-lg font-bold text-left">Chest</h2></AccordionTrigger>
                        <AccordionContent>
                            {chestResults.map(chest => (
                                <ChestSearchResult key={chest.id} chest={chest} />
                            ))}
                        </AccordionContent>
                    </AccordionItem>)
                    : (
                        <>
                            {initSearch && !searching && <p>No chest with NSN, description, or serial found</p>}
                        </>
                    )
                }
                {itemResults.length > 0 ?
                    <AccordionItem value="item-2">
                        <AccordionTrigger>
                            <h2 className="text-lg font-bold text-left">Individual Items</h2>
                        </AccordionTrigger>
                        <AccordionContent>
                            {itemResults.map(item => (
                                <ItemSearchResult key={item.id} item={item} />
                            ))}
                        </AccordionContent>
                    </AccordionItem>
                    :
                    <>
                        {initSearch && !searching && <p>No items with NSN, name, or size found</p>}
                    </>
                }
            </Accordion>
            <div className="mt-4">
                {/* <div className="mt-2 flex flex-col gap-4">
                    {chestResults.length > 0 ? (
                        <>
                            <h2 className="text-2xl font-bold text-left">Chest</h2>
                            {chestResults.map(chest => (
                                <ChestSearchResult key={chest.id} chest={chest} />
                            ))}
                        </>
                    ) : (
                        <>
                            {initSearch && !searching && <p>No chest with NSN, description, or serial found</p>}
                            {initSearch && searching && <p>Searching...</p>}
                        </>
                    )}
                </div> */}
                {/* <div className="mt-2 flex flex-col gap-4 mt-4"> */}
                    {/* {itemResults.length > 0 ?
                        <>
                            <h2 className="text-2xl font-bold text-left">Individual Items</h2>
                            {itemResults.map(item => (
                                <ItemSearchResult key={item.id} item={item} />
                            ))}
                        </>
                        :
                        <>
                            {initSearch && !searching && <p>No items with NSN, name, or size found</p>}
                            {initSearch && searching && <p>Searching...</p>}
                        </>
                    }
                </div> */}
            </div>
        </div>
    );
}
