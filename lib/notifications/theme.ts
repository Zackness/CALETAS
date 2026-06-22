import type { NotificationType } from "@/lib/notifications/payload";

export type NotificationTheme = {
  unreadBg: string;
  unreadDot: string;
  subline: string;
  iconRing: string;
  isAprendeSpecial?: boolean;
};

export function getNotificationTheme(type: NotificationType): NotificationTheme {
  if (type === "curso") {
    return {
      unreadBg: "",
      unreadDot: "bg-[var(--aprende-accent-bright)] shadow-[0_0_8px_var(--aprende-glow)]",
      subline: "text-[var(--aprende-accent-bright)]",
      iconRing: "ring-[color-mix(in_oklab,var(--aprende-accent)_45%,transparent)]",
      isAprendeSpecial: true,
    };
  }
  if (type === "blog") {
    return {
      unreadBg: "bg-[color-mix(in_oklab,var(--accent-hex)_7%,transparent)]",
      unreadDot: "bg-[var(--accent-hex)]",
      subline: "text-[var(--accent-hex)]",
      iconRing: "ring-[color-mix(in_oklab,var(--accent-hex)_30%,transparent)]",
    };
  }
  return {
    unreadBg: "bg-[color-mix(in_oklab,var(--accent-hex)_7%,transparent)]",
    unreadDot: "bg-[var(--accent-hex)]",
    subline: "text-[var(--accent-hex)]",
    iconRing: "ring-white/15",
  };
}
