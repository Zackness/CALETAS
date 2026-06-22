"use server";

import type { BlogCategory } from "@prisma/client";
import { getSession } from "@/lib/auth";

/** Notificaciones por correo al publicar (opcional; sin suscriptores configurados aún). */
export async function notifyBlogSubscribersForPost(_postId: string) {
  return { sent: 0 };
}

export async function checkBlogSubscribeEmail(email: string) {
  const normalized = email.trim().toLowerCase();
  if (!normalized || !normalized.includes("@")) {
    return { ok: false as const, error: "Correo no válido." };
  }
  const session = await getSession();
  return { ok: true as const, needsAccount: false, loggedIn: !!session?.user?.id };
}

export async function getSessionBlogSubscriptions(): Promise<BlogCategory[]> {
  return [];
}

export async function subscribeToBlogCategories(_data: {
  email: string;
  categories: string[];
  name?: string;
  password?: string;
}) {
  throw new Error("Suscripciones al blog aún no están disponibles.");
}
