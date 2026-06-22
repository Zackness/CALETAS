"use client";

import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import {
  NotificationListItem,
  type NotificationListItemData,
} from "@/components/notifications/notification-list-item";
import { notificationHref, parseNotificationMessage } from "@/lib/notifications/payload";

type Props = {
  initialItems: NotificationListItemData[];
};

export function HomeNotificationsFeed({ initialItems }: Props) {
  const router = useRouter();

  const markRead = async (id: string) => {
    await fetch(`/api/notifications/${id}`, { method: "PATCH" });
    router.refresh();
  };

  const openNotification = async (item: NotificationListItemData) => {
    const view = parseNotificationMessage(item.message);
    const href = notificationHref(view);
    if (!item.read) {
      await fetch(`/api/notifications/${item.id}`, { method: "PATCH" });
    }
    if (href) router.push(href);
  };

  if (initialItems.length === 0) {
    return (
      <div className="py-8 text-center text-white/70">
        <Bell className="mx-auto mb-2 h-8 w-8 text-white/30" />
        <p>No tienes notificaciones recientes</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {initialItems.map((item) => (
        <NotificationListItem
          key={item.id}
          item={item}
          variant="card"
          onOpen={openNotification}
          onMarkRead={markRead}
        />
      ))}
    </div>
  );
}
