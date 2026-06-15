import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { getCorsHeaders } from '@/lib/cors';

/** PDFs grandes: más tiempo y sin tope artificial de tamaño en axios (node). */
export const maxDuration = 120;

function withCors(res: NextResponse, req: NextRequest) {
  Object.entries(getCorsHeaders(req)).forEach(([k, v]) => res.headers.set(k, v));
  return res;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    if (!url) {
      return withCors(
        NextResponse.json({ error: 'URL parameter is required' }, { status: 400 }),
        request,
      );
    }

    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 120_000,
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    const contentType = response.headers['content-type'] || 'application/pdf';
    const contentLength = response.headers['content-length'];

    const pdfResponse = new NextResponse(response.data, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': contentLength || response.data.length.toString(),
        'Cache-Control': 'public, max-age=3600',
        'X-Content-Type-Options': 'nosniff',
        'Content-Disposition': 'inline',
        'Cross-Origin-Embedder-Policy': 'unsafe-none',
        'Cross-Origin-Opener-Policy': 'unsafe-none',
      },
    });

    return withCors(pdfResponse, request);
  } catch (error: unknown) {
    console.error('PDF proxy error:', error);
    const message = axios.isAxiosError(error)
      ? error.message + (error.response ? ` (HTTP ${error.response.status})` : '')
      : error instanceof Error
        ? error.message
        : 'Unknown error';

    return withCors(
      NextResponse.json({ error: 'Failed to fetch PDF', details: message }, { status: 500 }),
      request,
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  return withCors(new NextResponse(null, { status: 200 }), request);
}
