"use client";

export type IAChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type IAProject = {
  id: string;
  name: string;
  icon: string;
  color: string;
  createdAt: string;
};

export type IAProjectFile = {
  id: string;
  projectId: string;
  name: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
  textContent: string;
};

export type IAChatThread = {
  id: string;
  title: string;
  projectId: string | null;
  updatedAt: string;
  messages: IAChatMessage[];
};

export type IAChatStore = {
  projects: IAProject[];
  projectFiles: IAProjectFile[];
  threads: IAChatThread[];
  activeProjectId: string | null;
  activeThreadId: string | null;
};

const STORAGE_KEY = "caletas:ia-chat-store:v1";
export const IA_STORE_EVENT = "caletas:ia-chat-store:changed";

function nowIso() {
  return new Date().toISOString();
}

function newId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

const starterMessage: IAChatMessage = {
  role: "assistant",
  content:
    "Hola. Soy tu tutor IA. Dime tu materia, tema y qué necesitas (explicar, resolver, practicar, repasar) y lo adapto a tu carrera.",
};

function newDefaultThread(projectId: string | null = null): IAChatThread {
  return {
    id: newId("chat"),
    title: "Nuevo chat",
    projectId,
    updatedAt: nowIso(),
    messages: [starterMessage],
  };
}

const defaultStore = (): IAChatStore => {
  const firstThread = newDefaultThread(null);
  return {
    projects: [],
    projectFiles: [],
    threads: [firstThread],
    activeProjectId: null,
    activeThreadId: firstThread.id,
  };
};

export function loadIAStore(): IAChatStore {
  if (typeof window === "undefined") return defaultStore();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultStore();
    const parsed = JSON.parse(raw) as Partial<IAChatStore>;
    const projects = (parsed.projects || []).map((p) => ({
      ...p,
      icon: (p as IAProject).icon || "📁",
      color: (p as IAProject).color || "#40C9A9",
    })) as IAProject[];
    const projectFiles = Array.isArray(parsed.projectFiles) ? parsed.projectFiles : [];
    const threads = Array.isArray(parsed.threads) ? parsed.threads : [];
    const activeProjectId =
      parsed.activeProjectId === undefined ? null : (parsed.activeProjectId as string | null);
    const activeThreadId =
      parsed.activeThreadId === undefined ? null : (parsed.activeThreadId as string | null);
    if (!threads.length) return defaultStore();
    return { projects, projectFiles, threads, activeProjectId, activeThreadId };
  } catch {
    return defaultStore();
  }
}

export function saveIAStore(store: IAChatStore) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  window.dispatchEvent(new CustomEvent(IA_STORE_EVENT));
}

export function createProject(
  store: IAChatStore,
  payload: { name: string; icon: string; color: string },
): IAChatStore {
  const project: IAProject = {
    id: newId("proj"),
    name: payload.name,
    icon: payload.icon,
    color: payload.color,
    createdAt: nowIso(),
  };
  return {
    ...store,
    projects: [project, ...store.projects],
    activeProjectId: project.id,
  };
}

export function createThread(store: IAChatStore, projectId: string | null): IAChatStore {
  const thread = newDefaultThread(projectId);
  return {
    ...store,
    threads: [thread, ...store.threads],
    activeThreadId: thread.id,
    activeProjectId: projectId,
  };
}

export function updateThread(store: IAChatStore, thread: IAChatThread): IAChatStore {
  const threads = store.threads.map((t) => (t.id === thread.id ? thread : t));
  return { ...store, threads };
}

export function deleteThread(store: IAChatStore, threadId: string): IAChatStore {
  const remaining = store.threads.filter((t) => t.id !== threadId);
  if (!remaining.length) {
    const fallback = newDefaultThread(store.activeProjectId ?? null);
    return {
      ...store,
      threads: [fallback],
      activeThreadId: fallback.id,
    };
  }
  const nextActiveId =
    store.activeThreadId === threadId ? remaining[0].id : store.activeThreadId;
  return {
    ...store,
    threads: remaining,
    activeThreadId: nextActiveId,
  };
}

export function threadTitleFromText(text: string) {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.slice(0, 40) || "Nuevo chat";
}

export function addProjectFile(
  store: IAChatStore,
  payload: Omit<IAProjectFile, "id" | "uploadedAt">,
): IAChatStore {
  const next: IAProjectFile = {
    ...payload,
    id: newId("pfile"),
    uploadedAt: nowIso(),
  };
  return {
    ...store,
    projectFiles: [next, ...(store.projectFiles || [])],
  };
}

