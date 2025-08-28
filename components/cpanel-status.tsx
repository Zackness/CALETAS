"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Wifi, WifiOff, RefreshCw } from "lucide-react";

interface TestResult {
  success: boolean;
  message: string;
  name?: string;
}

export default function CPanelStatus() {
  const [status, setStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [lastCheck, setLastCheck] = useState<Date | null>(null);
  const [testResults, setTestResults] = useState<TestResult[]>([]);

  const checkConnection = async () => {
    setStatus('checking');
    setTestResults([]);

    try {
      // Prueba de conexión básica
      const response = await fetch('/api/caletas/list-files');
      const data = await response.json();

      if (response.ok) {
        setStatus('online');
        setTestResults([
          { success: true, message: 'Conexión FTP establecida', name: 'FTP Connection' },
          { success: true, message: `Archivos listados: ${data.files?.length || 0}`, name: 'File Listing' }
        ]);
      } else {
        setStatus('offline');
        setTestResults([
          { success: false, message: data.error || 'Error de conexión', name: 'FTP Connection' }
        ]);
      }
    } catch (error) {
      setStatus('offline');
      setTestResults([
        { success: false, message: 'Error de red o servidor', name: 'Network Error' }
      ]);
    }

    setLastCheck(new Date());
  };

  useEffect(() => {
    checkConnection();
  }, []);

  return (
    <Card className="bg-[#354B3A] border-white/10">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Wifi className="h-5 w-5 text-[#40C9A9]" />
          Estado de Conexión cPanel
        </CardTitle>
        <CardDescription className="text-white/70">
          Verificación en tiempo real de la conexión FTP
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {status === 'online' && <Wifi className="h-4 w-4 text-green-500" />}
            {status === 'offline' && <WifiOff className="h-4 w-4 text-red-500" />}
            {status === 'checking' && <RefreshCw className="h-4 w-4 text-yellow-500 animate-spin" />}
            
            <Badge 
              variant={status === 'online' ? 'default' : 'destructive'} 
              className={status === 'online' ? 'bg-green-600' : 'bg-red-600'}
            >
              {status === 'online' ? 'ONLINE' : status === 'offline' ? 'OFFLINE' : 'VERIFICANDO'}
            </Badge>
          </div>
          
          <Button
            onClick={checkConnection}
            size="sm"
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10"
            disabled={status === 'checking'}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Verificar
          </Button>
        </div>

        {testResults.length > 0 && (
          <div className="space-y-2">
            {testResults.map((result, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <div className={`w-2 h-2 rounded-full ${result.success ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-white/80">{result.name}:</span>
                <span className={result.success ? 'text-green-400' : 'text-red-400'}>
                  {result.message}
                </span>
              </div>
            ))}
          </div>
        )}

        {lastCheck && (
          <div className="text-white/50 text-xs border-t border-white/10 pt-4">
            Última verificación: {lastCheck.toLocaleTimeString()}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
