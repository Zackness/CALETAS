import { Client } from 'basic-ftp';
import { Readable } from 'stream';

interface CPanelConfig {
  host: string;
  user: string;
  password: string;
  port: number;
  secure: boolean;
  basePath: string;
  publicUrl: string;
}

const cpanelConfig: CPanelConfig = {
  host: process.env.CPANEL_HOST || "",
  user: process.env.CPANEL_USER || "",
  password: process.env.CPANEL_PASSWORD || "",
  port: parseInt(process.env.CPANEL_PORT || "21", 10),
  secure: process.env.CPANEL_SECURE === "true",
  basePath: process.env.CPANEL_BASE_PATH || "",
  publicUrl: process.env.CPANEL_PUBLIC_URL || "",
};

export class CPanelStorage {
  private client: Client;
  private isConnecting: boolean = false;
  private connectionPromise: Promise<void> | null = null;

  constructor() {
    this.client = new Client();
  }

  private async connect(): Promise<void> {
    // Si ya hay una conexión en progreso, esperar a que termine
    if (this.isConnecting && this.connectionPromise) {
      console.log('⏳ Esperando conexión existente...');
      await this.connectionPromise;
      return;
    }

    // Si ya está conectado, no hacer nada
    if (this.client.closed === false) {
      console.log('✅ Ya conectado a cPanel');
      return;
    }

    // Iniciar nueva conexión
    this.isConnecting = true;
    this.connectionPromise = this.performConnection();
    
    try {
      await this.connectionPromise;
    } finally {
      this.isConnecting = false;
      this.connectionPromise = null;
    }
  }

  private async performConnection(): Promise<void> {
    const maxRetries = 3;
    let lastError: any;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 Intento de conexión ${attempt}/${maxRetries} a cPanel...`);
        
        await this.client.access({
          host: cpanelConfig.host,
          user: cpanelConfig.user,
          password: cpanelConfig.password,
          port: cpanelConfig.port,
          secure: cpanelConfig.secure,
        });
        
        // Cambiar al directorio base
        await this.client.ensureDir(cpanelConfig.basePath);
        console.log('✅ Conexión a cPanel establecida exitosamente');
        return;
      } catch (error) {
        lastError = error;
        console.error(`❌ Error en intento ${attempt}/${maxRetries}:`, error);
        
        if (attempt < maxRetries) {
          console.log(`⏳ Esperando 2 segundos antes del siguiente intento...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }

    console.error('❌ Error conectando a cPanel después de todos los intentos:', lastError);
    throw new Error(`No se pudo conectar al servidor cPanel después de ${maxRetries} intentos`);
  }

  private async disconnect(): Promise<void> {
    try {
      this.client.close();
    } catch (error) {
      console.error('Error cerrando conexión:', error);
    }
  }

  async uploadFile(file: File, subfolder: string = ""): Promise<string> {
    try {
      await this.connect();

      // Generar nombre único para el archivo
      const timestamp = Date.now();
      const extension = file.name.split('.').pop();
      const fileName = `${timestamp}-${Math.random().toString(36).substring(2)}.${extension}`;
      
      // Navegar a la carpeta base primero
      await this.client.cd(cpanelConfig.basePath);
      
      // Crear subcarpeta si existe
      if (subfolder) {
        await this.client.ensureDir(subfolder);
        await this.client.cd(subfolder);
      }

      // Convertir archivo a stream
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const stream = Readable.from(buffer);

      // Subir archivo
      await this.client.uploadFrom(stream, fileName);

      // Generar URL pública (solo la ruta relativa desde public_html)
      const publicPath = subfolder ? `${subfolder}/${fileName}` : fileName;
      const fileUrl = `${cpanelConfig.publicUrl}/${publicPath}`;

      return fileUrl;
    } catch (error) {
      console.error('Error subiendo archivo a cPanel:', error);
      throw new Error('Error al subir archivo al servidor');
    } finally {
      await this.disconnect();
    }
  }

  async deleteFile(fileUrl: string): Promise<boolean> {
    try {
      await this.connect();

      // Extraer ruta del archivo desde la URL
      const url = new URL(fileUrl);
      const filePath = url.pathname.replace('/caletas/', '');
      const fullPath = `${cpanelConfig.basePath}/${filePath}`;

      // Eliminar archivo
      await this.client.remove(fullPath);
      return true;
    } catch (error) {
      console.error('Error eliminando archivo de cPanel:', error);
      return false;
    } finally {
      await this.disconnect();
    }
  }

  async listFiles(subfolder: string = ""): Promise<any[]> {
    try {
      await this.connect();

      // Navegar a la carpeta base primero
      await this.client.cd(cpanelConfig.basePath);
      
      // Luego navegar a la subcarpeta si existe
      const folderPath = subfolder ? subfolder : "";
      if (folderPath) {
        await this.client.cd(folderPath);
      }
      
      const files = await this.client.list();
      
      const fileList = files
        .filter(file => file.isFile)
        .map(file => {
          const fileUrl = `${cpanelConfig.publicUrl}/${subfolder ? `${subfolder}/` : ''}${file.name}`;
          console.log(`🔗 Generando URL para ${file.name}: ${fileUrl}`);
          return {
            name: file.name,
            size: file.size || 0,
            type: this.getFileType(file.name),
            url: fileUrl,
            lastModified: file.modifiedAt || new Date().toISOString()
          };
        });
      
      return fileList;
    } catch (error) {
      console.error('Error listando archivos de cPanel:', error);
      return [];
    } finally {
      await this.disconnect();
    }
  }

  private getFileType(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'pdf':
        return 'application/pdf';
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      case 'gif':
        return 'image/gif';
      case 'webp':
        return 'image/webp';
      case 'mp4':
        return 'video/mp4';
      case 'avi':
        return 'video/avi';
      case 'mov':
        return 'video/quicktime';
      case 'mp3':
        return 'audio/mpeg';
      case 'wav':
        return 'audio/wav';
      case 'txt':
        return 'text/plain';
      case 'doc':
      case 'docx':
        return 'application/msword';
      case 'xls':
      case 'xlsx':
        return 'application/vnd.ms-excel';
      case 'zip':
        return 'application/zip';
      case 'rar':
        return 'application/x-rar-compressed';
      default:
        return 'application/octet-stream';
    }
  }

  async fileExists(fileUrl: string): Promise<boolean> {
    try {
      await this.connect();

      const url = new URL(fileUrl);
      const filePath = url.pathname.replace('/caletas/', '');
      const fullPath = `${cpanelConfig.basePath}/${filePath}`;

      const files = await this.client.list(fullPath);
      return files.length > 0;
    } catch (error) {
      return false;
    } finally {
      await this.disconnect();
    }
  }
}

// Instancia singleton
export const cpanelStorage = new CPanelStorage();

// Función de conveniencia para subir archivos
export const uploadToCPanel = async (file: File, subfolder: string = ""): Promise<string> => {
  return await cpanelStorage.uploadFile(file, subfolder);
};

// Función de conveniencia para eliminar archivos
export const deleteFromCPanel = async (fileUrl: string): Promise<boolean> => {
  return await cpanelStorage.deleteFile(fileUrl);
};
