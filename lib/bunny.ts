interface BunnyConfig {
    storageZoneName: string;
    apiKey: string;
    baseUrl: string;
  }
  
  const bunnyConfig: BunnyConfig = {
    storageZoneName: process.env.BUNNY_STORAGE_ZONE_NAME || "",
    apiKey: process.env.BUNNY_API_KEY || "", 
    baseUrl: process.env.BUNNY_BASE_URL || "",
  };

const ensureBunnyConfig = () => {
  if (!bunnyConfig.apiKey || !bunnyConfig.storageZoneName || !bunnyConfig.baseUrl) {
    throw new Error(
      `Bunny.net configuration is missing: ${JSON.stringify({
        hasApiKey: !!bunnyConfig.apiKey,
        hasStorageZone: !!bunnyConfig.storageZoneName,
        hasBaseUrl: !!bunnyConfig.baseUrl,
      })}`,
    );
  }
};

const getPublicBaseUrl = () => {
  // Permite override si tienes un pullzone custom
  const custom = process.env.BUNNY_PUBLIC_BASE_URL;
  if (custom) return custom.replace(/\/+$/, "");
  return `https://${bunnyConfig.storageZoneName}.b-cdn.net`;
};

const normalizePath = (path: string) => {
  return path.replace(/^\/+/, "").replace(/\/{2,}/g, "/");
};

const getStoragePathFromPublicUrl = (fileUrl: string) => {
  const publicBase = getPublicBaseUrl();
  if (fileUrl.startsWith(publicBase)) {
    return normalizePath(fileUrl.slice(publicBase.length));
  }

  // fallback: intenta extraer el pathname
  try {
    const url = new URL(fileUrl);
    return normalizePath(url.pathname);
  } catch {
    // si nos mandan un path relativo (ej. "caletas/foo.pdf")
    return normalizePath(fileUrl);
  }
};
  
  export const generateUploadUrl = async (fileName: string) => {
    // Log para debug
    console.log('Bunny Config:', {
      storageZoneName: process.env.BUNNY_STORAGE_ZONE_NAME,
      apiKey: process.env.BUNNY_API_KEY ? '[PRESENT]' : '[MISSING]',
      baseUrl: process.env.BUNNY_BASE_URL
    });

    ensureBunnyConfig();
  
    // Para Storage, necesitamos usar la contraseña del Storage como AccessKey
    const headers = {
      "AccessKey": bunnyConfig.apiKey
    };
  
    // El formato correcto de la URL para Bunny Storage
    const uploadUrl = `${bunnyConfig.baseUrl}/${bunnyConfig.storageZoneName}/${fileName}`;
    
    // La URL pública usa el formato de CDN
    const fileUrl = `${getPublicBaseUrl()}/${fileName}`;
  
    return {
      url: uploadUrl,
      headers,
      fileUrl,
    };
  };

type UploadToBunnyOptions = {
  subfolder?: string;
  prefix?: string;
};

const guessMimeType = (fileName: string) => {
  const extension = fileName.split(".").pop()?.toLowerCase();
  switch (extension) {
    case "pdf":
      return "application/pdf";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "gif":
      return "image/gif";
    case "webp":
      return "image/webp";
    case "mp4":
      return "video/mp4";
    case "webm":
      return "video/webm";
    case "mp3":
      return "audio/mpeg";
    case "zip":
      return "application/zip";
    default:
      return "application/octet-stream";
  }
};

export const uploadToBunny = async (
  file: File,
  options: UploadToBunnyOptions = {},
): Promise<string> => {
  // Generar nombre único para el archivo
  const timestamp = Date.now();
  const extension = file.name.split(".").pop() || "bin";
  const prefix = normalizePath(options.prefix || "caleta");
  const subfolder = options.subfolder ? normalizePath(options.subfolder) : "";
  const folder = [prefix, subfolder].filter(Boolean).join("/");
  const fileName = `${folder}/${timestamp}-${Math.random().toString(36).substring(2)}.${extension}`;

  try {
    const { url, headers, fileUrl } = await generateUploadUrl(fileName);
    
    // Convertir archivo a buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Subir archivo usando fetch
    const uploadResponse = await fetch(url, {
      method: 'PUT',
      headers: {
        ...headers,
        'Content-Type': file.type,
        'Content-Length': buffer.length.toString(),
      },
      body: buffer,
    });

    if (!uploadResponse.ok) {
      throw new Error(`Error uploading to Bunny.net: ${uploadResponse.status} ${uploadResponse.statusText}`);
    }

    return fileUrl;
  } catch (error) {
    console.error('Error uploading to Bunny.net:', error);
    throw new Error('Failed to upload file to Bunny.net');
  }
};

export const deleteFromBunny = async (fileUrl: string): Promise<boolean> => {
  try {
    ensureBunnyConfig();
    const storagePath = getStoragePathFromPublicUrl(fileUrl);
    const deleteUrl = `${bunnyConfig.baseUrl}/${bunnyConfig.storageZoneName}/${storagePath}`;

    const res = await fetch(deleteUrl, {
      method: "DELETE",
      headers: {
        AccessKey: bunnyConfig.apiKey,
      },
    });

    if (!res.ok) {
      console.error("Error deleting from Bunny.net:", res.status, res.statusText);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error deleting from Bunny.net:", error);
    return false;
  }
};

type BunnyStorageEntry = {
  ObjectName: string;
  Path: string;
  Length: number;
  LastChanged: string;
  IsDirectory: boolean;
};

export const listBunnyFiles = async (subfolder: string = "") => {
  ensureBunnyConfig();
  const folder = normalizePath(subfolder);
  const listUrl = `${bunnyConfig.baseUrl}/${bunnyConfig.storageZoneName}/${folder}${folder ? "/" : ""}`;

  const res = await fetch(listUrl, {
    method: "GET",
    headers: {
      AccessKey: bunnyConfig.apiKey,
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    throw new Error(`Error listing Bunny.net files: ${res.status} ${res.statusText}`);
  }

  const entries = (await res.json()) as BunnyStorageEntry[];
  const publicBase = getPublicBaseUrl();

  return entries
    .filter((e) => !e.IsDirectory)
    .map((e) => {
      const relative = normalizePath(`${folder ? `${folder}/` : ""}${e.ObjectName}`);
      return {
        name: e.ObjectName,
        size: e.Length,
        type: guessMimeType(e.ObjectName),
        url: `${publicBase}/${relative}`,
        lastModified: e.LastChanged,
      };
    });
};

// --- Funciones para galería de medios del blog (StartupVen) ---

const IMAGE_EXT = /\.(jpe?g|png|gif|webp|svg|avif|bmp)$/i;

function sanitizeBunnyFilename(name: string) {
  return name.trim().replace(/\s+/g, "-").replace(/[^a-zA-Z0-9._-]/g, "");
}

export function bunnyPublicUrlForPath(path: string) {
  ensureBunnyConfig();
  const clean = path.replace(/^\/+/, "");
  return `${getPublicBaseUrl()}/${clean}`;
}

export function bunnyPathFromPublicUrl(url: string): string | null {
  try {
    const publicBase = getPublicBaseUrl();
    const u = new URL(url);
    const publicBaseUrl = new URL(publicBase);
    if (u.host !== publicBaseUrl.host) return null;
    return u.pathname.replace(/^\/+/, "");
  } catch {
    return null;
  }
}

export async function bunnyUploadBytes(opts: {
  folder?: string;
  filename: string;
  bytes: Uint8Array;
  contentType?: string;
}) {
  ensureBunnyConfig();
  const folder = (opts.folder ?? "blog").replace(/^\/+|\/+$/g, "");
  const safe = sanitizeBunnyFilename(opts.filename) || `file-${Date.now()}`;
  const key = `${folder}/${Date.now()}-${safe}`.replace(/^\/+/, "");

  const uploadUrl = `${bunnyConfig.baseUrl}/${bunnyConfig.storageZoneName}/${key}`;
  const buffer = Buffer.from(opts.bytes);

  const res = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      AccessKey: bunnyConfig.apiKey,
      "Content-Type": opts.contentType ?? "application/octet-stream",
      "Content-Length": buffer.length.toString(),
    },
    body: buffer,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Bunny upload failed (${res.status}): ${text}`);
  }

  return {
    path: key,
    url: bunnyPublicUrlForPath(key),
  };
}

export async function bunnyDeleteByPath(path: string) {
  ensureBunnyConfig();
  const key = path.replace(/^\/+/, "");
  const deleteUrl = `${bunnyConfig.baseUrl}/${bunnyConfig.storageZoneName}/${key}`;

  const res = await fetch(deleteUrl, {
    method: "DELETE",
    headers: { AccessKey: bunnyConfig.apiKey },
  });

  if (res.status === 404) return { deleted: false };
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Bunny delete failed (${res.status}): ${text}`);
  }
  return { deleted: true };
}

export async function bunnyDeleteByPublicUrl(publicUrl: string) {
  const path = bunnyPathFromPublicUrl(publicUrl);
  if (!path) return { deleted: false };
  return bunnyDeleteByPath(path);
}

type BunnyStorageItem = {
  Guid: string;
  StorageZoneName: string;
  Path: string;
  ObjectName: string;
  IsDirectory: boolean;
  Length?: number;
  ContentType?: string;
  DateCreated?: string;
  LastChanged?: string;
};

export function bunnyStorageItemToPath(item: BunnyStorageItem): string {
  const dir = (item.Path ?? "/").replace(/^\/+|\/+$/g, "");
  const name = item.ObjectName.replace(/^\/+/, "");
  return dir ? `${dir}/${name}` : name;
}

export function isBunnyImageItem(item: BunnyStorageItem): boolean {
  if (item.IsDirectory) return false;
  if (item.ContentType?.startsWith("image/")) return true;
  return IMAGE_EXT.test(item.ObjectName);
}

export async function bunnyListFolder(folderPath = ""): Promise<BunnyStorageItem[]> {
  ensureBunnyConfig();
  const clean = folderPath.replace(/^\/+|\/+$/g, "");
  const suffix = clean ? `${clean}/` : "";
  const listUrl = `${bunnyConfig.baseUrl}/${bunnyConfig.storageZoneName}/${suffix}`;

  const res = await fetch(listUrl, {
    method: "GET",
    headers: { AccessKey: bunnyConfig.apiKey, Accept: "application/json" },
  });

  if (res.status === 404) return [];
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Bunny list failed (${res.status}): ${text}`);
  }

  const data = (await res.json()) as BunnyStorageItem[];
  return Array.isArray(data) ? data : [];
}

export async function bunnyListAllImages(rootFolder = "") {
  const results: Array<{
    path: string;
    url: string;
    mimeType: string | null;
    sizeBytes: number | null;
    filename: string;
    folder: string;
  }> = [];

  async function walk(folder: string) {
    const items = await bunnyListFolder(folder);
    for (const item of items) {
      if (item.IsDirectory) {
        const sub = folder ? `${folder}/${item.ObjectName}` : item.ObjectName;
        await walk(sub);
        continue;
      }
      if (!isBunnyImageItem(item)) continue;
      const path = folder ? `${folder}/${item.ObjectName}` : item.ObjectName;
      const folderName = folder || "blog";
      results.push({
        path,
        url: bunnyPublicUrlForPath(path),
        mimeType: item.ContentType ?? null,
        sizeBytes: item.Length ?? null,
        filename: item.ObjectName,
        folder: folderName,
      });
    }
  }

  await walk(rootFolder.replace(/^\/+|\/+$/g, ""));
  return results;
}