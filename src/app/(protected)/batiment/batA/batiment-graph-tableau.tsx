"use client"

import React, { useEffect, useState } from "react"
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
  DropdownMenuItem,
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
      const bgColor =
        building === "A"
          ? "bg-[#00ff9d]/80"
          : building === "B"
          ? "bg-orange-500"
          : building === "C"
          ? "bg-blue-500"
          : "bg-gray-200"

      return (
        <div className={`text-xs text-center flex items-center gap-1`}>
          <div className={`${bgColor} w-3 h-3 rounded-full`}></div>
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
      return <div className="text-right font-medium">{totalConsumption as number}</div>
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
      return <div className="text-right font-medium">{emissions as number}</div>
    },
  },
]

export function BatimentgraphTable() {
  const [sorting, setSorting] = useState<SortingState>([{ id: 'totalConsumption', desc: true }])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({ emissions: false })
  const [rowSelection, setRowSelection] = useState({})
  const [filteredData, setFilteredData] = useState<ConsumptionData[]>([])
  const [loading, setLoading] = useState(true)

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

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      const deviceKeys = [
        { key: '4f887d23-3cf2-4d1c-8ae8-0f0bea45cf09', building: 'A', floor: 'Rez-de-chaussée' },
        { key: '510478e8-ddfe-40d1-8d2f-f8562e4fb128', building: 'A', floor: '1er étage' },
        // { key: '14375bc7-eb4f-4cac-88f8-ae6be2dde5cd', building: 'A', floor: '1er étage' }, //truc en double
        { key: 'ca8bf525-9259-4cfa-9ebe-856b4356895e', building: 'A', floor: '2e étage' },
        { key: '3b36f6d7-8abd-4e79-8154-72ccb92b9273', building: 'A', floor: '3e étage' },
        { key: '5ef1fc4b-0bfd-4b13-a174-835d154a0744', building: 'B', floor: 'Rez-de-chaussée' },
        { key: '85d14dac-8e5c-477b-a0f8-3e7768fcc8ee', building: 'B', floor: 'Rez-de-chaussée' },
        { key: 'b3195f2e-7071-4729-babd-47ca4f3e252e', building: 'B', floor: 'Rez-de-chaussée' },
        { key: '14ca1560-66ec-417a-99ee-5f7e4ac8e4a1', building: 'B', floor: 'Rez-de-chaussée' },
        { key: '566fbe08-44fa-442a-9fb8-1eadf8f66da1', building: 'B', floor: 'Rez-de-chaussée' },
        { key: '01db2140-19c7-4698-9b19-959f8a8f63a9', building: 'B', floor: 'Rez-de-chaussée' },// Puissance négative ????? //truc en double
        { key: 'eba9db95-7b31-44cf-a715-08bc75d3976c', building: 'B', floor: 'Rez-de-chaussée' },
        { key: '131be744-6676-47c2-9d8d-c6b503c7220b', building: 'B', floor: 'Rez-de-chaussée' }, //truc en double
        { key: '22e195a1-30ca-4d2b-a533-0be1b4e93f23', building: 'B', floor: '1er étage' },
        { key: '31cea110-651d-4cd2-8edf-add92b13bf17', building: 'C', floor: '1er étage' },
        { key: '306e5d7a-fa63-4f86-b117-aa0da4830a80', building: 'C', floor: '2e étage' },
      ];

      try {
        const allData: ConsumptionData[] = [];

        for (const device of deviceKeys) {
          const response = await fetch('/api/getDeviceDataByKey', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              device_key: device.key,
            }),
          });
          const data = await response.json();
          console.log(`Données du device ${device.key} :`, data);

          const deviceData = data.timestamps.map((timestamp: string, index: number) => ({
            id: `${device.key}-${index}`,
            building: device.building,
            floor: device.floor,
            totalConsumption: data.values[index], // Utiliser la valeur brute
            emissions: data.values[index] * 50, // Utiliser la valeur brute pour les émissions
          }));

          allData.push(...deviceData);
        }

        // Additionner les valeurs de consommation et les émissions pour chaque étage
        const aggregatedData: { [key: string]: ConsumptionData } = {};
        allData.forEach(item => {
          const key = `${item.building}-${item.floor}`;
          if (!aggregatedData[key]) {
            aggregatedData[key] = { ...item, totalConsumption: 0, emissions: 0 };
          }
          aggregatedData[key].totalConsumption += item.totalConsumption;
          aggregatedData[key].emissions += item.emissions;
        });

        setFilteredData(Object.values(aggregatedData));
      } catch (error) {
        console.error('Erreur lors de la récupération des données du device :', error);
      } finally {
        setLoading(false)
      }
    };

    fetchData();
  }, []);

  return (
    <div className="h-full pb-12 w-full p-2">
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
      <div className="h-full w-full rounded-md border">
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