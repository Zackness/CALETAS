"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  X, 
  Download, 
  FileText, 
  Image, 
  Video, 
  Music, 
  Archive,
  File,
  ExternalLink
} from "lucide-react";
import FullscreenPDFViewer from "./fullscreen-pdf-viewer";

interface FileViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: {
    name: string;
    size: number;
    type: string;
    url: string;
  } | null;
}

export default function FileViewerModal({ isOpen, onClose, file }: FileViewerModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  // Resetear estado de carga cuando se abre el modal
  useEffect(() => {
    if (isOpen && file) {
      setIsLoading(true);
    }
  }, [isOpen, file]);

  if (!file) return null;

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'pdf':
        return <FileText className="h-8 w-8 text-red-500" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'webp':
        return <Image className="h-8 w-8 text-blue-500" />;
      case 'mp4':
      case 'avi':
      case 'mov':
      case 'webm':
        return <Video className="h-8 w-8 text-purple-500" />;
      case 'mp3':
      case 'wav':
      case 'ogg':
        return <Music className="h-8 w-8 text-green-500" />;
      case 'zip':
      case 'rar':
      case '7z':
        return <Archive className="h-8 w-8 text-orange-500" />;
      default:
        return <File className="h-8 w-8 text-gray-500" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileType = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'pdf':
        return 'PDF Document';
      case 'jpg':
      case 'jpeg':
        return 'JPEG Image';
      case 'png':
        return 'PNG Image';
      case 'gif':
        return 'GIF Image';
      case 'webp':
        return 'WebP Image';
      case 'mp4':
        return 'MP4 Video';
      case 'avi':
        return 'AVI Video';
      case 'mov':
        return 'MOV Video';
      case 'mp3':
        return 'MP3 Audio';
      case 'wav':
        return 'WAV Audio';
      case 'txt':
        return 'Text File';
      case 'doc':
      case 'docx':
        return 'Word Document';
      case 'xls':
      case 'xlsx':
        return 'Excel Spreadsheet';
      case 'zip':
        return 'ZIP Archive';
      case 'rar':
        return 'RAR Archive';
      default:
        return 'Unknown File';
    }
  };

  const renderFileContent = () => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    
    switch (extension) {
              case 'pdf':
          return (
            <div className="w-full h-[600px] bg-white rounded-lg overflow-hidden">
              <FullscreenPDFViewer 
                url={file.url}
                fileName={file.name}
              />
            </div>
          );
      
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'webp':
        return (
          <div 
            className="flex justify-center"
            onContextMenu={(e) => e.preventDefault()}
            onDragStart={(e) => e.preventDefault()}
          >
            <img
              src={file.url}
              alt={file.name}
              className="max-w-full max-h-[600px] object-contain rounded-lg"
              onLoad={() => setIsLoading(false)}
              onError={() => setIsLoading(false)}
              onContextMenu={(e) => e.preventDefault()}
              onDragStart={(e) => e.preventDefault()}
              style={{ 
                userSelect: 'none',
                WebkitUserSelect: 'none',
                pointerEvents: 'none'
              }}
            />
          </div>
        );
      
      case 'mp4':
      case 'webm':
        return (
          <div className="flex justify-center">
            <video
              controls
              className="max-w-full max-h-[600px] rounded-lg"
              onLoadStart={() => setIsLoading(true)}
              onLoadedData={() => setIsLoading(false)}
            >
              <source src={file.url} type={`video/${extension}`} />
              Tu navegador no soporta el elemento de video.
            </video>
          </div>
        );
      
      case 'mp3':
      case 'wav':
      case 'ogg':
        return (
          <div className="flex justify-center">
            <audio
              controls
              className="w-full max-w-md"
              onLoadStart={() => setIsLoading(true)}
              onLoadedData={() => setIsLoading(false)}
            >
              <source src={file.url} type={`audio/${extension}`} />
              Tu navegador no soporta el elemento de audio.
            </audio>
          </div>
        );
      
      case 'txt':
        return (
          <div className="w-full h-[600px] bg-white rounded-lg p-4 overflow-auto">
            <pre className="text-sm text-gray-800 whitespace-pre-wrap">
              {/* Aquí podrías cargar el contenido del archivo de texto */}
              Contenido del archivo de texto...
            </pre>
          </div>
        );
      
      default:
        return (
          <div className="flex flex-col items-center justify-center h-[400px] text-white/70">
            <File className="h-16 w-16 mb-4 opacity-50" />
            <p className="text-lg mb-2">Vista previa no disponible</p>
            <p className="text-sm">Este tipo de archivo no se puede previsualizar</p>
            <Button
              onClick={() => window.open(file.url, '_blank')}
              className="mt-4 bg-[#40C9A9] hover:bg-[#40C9A9]/80"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Abrir en nueva pestaña
            </Button>
          </div>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-4xl max-h-[90vh] bg-[#354B3A] border-white/10"
        onContextMenu={(e) => e.preventDefault()}
        onDragStart={(e) => e.preventDefault()}
        onKeyDown={(e) => {
          // Prevenir atajos de teclado para descargar/guardar
          if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
            e.preventDefault();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-white font-special">
            {getFileIcon(file.name)}
            <div className="flex-1">
              <p className="text-lg">{file.name}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-white/70 border-white/20">
                  {getFileType(file.name)}
                </Badge>
                <span className="text-white/50 text-sm">
                  {formatFileSize(file.size)}
                </span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white/70 hover:text-white hover:bg-white/10"
            >
              <X className="h-5 w-5" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-auto">
          {isLoading && (
            <div className="flex items-center justify-center h-[400px]">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#40C9A9]"></div>
              <span className="ml-2 text-white/70">Cargando archivo...</span>
            </div>
          )}
          
          {!isLoading && renderFileContent()}
        </div>
        
        <div className="flex justify-between items-center pt-4 border-t border-white/10">
          <div className="text-white/50 text-sm">
            Archivo: {file.name} • {formatFileSize(file.size)}
          </div>
          <div className="flex items-center gap-4">
            <div className="text-white/40 text-xs">
              🔒 Vista protegida - Descarga deshabilitada
            </div>
            <Button
              variant="outline"
              onClick={() => window.open(file.url, '_blank')}
              className="bg-white/10 text-white hover:bg-white/20 border-white/20"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Abrir externamente
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
