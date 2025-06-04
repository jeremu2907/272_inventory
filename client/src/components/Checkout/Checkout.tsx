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
            />
        ),
        cell: ({ row }) => (
            <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(value) => row.toggleSelected(!!value)}
                aria-label="Select row"
            />
        ),
        enableSorting: false,
        enableHiding: false,
    },
    {
        accessorKey: "name",
        filterFn: (row: any, columnId: string, filterValue: string) => {
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
                <>
                    <div className='flex-2 whitespace-normal text-base font-bold'>
                        {item.name}
                    </div>
                    <div className='flex-2 whitespace-normal text-sm font-medium'>
                        {item.nameExt}
                    </div>
                    {item.nsn && <div className='flex-2 whitespace-normal text-sm text-muted-foreground '>
                        {item.nsn}
                    </div>}
                </>
            );
        }
    },
    {
        accessorKey: "qtyTotal",
        header: () => <div className="text-right">Assigned</div>,
        cell: ({ row }) => {
            const amount = parseFloat(row.getValue("qtyTotal"))
            return <div className="flex-1 text-center font-medium">{amount}</div>
        },
    },
    {
        accessorKey: "qtyReal",
        header: () => <div className="text-right">On-hand</div>,
        cell: ({ row }) => {
            const amount = parseFloat(row.getValue("qtyReal"))
            return <div className="flex-1 text-center font-medium">{amount}</div>
        },
    },
]

export default function ChestDetail() {
    const { chest } = useChest();

    const [chestState, setChestState] = useState<Chest | null>(chest || null);
    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [rowSelection, setRowSelection] = React.useState({});
    const [items, setItems] = React.useState<Item[]>([]);

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

    const fetchItems = async (serial: string, setNumber: number) => {
        try {
            const data = (await AxiosInstance.get(
                `chest/item?serial=${serial}&set_number=${setNumber}`
            )).data;

            setItems(data.map((item: any) => ({
                id: item.id,
                chest: item.chest,
                layer: item.layer,
                name: item.name,
                nameExt: item.name_ext,
                nsn: item.nsn,
                qtyTotal: item.qty_total,
                qtyReal: item.qty_real,
            })));
        } catch (error) {
            console.error('Error fetching items:', error);
        }
    }

    useEffect(() => {
        if (chest) {
            setChestState(chest);
            fetchItems(chest.serial, chest.setNumber);
        }
    }, [chest]);

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
            <h1 className='text-lg font-bold'>{chestState?.description}</h1>
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
                <div className="relative rounded-md border overflow-y-auto h-auto max-h-[50vh]">
                    <Table>
                        <TableHeader className="bg-white sticky top-0 z-10">
                            {table.getHeaderGroups().map((headerGroup) => (
                                <TableRow key={headerGroup.id}>
                                    {headerGroup.headers.map((header) => {
                                        return (
                                            <TableHead key={header.id}>
                                                {header.isPlaceholder
                                                    ? null
                                                    : flexRender(
                                                        header.column.columnDef.header,
                                                        header.getContext()
                                                    )}
                                            </TableHead>
                                        )
                                    })}
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
                                                {flexRender(
                                                    cell.column.columnDef.cell,
                                                    cell.getContext()
                                                )}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell
                                        colSpan={columns.length}
                                        className="h-24 text-center"
                                    >
                                        No results.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
                <div className="flex items-center justify-end space-x-2 pt-4">
                    <div className="text-muted-foreground flex-1 text-sm">
                        {table.getFilteredSelectedRowModel().rows.length} of{" "}
                        {table.getFilteredRowModel().rows.length} row(s) selected.
                    </div>
                </div>
            </div>
            <Button
                variant="outline"
                className="w-full bg-[#B2FFC4] hover:bg-[#C3FFD5] max-w-sm"
                onClick={() => {
                    console.log("Selected items:", table.getSelectedRowModel().rows);
                }
                }
            >
                <span>Checkout {table.getSelectedRowModel().rows.length} Items</span>
            </Button>
        </div>
    );
}