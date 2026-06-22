"use client";

import {
  Bell,
  GraduationCap,
  Heart,
  MessageCircle,
  Newspaper,
  Sparkles,
  UserPlus,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  formatRelativeTime,
  parseNotificationMessage,
  type NotificationType,
} from "@/lib/notifications/payload";
import { getNotificationActions } from "@/lib/notifications/actions";
import { getNotificationTheme } from "@/lib/notifications/theme";
import { NotificationInlineActions } from "@/components/notifications/notification-inline-actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export type NotificationListItemData = {
  id: string;
  message: string;
  read: boolean;
  createdAt: string;
};

function initials(name?: string) {
  if (!name?.trim()) return "?";
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function typeIcon(type: NotificationType) {
  switch (type) {
    case "like":
      return Heart;
    case "comment":
      return MessageCircle;
    case "favorite":
      return Heart;
    case "follow":
      return UserPlus;
    case "blog":
      return Newspaper;
    case "curso":
      return GraduationCap;
    default:
      return Bell;
  }
}

function typeIconClass(type: NotificationType) {
  switch (type) {
    case "like":
    case "favorite":
      return "bg-rose-500/15 text-rose-300 ring-rose-400/25";
    case "comment":
      return "bg-sky-500/15 text-sky-300 ring-sky-400/25";
    case "follow":
      return "bg-violet-500/15 text-violet-300 ring-violet-400/25";
    case "blog":
      return "bg-[color-mix(in_oklab,var(--accent-hex)_18%,transparent)] text-[var(--accent-hex)] ring-[color-mix(in_oklab,var(--accent-hex)_30%,transparent)]";
    case "curso":
      return "bg-[color-mix(in_oklab,var(--aprende-accent)_18%,transparent)] text-[var(--aprende-accent-bright)] ring-[color-mix(in_oklab,var(--aprende-accent)_30%,transparent)]";
    default:
      return "bg-white/10 text-white/70 ring-white/15";
  }
}

type Props = {
  item: NotificationListItemData;
  onOpen?: (item: NotificationListItemData) => void;
  onDismiss?: (id: string) => void;
  onMarkRead?: (id: string) => void;
  onNavigate?: () => void;
  variant?: "panel" | "card";
  className?: string;
};

export function NotificationListItem({
  item,
  onOpen,
  onDismiss,
  onMarkRead,
  onNavigate,
  variant = "panel",
  className,
}: Props) {
  const view = parseNotificationMessage(item.message);
  const theme = getNotificationTheme(view.type);
  const actions = getNotificationActions(view);
  const isAprende = theme.isAprendeSpecial === true;
  const Icon = typeIcon(view.type);
  const showActorAvatar =
    view.actor?.image || (view.actor?.name && view.type !== "blog" && view.type !== "curso");

  const interactive = Boolean(onOpen);

  return (
    <div
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={interactive ? () => onOpen?.(item) : undefined}
      onKeyDown={
        interactive
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onOpen?.(item);
              }
            }
          : undefined
      }
      className={cn(
        "group relative flex w-full gap-3 text-left transition-colors",
        variant === "panel"
          ? "cursor-pointer px-3 py-3 hover:bg-white/[0.06]"
          : "chalk-panel-soft cursor-pointer rounded-xl p-3 hover:bg-white/[0.04]",
        isAprende && "notification-aprende-stain",
        isAprende && !item.read && "notification-aprende-stain--unread",
        !isAprende && !item.read && theme.unreadBg,
        className,
      )}
    >
      {!item.read ? (
        <span
          className={cn(
            "absolute top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full",
            variant === "panel" ? "left-1.5" : "left-2",
            theme.unreadDot,
          )}
          aria-hidden
        />
      ) : null}

      <div className={cn("relative shrink-0", variant === "panel" ? "pl-1" : "pl-2")}>
        {showActorAvatar ? (
          <Avatar className="h-10 w-10 border border-white/10">
            <AvatarImage src={view.actor?.image ?? undefined} alt="" />
            <AvatarFallback className="bg-[#354B3A] text-xs text-white">
              {initials(view.actor?.name)}
            </AvatarFallback>
          </Avatar>
        ) : (
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full ring-1",
              typeIconClass(view.type),
            )}
          >
            <Icon className="h-4 w-4" />
          </div>
        )}
        {showActorAvatar ? (
          <span
            className={cn(
              "absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full ring-2 ring-[#1C2D20]",
              typeIconClass(view.type),
            )}
          >
            <Icon className="h-2.5 w-2.5" />
          </span>
        ) : null}
      </div>

      <div className="min-w-0 flex-1 pr-6">
        <p className="text-sm leading-snug text-white/90">
          {isAprende ? (
            <span className="notification-aprende-inline-badge mr-1.5 inline-flex align-middle">
              <Sparkles className="h-2.5 w-2.5" aria-hidden />
              Aprende
            </span>
          ) : null}
          <span className="font-medium text-white">{view.headline}</span>
        </p>
        {view.subline ? (
          <p className={cn("mt-0.5 truncate text-sm", theme.subline)}>{view.subline}</p>
        ) : null}
        {view.preview ? (
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-white/55">
            &ldquo;{view.preview}&rdquo;
          </p>
        ) : null}
        <p className="mt-1 text-[11px] text-white/45">{formatRelativeTime(item.createdAt)}</p>
        <NotificationInlineActions
          actions={actions}
          onNavigate={onNavigate}
          onMarkRead={onMarkRead ? () => onMarkRead(item.id) : undefined}
        />
      </div>

      {onDismiss ? (
        <button
          type="button"
          aria-label="Descartar notificación"
          onClick={(e) => {
            e.stopPropagation();
            onDismiss(item.id);
          }}
          className="absolute right-2 top-2 rounded-md p-1 text-white/35 opacity-0 transition-opacity hover:bg-white/10 hover:text-white/70 group-hover:opacity-100"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      ) : null}
    </div>
  );
}
