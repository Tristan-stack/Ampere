"use client"

import * as React from "react"
import { Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from "@/components/ui/command"
import { useSidebar, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar"

export function SearchBar() {
    const [open, setOpen] = React.useState(false)
    const { state } = useSidebar()

    React.useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "j" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                setOpen((open) => !open)
            }
        }

        document.addEventListener("keydown", down)
        return () => document.removeEventListener("keydown", down)
    }, [])

    const button = (
        <Button
            variant="ghost"
            className="w-full justify-start text-sm text-muted-foreground bg-background"
            onClick={() => setOpen(true)}
        >
            <Search className="size-4 stroke-[2.25px]" />
            {state !== "collapsed" && (
                <>
                    <span className="text-sm ml-2">Rechercher...</span>
                    <kbd className="pointer-events-none ml-auto hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                        <span className="text-xs">Ctrl</span>J
                    </kbd>
                </>
            )}
        </Button>
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
                <CommandInput placeholder="Rechercher ou taper une commande..." />
                <CommandList>
                    <CommandEmpty>Aucun résultat trouvé.</CommandEmpty>

                    <CommandGroup heading="Navigation">
                        <CommandItem>
                            <Search className="mr-2 h-4 w-4" />
                            <span>Tableau de bord</span>
                        </CommandItem>
                        <CommandItem>
                            <Search className="mr-2 h-4 w-4" />
                            <span>Analyse</span>
                        </CommandItem>
                        <CommandItem>
                            <Search className="mr-2 h-4 w-4" />
                            <span>Bâtiments</span>
                        </CommandItem>
                    </CommandGroup>
                </CommandList>
            </CommandDialog>
        </>
    )
}