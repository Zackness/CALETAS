"use client";

import { Home, Settings, FileText, ChevronUp, BookOpen, Upload, Heart, Search } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../../../components/ui/dropdown-menu";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../../../components/ui/collapsible";
import { IoBusinessOutline } from "react-icons/io5";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSubItem,
  SidebarMenuSub,
} from "@/components/ui/sidebar";

export function AppSidebar() {

  return (
    <Sidebar collapsible="icon" className="bg-[#354B3A] border-r border-white/10 text-white">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            {/* Aquí puedes agregar contenido adicional si es necesario */}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild className="hover:bg-white/10 text-white">
                  <a href="/home">
                    <Home />
                    <span>Inicio</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <Collapsible className="group/collapsible">
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton className="hover:bg-foreground/50">
                      <BookOpen />
                      <p>Caletas</p>
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      <SidebarMenuSubItem>
                        <SidebarMenuButton asChild>
                          <a href="/caletas" className="hover:bg-foreground/50">
                            <Search className="h-4 w-4" />
                            <span>Buscar Caletas</span>
                          </a>
                        </SidebarMenuButton>
                        <SidebarMenuButton asChild>
                          <a href="/caletas/subir" className="hover:bg-foreground/50">
                            <Upload className="h-4 w-4" />
                            <span>Subir Caleta</span>
                          </a>
                        </SidebarMenuButton>
                        <SidebarMenuButton asChild>
                          <a href="/caletas/favoritos" className="hover:bg-foreground/50">
                            <Heart className="h-4 w-4" />
                            <span>Mis Favoritos</span>
                          </a>
                        </SidebarMenuButton>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Puedes agregar más grupos o menús aquí si lo necesitas */}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton>
                  <IoBusinessOutline /> Informacion y negocios
                  <ChevronUp className="ml-auto" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                className="w-[--radix-popper-anchor-width] rounded-xl bg-fm-blue-3 text-foreground"
              >
                <DropdownMenuItem>
                  <a href="/" className="underline-offset-4 hover:underline">
                    <span>Informacion</span>
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <a href="/" className="underline-offset-4 hover:underline">
                    <span>Privacidad</span>
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <a href="/" className="underline-offset-4 hover:underline">
                    <span>Terminos</span>
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <a href="/" className="underline-offset-4 hover:underline">
                    <span>Contactar</span>
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <a href="/" className="underline-offset-4 hover:underline">
                    <span>Derechos de autor</span>
                  </a>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}