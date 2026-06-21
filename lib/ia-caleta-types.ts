export type CaletaChatListItem = {
  id: string;
  titulo: string;
  tipo: string;
  descripcion: string;
  tieneArchivo: boolean;
  materia: { codigo: string; nombre: string } | null;
  esPropio: boolean;
};
