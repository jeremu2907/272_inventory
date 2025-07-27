import AxiosInstance from "@/axios/AxiosInstance";
import ChestSearchResult from "@/components/SearchResult/ChestSearchResult";
import ItemSearchResult from "@/components/SearchResult/ItemSearchResult";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useChest } from "@/context/ChestContext";
import { localGet, localRemove, localSet, pltSuffix } from "@/lib/utils";
import type { Chest } from "@/types/Chest";
import type { Item } from "@/types/Item";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";

export default function HomePage() {
    const [searchParams] = useSearchParams();
    let scannedSerial = null
    let scannedCaseNumber = null
    const SCROLL_TO_ID = "scroll-to-id";

    const isFromScan = searchParams.get("serial") !== null && searchParams.get("caseNumber") !== null;
    if (isFromScan) {
        scannedSerial = searchParams.get("serial");
        scannedCaseNumber = searchParams.get("caseNumber");
    }

    const [searchTerm, setSearchTerm] = useState("");
    const [itemResults, setItemResults] = useState<Item[]>([]);
    const [chestResults, setChestResults] = useState<Chest[]>([]);
    const [initSearch, setInitSearch] = useState(false);
    const [searching, setSearching] = useState(false);
    const [scannedChest, setScannedChest] = useState<Chest | null>(null);
    const [scrollToId, setScrollToId] = useState<string | null>(null);
    const [accordionOpenIdx, setAccordionOpenIdx] = useState<string | undefined>(undefined);

    const navigate = useNavigate();
    const { setChest } = useChest();

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
                    caseNumber: element.case_number,
                    caseTotal: element.case_total
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

            if (scrollToId !== null && scrollToId.trim().length > 0) {

            }
        } catch (error) {
            console.error("Error fetching search results:", error);
        }
        setSearching(false);
    };

    const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const term = e.target.value;
        setSearchTerm(term);
        if (term.trim() !== "") {
            setInitSearch(true);
            navigate(`?term=${encodeURIComponent(term)}`, { replace: true });
        } else {
            setInitSearch(false);
            navigate("");
        }
    }

    const checkoutBtnOnClick = () => {
        if (isFromScan) {
            navigate(`/accountability/checkout/${scannedSerial}/${scannedCaseNumber}`);
        }
    };

    useEffect(() => {
        const fetchScannedChest = async () => {
            if (!scannedSerial || !scannedCaseNumber) return;
            try {
                const response = await AxiosInstance.get(
                    `chest/chest/single?serial=${scannedSerial}&case_number=${scannedCaseNumber}`
                );
                const chest: Chest = {
                    id: response.data.id,
                    plt: response.data.plt,
                    serial: response.data.serial,
                    nsn: response.data.nsn,
                    description: response.data.description,
                    caseNumber: response.data.case_number,
                    caseTotal: response.data.case_total,
                    driveUrl: response.data.drive_url,
                    location: response.data.location
                };
                setScannedChest(chest);
                setChest(chest);
            } catch (error) {
                console.error("Error fetching scanned chest data:", error);
            }
        };

        fetchScannedChest();
    }, [isFromScan, searchParams, setChest]);

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

    useEffect(() => {
        const termFromUrl = searchParams.get("term");
        if (termFromUrl) {
            setSearchTerm(termFromUrl);
            setInitSearch(true);
        }
    }, [searchParams]);

    useEffect(() => {
        const val: (string | null) = localGet(SCROLL_TO_ID) || null;
        setScrollToId(val);
        // localRemove(SCROLL_TO_ID);

        if (val === null) return;

        if (val.includes("items")) {
            setAccordionOpenIdx("items");
        } else if (val.includes("chests")) {
            setAccordionOpenIdx("chests");
        } else {
            setAccordionOpenIdx(undefined);
        }
    }, []);

    useEffect(() => {
        if (scrollToId !== null && itemResults.length > 0) {
            setTimeout(function () {
                const el = document.getElementById(scrollToId);

                if (!el) {
                    return;
                }

                el.scrollIntoView({
                    behavior: "smooth",
                    block: "center",
                });

                el.style.backgroundColor = "#007bff11";

                localRemove(SCROLL_TO_ID)
            }, 100);
        }
    }, [scrollToId, itemResults.length, accordionOpenIdx]);

    return (
        <div className="p-4 flex flex-col gap-4 justify-center min-h-[80vh]">
            {isFromScan && <>{scannedChest ?
                <>
                    <h1 className="text-lg font-bold">Scanned the following chest:</h1>
                    <p className="text-lg font-medium text-muted-foreground text-center">{scannedChest.description}</p>
                    <p className="text-sm text-muted-foreground text-center">{scannedChest.nsn}</p>

                    <div className="flex items-center gap-4">
                        <span className="font-semibold">Serial:</span>
                        <span>{scannedChest.serial}</span>
                    </div>

                    <div className="flex items-center gap-4">
                        <span className="font-semibold">Case:</span>
                        <span>{scannedChest.caseNumber} of {scannedChest.caseTotal}</span>
                    </div>

                    <div className="flex items-center gap-4">
                        <span className="font-semibold">Platoon:</span>
                        <span>{scannedChest.plt}{pltSuffix(scannedChest.plt)}</span>
                    </div>
                    <Button
                        variant="secondary"
                        className="w-full max-w-sm"
                        onClick={checkoutBtnOnClick}
                    >
                        <span>Checkout Items</span>
                    </Button>
                    {/* <Button
                        variant="secondary"
                        className="w-full max-w-sm"
                        onClick={() => {
                        }
                        }
                    >
                        <span>Checkin Items</span>
                    </Button> */}
                </>
                :
                <p className="text-sm text-muted-foreground text-center">Loading scanned chest...</p>
            }</>}

            <h1 className="text-lg font-bold mt-4">Inventory Finder</h1>
            <Input
                value={searchTerm}
                onChange={onChange}
                placeholder="Search by serial, name, size, or NSN"
            />
            {initSearch && searching && <p>Searching...</p>}
            {chestResults.length === 0 && itemResults.length === 0 && initSearch && !searching && (
                <p className="text-muted-foreground">No results found</p>
            )}
            <Accordion type="single" className="mt-4" value={accordionOpenIdx} onValueChange={setAccordionOpenIdx}>
                {chestResults.length > 0 && (
                    <AccordionItem value="chests">
                        <AccordionTrigger><h2 className="text-lg font-bold text-left">Chest</h2></AccordionTrigger>
                        <AccordionContent>
                            {chestResults.map(chest => (
                                <ChestSearchResult key={chest.id} chest={chest} />
                            ))}
                        </AccordionContent>
                    </AccordionItem>)
                }
                {itemResults.length > 0 &&
                    <AccordionItem value="items">
                        <AccordionTrigger>
                            <h2 className="text-lg font-bold text-left">Individual Items</h2>
                        </AccordionTrigger>
                        <AccordionContent>
                            {itemResults.map(item => (
                                <ItemSearchResult
                                    key={item.id}
                                    item={item}
                                    id={`items-id-${item.id}`}
                                    onClick={() => { localSet(SCROLL_TO_ID, `items-id-${item.id}`) }}
                                />
                            ))}
                        </AccordionContent>
                    </AccordionItem>
                }
            </Accordion>
        </div>
    );
}
