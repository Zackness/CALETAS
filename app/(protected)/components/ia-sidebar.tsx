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
  Menu,
  MessageCircle,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Target,
  Users,
  Upload,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  IA_STORE_EVENT,
  createProject,
  createThread,
  loadIAStore,
  saveIAStore,
} from "@/lib/ia-chat-store";

export function IASidebar() {
  const [open, setOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [chatStore, setChatStore] = useState(() => loadIAStore());
  const [courseCategories, setCourseCategories] = useState<string[]>([]);
  const pathname = usePathname();
  const router = useRouter();
  const isIAChatMode = pathname.startsWith("/ia/chat");
  const isCoursesMode = pathname.startsWith("/cursos");
  const isAdminMode = pathname.startsWith("/admin");

  useEffect(() => {
    fetch("/api/user")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        setIsAdmin(data?.user?.role === "ADMIN");
      })
      .catch(() => {
        // ignorar errores silenciosamente
      });
  }, []);

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
    "flex items-center gap-3 text-white hover:bg-[#354B3A] rounded-lg px-3 py-2 transition-colors";

  const createNewProject = () => {
    const name = window.prompt("Nombre del proyecto");
    if (!name?.trim()) return;
    const next = createProject(chatStore, name.trim());
    saveIAStore(next);
    setChatStore(next);
  };

  const createNewChat = () => {
    const next = createThread(chatStore, chatStore.activeProjectId);
    saveIAStore(next);
    setChatStore(next);
    router.push("/ia/chat");
    setOpen(false);
  };

  const selectProject = (projectId: string | null) => {
    const next = { ...chatStore, activeProjectId: projectId };
    saveIAStore(next);
    setChatStore(next);
  };

  const selectThread = (threadId: string) => {
    const next = { ...chatStore, activeThreadId: threadId };
    saveIAStore(next);
    setChatStore(next);
    router.push("/ia/chat");
    setOpen(false);
  };

  const renderIAMenu = () => (
    <nav className="flex flex-col gap-3">
      <button
        type="button"
        onClick={() => {
          router.push("/home");
          setOpen(false);
        }}
        className="w-full flex items-center gap-2 text-white/90 hover:text-white hover:bg-[#354B3A] rounded-lg px-3 py-2 transition-colors"
      >
        <ArrowLeft className="h-4 w-4 text-[#40C9A9]" />
        <span>Volver al menú general</span>
      </button>

      <div className="bg-[#354B3A] border border-white/10 rounded-xl p-3 space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <FolderKanban className="h-4 w-4 text-[#40C9A9]" />
            Proyectos IA
          </h3>
          <button
            type="button"
            onClick={createNewProject}
            className="p-1 rounded-md bg-white/10 hover:bg-white/20 text-white"
            aria-label="Crear proyecto"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        <button
          type="button"
          onClick={() => selectProject(null)}
          className={`w-full text-left rounded-md px-2 py-1.5 text-sm transition-colors ${
            chatStore.activeProjectId === null ? "bg-[#40C9A9]/25 text-white" : "text-white/80 hover:bg-white/10"
          }`}
        >
          Todos los chats
        </button>
        {chatStore.projects.map((project) => (
          <button
            key={project.id}
            type="button"
            onClick={() => selectProject(project.id)}
            className={`w-full text-left rounded-md px-2 py-1.5 text-sm transition-colors ${
              chatStore.activeProjectId === project.id ? "bg-[#40C9A9]/25 text-white" : "text-white/80 hover:bg-white/10"
            }`}
          >
            {project.name}
          </button>
        ))}
      </div>

      <div className="bg-[#354B3A] border border-white/10 rounded-xl p-3 space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-[#40C9A9]" />
            Chats
          </h3>
          <button
            type="button"
            onClick={createNewChat}
            className="p-1 rounded-md bg-white/10 hover:bg-white/20 text-white"
            aria-label="Nuevo chat"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[45vh] overflow-y-auto space-y-1 pr-1">
          {visibleThreads.map((thread) => (
            <button
              key={thread.id}
              type="button"
              onClick={() => selectThread(thread.id)}
              className={`w-full text-left rounded-md px-2 py-1.5 text-sm transition-colors ${
                chatStore.activeThreadId === thread.id ? "bg-[#40C9A9]/25 text-white" : "text-white/80 hover:bg-white/10"
              }`}
            >
              <span className="truncate block">{thread.title}</span>
            </button>
          ))}
          {!visibleThreads.length && (
            <p className="text-xs text-white/60 px-1 py-2">No hay chats en este proyecto.</p>
          )}
        </div>
      </div>

      <div className="space-y-1">
        <Link href="/ia/resumir" className={baseLinkClass}>
          <FileText className="h-5 w-5 text-[#40C9A9]" />
          <span>Resumir/Explicar PDF</span>
        </Link>
        <Link href="/ia/fichas" className={baseLinkClass}>
          <BookOpen className="h-5 w-5 text-[#40C9A9]" />
          <span>Fichas de Estudio</span>
        </Link>
        <Link href="/ia/cuestionario" className={baseLinkClass}>
          <HelpCircle className="h-5 w-5 text-[#40C9A9]" />
          <span>Cuestionarios</span>
        </Link>
      </div>
    </nav>
  );

  const renderCoursesMenu = () => (
    <nav className="flex flex-col gap-3">
      <button
        type="button"
        onClick={() => {
          router.push("/home");
          setOpen(false);
        }}
        className="w-full flex items-center gap-2 text-white/90 hover:text-white hover:bg-[#354B3A] rounded-lg px-3 py-2 transition-colors"
      >
        <ArrowLeft className="h-4 w-4 text-[#40C9A9]" />
        <span>Volver al menú general</span>
      </button>

      <div className="space-y-1">
        <Link href="/cursos" className={baseLinkClass}>
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
                className="block text-sm text-white/85 hover:text-white hover:bg-white/10 rounded-md px-2 py-1.5 transition-colors"
              >
                {cat}
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-xs text-white/60">Sin categorías publicadas por ahora.</p>
        )}
      </div>
    </nav>
  );

  const renderAdminMenu = () => (
    <nav className="flex flex-col gap-3">
      <button
        type="button"
        onClick={() => {
          router.push("/home");
          setOpen(false);
        }}
        className="w-full flex items-center gap-2 text-white/90 hover:text-white hover:bg-[#354B3A] rounded-lg px-3 py-2 transition-colors"
      >
        <ArrowLeft className="h-4 w-4 text-[#40C9A9]" />
        <span>Volver al menú general</span>
      </button>

      <div className="space-y-1">
        <Link href="/admin/estadisticas" className={baseLinkClass}>
          <BarChart3 className="h-5 w-5 text-[#40C9A9]" />
          <span>Estadísticas</span>
        </Link>
        <Link href="/admin/usuarios" className={baseLinkClass}>
          <Users className="h-5 w-5 text-[#40C9A9]" />
          <span>Usuarios</span>
        </Link>
        <Link href="/admin/pagos" className={baseLinkClass}>
          <ShieldCheck className="h-5 w-5 text-[#40C9A9]" />
          <span>Pagos</span>
        </Link>
        <Link href="/admin/blog" className={baseLinkClass}>
          <FileText className="h-5 w-5 text-[#40C9A9]" />
          <span>Blog</span>
        </Link>
        <Link href="/admin/pensums" className={baseLinkClass}>
          <BookOpen className="h-5 w-5 text-[#40C9A9]" />
          <span>Pensums</span>
        </Link>
        <Link href="/admin/media" className={baseLinkClass}>
          <Upload className="h-5 w-5 text-[#40C9A9]" />
          <span>Biblioteca de medios</span>
        </Link>
        <Link href="/admin/cursos" className={baseLinkClass}>
          <Library className="h-5 w-5 text-[#40C9A9]" />
          <span>Gestión de Cursos</span>
        </Link>
      </div>

      <div className="bg-[#354B3A] border border-white/10 rounded-xl p-3 space-y-2">
        <h3 className="text-sm font-semibold text-white">Opciones del panel</h3>
        <div className="space-y-1">
          <p className="text-sm text-white/80 flex items-center gap-2"><BarChart3 className="h-4 w-4 text-[#40C9A9]" />Estadísticas</p>
          <p className="text-sm text-white/80 flex items-center gap-2"><Users className="h-4 w-4 text-[#40C9A9]" />Usuarios</p>
          <p className="text-sm text-white/80 flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-[#40C9A9]" />Pagos</p>
          <p className="text-sm text-white/80 flex items-center gap-2"><FileText className="h-4 w-4 text-[#40C9A9]" />Blog</p>
          <p className="text-sm text-white/80 flex items-center gap-2"><BookOpen className="h-4 w-4 text-[#40C9A9]" />Pensums</p>
          <p className="text-sm text-white/80 flex items-center gap-2"><Upload className="h-4 w-4 text-[#40C9A9]" />Biblioteca de medios</p>
        </div>
      </div>
    </nav>
  );

  const renderGeneralMenu = () => (
    <nav className="flex flex-col gap-2">
      <div className="mb-2">
        <h3 className="text-sm font-semibold text-white/70 mb-2 px-2">Navegación</h3>
        <Link href="/home" className={baseLinkClass}><Home className="h-5 w-5 text-[#40C9A9]" /><span>Dashboard</span></Link>
        <Link href="/caletas" className={baseLinkClass}><Search className="h-5 w-5 text-[#40C9A9]" /><span>Recursos Colaborativos</span></Link>
        <Link href="/caletas/mis-recursos" className={baseLinkClass}><Upload className="h-5 w-5 text-[#40C9A9]" /><span>Mis Recursos</span></Link>
        <Link href="/cursos" className={baseLinkClass}><Library className="h-5 w-5 text-[#40C9A9]" /><span>Cursos</span></Link>
      </div>

      <div className="mb-2">
        <h3 className="text-sm font-semibold text-white/70 mb-2 px-2">Académico</h3>
        <Link href="/academico" className={baseLinkClass}><Target className="h-5 w-5 text-[#40C9A9]" /><span>Panel de Control</span></Link>
        <Link href="/academico/historial" className={baseLinkClass}><History className="h-5 w-5 text-[#40C9A9]" /><span>Historial Académico</span></Link>
      </div>

      <div className="mb-2">
        <h3 className="text-sm font-semibold text-white/70 mb-2 px-2">Herramientas IA</h3>
        <Link href="/ia/chat" className={baseLinkClass}><MessageCircle className="h-5 w-5 text-[#40C9A9]" /><span>Chat IA</span></Link>
        <Link href="/ia/resumir" className={baseLinkClass}><FileText className="h-5 w-5 text-[#40C9A9]" /><span>Resumir/Explicar PDF</span></Link>
        <Link href="/ia/fichas" className={baseLinkClass}><BookOpen className="h-5 w-5 text-[#40C9A9]" /><span>Fichas de Estudio</span></Link>
        <Link href="/ia/cuestionario" className={baseLinkClass}><HelpCircle className="h-5 w-5 text-[#40C9A9]" /><span>Cuestionarios</span></Link>
      </div>

      <div className="mb-2">
        <h3 className="text-sm font-semibold text-white/70 mb-2 px-2">Configuración</h3>
        <Link href="/ajustes" className={baseLinkClass}><Settings className="h-5 w-5 text-[#40C9A9]" /><span>Ajustes</span></Link>
      </div>

      {isAdmin && (
        <div className="mb-2">
          <h3 className="text-sm font-semibold text-white/70 mb-2 px-2">Admin</h3>
          <Link href="/admin/estadisticas" className={baseLinkClass}><BarChart3 className="h-5 w-5 text-[#40C9A9]" /><span>Estadísticas</span></Link>
          <Link href="/admin/usuarios" className={baseLinkClass}><Users className="h-5 w-5 text-[#40C9A9]" /><span>Usuarios</span></Link>
          <Link href="/admin/pagos" className={baseLinkClass}><ShieldCheck className="h-5 w-5 text-[#40C9A9]" /><span>Pagos</span></Link>
          <Link href="/admin/blog" className={baseLinkClass}><FileText className="h-5 w-5 text-[#40C9A9]" /><span>Blog</span></Link>
          <Link href="/admin/pensums" className={baseLinkClass}><BookOpen className="h-5 w-5 text-[#40C9A9]" /><span>Pensums</span></Link>
          <Link href="/admin/media" className={baseLinkClass}><Upload className="h-5 w-5 text-[#40C9A9]" /><span>Biblioteca de medios</span></Link>
          <Link href="/admin/cursos" className={baseLinkClass}><Library className="h-5 w-5 text-[#40C9A9]" /><span>Cursos</span></Link>
        </div>
      )}
    </nav>
  );

  return (
    <>
      <button
        className="fixed bottom-4 left-4 z-40 md:hidden bg-[#354B3A] text-white rounded-full p-3 shadow-lg hover:bg-[#203324] transition-colors"
        onClick={() => setOpen(true)}
        aria-label="Abrir menú"
      >
        <Menu className="h-6 w-6" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/40 flex">
          <aside className="w-72 bg-[#203324] h-full p-6 flex flex-col gap-4 shadow-xl animate-slide-in-left">
            <div className="flex items-center justify-between">
              <Link href="/home" className="block">
                <span className="text-2xl font-special text-[#40C9A9] block hover:text-[#40C9A9]/80 transition-colors cursor-pointer">Caletas</span>
              </Link>
              <button onClick={() => setOpen(false)} className="text-white hover:text-[#40C9A9] text-2xl" aria-label="Cerrar menú">
                <X className="h-5 w-5" />
              </button>
            </div>
            {isIAChatMode
              ? renderIAMenu()
              : isCoursesMode
                ? renderCoursesMenu()
                : isAdminMode
                  ? renderAdminMenu()
                  : renderGeneralMenu()}
          </aside>
          <div className="flex-1" onClick={() => setOpen(false)} />
        </div>
      )}

      <aside className="hidden md:flex flex-col gap-4 bg-[#203324] border-r border-white/10 w-72 min-h-screen p-6 sticky top-0 left-0 z-30">
        <div className="mb-2">
          <Link href="/home" className="block">
            <span className="text-2xl font-special text-white block hover:text-[#40C9A9] transition-colors cursor-pointer">Caletas</span>
          </Link>
        </div>
        {isIAChatMode
          ? renderIAMenu()
          : isCoursesMode
            ? renderCoursesMenu()
            : isAdminMode
              ? renderAdminMenu()
              : renderGeneralMenu()}
      </aside>
    </>
  );
} 