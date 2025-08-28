"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, List, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TestResult {
  success: boolean;
  message: string;
  name?: string;
}

export default function CPanelQuickTest() {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const { toast } = useToast();

  const runQuickTest = async () => {
    setIsRunning(true);
    setResults([]);

    const testResults: TestResult[] = [];

    try {
      // Test 1: Listar archivos
      console.log("🧪 Ejecutando test de listado...");
      const listResponse = await fetch('/api/caletas/list-files');
      const listData = await listResponse.json();

      if (listResponse.ok) {
        testResults.push({
          success: true,
          message: `✅ ${listData.files?.length || 0} archivos encontrados`,
          name: 'Listado de archivos'
        });
      } else {
        testResults.push({
          success: false,
          message: `❌ ${listData.error || 'Error desconocido'}`,
          name: 'Listado de archivos'
        });
      }

      // Test 2: Subida de archivo de prueba
      console.log("🧪 Ejecutando test de subida...");
      const testFile = new File(['Test content'], 'test.txt', { type: 'text/plain' });
      const formData = new FormData();
      formData.append('file', testFile);
      formData.append('titulo', 'Test Quick');
      formData.append('descripcion', 'Archivo de prueba rápida');
      formData.append('tipo', 'DOCUMENTO');
      formData.append('materiaId', 'test-materia');
      formData.append('tags', 'test, quick');
      formData.append('esPublico', 'false');

      const uploadResponse = await fetch('/api/caletas/upload-cpanel', {
        method: 'POST',
        body: formData
      });

      if (uploadResponse.ok) {
        const uploadData = await uploadResponse.json();
        testResults.push({
          success: true,
          message: `✅ Archivo subido: ${uploadData.fileUrl}`,
          name: 'Subida de archivo'
        });
      } else {
        const uploadError = await uploadResponse.json();
        testResults.push({
          success: false,
          message: `❌ ${uploadError.error || 'Error de subida'}`,
          name: 'Subida de archivo'
        });
      }

    } catch (error) {
      testResults.push({
        success: false,
        message: `❌ Error de red: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        name: 'Conexión de red'
      });
    }

    setResults(testResults);
    setIsRunning(false);

    // Mostrar resumen
    const successCount = testResults.filter(r => r.success).length;
    const totalCount = testResults.length;

    if (successCount === totalCount) {
      toast({
        title: "✅ Todas las pruebas exitosas",
        description: `${successCount}/${totalCount} pruebas pasaron correctamente`,
      });
    } else {
      toast({
        title: "⚠️ Algunas pruebas fallaron",
        description: `${successCount}/${totalCount} pruebas pasaron, ${totalCount - successCount} fallaron`,
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="bg-[#354B3A] border-white/10">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Zap className="h-5 w-5 text-[#40C9A9]" />
          Prueba Rápida
        </CardTitle>
        <CardDescription className="text-white/70">
          Test automático de conexión, listado y subida
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-white/70">
          <div className="flex items-center gap-2">
            <List className="h-4 w-4 text-blue-500" />
            <span>Listado de archivos</span>
          </div>
          <div className="flex items-center gap-2">
            <Upload className="h-4 w-4 text-green-500" />
            <span>Subida de archivo</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-yellow-500" />
            <span>Verificación completa</span>
          </div>
        </div>

        <Button
          onClick={runQuickTest}
          disabled={isRunning}
          className="w-full bg-[#40C9A9] hover:bg-[#40C9A9]/80 text-white"
        >
          {isRunning ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Ejecutando pruebas...
            </>
          ) : (
            <>
              <Zap className="h-4 w-4 mr-2" />
              Ejecutar Prueba Rápida
            </>
          )}
        </Button>

        {results.length > 0 && (
          <div className="space-y-2">
            <div className="text-white/50 text-xs">
              Resultados de las pruebas:
            </div>
            {results.map((result, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <Badge 
                  variant={result.success ? 'default' : 'destructive'} 
                  className={result.success ? 'bg-green-600' : 'bg-red-600'}
                >
                  {result.success ? 'PASS' : 'FAIL'}
                </Badge>
                <span className="text-white/80">{result.name}:</span>
                <span className={result.success ? 'text-green-400' : 'text-red-400'}>
                  {result.message}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
