import type { NotificationViewModel } from "@/lib/notifications/payload";
import { notificationHref } from "@/lib/notifications/payload";
import { normalizeNotificationProfileHref } from "@/lib/profile/public-profile";

export type NotificationAction = {
  id: string;
  label: string;
  href?: string;
  variant?: "primary" | "secondary" | "aprende";
  /** Seguir / dejar de seguir (solo follow). */
  followUserId?: string;
};

export function getNotificationActions(view: NotificationViewModel): NotificationAction[] {
  const primaryHref = notificationHref(view);
  const profileHref = normalizeNotificationProfileHref(view.actor?.href);

  switch (view.type) {
    case "follow": {
      const actions: NotificationAction[] = [];
      if (profileHref) {
        actions.push({ id: "profile", label: "Ver perfil", href: profileHref, variant: "secondary" });
      }
      if (view.actor?.id) {
        actions.push({
          id: "follow-back",
          label: "Seguir también",
          variant: "primary",
          followUserId: view.actor.id,
        });
      }
      return actions;
    }
    case "like":
    case "comment":
    case "favorite": {
      const actions: NotificationAction[] = [];
      if (primaryHref) {
        actions.push({
          id: "open-caleta",
          label: view.type === "comment" ? "Ver caleta" : "Ver caleta",
          href: primaryHref,
          variant: "primary",
        });
      }
      if (profileHref) {
        actions.push({ id: "profile", label: "Ver perfil", href: profileHref, variant: "secondary" });
      }
      return actions;
    }
    case "curso":
      if (primaryHref) {
        return [{ id: "open-curso", label: "Ver curso", href: primaryHref, variant: "aprende" }];
      }
      return [{ id: "open-cursos", label: "Ir a Aprende", href: "/cursos", variant: "aprende" }];
    case "blog":
      if (primaryHref) {
        return [{ id: "open-blog", label: "Leer artículo", href: primaryHref, variant: "primary" }];
      }
      return [{ id: "open-blog-home", label: "Ir al blog", href: "/blog", variant: "secondary" }];
    default:
      if (primaryHref) {
        return [{ id: "open", label: "Ver más", href: primaryHref, variant: "secondary" }];
      }
      return [];
  }
}
