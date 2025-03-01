

import { Home, Newspaper, Settings, Gamepad, GraduationCap, Ticket, FileText, ChevronDown, ChevronUp, PenLine, BookCopy, MoreHorizontal, Plus, Flame } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu"
import { logout } from "@/actions/logout"
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { MdOutlineColorLens } from "react-icons/md"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible"
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
    SidebarMenuAction,
  } from "@/components/ui/sidebar"
import { Button } from "./ui/button";

// Menu items.
const items = [
  {
    title: "Experience",
    url: "/eventos",
    icon: Ticket,
  },
  {
    title: "MonsterNews",
    url: "/noticias",
    icon: Newspaper,
  },
  {
    title: "Blog",
    url: "/blog",
    icon: FileText,
  },
]

const logotype = [
    { viewBox: "0 0 182.2 199.5", icon: "M146.6 147.6c.2-.4.6-.8 1-.9 1.1-.3 2.4-.5 3.8-.7 1-.1 2-.2 2.9-.3s1.6.7 1.5 1.6c-.1 1.7-.3 3.5-.5 5.4-.3 2.4-.7 4.7-1.1 6.9-.1.7-.8 1.2-1.5 1.2-2.2-.2-4.6-.6-7.2-1.3l-1.2-.4c-.8-.2-1.2-1-1-1.8.5-1.8 1.1-3.7 1.8-5.6.5-1.3 1-2.7 1.5-4.1zM161.1 142.6c-1.3.3-2.3 1.4-2.6 2.7-.4 1.8-.7 3.6-1 5.6-.5 3.6-.8 7-.9 10.2-.1 1.4.7 2.7 2 3.3.6.3 1.4.6 2.1.9 2.2.8 4.2 1 5.9 1s3.2-1.2 3.5-2.9c.4-2.4.7-4.9.9-7.7.2-3.6.2-6.8.1-9.8-.1-1.5-1.1-2.8-2.5-3.2-1-.3-2.3-.5-3.7-.5-1.6 0-2.8.1-3.8.4zM36.2 147.6c-.2-.4-.5-.8-1-.9-1.1-.3-2.4-.5-3.8-.7-1-.1-2-.2-2.9-.3s-1.6.7-1.5 1.6c.1 1.7.3 3.5.5 5.4.3 2.4.7 4.7 1.1 6.9.1.7.8 1.2 1.5 1.2 2.2-.2 4.6-.6 7.2-1.3l1.2-.4c.8-.2 1.2-1 1-1.8-.5-1.8-1.1-3.7-1.8-5.6-.4-1.3-.9-2.7-1.5-4.1zM21.8 142.6c1.3.3 2.3 1.4 2.6 2.7.4 1.8.7 3.6 1 5.6.5 3.6.8 7 .9 10.2.1 1.4-.7 2.7-2 3.3-.6.3-1.4.6-2.1.9-2.2.8-4.2 1-5.8 1-1.7 0-3.2-1.2-3.5-2.9-.4-2.4-.7-4.9-.9-7.7-.2-3.6-.2-6.8-.1-9.8.1-1.5 1.1-2.8 2.5-3.2 1-.3 2.3-.5 3.7-.5 1.5 0 2.7.1 3.7.4zM159.4 1.9c5.8 3.2 8.9 9.9 7.6 16.4l-3.1 16.2-2.2 8.2c-.3 1-1.3 1.7-2.4 1.7h-2.1c-1.2 0-2.2-.7-2.4-1.7l-2.5-6.5c-.3-1-1.3-1.7-2.4-1.7s-2.2.7-2.4 1.7l-2.5 6.5c-.3 1-1.3 1.7-2.4 1.7h-1.3c-1.2 0-2.2-.7-2.4-1.7l-2.5-6.5c-.3-1-1.3-1.7-2.4-1.7h-.7c-1.2 0-2.2.7-2.4 1.7l-2.5 6.5c-.3 1-1.3 1.7-2.4 1.7h-1.3c-1.2 0-2.2-.7-2.4-1.7l-2.5-6.5c-.3-1-1.3-1.7-2.4-1.7h-.7c-1.2 0-2.2.7-2.4 1.7l-2.5 6.5c-.3 1-1.3 1.7-2.4 1.7h-1.6c-1.2 0-2.2-.7-2.4-1.7l-2.6-6.5c-.3-1-1.3-1.7-2.4-1.7h-.7c-1.2 0-2.2.7-2.4 1.7l-2.5 6.6c-.3 1-1.3 1.7-2.4 1.7h-1.3c-1.2 0-2.2-.7-2.4-1.7l-2.5-6.5c-.3-1-1.3-1.7-2.4-1.7h-.7c-1.2 0-2.2.7-2.4 1.7l-2.5 6.5c-.3 1-1.3 1.7-2.4 1.7h-1.3c-1.2 0-2.2-.7-2.4-1.7l-2.5-6.5c-.3-1-1.3-1.7-2.4-1.7h-.7c-1.2 0-2.2.7-2.4 1.7l-2.5 6.5c-.3 1-1.3 1.7-2.4 1.7h-1.3c-1.2 0-2.2-.7-2.4-1.7l-2.7-6.6c-.3-1-1.3-1.7-2.4-1.7h-.7c-1.2 0-2.2.7-2.4 1.7l-2.5 6.5c-.3 1-1.3 1.7-2.4 1.7h-1.3c-1.2 0-2.2-.7-2.4-1.7l-2.5-6.5c-.3-1-1.3-1.7-2.4-1.7h-.4c-1.2 0-2.2.7-2.4 1.7l-2.5 6.5c-.3 1-1.3 1.7-2.4 1.7h-2.3c-1.2 0-2.2-.7-2.4-1.7l-2.2-8.2-3.1-16.8C14.9 11.3 18 4.9 23.6 1.8 25.8.5 28.4-.1 30.9-.1h120.9c2.6 0 5.2.6 7.6 2-.1 0 0 0 0 0z M159.4 49H155.6c-.6 0-1.2-.4-1.3-1l-1.4-5.6c-.2-1-1.2-1.6-2.3-1.6h-1.1c-1.1 0-2 .7-2.3 1.6l-2.4 6.5c-.2 1-1.2 1.7-2.3 1.7h-.6c-1.1 0-2.8-.7-3.1-1.7l-2.4-6.5c-.2-1-1.2-1.6-2.3-1.6H133c-1.1 0-2 .7-2.3 1.6l-2.4 6.5c-.2 1-2.7 1.7-3.8 1.7h-.6c-1.1 0-2-.7-2.3-1.7l-2.4-6.5c-.2-1-1.2-1.6-2.3-1.6h-1.1c-1.1 0-2 .7-2.3 1.6l-2.2 6.5c-.2 1-1.2 1.7-2.3 1.7h-.6c-1.1 0-2.8-.7-3.1-1.7l-2.4-6.5c-.2-1-1.2-1.6-2.3-1.6h-1.1c-1.1 0-2 .7-2.3 1.6L95 48.9c-.2 1-1.2 1.7-2.3 1.7h-1.4c-1.1 0-2-.7-2.3-1.7l-2.4-6.5c-.2-1-1.2-1.6-2.3-1.6h-1.1c-1.1 0-2 .7-2.3 1.6l-2.3 6.5c-.2 1-1.2 1.7-2.3 1.7h-.6c-1.1 0-3.6-.7-3.8-1.7l-2.4-6.5c-.2-1-1.2-1.6-2.3-1.6h-1.1c-1.1 0-2 .7-2.3 1.6l-2.3 6.5c-.2 1-2 1.7-3 1.7h-.7c-1.1 0-2-.7-2.3-1.7l-2.4-6.5c-.2-1-1.2-1.6-2.3-1.6h-1c-1.1 0-2 .7-2.3 1.6l-3.2 6.5c-.1.5-.4.9-.8 1.2s-.9.5-1.5.5c-1.1 0-2.8-2.1-3-3.1l-2.4-5.1c-.2-1-1.2-1.6-2.3-1.6h-1.9c-.9 0-1.7 5.3-2.1 7.2-.1.5-.4.8-.9 1-2.5.8-7.1-.8-6.5 1.6l.4 1 8.5 23.8s0 .1.1.2c.4 1.9 0 3.9-1.2 5.5l-1.9 2.5-1.3 1.7c-1 1.3-1.5 3-1.4 4.7l2.3 25.9c.1 1.2.5 2.3 1.2 3.3s1.6 1.8 2.7 2.3c2 1 3.4 2.7 3.8 4.7l13.3 47c.4 1.6 1.4 3.1 2.8 4.1l24.7 18.9c3.9 2.8 8.6 4.4 13.5 4.6h1.9c5-.1 9.7-1.9 13.7-4.6l24.7-18.9c1.4-1 2.4-2.5 2.8-4.1l13.3-47c.5-2 1.9-3.7 3.8-4.7 1.1-.6 2.1-1.3 2.8-2.3s1.1-2.1 1.2-3.3l2.3-25.9c.1-1.7-.3-3.3-1.4-4.7l-1.3-1.7-1.9-2.5c-1.2-1.6-1.7-3.6-1.2-5.6l9.7-24.6s0-.1.1-.1c.3-.9-.4-1.8-1.5-1.8zm-84 65.1c-.4-.4-.7-.8-1.1-1.2-3.2-3.2-7.6-5.2-12.5-5.2s-9.3 2-12.5 5.2c-1.6 1.6-2.9 3.5-3.8 5.6-7.3-10.4-2.6-28.6 13.8-28.6 14.2 0 19.6 13.8 16.1 24.2zm60.2 4.5c-.9-2.2-2.2-4.1-3.8-5.8-3.2-3.2-7.7-5.2-12.6-5.2s-9.3 2-12.6 5.2c-.4.4-.8.8-1.2 1.3-3.4-10.3 2-24 16.2-24 16.4.1 21 18.2 14 28.5z" },
  ]

const onClick = () => {
    logout();
};

export async function AppSidebar() {
    
    const session = await auth();

  return (
    <Sidebar collapsible="icon" className="bg-fm-blue-2 border-none pt-3">

        <SidebarHeader>
            <SidebarMenu>
            <SidebarMenuItem>
                
                    <SidebarMenuButton className="hover:bg-fm-blue-2 hover:text-fm-green font-bold text-fm-green space-x-[-3px] ">
                    <nav>
                        {logotype.map((item) => (
                            
                            <div>
                                <svg className="w-[27px] h-[27px] p-0 ml-[-3px]" fill="#4cac27" viewBox={item.viewBox}>
                                <path d={item.icon} />
                                </svg>
                            </div>
                        ))}
                    </nav>                                     
                    </SidebarMenuButton>
                
            </SidebarMenuItem>
            </SidebarMenu>
        </SidebarHeader>

        <SidebarContent>

            <SidebarGroup>
            <SidebarGroupContent>
                <SidebarMenu className="text-white">

                  <SidebarMenuItem className="text-white">
                  <SidebarMenuButton asChild>
                    <a href={"/home"}>
                      <Home />
                      <span>Home</span>
                    </a>
                  </SidebarMenuButton>
                  </SidebarMenuItem>

                    <Collapsible className="group/collapsible">
                    <SidebarMenuItem className="text-white">
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton>
                          <Flame />
                          <a href="/creator">
                            <span>Creator</span>
                          </a>
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            <SidebarMenuSubItem>
                              <SidebarMenuButton asChild>
                                  <a href={"/creator/analiticas"}>
                                  <span>Analiticas</span>
                                  </a>
                              </SidebarMenuButton>
                              <SidebarMenuButton asChild>
                                  <a href={"/creator/comunidad"}>
                                  <span>Comunidad</span>
                                  </a>
                              </SidebarMenuButton>
                              <SidebarMenuButton asChild>
                                  <a href={"/creator/ingresos"}>
                                  <span>Ingresos</span>
                                  </a>
                              </SidebarMenuButton>
                            </SidebarMenuSubItem>
                          </SidebarMenuSub>
                        </CollapsibleContent>
                    </SidebarMenuItem>
                    </Collapsible>
                  
                  <Collapsible className="group/collapsible">
                    <SidebarMenuItem className="text-white">
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton>
                          <GraduationCap />
                            <span>Academy</span>
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            <SidebarMenuSubItem>
                              <SidebarMenuButton asChild>
                                  <a href={"/juegos"}>
                                  <span>Juegos</span>
                                  </a>
                              </SidebarMenuButton>
                              <SidebarMenuButton asChild>
                                  <a href={"/cursos"}>
                                  <span>Cursos</span>
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
                        <SidebarMenuItem className="text-white">
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
            <SidebarGroupLabel className="text-white">Herramientas</SidebarGroupLabel>
            <SidebarGroupContent>
                <SidebarMenu>
                    <Collapsible className="group/collapsible">
                        <SidebarMenuItem className="text-white">
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
                        <SidebarGroupLabel className="text-white">Creadores de contenido</SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                <Collapsible className="group/collapsible">
                                    <SidebarMenuItem className="text-white">
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
                                            className="hover:bg-fm-blue-3 hover:text-white h-5">
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
                                            className="hover:bg-fm-blue-3 hover:text-white h-5">
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
                                            className="hover:bg-fm-blue-3 hover:text-white h-5">
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
                                    <SidebarMenuItem className="text-white">
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
                                              className="hover:bg-fm-blue-3 hover:text-white h-5">
                                                <a href={"/instructor/crear"}>
                                                <Plus className="h-4"/> <span className="sr-only">Crear nuevo curso</span>
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
            <SidebarMenuItem className="text-white">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton>
                    <IoBusinessOutline /> Informacion y negocios
                    <ChevronUp className="ml-auto" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  side="top"
                  className="w-[--radix-popper-anchor-width] rounded-xl bg-fm-blue-3 text-white"
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
  )
}

  