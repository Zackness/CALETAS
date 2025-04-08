import { Home, Settings, Plane, FileText, ChevronUp, PenLine, BookCopy, Plus, Car, UserRound } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { auth } from "@/auth";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";
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

export async function AppSidebar() {
  const session = await auth();

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
                <SidebarMenuButton asChild>
                  <a href={"/home"}>
                    <Home />
                    <span>Home</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <Collapsible className="group/collapsible">
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton>
                      <Car />
                        <p>Protección automovil</p>
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      <SidebarMenuSubItem>
                        <SidebarMenuButton asChild>
                          <a href={"/creator/analiticas"}>
                            <span>Compra de vehiculo</span>
                          </a>
                        </SidebarMenuButton>
                        <SidebarMenuButton asChild>
                          <a href={"/creator/comunidad"}>
                            <span>Venta de vehiculo</span>
                          </a>
                        </SidebarMenuButton>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>

              <Collapsible className="group/collapsible">
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton>
                      <Plane />
                      <span>Protección viajero</span>
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      <SidebarMenuSubItem>
                        <SidebarMenuButton asChild>
                          <a href={"/juegos"}>
                            <span>Viajes al exterior</span>
                          </a>
                        </SidebarMenuButton>
                        <SidebarMenuButton asChild>
                          <a href={"/cursos"}>
                            <span>Viajes nacionales</span>
                          </a>
                        </SidebarMenuButton>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>

              <Collapsible className="group/collapsible">
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton>
                      <UserRound  />
                      <span>Personal</span>
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      <SidebarMenuSubItem>
                        <SidebarMenuButton asChild>
                          <a href={"/solicitudes/personal/solteria"}>
                            <span>Carta de soltería</span>
                          </a>
                        </SidebarMenuButton>
                        <SidebarMenuButton asChild>
                          <a href={"/cursos"}>
                            <span>Viajes nacionales</span>
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

              <Collapsible className="group/collapsible">
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton>
                      <Settings />
                        <p>Ajustes</p>
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      <SidebarMenuSubItem>
                        <SidebarMenuButton asChild>
                          <a href={"/ajustes/cuenta"}>
                            <span>Ajustes de la cuenta</span>
                          </a>
                        </SidebarMenuButton>
                        <SidebarMenuButton asChild>
                          <a href={"/ajustes/familiares"}>
                            <span>Administrar familiares</span>
                          </a>
                        </SidebarMenuButton>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>

                <SidebarMenuButton asChild>
                  <a href="/blog">
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