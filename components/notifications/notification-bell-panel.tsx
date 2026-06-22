"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen, Bell } from "lucide-react";
import {
  NotificationListItem,
  type NotificationListItemData,
} from "@/components/notifications/notification-list-item";
import { notificationHref, parseNotificationMessage } from "@/lib/notifications/payload";

export type NotificationRecord = NotificationListItemData;

type Props = {
  items: NotificationListItemData[];
  loading: boolean;
  onMarkRead: (id: string) => void;
  onDismiss: (id: string) => void;
  onMarkAllRead: () => void;
  onClose?: () => void;
};

export function NotificationBellPanel({
  items,
  loading,
  onMarkRead,
  onDismiss,
  onMarkAllRead,
  onClose,
}: Props) {
  const router = useRouter();
  const unreadCount = items.filter((n) => !n.read).length;

  const openNotification = (item: NotificationListItemData) => {
    const view = parseNotificationMessage(item.message);
    const href = notificationHref(view);
    if (!item.read) onMarkRead(item.id);
    onClose?.();
    if (href) router.push(href);
  };

  return (
    <div className="flex max-h-[min(70vh,28rem)] w-[min(100vw-1rem,24rem)] flex-col overflow-hidden rounded-xl border border-white/10 bg-[#1C2D20] text-white shadow-xl">
      <div className="flex items-center justify-between gap-2 border-b border-white/10 px-4 py-3">
        <div>
          <p className="font-special text-sm font-semibold tracking-wide text-white">Notificaciones</p>
          {unreadCount > 0 ? (
            <p className="text-[11px] text-white/50">{unreadCount} sin leer</p>
          ) : null}
        </div>
        {unreadCount > 0 ? (
          <button
            type="button"
            onClick={onMarkAllRead}
            className="shrink-0 text-xs font-medium text-[var(--accent-hex)] transition-opacity hover:opacity-80"
          >
            Marcar todo leído
          </button>
        ) : null}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {loading ? (
          <div className="space-y-3 p-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex animate-pulse gap-3">
                <div className="h-10 w-10 shrink-0 rounded-full bg-white/10" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-3 w-4/5 rounded bg-white/10" />
                  <div className="h-2.5 w-1/3 rounded bg-white/10" />
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white/40">
              <Bell className="h-5 w-5" />
            </div>
            <p className="text-sm font-medium text-white/80">Estás al día</p>
            <p className="text-xs text-white/50">Cuando haya actividad nueva, aparecerá aquí.</p>
          </div>
        ) : (
          <ul className="divide-y divide-white/5">
            {items.map((item) => (
              <li key={item.id}>
                <NotificationListItem
                  item={item}
                  variant="panel"
                  onOpen={openNotification}
                  onDismiss={onDismiss}
                  onMarkRead={onMarkRead}
                  onNavigate={onClose}
                />
              </li>
            ))}
          </ul>
        )}
      </div>

      {items.length > 0 ? (
        <div className="border-t border-white/10 px-4 py-2.5 text-center">
          <Link
            href="/home"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-white/60 transition-colors hover:text-[var(--accent-hex)]"
          >
            <BookOpen className="h-3.5 w-3.5" />
            Ver actividad en inicio
          </Link>
        </div>
      ) : null}
    </div>
  );
}
