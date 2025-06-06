import { AxiosAuthInstance } from "@/axios/AxiosAuthInstance";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import { useProfileDialog } from "@/context/ProfileDialogContext";
import { useUser } from "@/context/UserContext";
import type { CompiledRecord } from "@/types/CompiledRecord";
import type { Item } from "@/types/Item";
import type { UserItemCustody } from "@/types/UserItemCustody";
import {
    type ColumnDef,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getSortedRowModel,
    type SortingState,
    useReactTable
} from "@tanstack/react-table";
import type { AxiosError } from "axios";
import { ArrowUpDown } from "lucide-react";
import React, { useEffect } from "react";
import { Link } from "react-router";
import { toast } from "react-toastify";

export const columns: ColumnDef<CompiledRecord>[] = [
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
            />
        ),
        enableSorting: false,
        enableHiding: false,
    },
    {
        accessorKey: "name",
        filterFn: (row: any, columnId: string, filterValue: string) => {
            const record = row.original as CompiledRecord;
            return (
                record.item.name.toLowerCase().includes(filterValue.toLowerCase()) ||
                (record.item.nameExt?.toLowerCase().includes(filterValue.toLowerCase()) ?? false) ||
                (record.item.nsn?.toLowerCase().includes(filterValue.toLowerCase()) ?? false)
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
            const record = row.original as CompiledRecord;
            return (
                <div className='whitespace-normal truncate max-w-[37vw]'>
                    <Link to={`/detail/item/${record.item.id}`} state={record.item}>
                        <div className='text-base font-bold underline'>
                            {record.item.name}
                        </div>
                    </Link>
                    <div className='break-all text-sm font-medium'>
                        {record.item.nameExt}
                    </div>
                    {record.item.nsn && <div className='break-all text-sm text-muted-foreground '>
                        {record.item.nsn}
                    </div>}
                </div>
            );
        }
    },
    {
        accessorKey: "checkout-qty",
        header: () => <div className="text-center">Checked out QTY</div>,
        cell: ({ row }) => {
            const record = row.original as CompiledRecord;
            return <div className="flex-1 text-center font-medium">{record.record.currentQty}</div>
        },
    },
]

export default function UserCheckinItemPage() {
    const { chest } = useChest();
    const { setOpenDialog } = useProfileDialog();
    const { user } = useUser();

    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [rowSelection, setRowSelection] = React.useState({});
    const [compiledLogs, setCompiledLogs] = React.useState<CompiledRecord[]>([])
    const [dialogOpen, setDialogOpen] = React.useState(false);
    const [inProgress, setInProgress] = React.useState(false);
    const [initialRender, setInitialRender] = React.useState(false);

    const table = useReactTable<CompiledRecord>({
        data: compiledLogs,
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

    const submitCheckin = async (e: React.FormEvent<HTMLFormElement>) => {
        setInProgress(true);
        e.preventDefault(); // prevent default page reload

        const formData = new FormData(e.currentTarget);

        const entries = Array.from(formData.entries());

        const order = entries.map(([key, value]) => ({
            id: Number(key.replace("quantity-", "")),
            qty: Number(value),
        }));

        try {
            await AxiosAuthInstance().post("accountability/checkin", { record_list: order });
            toast.success("Checkin successful!");
            setDialogOpen(false);
        } catch (error: AxiosError | any) {
            if (error.response && error.response.status === 401) {
                toast.info("You need to login first. Then confirm Checkin again", { autoClose: 5000 });
                setOpenDialog(true);
                return;
            }
            console.error("Error during Checkin:", error);
            toast.error("Checkin failed. Please try again.");
            return;
        } finally {
            if (chest) {
                fetchLogs();
            }
            setInProgress(false);
        }
    }

    const fetchLogs = async () => {
        const response = await AxiosAuthInstance().get("accountability/user/log");
        const data = response.data || [];

        setCompiledLogs(data.map((log: any) => {
            const item: Item = {
                id: log.item.id,
                chest: log.item.chest_id,
                layer: log.item.layer,
                name: log.item.name,
                nameExt: log.item.name_ext,
                nsn: log.item.nsn,
                qtyTotal: log.item.qty_total,
                qtyReal: log.item.qty_real
            };
            const record: UserItemCustody = {
                id: log.record.id,
                userId: log.record.user_id,
                itemId: log.record.item_id,
                originalQty: log.record.original_qty,
                currentQty: log.record.current_qty,
                createdAt: log.record.created_at
            };
            return {
                record,
                item
            }
        }));

        setInitialRender(true);
    }

    useEffect(() => {
        fetchLogs();
    }, [])

    if (!initialRender && compiledLogs.length === 0) {
        return (
            <div className='flex flex-col gap-4'>
                <h1 className='text-lg self-start weight font-bold'>Loading Log Details...</h1>
                <p>Please wait while the log details are being loaded.</p>
            </div>
        )
    }

    return (
        <div className='flex flex-col gap-4 align-start text-left'>
            <div className="mt-4">
                <h1 className='text-lg font-bold'>{user?.rank} {user?.lastName}</h1>
                <p className="text-sm text-muted-foreground">{user?.firstName}</p>
            </div>
            {(initialRender && compiledLogs.length === 0) ?
                <div className='flex flex-col gap-4'>
                    <h1 className='text-lg self-start weight font-bold'>No borrowed tool found</h1>
                </div>
                :
                <>
                    <div className="w-full">
                        <div className="flex items-center pb-4 gap-1">
                            <Input
                                placeholder="search with name, size, or NSN"
                                value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
                                onChange={(event) =>
                                    table.getColumn("name")?.setFilterValue(event.target.value)
                                }
                                className="max-w-sm"
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
                                        <TableCell colSpan={columns.length} className="h-24 text-center">
                                            No results.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {table.getSelectedRowModel().rows.length > 0 && <Button
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
                        <span>Checkin {table.getSelectedRowModel().rows.length} Items</span>
                    </Button>}

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
                            <form onSubmit={submitCheckin}>
                                <div className="flex flex-col gap-4 my-4 max-h-[50vh] overflow-y-auto">
                                    {table.getSelectedRowModel().rows.filter(row => row.original.record.currentQty > 0).map((row) => {
                                        const item = row.original as CompiledRecord;
                                        return (
                                            <div key={item.record.id} className="flex items-center justify-between">
                                                <span>
                                                    <p className="whitespace-normal text-base font-bold">{item.item.name}</p>
                                                    <p className="whitespace-normal text-sm text-muted-foreground">{item.item.nameExt}</p>
                                                    <p className="whitespace-normal text-sm text-muted-foreground">Currently checked out: {item.record.currentQty}</p>
                                                </span>
                                                <Input type="number" className="w-15 text-right" defaultValue={1} min={1} max={item.record.currentQty} name={`quantity-${item.record.id}`} autoFocus={false} />
                                            </div>
                                        );
                                    })}
                                </div>
                                <Button type="submit" className="w-full" disabled={inProgress}>
                                    {inProgress ? <span>Checking in...</span> : <span>Confirm checkin</span>}
                                </Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                </>}
        </div>
    );
}