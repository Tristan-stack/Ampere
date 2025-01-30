"use client"

import React, { useState } from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { ArrowUpDown, ChevronDown } from "lucide-react"
import BounceLoader from "react-spinners/BounceLoader"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export type ConsumptionData = {
  id: string
  building: string
  floor: string
  totalConsumption: number
  emissions: number
}

export const columns: ColumnDef<ConsumptionData>[] = [
  {
    accessorKey: "building",
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="flex items-center text-xs w-fit h-fit px-1"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Bâtiment
      </Button>
    ),
    cell: ({ row }) => {
      const building = row.getValue("building")
      const bgColor = {
        'A': 'hsl(var(--chart-1))',
        'B': 'hsl(var(--chart-2))',
        'C': 'hsl(var(--chart-3))'
      } as const;

      return (
        <div className={`text-xs text-center flex items-center gap-1`}>
        <div
          className="w-3 h-3 rounded-full"
          style={{
            backgroundColor: bgColor[building as keyof typeof bgColor],
            boxShadow: `0 0 10px ${bgColor[building as keyof typeof bgColor]}`
          }}
        />
          {building as string}
        </div>
      )
    },
  },
  {
    accessorKey: "floor",
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="flex items-center text-xs w-fit h-fit px-1"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Étage
      </Button>
    ),
    cell: ({ row }) => (
      <div className="capitalize">{row.getValue("floor")}</div>
    ),
  },
  {
    accessorKey: "totalConsumption",
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="flex items-center text-xs w-fit h-fit px-1"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Consommation Totale (Wh)
      </Button>
    ),
    cell: ({ row }) => {
      const totalConsumption = row.getValue("totalConsumption")
      return <div className="text-right font-medium">{String(totalConsumption || 0)}</div>
    },
  },
  {
    accessorKey: "emissions",
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="flex items-center text-xs w-fit h-fit px-1"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Émissions (gCO₂)
      </Button>
    ),
    cell: ({ row }) => {
      const emissions = row.getValue("emissions")
      return <div className="text-right font-medium">{String(emissions || 0)}</div>
    },
  },
]

type BatimentgraphTableProps = {
  filteredData: ConsumptionData[]
  loading: boolean
}

export function BatimentgraphTable({ filteredData, loading }: BatimentgraphTableProps) {
  const [sorting, setSorting] = useState<SortingState>([{ id: 'totalConsumption', desc: true }])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({ emissions: false })
  const [rowSelection, setRowSelection] = useState({})

  const table = useReactTable({
    data: filteredData,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  })

  return (
    <div className="h-full pb-12 w-full p-2 border rounded-md">
      <div className="flex items-center pb-2">
        <Input
          placeholder="Filter..."
          value={(table.getColumn("building")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("building")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              Colonnes <ChevronDown />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                )
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="h-full w-full rounded-md border iv">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <BounceLoader color='#00ff96' size={25} className='drop-shadow-[0_0_10px_rgba(47,173,121,1)]' />
          </div>
        ) : (
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : header.column.columnDef.header
                            ? flexRender(
                              header.column.columnDef.header ?? (() => null),
                              header.getContext()
                            )
                            : null}
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
                      <TableCell key={cell.id} className="sm:text-xs xl:text-sm">
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
                    Aucuns resultats.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  )
}