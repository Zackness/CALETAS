"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Upload, Sparkles } from "lucide-react";
import { toast } from "sonner";

export default function ResumirPage() {
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      toast.success("Archivo seleccionado: " + selectedFile.name);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file && !text.trim()) {
      toast.error("Por favor, sube un archivo o ingresa texto");
      return;
    }

    setLoading(true);
    
    try {
      const formData = new FormData();
      if (file) {
        formData.append("file", file);
      }
      if (text.trim()) {
        formData.append("texto", text);
      }

      const response = await fetch("/api/ia/resumir", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al procesar el contenido");
      }

      const data = await response.json();
      setResult(JSON.stringify(data.resumen, null, 2));
      toast.success("¡Resumen generado exitosamente!");
    } catch (error) {
      console.error("Error:", error);
      toast.error(error instanceof Error ? error.message : "Error al procesar el contenido");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-t from-mygreen to-mygreen-light">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-special text-white mb-2">
            Resumir y Explicar con IA
          </h1>
          <p className="text-white/70">
            Sube un PDF o ingresa texto para obtener un resumen inteligente y explicaciones detalladas
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Panel de Entrada */}
          <Card className="bg-[#354B3A] border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#40C9A9]" />
                Contenido a Procesar
              </CardTitle>
              <CardDescription className="text-white/70">
                Sube un archivo PDF o ingresa texto directamente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Subir Archivo */}
                <div className="space-y-2">
                  <label className="text-white font-medium">Subir PDF</label>
                  <div className="border-2 border-dashed border-white/20 rounded-lg p-6 text-center hover:border-[#40C9A9] transition-colors">
                    <Upload className="w-8 h-8 text-white/50 mx-auto mb-2" />
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleFileChange}
                      className="hidden"
                      id="file-upload"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <p className="text-white/70 mb-2">Haz clic para seleccionar un archivo PDF</p>
                      <p className="text-white/50 text-sm">o arrastra y suelta aquí</p>
                    </label>
                  </div>
                  {file && (
                    <p className="text-[#40C9A9] text-sm">✓ {file.name}</p>
                  )}
                </div>

                {/* O */}
                <div className="text-center">
                  <span className="text-white/50">o</span>
                </div>

                {/* Texto Directo */}
                <div className="space-y-2">
                  <label className="text-white font-medium">Ingresar Texto</label>
                  <Textarea
                    placeholder="Pega aquí el texto que quieres resumir o explicar..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    className="bg-[#1C2D20] border-white/10 text-white placeholder:text-white/50 min-h-[120px]"
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-[#40C9A9] hover:bg-[#40C9A9]/80 text-white"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Procesando...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generar Resumen
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Panel de Resultado */}
          <Card className="bg-[#354B3A] border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#40C9A9]" />
                Resultado
              </CardTitle>
              <CardDescription className="text-white/70">
                Resumen y explicación generada por IA
              </CardDescription>
            </CardHeader>
            <CardContent>
              {result ? (
                <div className="bg-[#1C2D20] rounded-lg p-4">
                  <div className="text-white leading-relaxed">
                    {(() => {
                      try {
                        const resumen = JSON.parse(result);
                        return (
                          <div className="space-y-4">
                            <div>
                              <h4 className="font-semibold text-[#40C9A9] mb-2">Tema Principal</h4>
                              <p className="text-white/90">{resumen.temaPrincipal}</p>
                            </div>
                            
                            <div>
                              <h4 className="font-semibold text-[#40C9A9] mb-2">Puntos Clave</h4>
                              <ul className="list-disc list-inside space-y-1">
                                {resumen.puntosClave.map((punto: string, idx: number) => (
                                  <li key={idx} className="text-white/80">{punto}</li>
                                ))}
                              </ul>
                            </div>
                            
                            <div>
                              <h4 className="font-semibold text-[#40C9A9] mb-2">Conceptos Importantes</h4>
                              <ul className="list-disc list-inside space-y-1">
                                {resumen.conceptosImportantes.map((concepto: string, idx: number) => (
                                  <li key={idx} className="text-white/80">{concepto}</li>
                                ))}
                              </ul>
                            </div>
                            
                            <div>
                              <h4 className="font-semibold text-[#40C9A9] mb-2">Aplicaciones Prácticas</h4>
                              <ul className="list-disc list-inside space-y-1">
                                {resumen.aplicacionesPracticas.map((aplicacion: string, idx: number) => (
                                  <li key={idx} className="text-white/80">{aplicacion}</li>
                                ))}
                              </ul>
                            </div>
                            
                            <div>
                              <h4 className="font-semibold text-[#40C9A9] mb-2">Conclusiones</h4>
                              <p className="text-white/90">{resumen.conclusiones}</p>
                            </div>
                            
                            <div>
                              <h4 className="font-semibold text-[#40C9A9] mb-2">Resumen General</h4>
                              <p className="text-white/90">{resumen.resumenGeneral}</p>
                            </div>
                          </div>
                        );
                      } catch {
                        return <p className="text-white/90">{result}</p>;
                      }
                    })()}
                  </div>
                </div>
              ) : (
                <div className="bg-[#1C2D20] rounded-lg p-8 text-center">
                  <Sparkles className="w-12 h-12 text-white/30 mx-auto mb-4" />
                  <p className="text-white/50">
                    El resultado aparecerá aquí después de procesar el contenido
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 