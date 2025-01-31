'use client'

import * as React from "react"
import { GalleryVerticalEnd, ChevronRight, LayoutGrid, HousePlug, Star, BarChart, Calendar, MapPin, Bell, Users, AlarmCheck, LogOut, User, BrickWall, Blocks, Building2 } from 'lucide-react'
import { UserButton } from '@clerk/nextjs'
import Link from "next/link"
import { motion } from "framer-motion"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@radix-ui/react-collapsible"
import { useUser } from "@clerk/nextjs"
import { SearchBar } from "@/components/searchbar"
import Rainbow from "@/components/ui/rainbow"
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
import { useSidebar } from "@/components/ui/sidebar"
import { ChatInterface } from "@/components/chat/chat-interface"
import ColorPicker from "@/components/colors"


const mainItems = [
  {
    title: "Tableau de bord",
    url: "/dashboard",
    icon: LayoutGrid,
    hasChildren: false
  },
  {
    title: "Analyse",
    url: "",
    icon: BarChart,
    hasChildren: true,
    children: [
      { title: "Puissance active", url: "/analyse/puissance" },
      { title: "Consomation", url: "/analyse/consomation" },
      { title: "Production", url: "/analyse/production" },
    ]
  },
  {
    title: "Bâtiments",
    url: "/batiment",
    icon: HousePlug,
    hasChildren: false,
  },
  {
    title: "Étages",
    url: "/etages",
    icon: GalleryVerticalEnd,
    hasChildren: false,
  },
  {
    title: "Carte interactive",
    url: "/carte-interractive",
    icon: MapPin,
    hasChildren: false
  }
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
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <Sidebar
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="dark:bg-[#18181b] h-full">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="hover:bg-zinc-600/10 transition-colors">
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-black ">
                <Rainbow hovered={isHovered} />
              </div>
              <span className="text-xl font-semibold mb-1">Ampere</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <div className="flex flex-col h-full">
          <SidebarGroup>
            <SidebarGroupLabel className="text-neutral-400">Suivi énergétique</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {mainItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    {item.hasChildren ? (
                      <Collapsible>
                        <CollapsibleTrigger asChild className="group">
                          <SidebarMenuButton tooltip={item.title} className="flex text-s items-center justify-start w-full hover:bg-zinc-400/10 rounded-md">
                            <item.icon className="size-4 stroke-[2.25px]" />
                            <span className="pl-2 mb-[1.5px] text-s">{item.title}</span>
                            <ChevronRight className="ml-auto size-4 transition-transform duration-200 group-data-[state=open]:rotate-90" />
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
                      <SidebarMenuButton asChild tooltip={item.title} className="hover:bg-zinc-400/10 rounded-md">
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
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton tooltip={item.title} asChild className="hover:bg-zinc-400/10 rounded-md">
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
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SearchBar />
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          <SidebarGroup className="flex-1 overflow-hidden">
            <SidebarGroupLabel className="text-neutral-400">Assistant IA</SidebarGroupLabel>
            <SidebarGroupContent className="h-full overflow-hidden">
              <div className="h-full">
                <ChatInterface />
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        </div>
      </SidebarContent>
      <SidebarFooter>
        <div className="flex justify-between gap-2 group-data-[state=collapsed]:flex-col-reverse">
          <UserButton appearance={{
            elements: {
              userButtonTrigger: "focus:shadow-none",
              userButtonAvatarBox: "w-8 h-8 rounded-lg",
              userButtonPopoverCard: "bg-white shadow-xl",
            },
            variables: {
              colorPrimary: "#0000ff",
              borderRadius: "0.5rem",
            }
          }} />
          <div className="flex group-data-[state=collapsed]:flex-col-reverse">
            <SidebarMenuButton tooltip={"Notifications"} className="hover:bg-zinc-400/10 rounded-md w-fit text-xs">
              <Bell className="size-4 stroke-[2.25px]" />
            </SidebarMenuButton>
            <SidebarMenuButton tooltip={"Editer l'affichage"} className="hover:bg-zinc-400/10 rounded-md w-fit text-xs">
              <Blocks className="h-4 w-4 stroke-[2.25px]" />
            </SidebarMenuButton>
            <SidebarMenuButton tooltip={"Paramètres"} className="hover:bg-zinc-400/10 rounded-md w-fit text-xs">

              <ColorPicker />
            </SidebarMenuButton>
          </div>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

