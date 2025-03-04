import { Home, Settings, Plane, FileText, ChevronUp, PenLine, BookCopy, Plus, Car, UserRound } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { auth } from "@/auth";
import { MdOutlineColorLens } from "react-icons/md";
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
import { Button } from "./ui/button";

// Menu items.
const items = [
  {
    title: "Blog",
    url: "/blog",
    icon: FileText,
  },
];

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

              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {session ? (
          <SidebarGroup>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <a href="/ajustes">
                    <Settings />
                    <span>Ajustes</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        ) : (
          ""
        )}

        <SidebarGroup>
          <SidebarGroupLabel>Herramientas</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <Collapsible className="group/collapsible">
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton>
                      <MdOutlineColorLens />
                      <span>Paletas de colores</span>
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      <SidebarMenuSubItem>
                        <SidebarMenuButton asChild>
                          <a href={"/generar-colores"}>
                            <span>Generador de paletas</span>
                          </a>
                        </SidebarMenuButton>
                        <SidebarMenuButton asChild>
                          <a href={"/paleta-de-colores/catalogo"}>
                            <span>Catalogo de paletas</span>
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

        <SidebarGroup>
          <SidebarGroupLabel>Creadores de contenido</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <Collapsible className="group/collapsible">
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton>
                      <PenLine />
                      <span>Editor</span>
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      <SidebarMenuSubItem>
                        <div className="flex items-center justify-between">
                          <SidebarMenuButton asChild>
                            <a href={"/editor/blog"}>
                              <span>Blog</span>
                            </a>
                          </SidebarMenuButton>
                          <Button
                            variant="ghost"
                            size="rounded"
                            className="hover:bg-background hover:text-background text-foreground h-5"
                          >
                            <a href={"/editor/crear/blog"}>
                              <Plus className="h-4" /> <span className="sr-only">Crear blog</span>
                            </a>
                          </Button>
                        </div>
                        <div className="flex items-center justify-between">
                          <SidebarMenuButton asChild>
                            <a href={"/editor/noticias"}>
                              <span>Noticias</span>
                            </a>
                          </SidebarMenuButton>
                          <Button
                            variant="ghost"
                            size="rounded"
                            className="hover:bg-background hover:text-background h-5"
                          >
                            <a href={"/editor/crear/noticias"}>
                              <Plus className="h-4" /> <span className="sr-only">Crear articulo</span>
                            </a>
                          </Button>
                        </div>
                        <div className="flex items-center justify-between">
                          <SidebarMenuButton asChild>
                            <a href={"/editor/juegos"}>
                              <span>Juegos</span>
                            </a>
                          </SidebarMenuButton>
                          <Button
                            variant="ghost"
                            size="rounded"
                            className="hover:bg-background hover:text-background h-5"
                          >
                            <a href={"/editor/crear/juegos"}>
                              <Plus className="h-4" /> <span className="sr-only">Crear nuevo juego</span>
                            </a>
                          </Button>
                        </div>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            </SidebarMenu>
            <SidebarMenu>
              <Collapsible className="group/collapsible">
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton>
                      <BookCopy />
                      <span>Instructor</span>
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      <SidebarMenuSubItem>
                        <div className="flex items-center justify-between">
                          <SidebarMenuButton asChild>
                            <a href={"/instructor/cursos"}>
                              <span>Cursos</span>
                            </a>
                          </SidebarMenuButton>
                          <Button
                            variant="ghost"
                            size="rounded"
                            className="hover:bg-background hover:text-background h-5"
                          >
                            <a href={"/instructor/crear"}>
                              <Plus className="h-4" /> <span className="sr-only">Crear nuevo curso</span>
                            </a>
                          </Button>
                        </div>
                        <SidebarMenuButton asChild>
                          <a href={"/instructor/analiticas"}>
                            <span>Analiticas</span>
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
                    <span>Prensa</span>
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <a href={"/"} className="underline-offset-4 hover:underline">
                    <span>Derechos de autor</span>
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <a href={"/"} className="underline-offset-4 hover:underline">
                    <span>Contactar</span>
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <a href={"/"} className="underline-offset-4 hover:underline">
                    <span>Publicidad</span>
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <a href={"/"} className="underline-offset-4 hover:underline">
                    <span>Terminos</span>
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <a href={"/"} className="underline-offset-4 hover:underline">
                    <span>Privacidad</span>
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <a href={"/"} className="underline-offset-4 hover:underline">
                    <span>RoadMap</span>
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

