"use client"

import * as React from "react"
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, LayoutGrid, Building2, GalleryVerticalEnd } from "lucide-react"
import { Input } from "@/components/ui/input"
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import { useSidebar, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar"
import { GraphConso } from "@/app/(protected)/dashboard/graph/graph-conso"
import { Batimentgraph2 } from "@/app/(protected)/batiment/batiment-graph-2"
import { EtageGraph2 } from "@/app/(protected)/etages/etage-graph-2"
import { RadialChart } from "@/app/(protected)/dashboard/graph/radial-chart"
import { ScrollArea } from "@/components/ui/scroll-area"

const pages = [
    {
        title: "Tableau de bord",
        description: "Vue d'ensemble de la consommation",
        path: "/dashboard",
        icon: LayoutGrid
    },
    {
        title: "Bâtiments",
        description: "Analyse détaillée des bâtiments",
        path: "/batiment",
        icon: Building2
    },
    {
        title: "Étages",
        description: "Gestion par étages",
        path: "/etages",
        icon: GalleryVerticalEnd
    },
]

const graphs = [
    {
        id: 'batiment-graph-2',
        title: "Consommation totale",
        description: "Graphique de la consommation totale des bâtiments",
        path: "/batiment",
        PreviewComponent: () => (
            <div className="w-[400px] h-[240px] transform scale-[0.2] -translate-x-[160px] -translate-y-[96px]">
                <Batimentgraph2
                    aggregatedData={{}}
                    loading={false}
                />
            </div>
        )
    },
    {
        id: 'etage-graph-2',
        title: "Analyse par étages",
        description: "Visualisation détaillée par étages",
        path: "/etages",
        PreviewComponent: () => (
            <div className="w-[400px] h-[240px] transform scale-[0.2] -translate-x-[160px] -translate-y-[96px]">
                <EtageGraph2
                    floorData={{}}
                    isExpanded={true}
                />
            </div>
        )
    },
]

export function SearchBar() {
    const [open, setOpen] = React.useState(false)
    const router = useRouter()
    const { state } = useSidebar()

    React.useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                setOpen((open) => !open)
            }
        }

        document.addEventListener("keydown", down)
        return () => document.removeEventListener("keydown", down)
    }, [])

    const handleSelect = (path: string, graphId?: string) => {
        setOpen(false)
        router.push(path + (graphId ? `?highlight=${graphId}` : ''))
    }

    const button = (
        <button
            onClick={() => setOpen(true)}
            className="relative w-full flex items-center text-sm px-2 py-1.5 text-muted-foreground rounded-md border border-input hover:bg-accent hover:text-accent-foreground"
        >
            <Search className=" h-4 w-4" />
            <span className="text-sm">Rechercher un graphique...</span>

            <kbd className="pointer-events-none absolute right-2 top-1.4 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                <span className="text-xs">⌘</span>K
            </kbd>
        </button>
    )

    return (
        <>
            {state === "collapsed" ? (
                <SidebarMenuItem key="Rechercher">
                    <SidebarMenuButton
                        onClick={() => setOpen(true)}
                        asChild
                        tooltip={'Rechercher'}
                        className="hover:bg-zinc-400/10 rounded-md cursor-pointer select-none"
                    >
                        <div className="flex items-center justify-center">
                            <Search className="size-4 stroke-[2.25px]" />
                        </div>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            ) : (
                <SidebarMenuItem key="Rechercher">
                    <SidebarMenuButton asChild tooltip={'Rechercher'} className="hover:bg-zinc-400/10 rounded-md">
                        {button}
                    </SidebarMenuButton>
                </SidebarMenuItem>
            )}
            <CommandDialog open={open} onOpenChange={setOpen}>
                <CommandInput placeholder="Rechercher un graphique..." />
                <ScrollArea className="h-[300px] overflow-y-auto scrollbar-thin">
                    <CommandList>
                        <CommandEmpty>Aucun résultat trouvé.</CommandEmpty>
                        <CommandGroup heading="Pages" className="px-2">
                            {pages.map((page) => (
                                <CommandItem
                                    key={page.path}
                                    onSelect={() => handleSelect(page.path)}
                                    className=""
                                >
                                    <div className="w-6 h-6 rounded flex items-center justify-center">
                                        <page.icon className="size-4 stroke-[2.25px]" />
                                    </div>
                                    <div className="flex flex-col gap-0.5">
                                        <h3 className="text-sm font-medium">{page.title}</h3>
                                        <p className="text-xs text-muted-foreground">{page.description}</p>
                                    </div>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                        <CommandGroup heading="Graphiques" className="px-2">
                            {graphs.map((graph) => (
                                <CommandItem
                                    key={graph.path}
                                    onSelect={() => handleSelect(graph.path, graph.id)}
                                    className="flex items-center gap-4 p-2"
                                >
                                    <div className="relative w-20 h-12 bg-neutral-800 rounded overflow-hidden">
                                        <graph.PreviewComponent />
                                    </div>
                                    <div>
                                        <h3 className="font-medium">{graph.title}</h3>
                                        <p className="text-sm text-muted-foreground">{graph.description}</p>
                                    </div>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </ScrollArea>
            </CommandDialog>
        </>
    )
}