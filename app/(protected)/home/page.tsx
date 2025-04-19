"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Loader2
} from "lucide-react";
import { InfoCard } from "./components/info-card";
import { MotionWrapper } from "./components/wrapped.";
import { ListadoServicios } from "./components/listado-servicios";
import { useOnboarding } from "./hooks/use-onboarding";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { OnboardingStatus } from "@prisma/client";

export default function DashboardPage() {
  const { isLoading: isLoadingOnboarding } = useOnboarding();
  const [isLoading, setIsLoading] = useState(true);
  const [servicios, setServicios] = useState([]);
  const [solicitudes, setSolicitudes] = useState([]);
  const [stats, setStats] = useState({
    pendingSolicitudes: 0,
    aprovedSolicitudes: 0,
    inProgressSolicitudes: 0,
    completedSolicitudes: 0,
    regectedSolicitudes: 0
  });
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Obtener las solicitudes
        const response = await fetch('/api/solicitudes/count');
        if (response.ok) {
          const data = await response.json();
          setStats({
            pendingSolicitudes: data.pendingSolicitudes?.length || 0,
            aprovedSolicitudes: data.aprovedSolicitudes?.length || 0,
            inProgressSolicitudes: data.inProgressSolicitudes?.length || 0,
            completedSolicitudes: data.completedSolicitudes?.length || 0,
            regectedSolicitudes: data.regectedSolicitudes?.length || 0
          });
        }

        // Obtener las solicitudes
        const solicitudesResponse = await fetch('/api/solicitudes');
        if (solicitudesResponse.ok) {
          const solicitudesData = await solicitudesResponse.json();
          setSolicitudes(solicitudesData || []);
        }

        // Obtener los servicios
        const serviciosResponse = await fetch('/api/servicios');
        if (serviciosResponse.ok) {
          const serviciosData = await serviciosResponse.json();
          setServicios(serviciosData || []);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading || isLoadingOnboarding) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-lg">Cargando...</p>
      </div>
    );
  }

  return (
    <MotionWrapper>
      <div className="h-full w-full p-8">
        <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoCard
            label="Total de solicitudes"
            numberOfItems={stats.completedSolicitudes + stats.pendingSolicitudes + stats.aprovedSolicitudes + stats.inProgressSolicitudes + stats.regectedSolicitudes}
            type={"none"}
          />
          <InfoCard
            label="Solicitudes rechazadas"
            numberOfItems={stats.regectedSolicitudes}
            type="rejected"
          />          
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <InfoCard
            label="Solicitudes pendientes"
            numberOfItems={stats.pendingSolicitudes}
            type="pending"
          />
          <InfoCard
            label="Solicitudes aprobadas"
            numberOfItems={stats.aprovedSolicitudes}
            type="approved"
          />
          <InfoCard
            label="Solicitudes en proceso"
            numberOfItems={stats.inProgressSolicitudes}
            type="inProcess"
          />          
          <InfoCard
            label="Solicitudes finalizadas"
            numberOfItems={stats.completedSolicitudes}
            type="completed"
          />
        </div>

        <div className="w-full">
          <Card className="w-full border-2">
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle className="mb-2">Documentos solicitados</CardTitle>
                  <CardDescription>
                    Gestiona los documentos legales solicitados por ti o tus familiares
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <FileText className="h-4 w-4 mr-2" />
                    Exportar
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ListadoServicios servicios={servicios} solicitudes={solicitudes} />
            </CardContent>
          </Card>
        </div>
      </div>
    </MotionWrapper>
  );
}
