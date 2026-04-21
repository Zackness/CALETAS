"use client";
import {
  ArrowLeft,
  BarChart3,
  BookOpen,
  FileText,
  FolderKanban,
  HelpCircle,
  History,
  Home,
  Library,
  MessageCircle,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Target,
  Users,
  Upload,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import {
  IA_STORE_EVENT,
  addProjectFile,
  createProject,
  createThread,
  loadIAStore,
  saveIAStore,
} from "@/lib/ia-chat-store";

const sectionTint =
  "border-[#40C9A9]/40 bg-[#40C9A9]/10 shadow-[0_0_0_1px_rgba(64,201,169,0.12)]";
const sectionDot = "h-2 w-2 shrink-0 rounded-full bg-gradient-to-r from-[#40C9A9] to-emerald-300";

export function CaletasSidebarNav({ userRole }: { userRole?: string | null }) {
  const [isAdmin, setIsAdmin] = useState(() => userRole === "ADMIN");
  const [chatStore, setChatStore] = useState(() => loadIAStore());
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [projectIcon, setProjectIcon] = useState("📁");
  const [projectColor, setProjectColor] = useState("#40C9A9");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [courseCategories, setCourseCategories] = useState<string[]>([]);
  const pathname = usePathname();
  const router = useRouter();
  const { isMobile, setOpenMobile } = useSidebar();
  const closeMobile = () => {
    if (isMobile) setOpenMobile(false);
  };
  const isIAChatMode = pathname.startsWith("/ia/chat");
  const isCoursesMode = pathname.startsWith("/cursos");
  const isAdminMode = pathname.startsWith("/admin");

  useEffect(() => {
    // Preferir rol desde sesión (evita depender de /api/user y la DB).
    if (userRole) {
      setIsAdmin(userRole === "ADMIN");
      return;
    }

    // Fallback: si la sesión no trae role, consultamos /api/user
    fetch("/api/user")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        setIsAdmin(data?.user?.role === "ADMIN");
      })
      .catch(() => {
        // ignorar errores silenciosamente
      });
  }, [userRole]);

  useEffect(() => {
    const sync = () => setChatStore(loadIAStore());
    window.addEventListener("storage", sync);
    window.addEventListener(IA_STORE_EVENT, sync as EventListener);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(IA_STORE_EVENT, sync as EventListener);
    };
  }, []);

  useEffect(() => {
    if (!isCoursesMode) return;
    fetch("/api/cursos")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const cursos = Array.isArray(data?.cursos) ? data.cursos : [];
        const categorias: string[] = Array.from(
          new Set<string>(
            cursos
              .map((c: { tema?: string | null }) => c.tema?.trim())
              .filter((t: string | undefined): t is string => !!t),
          ),
        ).sort((a, b) => a.localeCompare(b, "es"));
        setCourseCategories(categorias);
      })
      .catch(() => {
        setCourseCategories([]);
      });
  }, [isCoursesMode]);

  const visibleThreads = useMemo(() => {
    if (!chatStore.activeProjectId) return chatStore.threads;
    return chatStore.threads.filter((t) => t.projectId === chatStore.activeProjectId);
  }, [chatStore]);

  const baseLinkClass =
    "flex min-w-0 items-center gap-3 rounded-lg px-3 py-2 text-white transition-colors hover:bg-[#354B3A] [&>span:last-child]:min-w-0 [&>span:last-child]:flex-1 [&>span:last-child]:truncate";

  const createNewProject = () => {
    setProjectName("");
    setProjectIcon("📁");
    setProjectColor("#40C9A9");
    setProjectDialogOpen(true);
  };

  const saveNewProject = () => {
    if (!projectName.trim()) return;
    const next = createProject(chatStore, {
      name: projectName.trim(),
      icon: projectIcon,
      color: projectColor,
    });
    saveIAStore(next);
    setChatStore(next);
    setProjectDialogOpen(false);
  };

  const createNewChat = () => {
    const next = createThread(chatStore, chatStore.activeProjectId);
    saveIAStore(next);
    setChatStore(next);
    router.push("/ia/chat");
    closeMobile();
  };

  const selectProject = (projectId: string | null) => {
    const next = { ...chatStore, activeProjectId: projectId };
    saveIAStore(next);
    setChatStore(next);
  };

  const uploadProjectFile = async (file: File) => {
    if (!chatStore.activeProjectId) return;
    const supported = ["text/plain", "text/markdown", "application/json", "text/csv"];
    if (!supported.includes(file.type)) {
      alert("Por ahora solo se admiten TXT, MD, JSON y CSV para contexto automático.");
      return;
    }
    const text = await file.text();
    const next = addProjectFile(chatStore, {
      projectId: chatStore.activeProjectId,
      name: file.name,
      mimeType: file.type,
      size: file.size,
      textContent: text.slice(0, 20000),
    });
    saveIAStore(next);
    setChatStore(next);
  };

  const selectThread = (threadId: string) => {
    const next = { ...chatStore, activeThreadId: threadId };
    saveIAStore(next);
    setChatStore(next);
    router.push("/ia/chat");
    closeMobile();
  };

  const renderIAMenu = () => {
    const subLink =
      "flex min-w-0 items-center gap-2 rounded-xl px-2 py-1.5 text-sm text-white/90 transition-colors hover:bg-white/10";

    return (
      <div className="flex flex-col gap-3 px-1">
        <button
          type="button"
          onClick={() => {
            router.push("/home");
            closeMobile();
          }}
          className="w-full flex items-center gap-2 text-white/90 hover:text-white hover:bg-[#354B3A] rounded-lg px-3 py-2 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 text-[#40C9A9]" />
          <span>Volver al menú general</span>
        </button>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem className={cn("rounded-2xl border border-transparent", sectionTint)}>
                <div className="flex items-center justify-between gap-2 px-2 py-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-white">
                    <FolderKanban className="h-4 w-4 shrink-0 text-[#40C9A9]" />
                    <span className="truncate">Proyectos IA</span>
                  </div>
                  <button
                    type="button"
                    onClick={createNewProject}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-white/10 text-white transition-colors hover:bg-white/20"
                    aria-label="Crear proyecto"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                <SidebarMenuSub className="pb-2">
                  <SidebarMenuSubItem>
                    <button
                      type="button"
                      onClick={() => selectProject(null)}
                      className={cn(
                        subLink,
                        "w-full justify-start",
                        chatStore.activeProjectId === null && "bg-[#40C9A9]/20 text-white",
                      )}
                    >
                      Todos los chats
                    </button>
                  </SidebarMenuSubItem>
                  {chatStore.projects.map((project) => (
                    <SidebarMenuSubItem key={project.id}>
                      <button
                        type="button"
                        onClick={() => selectProject(project.id)}
                        className={cn(
                          subLink,
                          "w-full justify-start",
                          chatStore.activeProjectId === project.id && "bg-[#40C9A9]/20 text-white",
                        )}
                      >
                        <span
                          className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded"
                          style={{ backgroundColor: project.color }}
                        >
                          {project.icon}
                        </span>
                        <span className="truncate">{project.name}</span>
                      </button>
                    </SidebarMenuSubItem>
                  ))}
                </SidebarMenuSub>
              </SidebarMenuItem>

              <SidebarMenuItem className={cn("rounded-2xl border border-transparent", sectionTint)}>
                <div className="flex items-center justify-between gap-2 px-2 py-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-white">
                    <MessageCircle className="h-4 w-4 shrink-0 text-[#40C9A9]" />
                    <span className="truncate">Chats</span>
                  </div>
                  <button
                    type="button"
                    onClick={createNewChat}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-white/10 text-white transition-colors hover:bg-white/20"
                    aria-label="Nuevo chat"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                <SidebarMenuSub className="pb-2">
                  <div className="max-h-[45vh] overflow-y-auto pr-1">
                    {visibleThreads.map((thread) => (
                      <SidebarMenuSubItem key={thread.id}>
                        <button
                          type="button"
                          onClick={() => selectThread(thread.id)}
                          className={cn(
                            subLink,
                            "w-full justify-start",
                            chatStore.activeThreadId === thread.id && "bg-[#40C9A9]/20 text-white",
                          )}
                          title={thread.title}
                        >
                          <span className="truncate">{thread.title}</span>
                        </button>
                      </SidebarMenuSubItem>
                    ))}
                    {!visibleThreads.length ? (
                      <div className="px-2 py-2 text-xs text-white/60">No hay chats en este proyecto.</div>
                    ) : null}
                  </div>
                </SidebarMenuSub>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </div>
    );
  };

  const renderCoursesMenu = () => (
    <div className="flex flex-col gap-3 px-1">
      <button
        type="button"
        onClick={() => {
          router.push("/home");
          closeMobile();
        }}
        className="w-full flex items-center gap-2 text-white/90 hover:text-white hover:bg-[#354B3A] rounded-lg px-3 py-2 transition-colors"
      >
        <ArrowLeft className="h-4 w-4 text-[#40C9A9]" />
        <span>Volver al menú general</span>
      </button>

      <div className="space-y-1">
        <Link onClick={closeMobile} href="/cursos" className={baseLinkClass}>
          <Library className="h-5 w-5 text-[#40C9A9]" />
          <span>Inicio de Cursos</span>
        </Link>
      </div>

      <div className="bg-[#354B3A] border border-white/10 rounded-xl p-3 space-y-2">
        <h3 className="text-sm font-semibold text-white">Categorías</h3>
        {courseCategories.length > 0 ? (
          <div className="space-y-1">
            {courseCategories.map((cat) => (
              <Link
                key={cat}
                href={`/cursos?tema=${encodeURIComponent(cat)}`}
                onClick={closeMobile}
                className="block rounded-md px-2 py-1.5 text-sm text-white/85 transition-colors hover:bg-white/10 hover:text-white"
              >
                {cat}
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-xs text-white/60">Sin categorías publicadas por ahora.</p>
        )}
      </div>
    </div>
  );

  const renderAdminMenu = () => {
    const adminLink =
      "text-white hover:bg-white/10 data-[active=true]:bg-[#40C9A9]/20 data-[active=true]:text-white";
    const row =
      "flex min-w-0 items-center gap-2 [&>span:last-child]:min-w-0 [&>span:last-child]:flex-1 [&>span:last-child]:truncate";

    return (
      <div className="flex flex-col gap-3 px-1">
        <button
          type="button"
          onClick={() => {
            router.push("/home");
            closeMobile();
          }}
          className="w-full flex items-center gap-2 text-white/90 hover:text-white hover:bg-[#354B3A] rounded-lg px-3 py-2 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 text-[#40C9A9]" />
          <span>Volver al menú general</span>
        </button>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname.startsWith("/admin/estadisticas")}
                  className={adminLink}
                >
                  <Link href="/admin/estadisticas" onClick={closeMobile} className={row}>
                    <BarChart3 className="h-4 w-4 shrink-0 text-[#40C9A9]" />
                    <span className="truncate">Estadísticas</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname.startsWith("/admin/usuarios")}
                  className={adminLink}
                >
                  <Link href="/admin/usuarios" onClick={closeMobile} className={row}>
                    <Users className="h-4 w-4 shrink-0 text-[#40C9A9]" />
                    <span className="truncate">Usuarios</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname.startsWith("/admin/pagos")}
                  className={adminLink}
                >
                  <Link href="/admin/pagos" onClick={closeMobile} className={row}>
                    <ShieldCheck className="h-4 w-4 shrink-0 text-[#40C9A9]" />
                    <span className="truncate">Pagos</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname.startsWith("/admin/blog")}
                  className={adminLink}
                >
                  <Link href="/admin/blog" onClick={closeMobile} className={row}>
                    <FileText className="h-4 w-4 shrink-0 text-[#40C9A9]" />
                    <span className="truncate">Blog</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname.startsWith("/admin/biblioteca")}
                  className={adminLink}
                >
                  <Link href="/admin/biblioteca" onClick={closeMobile} className={row}>
                    <Library className="h-4 w-4 shrink-0 text-[#40C9A9]" />
                    <span className="truncate">Biblioteca de libros</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname.startsWith("/admin/pensums")}
                  className={adminLink}
                >
                  <Link href="/admin/pensums" onClick={closeMobile} className={row}>
                    <BookOpen className="h-4 w-4 shrink-0 text-[#40C9A9]" />
                    <span className="truncate">Pensums</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname.startsWith("/admin/media")}
                  className={adminLink}
                >
                  <Link href="/admin/media" onClick={closeMobile} className={row}>
                    <Upload className="h-4 w-4 shrink-0 text-[#40C9A9]" />
                    <span className="truncate">Biblioteca de medios</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname.startsWith("/admin/cursos")}
                  className={adminLink}
                >
                  <Link href="/admin/cursos" onClick={closeMobile} className={row}>
                    <Library className="h-4 w-4 shrink-0 text-[#40C9A9]" />
                    <span className="truncate">Gestión de cursos</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </div>
    );
  };

  const caletasExploreActive =
    pathname === "/caletas" ||
    (pathname.startsWith("/caletas/") &&
      !pathname.startsWith("/caletas/crear") &&
      !pathname.startsWith("/caletas/mis-recursos") &&
      !pathname.startsWith("/caletas/favoritos") &&
      !pathname.startsWith("/caletas/estadisticas"));

  const renderGeneralMenu = () => {
    const inCaletas = pathname.startsWith("/caletas");
    const inAcademico = pathname.startsWith("/academico");
    const inCursos = pathname.startsWith("/cursos");
    const inIA = pathname.startsWith("/ia");
    const inAdminNav = pathname.startsWith("/admin");

    const subLink =
      "flex min-w-0 items-center gap-2 rounded-xl px-2 py-1.5 text-sm text-white/90 transition-colors hover:bg-white/10";

    return (
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === "/home"}
                className="text-white hover:bg-white/10 data-[active=true]:bg-[#40C9A9]/20 data-[active=true]:text-white"
              >
                <Link href="/home" onClick={closeMobile} className="flex min-w-0 items-center gap-2">
                  <Home className="h-4 w-4 shrink-0 text-[#40C9A9]" />
                  <span className="truncate">Inicio</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <Collapsible defaultOpen={inCaletas} className="group/collapsible">
              <SidebarMenuItem
                className={cn(
                  "rounded-2xl border border-transparent",
                  inCaletas && sectionTint,
                )}
              >
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton
                    isActive={inCaletas}
                    className="rounded-2xl text-white hover:bg-white/10 data-[active=true]:bg-transparent data-[active=true]:text-white"
                  >
                    <Search className="h-4 w-4 shrink-0 text-[#40C9A9]" />
                    <span className={sectionDot} aria-hidden />
                    <span className="truncate">Caletas</span>
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    <SidebarMenuSubItem>
                      <SidebarMenuButton asChild isActive={caletasExploreActive}>
                        <Link href="/caletas" onClick={closeMobile} className={cn(subLink, caletasExploreActive && "bg-[#40C9A9]/20 text-white")}>
                          <span className="truncate">Explorar recursos</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuButton asChild isActive={pathname.startsWith("/caletas/crear")}>
                        <Link href="/caletas/crear" onClick={closeMobile} className={cn(subLink, pathname.startsWith("/caletas/crear") && "bg-[#40C9A9]/20 text-white")}>
                          <span className="truncate">Compartir recurso</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuButton asChild isActive={pathname.startsWith("/caletas/mis-recursos")}>
                        <Link href="/caletas/mis-recursos" onClick={closeMobile} className={cn(subLink, pathname.startsWith("/caletas/mis-recursos") && "bg-[#40C9A9]/20 text-white")}>
                          <span className="truncate">Mis recursos</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuButton asChild isActive={pathname.startsWith("/caletas/favoritos")}>
                        <Link href="/caletas/favoritos" onClick={closeMobile} className={cn(subLink, pathname.startsWith("/caletas/favoritos") && "bg-[#40C9A9]/20 text-white")}>
                          <span className="truncate">Favoritos</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuSubItem>
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>

            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname.startsWith("/biblioteca")}
                className="text-white hover:bg-white/10 data-[active=true]:bg-[#40C9A9]/20 data-[active=true]:text-white"
              >
                <Link href="/biblioteca" onClick={closeMobile} className="flex min-w-0 items-center gap-2">
                  <Library className="h-4 w-4 shrink-0 text-[#40C9A9]" />
                  <span className="truncate">Biblioteca</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <Collapsible defaultOpen={inCursos} className="group/collapsible">
              <SidebarMenuItem
                className={cn(
                  "rounded-2xl border border-transparent",
                  inCursos && sectionTint,
                )}
              >
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton
                    isActive={inCursos}
                    className="rounded-2xl text-white hover:bg-white/10 data-[active=true]:bg-transparent data-[active=true]:text-white"
                  >
                    <Library className="h-4 w-4 shrink-0 text-[#40C9A9]" />
                    <span className={sectionDot} aria-hidden />
                    <span className="truncate">Cursos</span>
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    <SidebarMenuSubItem>
                      <SidebarMenuButton asChild isActive={pathname === "/cursos" || pathname.startsWith("/cursos?")}>
                        <Link href="/cursos" onClick={closeMobile} className={cn(subLink, (pathname === "/cursos" || pathname.startsWith("/cursos?")) && "bg-[#40C9A9]/20 text-white")}>
                          <span className="truncate">Catálogo de cursos</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuSubItem>
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>

            <Collapsible defaultOpen={inAcademico} className="group/collapsible">
              <SidebarMenuItem
                className={cn(
                  "rounded-2xl border border-transparent",
                  inAcademico && sectionTint,
                )}
              >
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton
                    isActive={inAcademico}
                    className="rounded-2xl text-white hover:bg-white/10 data-[active=true]:bg-transparent data-[active=true]:text-white"
                  >
                    <Target className="h-4 w-4 shrink-0 text-[#40C9A9]" />
                    <span className={sectionDot} aria-hidden />
                    <span className="truncate">Académico</span>
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    <SidebarMenuSubItem>
                      <SidebarMenuButton asChild isActive={pathname === "/academico"}>
                        <Link href="/academico" onClick={closeMobile} className={cn(subLink, pathname === "/academico" && "bg-[#40C9A9]/20 text-white")}>
                          <span className="truncate">Panel de control</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuButton asChild isActive={pathname.startsWith("/academico/recomendaciones")}>
                        <Link href="/academico/recomendaciones" onClick={closeMobile} className={cn(subLink, pathname.startsWith("/academico/recomendaciones") && "bg-[#40C9A9]/20 text-white")}>
                          <span className="truncate">Recomendaciones</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuButton asChild isActive={pathname.startsWith("/academico/estadisticas")}>
                        <Link href="/academico/estadisticas" onClick={closeMobile} className={cn(subLink, pathname.startsWith("/academico/estadisticas") && "bg-[#40C9A9]/20 text-white")}>
                          <span className="truncate">Estadísticas</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuButton asChild isActive={pathname.startsWith("/academico/historial")}>
                        <Link href="/academico/historial" onClick={closeMobile} className={cn(subLink, pathname.startsWith("/academico/historial") && "bg-[#40C9A9]/20 text-white")}>
                          <span className="truncate">Historial</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuButton asChild isActive={pathname.startsWith("/academico/metas")}>
                        <Link href="/academico/metas" onClick={closeMobile} className={cn(subLink, pathname.startsWith("/academico/metas") && "bg-[#40C9A9]/20 text-white")}>
                          <span className="truncate">Metas</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuSubItem>
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>

            <Collapsible defaultOpen={inIA} className="group/collapsible">
              <SidebarMenuItem
                className={cn(
                  "rounded-2xl border border-transparent",
                  inIA && sectionTint,
                )}
              >
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton
                    isActive={inIA}
                    className="rounded-2xl text-white hover:bg-white/10 data-[active=true]:bg-transparent data-[active=true]:text-white"
                  >
                    <MessageCircle className="h-4 w-4 shrink-0 text-[#40C9A9]" />
                    <span className={sectionDot} aria-hidden />
                    <span className="truncate">Herramientas IA</span>
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    <SidebarMenuSubItem>
                      <SidebarMenuButton asChild isActive={pathname.startsWith("/ia/chat")}>
                        <Link href="/ia/chat" onClick={closeMobile} className={cn(subLink, pathname.startsWith("/ia/chat") && "bg-[#40C9A9]/20 text-white")}>
                          <span className="truncate">Chat IA</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuButton asChild isActive={pathname.startsWith("/ia/resumir")}>
                        <Link href="/ia/resumir" onClick={closeMobile} className={cn(subLink, pathname.startsWith("/ia/resumir") && "bg-[#40C9A9]/20 text-white")}>
                          <span className="truncate">Resumir / PDF</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuButton asChild isActive={pathname.startsWith("/ia/fichas")}>
                        <Link href="/ia/fichas" onClick={closeMobile} className={cn(subLink, pathname.startsWith("/ia/fichas") && "bg-[#40C9A9]/20 text-white")}>
                          <span className="truncate">Fichas de estudio</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuButton asChild isActive={pathname.startsWith("/ia/cuestionario")}>
                        <Link href="/ia/cuestionario" onClick={closeMobile} className={cn(subLink, pathname.startsWith("/ia/cuestionario") && "bg-[#40C9A9]/20 text-white")}>
                          <span className="truncate">Cuestionarios</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuSubItem>
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>

            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname.startsWith("/ajustes")}
                className="text-white hover:bg-white/10 data-[active=true]:bg-[#40C9A9]/20 data-[active=true]:text-white"
              >
                <Link href="/ajustes" onClick={closeMobile} className="flex min-w-0 items-center gap-2">
                  <Settings className="h-4 w-4 shrink-0 text-[#40C9A9]" />
                  <span className="truncate">Ajustes</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            {isAdmin ? (
              <Collapsible defaultOpen={inAdminNav} className="group/collapsible">
                <SidebarMenuItem
                  className={cn(
                    "rounded-2xl border border-transparent",
                    inAdminNav && sectionTint,
                  )}
                >
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      isActive={inAdminNav}
                      className="rounded-2xl text-white hover:bg-white/10 data-[active=true]:bg-transparent data-[active=true]:text-white"
                    >
                      <ShieldCheck className="h-4 w-4 shrink-0 text-[#40C9A9]" />
                      <span className={sectionDot} aria-hidden />
                      <span className="truncate">Administración</span>
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      <SidebarMenuSubItem>
                        <SidebarMenuButton asChild isActive={pathname.startsWith("/admin/estadisticas")}>
                          <Link href="/admin/estadisticas" onClick={closeMobile} className={cn(subLink, pathname.startsWith("/admin/estadisticas") && "bg-[#40C9A9]/20 text-white")}>
                            <span className="truncate">Estadísticas</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuButton asChild isActive={pathname.startsWith("/admin/usuarios")}>
                          <Link href="/admin/usuarios" onClick={closeMobile} className={cn(subLink, pathname.startsWith("/admin/usuarios") && "bg-[#40C9A9]/20 text-white")}>
                            <span className="truncate">Usuarios</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuButton asChild isActive={pathname.startsWith("/admin/pagos")}>
                          <Link href="/admin/pagos" onClick={closeMobile} className={cn(subLink, pathname.startsWith("/admin/pagos") && "bg-[#40C9A9]/20 text-white")}>
                            <span className="truncate">Pagos</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuButton asChild isActive={pathname.startsWith("/admin/blog")}>
                          <Link href="/admin/blog" onClick={closeMobile} className={cn(subLink, pathname.startsWith("/admin/blog") && "bg-[#40C9A9]/20 text-white")}>
                            <span className="truncate">Blog</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuButton asChild isActive={pathname.startsWith("/admin/biblioteca")}>
                          <Link href="/admin/biblioteca" onClick={closeMobile} className={cn(subLink, pathname.startsWith("/admin/biblioteca") && "bg-[#40C9A9]/20 text-white")}>
                            <span className="truncate">Biblioteca libros</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuButton asChild isActive={pathname.startsWith("/admin/pensums")}>
                          <Link href="/admin/pensums" onClick={closeMobile} className={cn(subLink, pathname.startsWith("/admin/pensums") && "bg-[#40C9A9]/20 text-white")}>
                            <span className="truncate">Pensums</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuButton asChild isActive={pathname.startsWith("/admin/media")}>
                          <Link href="/admin/media" onClick={closeMobile} className={cn(subLink, pathname.startsWith("/admin/media") && "bg-[#40C9A9]/20 text-white")}>
                            <span className="truncate">Biblioteca de medios</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuButton asChild isActive={pathname.startsWith("/admin/cursos")}>
                          <Link href="/admin/cursos" onClick={closeMobile} className={cn(subLink, pathname.startsWith("/admin/cursos") && "bg-[#40C9A9]/20 text-white")}>
                            <span className="truncate">Gestión de cursos</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            ) : null}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  };

  return (
    <>
      <Dialog open={projectDialogOpen} onOpenChange={setProjectDialogOpen}>
        <DialogContent className="bg-[#203324] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Nuevo proyecto IA</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-white/80">Nombre</Label>
              <Input
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="bg-[#1C2D20] border-white/20 text-white"
                placeholder="Ej: Cálculo II"
              />
            </div>
            <div>
              <Label className="text-white/80">Icono</Label>
              <div className="grid grid-cols-5 gap-2 mt-2">
                {["📁", "📘", "🧠", "🧪", "⚙️", "📐", "🧮", "💻", "📝", "🎯"].map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setProjectIcon(icon)}
                    className={`rounded-md border px-2 py-1 text-lg ${
                      projectIcon === icon ? "border-[#40C9A9] bg-[#40C9A9]/20" : "border-white/20 bg-white/5"
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-white/80">Color</Label>
              <Input
                type="color"
                value={projectColor}
                onChange={(e) => setProjectColor(e.target.value)}
                className="bg-[#1C2D20] border-white/20 h-10"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" className="border-white/20 text-white hover:bg-white/10" onClick={() => setProjectDialogOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" className="bg-[#40C9A9] hover:bg-[#40C9A9]/80 text-white" onClick={saveNewProject}>
              Crear proyecto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SidebarHeader className="border-b border-white/10">
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="px-2 py-1">
              <div className="rounded-xl border border-white/10 bg-[#354B3A]/80 p-3 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#40C9A9]/20 text-[#40C9A9]">
                    <BookOpen className="h-6 w-6" />
                  </div>
                  <div className="min-w-0 leading-tight">
                    <p className="font-special text-sm font-semibold text-white">Caletas</p>
                    <p className="truncate text-xs text-white/55">Panel estudiantil</p>
                  </div>
                </div>
              </div>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="text-white">
        <div className="px-1 pb-4 pt-1">
          {isIAChatMode
            ? renderIAMenu()
            : isCoursesMode
              ? renderCoursesMenu()
              : isAdminMode
                ? renderAdminMenu()
                : renderGeneralMenu()}
        </div>
      </SidebarContent>

      <SidebarFooter className="mt-auto border-t border-white/10">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="text-white/80 hover:bg-white/10 hover:text-white"
            >
              <Link href="/" onClick={closeMobile} className="flex min-w-0 items-center gap-2">
                <span className="truncate text-sm">Sitio público</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </>
  );
} 