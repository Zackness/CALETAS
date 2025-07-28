"use client";

import { Home, Settings, FileText, ChevronUp, BookOpen, Upload, Heart, Search, GraduationCap, Lightbulb, TrendingUp, BarChart3, History, Plus } from "lucide-react";
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
import Link from "next/link";

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
                  <Link href="/home">
                    <Home />
                    <span>Inicio</span>
                  </Link>
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
                          <Link href="/caletas" className="hover:bg-foreground/50">
                            <Search className="h-4 w-4" />
                            <span>Recursos Colaborativos</span>
                          </Link>
                        </SidebarMenuButton>
                        <SidebarMenuButton asChild>
                          <Link href="/caletas/crear" className="hover:bg-foreground/50">
                            <Plus className="h-4 w-4" />
                            <span>Compartir Recurso</span>
                          </Link>
                        </SidebarMenuButton>
                        <SidebarMenuButton asChild>
                          <Link href="/caletas/mis-recursos" className="hover:bg-foreground/50">
                            <FileText className="h-4 w-4" />
                            <span>Mis Recursos</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>

              <Collapsible className="group/collapsible">
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton className="hover:bg-foreground/50">
                      <GraduationCap />
                      <p>Académico</p>
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      <SidebarMenuSubItem>
                        <SidebarMenuButton asChild>
                          <Link href="/academico" className="hover:bg-foreground/50">
                            <TrendingUp className="h-4 w-4" />
                            <span>Panel de Control</span>
                          </Link>
                        </SidebarMenuButton>
                        <SidebarMenuButton asChild>
                          <Link href="/academico/recomendaciones" className="hover:bg-foreground/50">
                            <Lightbulb className="h-4 w-4" />
                            <span>Recomendaciones</span>
                          </Link>
                        </SidebarMenuButton>
                        <SidebarMenuButton asChild>
                          <Link href="/academico/estadisticas" className="hover:bg-foreground/50">
                            <BarChart3 className="h-4 w-4" />
                            <span>Estadísticas</span>
                          </Link>
                        </SidebarMenuButton>
                        <SidebarMenuButton asChild>
                          <Link href="/academico/historial" className="hover:bg-foreground/50">
                            <History className="h-4 w-4" />
                            <span>Historial</span>
                          </Link>
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
                  <Link href="/" className="underline-offset-4 hover:underline">
                    <span>Informacion</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link href="/" className="underline-offset-4 hover:underline">
                    <span>Privacidad</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link href="/" className="underline-offset-4 hover:underline">
                    <span>Terminos</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link href="/" className="underline-offset-4 hover:underline">
                    <span>Contactar</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link href="/" className="underline-offset-4 hover:underline">
                    <span>Derechos de autor</span>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}