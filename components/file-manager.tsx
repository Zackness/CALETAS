"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  File, 
  Download, 
  Trash2, 
  Eye, 
  Search, 
  FolderOpen,
  ExternalLink,
  FileText,
  Image,
  Video,
  Music,
  Archive
} from "lucide-react";
import FileViewerModal from "./file-viewer-modal";

interface FileItem {
  name: string;
  size: number;
  type: string;
  url: string;
  lastModified?: string;
}

export default function FileManager() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFolder, setSelectedFolder] = useState("");
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const folders = [
    { id: "", name: "Archivos", icon: FolderOpen },
    { id: "recursos", name: "Recursos", icon: FolderOpen },
    { id: "test", name: "Test", icon: FileText },
  ];

  const loadFiles = async (folder: string = "") => {
    try {
      setLoading(true);
      const response = await fetch(`/api/caletas/list-files?subfolder=${folder}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Archivos cargados:', data);
        
        if (data.files && Array.isArray(data.files)) {
          // Convertir los archivos del servidor al formato del componente
          const realFiles: FileItem[] = data.files.map((file: any) => ({
            name: file.name,
            size: file.size || 0,
            type: file.type || 'application/octet-stream',
            url: file.url || `https://startupven.com/caletas/home/nrektwbx/public_html/caletas/${folder}/${file.name}`,
            lastModified: file.lastModified || new Date().toISOString()
          }));
          setFiles(realFiles);
        } else {
          console.log('No se encontraron archivos en la respuesta:', data);
          setFiles([]);
        }
      } else {
        console.error("Error cargando archivos:", response.status, response.statusText);
        setFiles([]);
      }
    } catch (error) {
      console.error("Error:", error);
      setFiles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFiles(selectedFolder);
  }, [selectedFolder]);

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'pdf':
        return <FileText className="h-5 w-5 text-red-500" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'webp':
        return <Image className="h-5 w-5 text-blue-500" />;
      case 'mp4':
      case 'avi':
      case 'mov':
      case 'webm':
        return <Video className="h-5 w-5 text-purple-500" />;
      case 'mp3':
      case 'wav':
      case 'ogg':
        return <Music className="h-5 w-5 text-green-500" />;
      case 'zip':
      case 'rar':
      case '7z':
        return <Archive className="h-5 w-5 text-orange-500" />;
      default:
        return <File className="h-5 w-5 text-gray-500" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const filteredFiles = files.filter(file =>
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeleteFile = async (fileName: string) => {
    if (confirm(`¿Estás seguro de que quieres eliminar "${fileName}"?`)) {
      try {
        const response = await fetch(`/api/caletas/delete-file?fileUrl=${encodeURIComponent(fileName)}`);
        if (response.ok) {
          setFiles(files.filter(f => f.name !== fileName));
        } else {
          alert("Error eliminando archivo");
        }
      } catch (error) {
        console.error("Error:", error);
        alert("Error eliminando archivo");
      }
    }
  };

  return (
    <Card className="bg-[#354B3A] border-white/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white font-special">
          <FolderOpen className="h-5 w-5 text-[#40C9A9]" />
          Gestor de Archivos - cPanel
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Navegación de carpetas */}
        <div className="flex flex-wrap gap-2">
          {folders.map((folder) => {
            const Icon = folder.icon;
            return (
              <Button
                key={folder.id}
                variant={selectedFolder === folder.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedFolder(folder.id)}
                className={`flex items-center gap-2 ${
                  selectedFolder === folder.id 
                    ? 'bg-[#40C9A9] text-white' 
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                <Icon className="h-4 w-4" />
                {folder.name}
              </Button>
            );
          })}
        </div>

        {/* Barra de búsqueda */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/50" />
          <Input
            placeholder="Buscar archivos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/50"
          />
        </div>

        {/* Lista de archivos */}
        <div className="space-y-2">
          {loading ? (
            <div className="text-center py-8 text-white/70">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#40C9A9] mx-auto"></div>
              <p className="mt-2">Cargando archivos...</p>
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="text-center py-8 text-white/70">
              <File className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No se encontraron archivos</p>
            </div>
          ) : (
            filteredFiles.map((file) => (
              <div
                key={file.name}
                className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1">
                  {getFileIcon(file.name)}
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{file.name}</p>
                    <p className="text-white/50 text-sm">
                      {formatFileSize(file.size)} • {file.type}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-white/70 border-white/20">
                    {file.type.split('/')[1]?.toUpperCase() || 'ARCHIVO'}
                  </Badge>
                  
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      if (file.name.toLowerCase().endsWith('.pdf')) {
                        // Para PDFs, redirigir a la página dinámica
                        const encodedFilename = encodeURIComponent(file.name);
                        window.open(`/view-pdf/${encodedFilename}`, '_blank');
                      } else {
                        // Para otros archivos, usar el modal
                        setSelectedFile(file);
                        setIsModalOpen(true);
                      }
                    }}
                    className="text-white/70 hover:text-white hover:bg-white/10"
                    title={file.name.toLowerCase().endsWith('.pdf') ? "Ver PDF (modo seguro)" : "Ver archivo"}
                  >
                    <Eye className="h-4 w-4" />
                    {file.name.toLowerCase().endsWith('.pdf') && (
                      <span className="ml-1 text-xs">📄</span>
                    )}
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => window.open(file.url, '_blank')}
                    className="text-white/70 hover:text-white hover:bg-white/10"
                    title="Descargar"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteFile(file.name)}
                    className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                    title="Eliminar"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Información adicional */}
        <div className="text-white/50 text-xs border-t border-white/10 pt-4">
          <p>• Los archivos se almacenan en el servidor cPanel de Banna Hosting</p>
          <p>• Almacenamiento ilimitado disponible</p>
          <p>• Los archivos son accesibles públicamente desde las URLs generadas</p>
          <p>• 📄 Los PDFs se abren en pantalla completa (modo seguro - sin descarga)</p>
        </div>
      </CardContent>
      
      {/* Modal para visualizar archivos */}
      <FileViewerModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedFile(null);
        }}
        file={selectedFile}
      />
    </Card>
  );
}
