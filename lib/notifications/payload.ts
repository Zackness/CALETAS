import { normalizeNotificationProfileHref } from "@/lib/profile/public-profile";

export type NotificationType =
  | "like"
  | "comment"
  | "favorite"
  | "follow"
  | "blog"
  | "curso"
  | "generic";

export type NotificationActor = {
  id?: string;
  name?: string;
  image?: string | null;
  href?: string;
};

export type NotificationTarget = {
  label: string;
  href?: string;
};

export type NotificationPayload = {
  v: 1;
  type: NotificationType;
  actor?: NotificationActor;
  target?: NotificationTarget;
  /** Texto auxiliar (p. ej. extracto de comentario). */
  preview?: string;
};

export type NotificationViewModel = {
  type: NotificationType;
  actor?: NotificationActor;
  target?: NotificationTarget;
  preview?: string;
  /** Texto plano legacy si no hay payload estructurado. */
  legacyMessage?: string;
  headline: string;
  subline?: string;
};

export function serializeNotificationPayload(payload: NotificationPayload): string {
  return JSON.stringify(payload);
}

export function parseNotificationMessage(message: string): NotificationViewModel {
  const trimmed = message.trim();
  if (trimmed.startsWith("{")) {
    try {
      const raw = JSON.parse(trimmed) as NotificationPayload;
      if (raw?.v === 1 && raw.type) {
        return payloadToViewModel(raw);
      }
    } catch {
      /* fallback legacy */
    }
  }
  return legacyToViewModel(trimmed);
}

function payloadToViewModel(p: NotificationPayload): NotificationViewModel {
  const actor = p.actor
    ? { ...p.actor, href: normalizeNotificationProfileHref(p.actor.href) }
    : undefined;
  const target = p.target
    ? { ...p.target, href: p.target.href || undefined }
    : undefined;
  const actorName = actor?.name?.trim() || "Alguien";
  const targetLabel = target?.label?.trim();

  switch (p.type) {
    case "like":
      return {
        type: p.type,
        actor,
        target,
        headline: `${actorName} le dio like a tu caleta`,
        subline: targetLabel,
      };
    case "comment":
      return {
        type: p.type,
        actor,
        target,
        preview: p.preview,
        headline: `${actorName} comentó en tu caleta`,
        subline: targetLabel,
      };
    case "favorite":
      return {
        type: p.type,
        actor,
        target,
        headline: `${actorName} guardó tu caleta en favoritos`,
        subline: targetLabel,
      };
    case "follow":
      return {
        type: p.type,
        actor,
        headline: `${actorName} empezó a seguirte`,
      };
    case "blog":
      return {
        type: p.type,
        target,
        headline: "Nuevo artículo en el blog",
        subline: targetLabel,
      };
    case "curso":
      return {
        type: p.type,
        target,
        headline: "Nuevo curso en Aprende",
        subline: targetLabel,
      };
    default:
      return {
        type: "generic",
        target: p.target,
        headline: targetLabel || p.preview || "Tienes una nueva notificación",
        subline: p.preview,
      };
  }
}

function legacyToViewModel(message: string): NotificationViewModel {
  const href = extractLegacyHref(message);
  const cleaned = message
    .replace(/Explóralo en \/\S+/i, "")
    .replace(/Léelo en \/\S+/i, "")
    .replace(/[🎓📰]/gu, "")
    .replace(/\s+/g, " ")
    .trim();

  let type: NotificationType = "generic";
  if (/like/i.test(message)) type = "like";
  else if (/coment/i.test(message)) type = "comment";
  else if (/favorito/i.test(message)) type = "favorite";
  else if (/sigui/i.test(message)) type = "follow";
  else if (/blog/i.test(message)) type = "blog";
  else if (/curso|aprende/i.test(message)) type = "curso";

  const quoted = cleaned.match(/«([^»]+)»|"([^"]+)"/);
  const label = quoted?.[1] ?? quoted?.[2];

  return {
    type,
    legacyMessage: message,
    headline: cleaned.slice(0, 120) || "Notificación",
    subline: label,
    target: href || label ? { label: label ?? "", href } : undefined,
  };
}

function extractLegacyHref(message: string): string | undefined {
  const match = message.match(/(\/(?:blog|cursos|caletas|view-file|perfil)[^\s»."']*)/);
  return match?.[1];
}

export function notificationHref(view: NotificationViewModel): string | undefined {
  if (view.target?.href) return view.target.href;
  if (view.actor?.href && view.type === "follow") return view.actor.href;
  return normalizeNotificationProfileHref(extractLegacyHref(view.legacyMessage ?? ""));
}

export function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  if (diffMs < 45_000) return "Ahora";
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 60) return `Hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Hace ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `Hace ${days} d`;
  return date.toLocaleDateString("es-VE", { day: "numeric", month: "short" });
}

export function buildLikeNotification(input: {
  actor: NotificationActor;
  target: NotificationTarget;
}): NotificationPayload {
  return { v: 1, type: "like", actor: input.actor, target: input.target };
}

export function buildCommentNotification(input: {
  actor: NotificationActor;
  target: NotificationTarget;
  preview?: string;
}): NotificationPayload {
  return {
    v: 1,
    type: "comment",
    actor: input.actor,
    target: input.target,
    preview: input.preview?.slice(0, 140),
  };
}

export function buildFavoriteNotification(input: {
  actor: NotificationActor;
  target: NotificationTarget;
}): NotificationPayload {
  return { v: 1, type: "favorite", actor: input.actor, target: input.target };
}

export function buildFollowNotification(actor: NotificationActor): NotificationPayload {
  return { v: 1, type: "follow", actor };
}

export function buildBlogNotification(target: NotificationTarget): NotificationPayload {
  return { v: 1, type: "blog", target };
}

export function buildCursoNotification(target: NotificationTarget): NotificationPayload {
  return { v: 1, type: "curso", target };
}
