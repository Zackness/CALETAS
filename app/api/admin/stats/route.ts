import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

async function requireAdmin(headers: Headers) {
  const session = await auth.api.getSession({ headers });
  if (!session?.user?.id) return { ok: false as const, status: 401 as const };

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (user?.role !== "ADMIN") return { ok: false as const, status: 403 as const };
  return { ok: true as const };
}

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request.headers);
    if (!admin.ok) {
      return NextResponse.json({ error: "No autorizado" }, { status: admin.status });
    }

    const [
      users,
      universidades,
      carreras,
      materias,
      recursos,
      subscriptions,
      manualPaymentsTotal,
      manualPaymentsPending,
      usersByMonthRaw,
      recursosByTipo,
      recursosByMonthRaw,
      paymentsByStatus,
      aiUsageCount,
      aiUsageSum,
      aiUsageByMonthRaw,
      storageAgg,
      recursosConArchivo,
    ] = await Promise.all([
      db.user.count(),
      db.universidad.count(),
      db.carrera.count(),
      db.materia.count(),
      db.recurso.count(),
      db.userSubscription.count(),
      db.manualPayment.count(),
      db.manualPayment.count({ where: { status: "PENDING" } }),
      db.$queryRaw<{ mes: string; total: number }[]>`
        SELECT DATE_FORMAT(createdAt, '%Y-%m') as mes, COUNT(*) as total
        FROM User
        WHERE createdAt >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
        GROUP BY mes
        ORDER BY mes ASC
      `,
      db.recurso.groupBy({
        by: ["tipo"],
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
      }),
      db.$queryRaw<{ mes: string; total: number }[]>`
        SELECT DATE_FORMAT(createdAt, '%Y-%m') as mes, COUNT(*) as total
        FROM Recurso
        WHERE createdAt >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
        GROUP BY mes
        ORDER BY mes ASC
      `,
      db.manualPayment.groupBy({
        by: ["status"],
        _count: { id: true },
      }),
      db.aiUsageLog.count(),
      db.aiUsageLog.aggregate({ _sum: { totalTokens: true } }),
      db.$queryRaw<{ mes: string; total: number; tokens: number }[]>`
        SELECT DATE_FORMAT(createdAt, '%Y-%m') as mes, COUNT(*) as total, COALESCE(SUM(totalTokens), 0) as tokens
        FROM AiUsageLog
        WHERE createdAt >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
        GROUP BY mes
        ORDER BY mes ASC
      `,
      db.recurso.aggregate({ _sum: { archivoSizeBytes: true }, where: { archivoSizeBytes: { not: null } } }),
      db.recurso.count({ where: { archivoUrl: { not: null } } }),
    ]);

    const now = new Date();
    const last12Months: string[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      last12Months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    }
    const usersByMonth = last12Months.map((mes) => ({
      mes,
      usuarios: Number((usersByMonthRaw as any[]).find((r) => r.mes === mes)?.total ?? 0),
    }));
    const recursosByMonth = last12Months.map((mes) => ({
      mes,
      recursos: Number((recursosByMonthRaw as any[]).find((r) => r.mes === mes)?.total ?? 0),
    }));
    const paymentsByStatusMap = (paymentsByStatus as { status: string; _count: { id: number } }[]).reduce(
      (acc, p) => {
        acc[p.status] = p._count.id;
        return acc;
      },
      {} as Record<string, number>
    );

    const aiUsageByMonth = last12Months.map((mes) => {
      const row = (aiUsageByMonthRaw as { mes: string; total: number; tokens: number }[]).find((r) => r.mes === mes);
      return { mes, peticiones: Number(row?.total ?? 0), tokens: Number(row?.tokens ?? 0) };
    });

    return NextResponse.json({
      counts: {
        users,
        universidades,
        carreras,
        materias,
        recursos,
        subscriptions,
        manualPaymentsTotal,
        manualPaymentsPending,
      },
      charts: {
        usersByMonth,
        recursosByTipo: recursosByTipo.map((r) => ({ tipo: r.tipo, count: r._count.id })),
        recursosByMonth,
        paymentsByStatus: {
          PENDING: paymentsByStatusMap.PENDING ?? 0,
          APPROVED: paymentsByStatusMap.APPROVED ?? 0,
          REJECTED: paymentsByStatusMap.REJECTED ?? 0,
        },
      },
      aiUsage: {
        totalRequests: aiUsageCount,
        totalTokens: Number(aiUsageSum._sum.totalTokens ?? 0),
        byMonth: aiUsageByMonth,
      },
      storage: {
        totalBytes: Number(storageAgg._sum.archivoSizeBytes ?? 0),
        recursosConArchivo,
      },
    });
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

