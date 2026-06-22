import { db } from "@/lib/db";
import {
  buildBlogNotification,
  serializeNotificationPayload,
  type NotificationPayload,
} from "@/lib/notifications/payload";

const NOTIFICATION_LIST_LIMIT = 30;

function toStoredMessage(payload: NotificationPayload | string): string {
  return typeof payload === "string" ? payload : serializeNotificationPayload(payload);
}

// Obtener notificaciones de un usuario (más recientes primero)
export async function getUserNotifications(userId: string) {
  return db.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: NOTIFICATION_LIST_LIMIT,
  });
}

export async function getUnreadNotificationCount(userId: string) {
  return db.notification.count({
    where: { userId, read: false },
  });
}

// Crear una notificación
export async function createNotification(userId: string, payload: NotificationPayload | string) {
  return db.notification.create({
    data: { userId, message: toStoredMessage(payload) },
  });
}

// Marcar una notificación como leída
export async function markNotificationRead(notificationId: string) {
  return db.notification.update({
    where: { id: notificationId },
    data: { read: true },
  });
}

export async function markAllNotificationsRead(userId: string) {
  return db.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  });
}

// Eliminar una notificación
export async function deleteNotification(notificationId: string) {
  return db.notification.delete({
    where: { id: notificationId },
  });
}

const STUDENT_NOTIFY_BATCH = 500;

/** Notifica en la app a todos los usuarios registrados. */
export async function notifyAllUsers(payload: NotificationPayload | string) {
  try {
    const message = toStoredMessage(payload);
    const users = await db.user.findMany({
      select: { id: true },
    });
    if (!users.length) return { count: 0 };

    let count = 0;
    for (let i = 0; i < users.length; i += STUDENT_NOTIFY_BATCH) {
      const chunk = users.slice(i, i + STUDENT_NOTIFY_BATCH);
      const result = await db.notification.createMany({
        data: chunk.map((s) => ({ userId: s.id, message })),
      });
      count += result.count;
    }
    return { count };
  } catch (error) {
    console.error("notifyAllUsers:", error);
    return { count: 0 };
  }
}

/** @deprecated Usar notifyAllUsers */
export async function notifyAllStudents(payload: NotificationPayload | string) {
  return notifyAllUsers(payload);
}

export async function notifyStudentsForNewCurso(titulo: string, cursoId: string) {
  const { announceNewCurso } = await import("@/lib/notifications/announce-curso");
  return announceNewCurso({ id: cursoId, titulo });
}

export async function notifyStudentsForNewBlogPost(title: string, slug: string) {
  return notifyAllUsers(
    buildBlogNotification({
      label: title,
      href: `/blog/${slug}`,
    }),
  );
}
