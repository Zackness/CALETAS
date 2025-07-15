import { db } from "@/lib/db";

// Obtener notificaciones de un usuario (más recientes primero)
export async function getUserNotifications(userId: string) {
  return db.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

// Crear una notificación
export async function createNotification(userId: string, message: string) {
  return db.notification.create({
    data: { userId, message },
  });
}

// Marcar una notificación como leída
export async function markNotificationRead(notificationId: string) {
  return db.notification.update({
    where: { id: notificationId },
    data: { read: true },
  });
}

// Eliminar una notificación
export async function deleteNotification(notificationId: string) {
  return db.notification.delete({
    where: { id: notificationId },
  });
} 