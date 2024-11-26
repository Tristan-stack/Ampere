'use client'

import * as React from "react"
import { BadgeCheck, ChevronRight, LayoutGrid, Book, Settings2, Atom, Plus, PlugIcon as HousePlug, Star, BarChart, Calendar, MapPin, Bell, Users, AlarmCheck, LogOut, User, BrickWall, Blocks } from 'lucide-react'
import { UserButton } from '@clerk/nextjs'
import Link from "next/link"
import { motion } from "framer-motion"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@radix-ui/react-collapsible"
import { useUser } from "@clerk/nextjs"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarHeader,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { ScrollArea } from "@/components/ui/scroll-area"

const mainItems = [
  {
    title: "Tableau de bord",
    url: "",
    icon: LayoutGrid,
    hasChildren: false
  },
  {
    title: "Analyse",
    url: "",
    icon: BarChart,
    hasChildren: true,
    children: [
      { title: "Puissance active", url: "" },
      { title: "Énergie consommée", url: "" },
      { title: "Énergie produite", url: "" },
    ]
  },
  {
    title: "Bâtiments",
    url: "",
    icon: HousePlug,
    hasChildren: true,
    children: [
      { title: "Bâtiment A", url: "" },
      { title: "Bâtiment B", url: "" },
      { title: "Bâtiment C", url: "" },
    ]
  },
  {
    title: "Carte interactive",
    url: "",
    icon: MapPin,
    hasChildren: false
  },
]

const adminItems = [
  {
    title: "Gestion des utilisateurs",
    url: "/admin/users",
    icon: Users,
    hasChildren: false
  },
]

export function AppSidebar() {
  
  const { user } = useUser();

  return (
    <Sidebar className="dark:bg-[#18181b]">
      <SidebarHeader className="h-16 px-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="hover:bg-zinc-600/10 transition-colors">
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-black drop-shadow-[0px_10px_10px_rgba(135,232,48,0.2)]">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-black drop-shadow-[0px_10px_10px_rgba(135,232,48,0.2)]">
                  <Atom className="size-5 text-white/80 stroke-[2.5px]" />
                </div>
              </div>
              <span className="text-xl font-semibold mb-1">Ampere</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <ScrollArea className="h-[37rem] w-full">
          <SidebarGroup>
            <SidebarGroupLabel className="text-neutral-400">Suivi énergétique</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {mainItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    {item.hasChildren ? (
                      <Collapsible>
                        <CollapsibleTrigger asChild className="group">
                          <SidebarMenuButton className="w-full hover:bg-zinc-400/10 rounded-md">
                            <div className="flex text-s items-center justify-start w-full">
                              <item.icon className="size-4 stroke-[2.25px]" />
                              <span className="pl-2 mb-[1.5px] text-s">{item.title}</span>
                              <ChevronRight className="ml-auto size-4 transition-transform duration-200 group-data-[state=open]:rotate-90" />
                            </div>
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {item.children && item.children.map((subItem) => (
                              <SidebarMenuSubItem key={subItem.title}>
                                <SidebarMenuSubButton asChild>
                                  <Link href={subItem.url} className="hover:bg-zinc-400/10 rounded-md">
                                    {subItem.title}
                                  </Link>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            ))}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </Collapsible>
                    ) : (
                      <SidebarMenuButton asChild className="hover:bg-zinc-400/10 rounded-md">
                        <Link href={item.url} className="flex text-s items-center justify-start">
                          <item.icon className="size-4 stroke-[2.25px]" />
                          <span className="mb-[1.5px] text-s">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    )}
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          <SidebarGroup>
            <SidebarGroupLabel className="text-neutral-400">Administration</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems.map((item) => (
                  <SidebarMenuItem key={item.title} className="hover:bg-zinc-400/10 rounded-md">
                    <SidebarMenuButton asChild>
                      <Link href={item.url} className="flex text-lg items-center justify-start">
                        <item.icon className="size-4 stroke-[2.25px]" />
                        <span className="mb-[1.5px]">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </ScrollArea>
      </SidebarContent>
      <SidebarFooter className="p-4">
        <div className="flex justify-between gap-2">
          <UserButton />
          <div className="flex">
            <SidebarMenuButton className="hover:bg-zinc-400/10 rounded-md w-fit text-xs">
              <Bell className="size-4 stroke-[2.25px]" />
            </SidebarMenuButton>
            <SidebarMenuButton className="hover:bg-zinc-400/10 rounded-md w-fit text-xs">
              <Blocks className="h-4 w-4 stroke-[2.25px]" />
            </SidebarMenuButton>
            
          </div>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

