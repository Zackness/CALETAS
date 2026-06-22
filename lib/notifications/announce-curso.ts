import { db } from "@/lib/db";
import { sendNewCursoAnnouncementEmail } from "@/lib/mail";
import { buildCursoNotification, serializeNotificationPayload } from "@/lib/notifications/payload";

const NOTIFY_BATCH = 500;
const EMAIL_BATCH = 40;

export async function announceNewCurso(curso: {
  id: string;
  titulo: string;
  descripcion?: string | null;
}) {
  const payload = buildCursoNotification({
    label: curso.titulo,
    href: `/cursos/${curso.id}`,
  });
  const message = serializeNotificationPayload(payload);
  const cursoUrl = `/cursos/${curso.id}`;
  const appBase = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "";
  const fullCursoUrl = appBase ? `${appBase}${cursoUrl}` : cursoUrl;

  const users = await db.user.findMany({
    select: { id: true, email: true, name: true },
  });

  if (!users.length) {
    return { notified: 0, emailed: 0 };
  }

  let notified = 0;
  for (let i = 0; i < users.length; i += NOTIFY_BATCH) {
    const chunk = users.slice(i, i + NOTIFY_BATCH);
    const result = await db.notification.createMany({
      data: chunk.map((u) => ({ userId: u.id, message })),
    });
    notified += result.count;
  }

  const recipients = users.filter((u) => u.email?.includes("@"));
  let emailed = 0;

  if (!process.env.RESEND_API_KEY) {
    console.warn("[announceNewCurso] RESEND_API_KEY no configurada; se omiten correos.");
    return { notified, emailed };
  }

  for (let i = 0; i < recipients.length; i += EMAIL_BATCH) {
    const chunk = recipients.slice(i, i + EMAIL_BATCH);
    const results = await Promise.allSettled(
      chunk.map((user) =>
        sendNewCursoAnnouncementEmail({
          email: user.email,
          userName: user.name,
          cursoTitulo: curso.titulo,
          cursoUrl: fullCursoUrl,
          descripcion: curso.descripcion,
        }),
      ),
    );
    emailed += results.filter((r) => r.status === "fulfilled").length;
  }

  return { notified, emailed };
}
