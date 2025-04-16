"use client";

import { Home, Settings, Plane, FileText, ChevronUp, PenLine, BookCopy, Plus, Car, UserRound, Building, HeartHandshake, Briefcase, Globe, CreditCard } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../../../components/ui/dropdown-menu";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../../../components/ui/collapsible";
import { IoBusinessOutline } from "react-icons/io5";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSubItem,
  SidebarMenuSub,
} from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";

interface AppSidebarProps {
  session: any;
}

export function AppSidebar({ session }: AppSidebarProps) {
  const pathname = usePathname();

  // Función para verificar si una ruta está activa
  const isActiveRoute = (route: string) => {
    return pathname === route;
  };

  // Función para verificar si una ruta pertenece a una sección
  const isInSection = (section: string) => {
    return pathname.startsWith(section);
  };

  return (
    <Sidebar collapsible="icon" className="text-foreground">
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
                <SidebarMenuButton className={`${isActiveRoute("/home") ? "bg-foreground/50 text-foreground hover:bg-foreground/80" : "hover:bg-foreground/50"}`} asChild>
                  <a 
                    href={"/home"} 
                  >
                    <Home />
                    <span>Home</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <Collapsible 
                className="group/collapsible"
                defaultOpen={isInSection("/solicitudes/automovil")}
              >
                <SidebarMenuItem className={isInSection("/solicitudes/automovil") ? "bg-gradient-to-r from-blue-500 to-cyan-500 dark:from-blue-600 dark:to-cyan-600 text-foreground rounded-xl pb-2" : ""}>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton className={`${isInSection("/solicitudes/automovil") ? "text-foreground hover:bg-transparent" : "hover:bg-foreground/50"}`}>
                      <Car />
                      <p>Protección automovil</p>
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      <SidebarMenuSubItem>
                        <SidebarMenuButton asChild>
                          <a 
                            href={"/solicitudes/automovil/compra"} 
                            className={`${isActiveRoute("/solicitudes/automovil/compra") ? "bg-foreground/50 text-background hover:bg-foreground/80" : "hover:bg-foreground/50"}`}
                          >
                            <span>Compra-venta de vehiculo</span>
                          </a>
                        </SidebarMenuButton>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>

              <Collapsible 
                className="group/collapsible"
                defaultOpen={isInSection("/solicitudes/vivienda")}
              >
                <SidebarMenuItem className={isInSection("/solicitudes/vivienda") ? "bg-gradient-to-r from-green-500 to-emerald-500 dark:from-green-600 dark:to-emerald-600 text-foreground rounded-xl pb-2" : ""}>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton className={`${isInSection("/solicitudes/vivienda") ? "text-foreground hover:bg-transparent" : "hover:bg-foreground/50"}`}>
                      <Building />
                      <span>Protección vivienda</span>
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      <SidebarMenuSubItem>
                        <SidebarMenuButton asChild>
                          <a 
                            href={"/solicitudes/vivienda/declaracion"} 
                            className={`${isActiveRoute("/solicitudes/vivienda/declaracion") ? "bg-foreground/50 text-background hover:bg-foreground/80" : "hover:bg-foreground/50"}`}
                          >
                            <span>Declaración de no poseer vivienda</span>
                          </a>
                        </SidebarMenuButton>
                        <SidebarMenuButton asChild>
                          <a 
                            href={"/solicitudes/vivienda/compra-venta"} 
                            className={`${isActiveRoute("/solicitudes/vivienda/compra-venta") ? "bg-foreground/50 text-background hover:bg-foreground/80" : "hover:bg-foreground/50"}`}
                          >
                            <span>Compra-venta de vivienda</span>
                          </a>
                        </SidebarMenuButton>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>

              <Collapsible 
                className="group/collapsible"
                defaultOpen={isInSection("/solicitudes/viajero")}
              >
                <SidebarMenuItem className={isInSection("/solicitudes/viajero") ? "bg-gradient-to-r from-purple-500 to-indigo-500 dark:from-purple-600 dark:to-indigo-600 text-foreground rounded-xl pb-2" : ""}>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton className={`${isInSection("/solicitudes/viajero") ? "text-foreground hover:bg-transparent" : "hover:bg-foreground/50"}`}>
                      <Plane />
                      <span>Protección viajero</span>
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      <SidebarMenuSubItem>
                        <SidebarMenuButton asChild>
                          <a 
                            href={"/solicitudes/viajero/exterior"} 
                            className={`${isActiveRoute("/solicitudes/viajero/exterior") ? "bg-foreground/50 text-background hover:bg-foreground/80" : "hover:bg-foreground/50"}`}
                          >
                            <span>Viajes al exterior</span>
                          </a>
                        </SidebarMenuButton>
                        <SidebarMenuButton asChild>
                          <a 
                            href={"/solicitudes/viajero/nacional"} 
                            className={`${isActiveRoute("/solicitudes/viajero/nacional") ? "bg-foreground/50 text-background hover:bg-foreground/80" : "hover:bg-foreground/50"}`}
                          >
                            <span>Viajes nacionales</span>
                          </a>
                        </SidebarMenuButton>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>

              <Collapsible 
                className="group/collapsible"
                defaultOpen={isInSection("/solicitudes/herencia")}
              >
                <SidebarMenuItem className={isInSection("/solicitudes/herencia") ? "bg-gradient-to-r from-amber-500 to-orange-500 dark:from-amber-600 dark:to-orange-600 text-foreground rounded-xl pb-2" : ""}>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton className={`${isInSection("/solicitudes/herencia") ? "text-foreground hover:bg-transparent" : "hover:bg-foreground/50"}`}>
                      <HeartHandshake />
                      <span>Protección herencia</span>
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      <SidebarMenuSubItem>
                        <SidebarMenuButton asChild>
                          <a 
                            href={"/solicitudes/herencia/declaracion"} 
                            className={`${isActiveRoute("/solicitudes/herencia/declaracion") ? "bg-foreground/50 text-background hover:bg-foreground/80" : "hover:bg-foreground/50"}`}
                          >
                            <span>Declaración de Sucesiones</span>
                          </a>
                        </SidebarMenuButton>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>

              <Collapsible 
                className="group/collapsible"
                defaultOpen={isInSection("/solicitudes/personal")}
              >
                <SidebarMenuItem className={isInSection("/solicitudes/personal") ? "bg-gradient-to-r from-pink-500 to-rose-500 dark:from-pink-600 dark:to-rose-600 text-foreground rounded-xl pb-2" : ""}>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton className={`${isInSection("/solicitudes/personal") ? "text-foreground hover:bg-transparent" : "hover:bg-foreground/50"}`}>
                      <UserRound />
                      <span>Personal</span>
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      <SidebarMenuSubItem>
                        <SidebarMenuButton asChild>
                          <a 
                            href={"/solicitudes/personal/solteria"} 
                            className={`${isActiveRoute("/solicitudes/personal/solteria") ? "bg-foreground/50 text-background hover:bg-foreground/80" : "hover:bg-foreground/50"}`}
                          >
                            <span>Carta de soltería</span>
                          </a>
                        </SidebarMenuButton>
                        <SidebarMenuButton asChild>
                          <a 
                            href={"/solicitudes/personal/poder"} 
                            className={`${isActiveRoute("/solicitudes/personal/poder") ? "bg-foreground/50 text-background hover:bg-foreground/80" : "hover:bg-foreground/50"}`}
                          >
                            <span>Poder especial o general</span>
                          </a>
                        </SidebarMenuButton>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>

              <Collapsible 
                className="group/collapsible"
                defaultOpen={isInSection("/solicitudes/empresarial")}
              >
                <SidebarMenuItem className={isInSection("/solicitudes/empresarial") ? "bg-gradient-to-r from-blue-600 to-violet-600 dark:from-blue-700 dark:to-violet-700 text-foreground rounded-xl pb-2" : ""}>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton className={`${isInSection("/solicitudes/empresarial") ? "text-foreground hover:bg-transparent" : "hover:bg-foreground/50"}`}>
                      <Briefcase />
                      <span>Empresarial</span>
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      <SidebarMenuSubItem>
                        <SidebarMenuButton asChild>
                          <a 
                            href={"/solicitudes/empresarial/constitucion"} 
                            className={`${isActiveRoute("/solicitudes/empresarial/constitucion") ? "bg-foreground/50 text-background hover:bg-foreground/80" : "hover:bg-foreground/50"}`}
                          >
                            <span>Constitución de empresa PYME</span>
                          </a>
                        </SidebarMenuButton>
                        <SidebarMenuButton asChild>
                          <a 
                            href={"/solicitudes/empresarial/asamblea"} 
                            className={`${isActiveRoute("/solicitudes/empresarial/asamblea") ? "bg-foreground/50 text-background hover:bg-foreground/80" : "hover:bg-foreground/50"}`}
                          >
                            <span>Acta de Asamblea de Accionistas</span>
                          </a>
                        </SidebarMenuButton>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>

              <Collapsible 
                className="group/collapsible"
                defaultOpen={isInSection("/solicitudes/migrante")}
              >
                <SidebarMenuItem className={isInSection("/solicitudes/migrante") ? "bg-gradient-to-r from-teal-500 to-cyan-500 dark:from-teal-600 dark:to-cyan-600 text-foreground rounded-xl pb-2" : ""}>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton className={`${isInSection("/solicitudes/migrante") ? "text-foreground hover:bg-transparent" : "hover:bg-foreground/50"}`}>
                      <Globe />
                      <span>Migrante</span>
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      <SidebarMenuSubItem>
                        <SidebarMenuButton asChild>
                          <a 
                            href={"/solicitudes/migrante/poder"} 
                            className={`${isActiveRoute("/solicitudes/migrante/poder") ? "bg-foreground/50 text-background hover:bg-foreground/80" : "hover:bg-foreground/50"}`}
                          >
                            <span>Poder desde el exterior</span>
                          </a>
                        </SidebarMenuButton>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>

              <Collapsible 
                className="group/collapsible"
                defaultOpen={isInSection("/solicitudes/financiera")}
              >
                <SidebarMenuItem className={isInSection("/solicitudes/financiera") ? "bg-gradient-to-r from-emerald-500 to-green-600 dark:from-emerald-600 dark:to-green-700 text-foreground rounded-xl pb-2" : ""}>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton className={`${isInSection("/solicitudes/financiera") ? "text-foreground hover:bg-transparent" : "hover:bg-foreground/50"}`}>
                      <CreditCard />
                      <span>Financiera</span>
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      <SidebarMenuSubItem>
                        <SidebarMenuButton asChild>
                          <a 
                            href={"/solicitudes/financiera/certificacion"} 
                            className={`${isActiveRoute("/solicitudes/financiera/certificacion") ? "bg-foreground/50 text-background hover:bg-foreground/80" : "hover:bg-foreground/50"}`}
                          >
                            <span>Certificación de ingresos</span>
                          </a>
                        </SidebarMenuButton>
                        <SidebarMenuButton asChild>
                          <a 
                            href={"/solicitudes/financiera/balance"} 
                            className={`${isActiveRoute("/solicitudes/financiera/balance") ? "bg-foreground/50 text-background hover:bg-foreground/80" : "hover:bg-foreground/50"}`}
                          >
                            <span>Balance personal</span>
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

        {session ? (
          <SidebarGroup>
            <SidebarMenu>
              <SidebarMenuItem>
                <Collapsible 
                  className="group/collapsible"
                  defaultOpen={isInSection("/ajustes")}
                >
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton className={`${isInSection("/ajustes") ? "text-foreground hover:bg-transparent" : "hover:bg-foreground/50"}`}>
                      <Settings />
                      <p>Ajustes</p>
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      <SidebarMenuSubItem>
                        <SidebarMenuButton asChild>
                          <a 
                            href={"/ajustes/cuenta"} 
                            className={`${isActiveRoute("/ajustes/cuenta") ? "bg-foreground/50 text-background hover:bg-foreground/80" : "hover:bg-foreground/50"}`}
                          >
                            <span>Ajustes de la cuenta</span>
                          </a>
                        </SidebarMenuButton>
                        <SidebarMenuButton asChild>
                          <a 
                            href={"/ajustes/familiares"} 
                            className={`${isActiveRoute("/ajustes/familiares") ? "bg-foreground/50 text-background hover:bg-foreground/80" : "hover:bg-foreground/50"}`}
                          >
                            <span>Administrar familiares</span>
                          </a>
                        </SidebarMenuButton>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </Collapsible>

                <SidebarMenuButton asChild>
                  <a 
                    href="/blog"
                    className={`${isActiveRoute("/blog") ? "bg-foreground/50 text-background hover:bg-foreground/80" : "hover:bg-foreground/50"}`}
                  >
                    <FileText />
                    <span>Blog</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        ) : (
          ""
        )}
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
                  <a href={"/"} className="underline-offset-4 hover:underline">
                    <span>Informacion</span>
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <a href={"/"} className="underline-offset-4 hover:underline">
                    <span>Privacidad</span>
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <a href={"/"} className="underline-offset-4 hover:underline">
                    <span>Terminos</span>
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <a href={"/"} className="underline-offset-4 hover:underline">
                    <span>Contactar</span>
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <a href={"/"} className="underline-offset-4 hover:underline">
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