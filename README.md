# Caletas

Plataforma para estudiantes (caletas, académico, IA, suscripciones y más).

## Versión

**0.9.0-beta.1** — fase beta pública. Los números pueden cambiar con cada release; la fuente de verdad para despliegues es el campo `version` en `package.json`.

## Requisitos

- Node.js compatible con Next.js 15
- PostgreSQL (p. ej. Neon) y variables en `.env` (ver `.env.example`)

## Desarrollo

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Build de producción

```bash
npm run test
npm run build
npm start
```

## Verificaciones

```bash
npm run typecheck
npm run lint
npm run prisma:validate
npm run test
npm run ci
```

`npm run test` es una compuerta técnica mínima: TypeScript, ESLint y validación de Prisma. Para liberar a usuarios reales todavía se deben ejecutar pruebas funcionales/e2e en staging con credenciales reales.

## Notas

- El proyecto usa **Next.js** (App Router), **Prisma**, **Better Auth** y otras integraciones descritas en `package.json`.
- Para detalles de despliegue, variables de entorno y scripts adicionales, revisa los scripts en `package.json` y `.env.example`.
- La base de datos esperada por Prisma es **PostgreSQL**; usa una URL `postgresql://` o `postgres://`.
