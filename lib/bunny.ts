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
  const prefix = normalizePath(options.prefix || "caletas");
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