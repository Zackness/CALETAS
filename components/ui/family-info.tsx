import { Users } from "lucide-react";

export const FamilyInfo = () => {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mt-4">
      <div className="flex items-start gap-2">
        <Users className="h-5 w-5 text-blue-500 mt-0.5" />
        <div>
          <h4 className="font-medium text-blue-700 mb-1">¿Sabías que puedes registrar familiares?</h4>
          <p className="text-sm text-blue-800">
            Registra a tus familiares de forma gratuita y comparte los beneficios de solicitar documentos sin necesidad de costos extras o cuentas adicionales. 
            <a 
              href="/ajustes/familiares" 
              className="ml-1 font-medium underline hover:text-blue-900"
            >
              Agregar familiar
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};