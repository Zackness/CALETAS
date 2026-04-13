import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

/** PDFs grandes: más tiempo y sin tope artificial de tamaño en axios (node). */
export const maxDuration = 120;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    if (!url) {
      return NextResponse.json(
        { error: 'URL parameter is required' },
        { status: 400 }
      );
    }

    console.log('🔍 Proxy PDF request:', url);

    // Hacer la petición al PDF
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 120_000,
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    // Obtener el tipo de contenido
    const contentType = response.headers['content-type'] || 'application/pdf';
    const contentLength = response.headers['content-length'];

    console.log('✅ PDF proxy success:', {
      status: response.status,
      contentType,
      contentLength,
      url
    });

    // Crear la respuesta con los headers correctos para PDFs
    const pdfResponse = new NextResponse(response.data, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Length': contentLength || response.data.length.toString(),
        'Cache-Control': 'public, max-age=3600', // Cache por 1 hora
        'Access-Control-Allow-Origin': 'http://localhost:3000',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'X-Content-Type-Options': 'nosniff',
        'Content-Security-Policy': "frame-ancestors 'self'",
        'Content-Disposition': 'inline',
        'Cross-Origin-Embedder-Policy': 'unsafe-none',
        'Cross-Origin-Opener-Policy': 'unsafe-none'
      }
    });

    return pdfResponse;

  } catch (error: unknown) {
    console.error('❌ PDF proxy error:', error);
    const message = axios.isAxiosError(error)
      ? error.message + (error.response ? ` (HTTP ${error.response.status})` : '')
      : error instanceof Error
        ? error.message
        : 'Unknown error';

    return NextResponse.json(
      { error: 'Failed to fetch PDF', details: message },
      { status: 500 },
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': 'http://localhost:3000',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
}
