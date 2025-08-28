"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, CheckCircle, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function FileUploadTest() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{
    success: boolean;
    message: string;
    url?: string;
  } | null>(null);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setUploadResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: "Archivo requerido",
        description: "Selecciona un archivo para subir",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setUploadResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("titulo", `Test Upload - ${file.name}`);
      formData.append("descripcion", "Archivo de prueba subido manualmente");
      formData.append("tipo", "DOCUMENTO");
      formData.append("materiaId", "test-materia");
      formData.append("tags", "test, manual");
      formData.append("esPublico", "false");

      console.log("📤 Subiendo archivo manual...");

      const response = await fetch("/api/caletas/upload-cpanel", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        console.log("✅ Resultado de subida manual:", result);
        
        setUploadResult({
          success: true,
          message: "Archivo subido exitosamente",
          url: result.fileUrl
        });
        
        toast({
          title: "¡Archivo subido exitosamente!",
          description: `Archivo subido a cPanel: ${result.fileUrl}`,
        });
        
        // Limpiar archivo
        setFile(null);
        
      } else {
        const error = await response.json();
        throw new Error(error.error || "Error al subir el archivo");
      }
    } catch (error) {
      console.error("Error subiendo archivo manual:", error);
      
      setUploadResult({
        success: false,
        message: error instanceof Error ? error.message : "Error al subir el archivo"
      });
      
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al subir el archivo",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className="bg-[#354B3A] border-white/10">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Upload className="h-5 w-5 text-[#40C9A9]" />
          Subida Manual de Archivos
        </CardTitle>
        <CardDescription className="text-white/70">
          Sube archivos directamente a cPanel para pruebas
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="file" className="text-white/80">Seleccionar archivo</Label>
          <Input
            id="file"
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.txt"
            onChange={handleFileChange}
            className="bg-white/10 border-white/20 text-white file:text-white file:bg-[#40C9A9] file:border-0 file:rounded-lg file:px-4 file:py-2 focus:border-[#40C9A9] focus:ring-[#40C9A9] rounded-lg"
          />
          {file && (
            <div className="text-[#40C9A9] text-sm">
              Archivo seleccionado: {file.name} ({file.size} bytes)
            </div>
          )}
        </div>

        <Button
          onClick={handleUpload}
          disabled={isUploading || !file}
          className="w-full bg-[#40C9A9] hover:bg-[#40C9A9]/80 text-white font-bold py-3 rounded-xl shadow-lg transition-colors"
        >
          {isUploading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Subiendo...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Subir a cPanel
            </>
          )}
        </Button>

        {uploadResult && (
          <div className={`p-4 rounded-lg border ${
            uploadResult.success 
              ? 'bg-green-500/10 border-green-500/20' 
              : 'bg-red-500/10 border-red-500/20'
          }`}>
            <div className="flex items-center gap-2">
              {uploadResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-red-500" />
              )}
              <span className={uploadResult.success ? 'text-green-400' : 'text-red-400'}>
                {uploadResult.message}
              </span>
            </div>
            {uploadResult.url && (
              <div className="mt-2 text-sm text-white/70">
                URL: <span className="text-[#40C9A9] break-all">{uploadResult.url}</span>
              </div>
            )}
          </div>
        )}

        <div className="text-white/50 text-xs border-t border-white/10 pt-4">
          Tipos de archivo soportados: PDF, JPG, PNG, TXT
        </div>
      </CardContent>
    </Card>
  );
}
