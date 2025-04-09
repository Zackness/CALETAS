import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FileText,
  FileSignature,
} from "lucide-react";
import { InfoCard } from "./components/info-card";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { MotionWrapper } from "./components/wrapped.";
import { getSolicitudWithCount } from "./hooks/get-solicitudes";
import { ListadoServicios } from "./components/listado-servicios";

export default async function DashboardPage() {
  
  const session = await auth();

  if (!session?.user?.id) {
    return redirect("/");
  }
  
  const { completedSolicitudes, pendingSolicitudes } = await getSolicitudWithCount(session.user.id);

  // Obtener los servicios desde la base de datos
  const servicios = await db.servicio.findMany({
    orderBy: {
      nombre: "asc",
    },
    include: {
      documentos: true, // Incluir los documentos relacionados con cada servicio
    },
  });

  return (

      <MotionWrapper>
<div className="flex flex-row justify-center md:grid-cols-3 gap-6 mb-8 mt-8 px-8">
          <InfoCard
            label="Total de solicitudes"
            numberOfItems={completedSolicitudes.length + pendingSolicitudes.length}
          />
          <InfoCard
            label="Solicitudes completadas"
            numberOfItems={completedSolicitudes.length}
          />
          <InfoCard
            label="Solicitudes pendientes"
            numberOfItems={pendingSolicitudes.length}
          />
        </div>

        <div className="mb-6 px-8">
          <Card className="w-full border-2">
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle>Solicitudes de documentos</CardTitle>
                  <CardDescription>
                    Gestiona las solicitudes de documentos legales de tus clientes
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <FileText className="h-4 w-4 mr-2" />
                    Exportar
                  </Button>
                  <Button size="sm">
                    <FileSignature className="h-4 w-4 mr-2" />
                    Nueva solicitud
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
            {/* Renderizar el componente ListadoServicios */}
            <ListadoServicios servicios={servicios} />
            </CardContent>
          </Card>
        </div>
      </MotionWrapper>

  );
}
