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
  
  export const generateUploadUrl = async (fileName: string) => {
    // Log para debug
    console.log('Bunny Config:', {
      storageZoneName: process.env.BUNNY_STORAGE_ZONE_NAME,
      apiKey: process.env.BUNNY_API_KEY ? '[PRESENT]' : '[MISSING]',
      baseUrl: process.env.BUNNY_BASE_URL
    });

    if (!bunnyConfig.apiKey || !bunnyConfig.storageZoneName || !bunnyConfig.baseUrl) {
      throw new Error(`Bunny.net configuration is missing: ${JSON.stringify({
        hasApiKey: !!bunnyConfig.apiKey,
        hasStorageZone: !!bunnyConfig.storageZoneName,
        hasBaseUrl: !!bunnyConfig.baseUrl
      })}`);
    }
  
    // Para Storage, necesitamos usar la contraseña del Storage como AccessKey
    const headers = {
      "AccessKey": bunnyConfig.apiKey
    };
  
    // El formato correcto de la URL para Bunny Storage
    const uploadUrl = `${bunnyConfig.baseUrl}/${bunnyConfig.storageZoneName}/${fileName}`;
    
    // La URL pública usa el formato de CDN
    const fileUrl = `https://${bunnyConfig.storageZoneName}.b-cdn.net/${fileName}`;
  
    return {
      url: uploadUrl,
      headers,
      fileUrl,
    };
  };

export const uploadToBunny = async (file: File): Promise<string> => {
  // Generar nombre único para el archivo
  const timestamp = Date.now();
  const extension = file.name.split('.').pop();
  const fileName = `caletas/${timestamp}-${Math.random().toString(36).substring(2)}.${extension}`;

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