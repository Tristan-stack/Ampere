'use client'

import * as React from "react"
import { ChevronDown, ChevronRight, LayoutGrid, Book, Settings, Atom, Plus, History, Star } from 'lucide-react'
import { UserButton } from '@clerk/nextjs'

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

const mainItems = [
  {
    title: "Models",
    url: "#",
    icon: LayoutGrid,
    hasChildren: true
  },
  {
    title: "Documentation",
    url: "#",
    icon: Book,
    hasChildren: true
  },
  {
    title: "Settings",
    url: "#",
    icon: Settings,
    hasChildren: true
  },
]

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarHeader className="h-16 border-b border-sidebar-border px-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg">
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-black drop-shadow-[0px_10px_10px_rgba(135,232,48,0.2)]">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-black drop-shadow-[0px_-10px_10px_rgba(135,232,48,0.2)]">
                  <Atom className="size-5 text-white/80 stroke-[2.5px]" />
                </div>
              </div>
              <span className="text-xl font-semibold">Ampere</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Platform</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <a href="#">
                    <LayoutGrid className="size-4" />
                    <span>Playground</span>
                    <ChevronDown className="ml-auto size-4" />
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url}>
                      <item.icon className="size-4" />
                      <span>{item.title}</span>
                      {item.hasChildren && <ChevronRight className="ml-auto size-4" />}
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Projects</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <a href="#">
                    <Plus className="size-4" />
                    <span>Design Engineering</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4">
        <UserButton />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

