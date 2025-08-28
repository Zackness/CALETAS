# Configuración de cPanel para Banna Hosting

## 📋 Resumen

Este documento explica cómo configurar la conexión entre tu aplicación Next.js y el servidor cPanel de Banna Hosting para aprovechar el almacenamiento ilimitado.

## 🎯 Beneficios

- **Almacenamiento ilimitado**: Aprovecha el plan de Banna Hosting
- **Bandwidth ilimitado**: Sin límites de transferencia
- **Costo cero**: Usa el almacenamiento incluido en tu plan
- **Integración completa**: Subida y descarga de archivos desde la app

## 🔧 Configuración Rápida

### Opción 1: Script Automático (Recomendado)

```bash
node scripts/setup-cpanel.js
```

El script te guiará paso a paso para configurar todas las variables necesarias.

### Opción 2: Configuración Manual

Agrega estas variables a tu archivo `.env.local`:

```env
# Configuración de cPanel para Banna Hosting
CPANEL_HOST=tu-dominio.com
CPANEL_USER=tu-usuario-cpanel
CPANEL_PASSWORD=tu-contraseña-cpanel
CPANEL_PORT=21
CPANEL_SECURE=false
CPANEL_BASE_PATH=/public_html/caletas
CPANEL_PUBLIC_URL=https://tu-dominio.com/caletas
```

## 📁 Estructura de Directorios

En tu servidor cPanel, se creará la siguiente estructura:

```
public_html/
└── caletas/
    ├── recursos/          # Archivos subidos por usuarios
    ├── imagenes/          # Imágenes del sistema
    ├── documentos/        # Documentos PDF y otros
    └── videos/           # Archivos de video
```

## 🔐 Configuración en cPanel

### 1. Acceder a cPanel

1. Ve a tu panel de control de Banna Hosting
2. Accede a cPanel
3. Busca la sección "Archivos" → "Administrador de archivos"

### 2. Crear Directorio

1. Navega a `public_html`
2. Crea un nuevo directorio llamado `caletas`
3. Dentro de `caletas`, crea los subdirectorios:
   - `recursos`
   - `imagenes`
   - `documentos`
   - `videos`

### 3. Configurar Permisos

Para cada directorio, establece permisos:
- **Directorios**: 755
- **Archivos**: 644

### 4. Configurar FTP

1. En cPanel, ve a "Archivos" → "Cuentas FTP"
2. Crea una nueva cuenta FTP o usa la existente
3. Anota las credenciales para usar en la configuración

## 🚀 Uso en la Aplicación

### Subir Archivos

```typescript
import { uploadToCPanel } from '@/lib/cpanel-storage';

const fileUrl = await uploadToCPanel(file, 'recursos');
```

### Eliminar Archivos

```typescript
import { deleteFromCPanel } from '@/lib/cpanel-storage';

const success = await deleteFromCPanel(fileUrl);
```

### Listar Archivos

```typescript
import { cpanelStorage } from '@/lib/cpanel-storage';

const files = await cpanelStorage.listFiles('recursos');
```

## 📊 Monitoreo

### Componente de Estado

Usa el componente `CPanelStatus` para monitorear la conexión:

```tsx
import CPanelStatus from '@/components/cpanel-status';

<CPanelStatus />
```

### API Endpoints

- `GET /api/caletas/list-files` - Listar archivos
- `DELETE /api/caletas/delete-file?fileUrl=...` - Eliminar archivo

## 🔍 Solución de Problemas

### Error de Conexión

1. **Verificar credenciales FTP**:
   - Usuario y contraseña correctos
   - Puerto correcto (21 para FTP, 22 para SFTP)

2. **Verificar host**:
   - Usar el dominio principal, no subdominio
   - Ejemplo: `midominio.com` no `www.midominio.com`

3. **Verificar directorio**:
   - El directorio `/public_html/caletas` debe existir
   - Permisos correctos (755)

### Error de Subida

1. **Verificar espacio en disco**:
   - Aunque es ilimitado, verificar que no haya restricciones temporales

2. **Verificar permisos**:
   - El directorio debe tener permisos de escritura

3. **Verificar tipo de archivo**:
   - Solo archivos permitidos según la configuración

### Error de Acceso Público

1. **Verificar URL pública**:
   - La URL debe ser accesible desde internet
   - No usar localhost o IPs privadas

2. **Verificar estructura de directorios**:
   - Los archivos deben estar en `public_html`

## 🔄 Migración desde Bunny.net

El sistema está configurado para usar cPanel por defecto con fallback a Bunny.net:

1. **Configura cPanel** siguiendo este documento
2. **Prueba la conexión** con el componente de estado
3. **Sube algunos archivos** para verificar que funciona
4. **Monitorea** el uso durante unos días
5. **Elimina la configuración de Bunny.net** cuando estés seguro

## 📈 Optimizaciones

### Compresión de Imágenes

Considera implementar compresión automática de imágenes antes de subir:

```typescript
import sharp from 'sharp';

const compressedBuffer = await sharp(fileBuffer)
  .jpeg({ quality: 80 })
  .toBuffer();
```

### CDN

Para mejor rendimiento, considera configurar un CDN en cPanel:
1. Ve a "Optimización" → "Cloudflare"
2. Activa Cloudflare para tu dominio
3. Los archivos se servirán más rápido

## 🛡️ Seguridad

### Buenas Prácticas

1. **Usar SFTP** en lugar de FTP cuando sea posible
2. **Credenciales seguras** para la cuenta FTP
3. **Permisos mínimos** en directorios
4. **Validación de archivos** antes de subir
5. **Límites de tamaño** apropiados

### Validación de Archivos

El sistema incluye validación automática:
- Tipos de archivo permitidos
- Tamaño máximo (50MB)
- Sanitización de nombres

## 📞 Soporte

Si tienes problemas:

1. **Revisa los logs** de la aplicación
2. **Verifica la configuración** de cPanel
3. **Contacta a Banna Hosting** para soporte técnico
4. **Revisa este documento** para soluciones comunes

## 🔄 Actualizaciones

Para actualizar la configuración:

1. **Modifica las variables** en `.env.local`
2. **Reinicia el servidor** de desarrollo
3. **Prueba la conexión** con el componente de estado
4. **Verifica la funcionalidad** subiendo un archivo de prueba
