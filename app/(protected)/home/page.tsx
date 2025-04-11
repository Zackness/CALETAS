import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FileText,
} from "lucide-react";
import { InfoCard } from "./components/info-card";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { MotionWrapper } from "./components/wrapped.";
import { getSolicitudWithCount } from "./hooks/get-solicitudes";
import { ListadoServicios } from "./components/listado-servicios";
import { Solicitud, User, Familiar, Documento, Detalle, Nota } from "@prisma/client";

type SolicitudWithRelations = Solicitud & {
  documento: Documento & {
    servicio: {
      id: string;
      nombre: string;
    };
  };
  usuario: User;
  familiar: Familiar | null;
  detalle: Detalle | null;
  nota: Nota | null;
};

export default async function DashboardPage() {
  
  const session = await auth();

  if (!session?.user?.id) {
    return redirect("/");
  }
  
  const { pendingSolicitudes, aprovedSolicitudes, inProgressSolicitudes, completedSolicitudes, regectedSolicitudes } = await getSolicitudWithCount(session.user.id);

  // Obtener los servicios desde la base de datos
  const servicios = await db.servicio.findMany({
    orderBy: {
      nombre: "asc",
    },
    include: {
      documentos: true, // Incluir los documentos relacionados con cada servicio
    },
  });

  // Obtener todas las solicitudes del usuario
  const solicitudes = await db.solicitud.findMany({
    where: {
      estado: {
        not: "FINALIZADA"
      }
    },
    include: {
      documento: {
        include: {
          servicio: true
        }
      },
      usuario: true,
      familiar: true,
      detalle: true,
      nota: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  }) as SolicitudWithRelations[];

  // Transformar las solicitudes para el formato esperado
  const transformedSolicitudes = solicitudes.map(solicitud => ({
    id: solicitud.id.toString(),
    estado: solicitud.estado,
    fecha: solicitud.createdAt.toISOString(),
    prioridad: "NORMAL",
    documento: {
      id: solicitud.documento.id,
      nombre: solicitud.documento.nombre,
      servicio: {
        id: solicitud.documento.servicio.id,
        nombre: solicitud.documento.servicio.nombre
      }
    },
    client: {
      id: solicitud.usuario.id,
      name: solicitud.usuario.name || "",
      email: solicitud.usuario.email || "",
      avatar: solicitud.usuario.image || "/default-avatar.png"
    },
    familiar: solicitud.familiar ? {
      id: solicitud.familiar.id,
      name: solicitud.familiar.nombre,
      email: solicitud.familiar.telefono || "",
      avatar: "/default-avatar.png"
    } : null,
    detalle: solicitud.detalle ? {
      Testigo1: solicitud.detalle.Testigo1 || undefined,
      Testigo2: solicitud.detalle.Testigo2 || undefined,
      Testigo3: solicitud.detalle.Testigo3 || undefined,
      Testigo4: solicitud.detalle.Testigo4 || undefined,
      generic_text: solicitud.detalle.generic_text || undefined,
      bienes_generico1: solicitud.detalle.bienes_generico1 || undefined,
      bienes_generico2: solicitud.detalle.bienes_generico2 || undefined,
      bienes_generico3: solicitud.detalle.bienes_generico3 || undefined,
      bienes_generico4: solicitud.detalle.bienes_generico4 || undefined,
      bienes_generico5: solicitud.detalle.bienes_generico5 || undefined,
      Acta_de_nacimiento: solicitud.detalle.Acta_de_nacimiento || undefined,
      Acta_de_matrimonio: solicitud.detalle.Acta_de_matrimonio || undefined,
      Acta_de_defuncion: solicitud.detalle.Acta_de_defuncion || undefined,
      Acta_de_divorcio: solicitud.detalle.Acta_de_divorcio || undefined
    } : null,
    nota: solicitud.nota ? {
      id: solicitud.nota.id,
      contenido: solicitud.nota.contenido,
      createdAt: solicitud.nota.createdAt.toISOString()
    } : null
  }));

  return (
    <MotionWrapper>
      <div className="h-full w-full p-8">
        <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoCard
            label="Total de solicitudes"
            numberOfItems={completedSolicitudes.length + pendingSolicitudes.length + aprovedSolicitudes.length + inProgressSolicitudes.length + regectedSolicitudes.length}
            type={"none"}
          />
          <InfoCard
            label="Solicitudes rechazadas"
            numberOfItems={regectedSolicitudes.length}
            type="rejected"
          />          
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <InfoCard
            label="Solicitudes pendientes"
            numberOfItems={pendingSolicitudes.length}
            type="pending"
          />
          <InfoCard
            label="Solicitudes aprobadas"
            numberOfItems={aprovedSolicitudes.length}
            type="approved"
          />
          <InfoCard
            label="Solicitudes en proceso"
            numberOfItems={inProgressSolicitudes.length}
            type="inProcess"
          />          
          <InfoCard
            label="Solicitudes finalizadas"
            numberOfItems={completedSolicitudes.length}
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
              <ListadoServicios servicios={servicios} solicitudes={transformedSolicitudes} />
            </CardContent>
          </Card>
        </div>
      </div>
    </MotionWrapper>
  );
}
