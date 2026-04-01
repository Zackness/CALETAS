"use client";

export type IAChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type IAProject = {
  id: string;
  name: string;
  createdAt: string;
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
    const parsed = JSON.parse(raw) as IAChatStore;
    if (!parsed?.threads?.length) return defaultStore();
    return parsed;
  } catch {
    return defaultStore();
  }
}

export function saveIAStore(store: IAChatStore) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  window.dispatchEvent(new CustomEvent(IA_STORE_EVENT));
}

export function createProject(store: IAChatStore, name: string): IAChatStore {
  const project: IAProject = { id: newId("proj"), name, createdAt: nowIso() };
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

export function threadTitleFromText(text: string) {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.slice(0, 40) || "Nuevo chat";
}

