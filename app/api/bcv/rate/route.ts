import { NextResponse } from "next/server";

/**
 * Obtiene la tasa del dólar BCV para mostrar el monto en Bs.
 * Prueba APIs públicas; si fallan, usa BCV_RATE_FALLBACK en .env (opcional).
 */
export async function GET() {
  const fallback = process.env.BCV_RATE_FALLBACK;
  const fallbackNum = fallback ? Number(fallback) : NaN;

  // DolarApi Venezuela: https://dolarapi.com/docs/venezuela/ — respuesta { venta, compra, promedio }
  const sources: { url: string; getRate: (data: unknown) => number | null }[] = [
    {
      url: "https://ve.dolarapi.com/v1/dolares/oficial",
      getRate: (data: unknown) => {
        const d = data as { venta?: number; compra?: number; promedio?: number };
        return d?.venta ?? d?.promedio ?? d?.compra ?? null;
      },
    },
    {
      url: "https://bcv-api.rafnixg.dev/rates/",
      getRate: (data: unknown) => {
        const d = data as { usd?: { rate?: number }; rates?: { usd?: number } };
        return d?.usd?.rate ?? d?.rates?.usd ?? null;
      },
    },
  ];

  for (const { url, getRate } of sources) {
    try {
      const res = await fetch(url, { next: { revalidate: 300 } });
      if (!res.ok) continue;
      const data = await res.json();
      const rate = getRate(data);
      if (rate != null && Number.isFinite(rate) && rate > 0) {
        return NextResponse.json({ rate: Number(rate), source: url });
      }
    } catch {
      continue;
    }
  }

  if (Number.isFinite(fallbackNum) && fallbackNum > 0) {
    return NextResponse.json({ rate: fallbackNum, source: "BCV_RATE_FALLBACK" });
  }

  return NextResponse.json(
    { error: "No se pudo obtener la tasa BCV. Configura BCV_RATE_FALLBACK en .env como respaldo." },
    { status: 503 }
  );
}
