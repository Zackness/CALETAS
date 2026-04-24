"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Upload, CheckCircle, AlertTriangle } from "lucide-react";

export default function TestUploadCPanelPage() {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubiendo, setIsSubiendo] = useState(false);
  
  // Estados del formulario
  const [file, setFile] = useState<File | null>(null);
  const [titulo, setTitulo] = useState("Test PDF cPanel");
  const [descripcion, setDescripcion] = useState("Archivo de prueba subido a cPanel");
  const [tipo, setTipo] = useState("DOCUMENTO");
  const [materiaId, setMateriaId] = useState("test-materia-id");
  const [tags, setTags] = useState("test, cpanel, pdf");

  useEffect(() => {
    if (isPending) return;
    
    if (!session?.user?.id) {
      router.push("/login");
      return;
    }
    
    setIsLoading(false);
  }, [session, isPending, router]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      toast({
        title: "Archivo requerido",
        description: "Selecciona un archivo para subir",
        variant: "destructive",
      });
      return;
    }

    setIsSubiendo(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("titulo", titulo);
      formData.append("descripcion", descripcion);
      formData.append("tipo", tipo);
      formData.append("materiaId", materiaId);
      formData.append("tags", tags);
      // Todos los recursos son visibles para todos; ya no existe toggle de visibilidad.

      console.log("📤 Enviando archivo a cPanel...");

      const response = await fetch("/api/caletas/upload-cpanel", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        console.log("✅ Resultado de subida:", result);
        
        toast({
          title: "¡Archivo subido exitosamente!",
          description: `Archivo subido a cPanel: ${result.fileUrl}`,
        });
        
        // Limpiar formulario
        setFile(null);
        setTitulo("Test PDF cPanel");
        setDescripcion("Archivo de prueba subido a cPanel");
        
      } else {
        const error = await response.json();
        throw new Error(error.error || "Error al subir el archivo");
      }
    } catch (error) {
      console.error("Error subiendo archivo:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al subir el archivo",
        variant: "destructive",
      });
    } finally {
      setIsSubiendo(false);
    }
  };

  if (isLoading || isPending) {
    return (
      <div className="min-h-screen bg-gradient-to-t from-mygreen to-mygreen-light flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-t from-mygreen to-mygreen-light p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-special text-white mb-2">
            🧪 Prueba Subida cPanel
          </h1>
          <p className="text-white/70 mb-4">
            Prueba la subida de archivos a cPanel con registro en base de datos
          </p>
        </div>

        <div className="bg-[var(--mygreen-light)] border-white/10 rounded-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Archivo */}
            <div>
              <Label htmlFor="file" className="text-white/80">Archivo *</Label>
              <Input
                id="file"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                className="bg-white/10 border-white/20 text-white file:text-white file:bg-[var(--accent-hex)] file:border-0 file:rounded-lg file:px-4 file:py-2 focus:border-[var(--accent-hex)] focus:ring-[var(--accent-hex)] rounded-lg mt-1"
              />
              {file && (
                <div className="text-[var(--accent-hex)] text-sm mt-1">
                  Archivo seleccionado: {file.name} ({file.size} bytes)
                </div>
              )}
            </div>

            {/* Título */}
            <div>
              <Label htmlFor="titulo" className="text-white/80">Título *</Label>
              <Input
                id="titulo"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-[var(--accent-hex)] focus:ring-[var(--accent-hex)] rounded-lg mt-1"
              />
            </div>

            {/* Descripción */}
            <div>
              <Label htmlFor="descripcion" className="text-white/80">Descripción *</Label>
              <Textarea
                id="descripcion"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                rows={3}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-[var(--accent-hex)] focus:ring-[var(--accent-hex)] rounded-lg mt-1"
              />
            </div>

            {/* Tipo */}
            <div>
              <Label htmlFor="tipo" className="text-white/80">Tipo *</Label>
              <Select value={tipo} onValueChange={setTipo}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white focus:border-[var(--accent-hex)] focus:ring-[var(--accent-hex)] rounded-lg mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[var(--mygreen)] text-white">
                  <SelectItem value="DOCUMENTO">Documento</SelectItem>
                  <SelectItem value="ANOTACION">Anotación</SelectItem>
                  <SelectItem value="RESUMEN">Resumen</SelectItem>
                  <SelectItem value="GUIA_ESTUDIO">Guía de Estudio</SelectItem>
                  <SelectItem value="EJERCICIOS">Ejercicios</SelectItem>
                  <SelectItem value="PRESENTACION">Presentación</SelectItem>
                  <SelectItem value="TIP">Tip/Consejo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Materia ID */}
            <div>
              <Label htmlFor="materiaId" className="text-white/80">Materia ID *</Label>
              <Input
                id="materiaId"
                value={materiaId}
                onChange={(e) => setMateriaId(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-[var(--accent-hex)] focus:ring-[var(--accent-hex)] rounded-lg mt-1"
              />
            </div>

            {/* Tags */}
            <div>
              <Label htmlFor="tags" className="text-white/80">Tags</Label>
              <Input
                id="tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-[var(--accent-hex)] focus:ring-[var(--accent-hex)] rounded-lg mt-1"
              />
            </div>

            {/* Botón subir */}
            <Button
              type="submit"
              disabled={isSubiendo || !file}
              className="w-full bg-[var(--accent-hex)] hover:bg-[color-mix(in_oklab,var(--accent-hex)_80%,transparent)] text-white font-bold py-3 rounded-xl shadow-lg transition-colors"
            >
              {isSubiendo ? (
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
          </form>
        </div>

        {/* Información */}
        <div className="bg-[var(--mygreen-light)] border-white/10 rounded-lg p-6">
          <h2 className="text-xl font-special text-white mb-4">
            📋 Información de la prueba
          </h2>
          <div className="text-white/70 space-y-2">
            <p>• <strong>API:</strong> `/api/caletas/upload-cpanel`</p>
            <p>• <strong>Almacenamiento:</strong> cPanel (Banna Hosting)</p>
            <p>• <strong>Base de datos:</strong> Registro en tabla `Recurso`</p>
            <p>• <strong>URL generada:</strong> Para visualización en `/view-pdf/[filename]`</p>
            <p>• <strong>Validación:</strong> Archivos PDF, JPG, PNG</p>
            <p>• <strong>Autenticación:</strong> Requiere sesión activa</p>
          </div>
        </div>

        {/* Botones de navegación */}
        <div className="flex justify-center gap-4">
          <Button
            onClick={() => router.push("/test-cpanel")}
            className="bg-[var(--accent-hex)] hover:bg-[color-mix(in_oklab,var(--accent-hex)_80%,transparent)]"
          >
            Ir a cPanel
          </Button>
          
          <Button
            onClick={() => router.push("/caletas/crear")}
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10"
          >
            Ir a crear caleta
          </Button>
        </div>
      </div>
    </div>
  );
}
