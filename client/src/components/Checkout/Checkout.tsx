import AxiosInstance from "@/axios/AxiosInstance";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { useChest } from "@/context/ChestContext";
import type { Chest } from "@/types/Chest";
import type { Item } from "@/types/Item";
import {
    type ColumnDef,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getSortedRowModel,
    type SortingState,
    useReactTable
} from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { AxiosAuthInstance } from "@/axios/AxiosAuthInstance";
import { toast } from "react-toastify";
import type { AxiosError } from "axios";
import { useProfileDialog } from "@/context/ProfileDialogContext";
import { useUser } from "@/context/UserContext";

export const columns: ColumnDef<Item>[] = [
    {
        id: "select",
        header: ({ table }) => (
            <Checkbox
                checked={
                    table.getIsAllPageRowsSelected() ||
                    (table.getIsSomePageRowsSelected() && "indeterminate")
                }
                onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                aria-label="Select all"
                className="h-6 w-6"
            />
        ),
        cell: ({ row }) => (
            <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(value) => row.toggleSelected(!!value)}
                aria-label="Select row"
                className="h-6 w-6"
                disabled={row.original.qtyReal === 0}
            />
        ),
        enableSorting: false,
        enableHiding: false,
    },
    {
        accessorKey: "name",
        filterFn: (row: any, _: string, filterValue: string) => {
            const item = row.original as Item;
            return (
                item.name.toLowerCase().includes(filterValue.toLowerCase()) ||
                (item.nameExt?.toLowerCase().includes(filterValue.toLowerCase()) ?? false) ||
                (item.nsn?.toLowerCase().includes(filterValue.toLowerCase()) ?? false)
            );
        },
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Item
                    <ArrowUpDown />
                </Button>
            )
        },
        cell: ({ row }) => {
            const item = row.original as Item;
            return (
                <div className='whitespace-normal truncate max-w-[40vw]'>
                    <Link to={`/detail/item/${item.id}`} state={item}>
                        <div className='text-base font-bold underline'>
                            {item.name}
                        </div>
                    </Link>
                    <div className='text-sm font-medium'>
                        {item.nameExt}
                    </div>
                    {item.nsn && <div className='break-all text-sm text-muted-foreground '>
                        {item.nsn}
                    </div>}
                    {row.original.qtyReal === 0 &&
                        <>
                            <div className='break-all text-xs text-[red] '>
                                checkout unavailable,
                            </div>
                            <div className='break-all text-xs text-[red] '>
                                0 on-hand
                            </div>
                        </>
                    }
                </div>
            );
        }
    },
    {
        accessorKey: "qtyTotal",
        header: () => <div className="text-center">Assigned</div>,
        cell: ({ row }) => {
            const amount = parseFloat(row.getValue("qtyTotal"))
            return <div className="flex-1 text-center font-medium">{amount}</div>
        },
    },
    {
        accessorKey: "qtyReal",
        header: () => <div className="text-center">On-hand</div>,
        cell: ({ row }) => {
            const amount = parseFloat(row.getValue("qtyReal"))
            return <div className="flex-1 text-center font-medium">{amount}</div>
        },
    },
]

export default function ChestDetail() {
    const { chest } = useChest();
    const { user } = useUser();
    const { setOpenDialog } = useProfileDialog();
    const location = useLocation();
    const navigate = useNavigate();
    const { selectedItem } = location.state ?? {};

    const [chestState, setChestState] = useState<Chest | null>(null);
    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [selectedItemIdx, setSelectedItemIdx] = React.useState(-1);
    const [rowSelection, setRowSelection] = React.useState({});
    const [items, setItems] = React.useState<Item[]>([]);
    const [dialogOpen, setDialogOpen] = React.useState(false);
    const [supervisorDialogOpen, setSupervisorDialogOpen] = useState(false);
    const [inProgress, setInProgress] = React.useState(false);

    const table = useReactTable<Item>({
        data: items,
        columns,
        onSortingChange: setSorting,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onRowSelectionChange: setRowSelection,
        state: {
            sorting,
            rowSelection,
        },
    })

    const fetchItems = async (serial: string, caseNumber: number) => {
        setInProgress(true);
        try {
            const response = await AxiosInstance.get(
                `chest/item?serial=${serial}&case_number=${caseNumber}`
            )

            const data = response.data;
            const itemList = data.map((item: any) => ({
                id: item.id,
                chest: item.chest_id,
                layer: item.layer,
                name: item.name,
                nameExt: item.name_ext,
                nsn: item.nsn,
                qtyTotal: item.qty_total,
                qtyReal: item.qty_real,
            }))

            if (selectedItem) {
                const idx = itemList.findIndex((row: any) => row.id === selectedItem.id);
                setSelectedItemIdx(idx);
                if (idx !== -1) {
                    const temp = itemList[0];
                    itemList[0] = itemList[idx];
                    itemList[idx] = temp;
                }
            }
            setItems(itemList);

        } catch (error) {
            console.error('Error fetching items:', error);
        } finally {
            setInProgress(false);
        }
    }

    const submitCheckout = async (e: React.FormEvent<HTMLFormElement>) => {
        setInProgress(true);
        e.preventDefault(); // prevent default page reload

        const formData = new FormData(e.currentTarget);

        const entries = Array.from(formData.entries());

        const order = entries.map(([key, value]) => ({
            item_id: key.replace("quantity-", ""),
            qty: Number(value),
        }));

        try {
            await AxiosAuthInstance().post("accountability/checkout", { item_list: order });
            toast.success("Checkout successful!");
            setDialogOpen(false);
            setRowSelection({});
            if (chest) {
                fetchItems(chest.serial, chest.caseNumber);
            }
            navigate(location.pathname, { replace: true, state: {} });
        } catch (error: AxiosError | any) {
            if (error.response && error.response.status === 401) {
                toast.info("You need to login first. Then confirm checkout again", { autoClose: 5000 });
                setOpenDialog(true);
                return;
            }
            console.error("Error during checkout:", error);
            toast.error("Checkout failed. Please try again.");
            return;
        } finally {
            setInProgress(false);
        }
    }

    const submitCompleteChestCheckout = async (e: React.FormEvent<HTMLFormElement>) => {
        setInProgress(true);
        e.preventDefault(); // prevent default page reload
        if (!chest) {
            toast.info("Chest still loading");
            return;
        }
        try {
            await AxiosAuthInstance().post("accountability/checkout", { chest_id: chest?.id });
            toast.success("Checkout successful!");
            setSupervisorDialogOpen(false);
            fetchItems(chest.serial, chest.caseNumber);
            navigate(location.pathname, { replace: true, state: {} });
        } catch (error: AxiosError | any) {
            if (error.response && error.response.status === 401) {
                toast.info("You need to login first. Then confirm checkout again", { autoClose: 5000 });
                setOpenDialog(true);
                return;
            }
            console.error("Error during checkout:", error);
            toast.error("Checkout failed. Please try again.");
            return;
        } finally {
            setInProgress(false);
        }
    }

    useEffect(() => {
        if (chest) {
            setChestState(chest);
        }
    }, [chest]);

    useEffect(() => {
        if (chestState) {
            fetchItems(chestState.serial, chestState.caseNumber);
        }
    }, [chestState])

    useEffect(() => {
        if (selectedItem &&
            selectedItem.qtyReal > 0 &&
            items.length > 0 &&
            (selectedItem.id === items[0].id) &&
            selectedItemIdx !== -1
        ) {
            setRowSelection(prev => ({ ...prev, [0]: true }));
        }
    }, [selectedItemIdx])

    if (!chestState) {
        return (
            <div className='flex flex-col gap-4'>
                <h1 className='text-lg self-start weight font-bold'>Loading Chest Details...</h1>
                <p>Please wait while the chest details are being loaded.</p>
            </div>
        )
    }

    return (
        <div className='flex flex-col gap-4 align-start text-left'>
            <div>
                <h1 className='text-lg font-bold'>{chestState?.description}</h1>
                <p className="text-sm text-muted-foreground">{chestState?.nsn}</p>
            </div>
            <div className="w-full">
                {user?.isStaff && items.length > 0 &&
                    <Button onClick={() => { setSupervisorDialogOpen(true) }} className="w-full bg-[#B2FFC4] hover:bg-[#C3FFD5] text-[black] mb-4">
                        <span>Checkout all items in chest</span>
                    </Button>
                }
                <div className="flex items-center pb-4 gap-1 w-full">
                    <Input
                        placeholder="search with name, size, or NSN"
                        value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
                        onChange={(event) =>
                            table.getColumn("name")?.setFilterValue(event.target.value)
                        }
                        className="w-full"
                    />
                </div>
                <Table className="w-full">
                    <TableHeader className="sticky top-0 z-10 bg-background">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <TableHead key={header.id}>
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(header.column.columnDef.header, header.getContext())}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && "selected"}
                                    id={`item-data-table${row.id}-scroll`}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                {inProgress ? <TableCell colSpan={columns.length} className="h-24 text-center">
                                    Pulling data...
                                </TableCell>
                                    :
                                    <TableCell colSpan={columns.length} className="h-24 text-center">
                                        No item found
                                    </TableCell>}
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {table.getSelectedRowModel().rows.length > 0 &&
                <Button
                    variant="outline"
                    className="w-full bg-[#B2FFC4] hover:bg-[#C3FFD5] sticky bottom-4"
                    onClick={() => {
                        if (table.getSelectedRowModel().rows.length === 0) {
                            return;
                        }
                        console.log("Selected items:", table.getSelectedRowModel().rows.map(row => row.original));
                        setDialogOpen(true);
                    }
                    }
                >
                    <span>Checkout {table.getSelectedRowModel().rows.length} Items</span>
                </Button>
            }

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent
                    className="w-[90vw] max-w-[600px] z-102"
                    onOpenAutoFocus={(e) => e.preventDefault()}
                >
                    <DialogHeader>
                        <DialogTitle>Checkout Items</DialogTitle>
                        <DialogDescription>
                            Please confirm the items and amount you want to checkout.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={submitCheckout}>
                        <div className="flex flex-col gap-4 my-4 max-h-[50vh] overflow-y-auto">
                            {table.getSelectedRowModel().rows.filter(row => row.original.qtyReal > 0).map((row) => {
                                const item = row.original as Item;
                                return (
                                    <div key={item.id} className="flex items-center justify-between p-1">
                                        <span>
                                            <p className="whitespace-normal text-base font-bold">{item.name}</p>
                                            <p className="whitespace-normal text-sm text-muted-foreground">{item.nameExt}</p>
                                            <p className="whitespace-normal text-sm text-muted-foreground">on-hand: {item.qtyReal}</p>
                                        </span>
                                        <Input type="number" className="w-15 text-right" inputMode="numeric" defaultValue={1} min={1} max={item.qtyReal} name={`quantity-${item.id}`} autoFocus={false} />
                                    </div>
                                );
                            })}
                        </div>
                        <Button type="submit" className="w-full" disabled={inProgress}>
                            {inProgress ? <span>Checking out...</span> : <span>Confirm checkout</span>}
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>

            {/* <SupervisorCheckoutDialog open={supervisorDialogOpen} onOpenChange={setSupervisorDialogOpen} /> */}
            <Dialog open={supervisorDialogOpen} onOpenChange={setSupervisorDialogOpen}>
                <DialogContent
                    className="w-[90vw] max-w-[600px] z-102"
                    onOpenAutoFocus={(e) => e.preventDefault()}
                >
                    <DialogHeader>
                        <DialogTitle>Checkout Complete Chest</DialogTitle>
                        <DialogDescription>
                            Please read the following information below.
                        </DialogDescription>
                    </DialogHeader>
                    <p>You, as a <strong>supervisor role</strong>, will ultimately be responsible for all the items
                        within this chest.</p>
                    <p>Items will be returned at the same quantity at time of checkout
                        unless an expendable item.</p>
                    <p>You will inventory these items at the end of use before returning them.</p>
                    <DialogFooter>
                        <form onSubmit={submitCompleteChestCheckout}>
                            <Button type="submit" className="w-full" disabled={inProgress}>
                                {inProgress ? <span>Checking out...</span> : <span>Confirm checkout</span>}
                            </Button>
                        </form>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}