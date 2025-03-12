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