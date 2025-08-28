export interface FileValidationResult {
  isValid: boolean;
  error?: string;
}

export const validateFile = (file: File): FileValidationResult => {
  // Validar tipo de archivo
  const allowedTypes = [
    'application/pdf',
    'image/jpeg', 
    'image/png', 
    'image/jpg',
    'image/gif',
    'image/webp',
    'video/mp4',
    'video/webm',
    'video/ogg',
    'audio/mpeg',
    'audio/wav',
    'audio/ogg',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv'
  ];

  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: "Tipo de archivo no permitido. Formatos soportados: PDF, imágenes, videos, audio, documentos de Office, texto"
    };
  }

  // Validar tamaño (máximo 50MB para aprovechar el almacenamiento ilimitado)
  const maxSize = 50 * 1024 * 1024; // 50MB
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: "El archivo es demasiado grande. Máximo 50MB"
    };
  }

  return { isValid: true };
};

export const getFileType = (file: File): string => {
  if (file.type.startsWith('image/')) return 'imagen';
  if (file.type.startsWith('video/')) return 'video';
  if (file.type.startsWith('audio/')) return 'audio';
  if (file.type === 'application/pdf') return 'pdf';
  if (file.type.includes('word')) return 'documento';
  if (file.type.includes('excel') || file.type.includes('spreadsheet')) return 'hoja_calculo';
  if (file.type.includes('powerpoint') || file.type.includes('presentation')) return 'presentacion';
  if (file.type.startsWith('text/')) return 'texto';
  return 'archivo';
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const generateFileName = (originalName: string): string => {
  const timestamp = Date.now();
  const extension = originalName.split('.').pop();
  const randomString = Math.random().toString(36).substring(2, 15);
  return `${timestamp}-${randomString}.${extension}`;
};

export const getFileIcon = (fileType: string): string => {
  switch (fileType) {
    case 'imagen':
      return '🖼️';
    case 'video':
      return '🎥';
    case 'audio':
      return '🎵';
    case 'pdf':
      return '📄';
    case 'documento':
      return '📝';
    case 'hoja_calculo':
      return '📊';
    case 'presentacion':
      return '📈';
    case 'texto':
      return '📃';
    default:
      return '📁';
  }
};
