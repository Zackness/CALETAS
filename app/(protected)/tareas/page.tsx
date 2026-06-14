import { CaletaTasksBoard } from "./tasks-board";

export default function TareasPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-special text-white">Tareas y notas</h1>
        <p className="mt-1 text-white/70">
          Tablero operativo tipo kanban. Misma dinamica de Flow, adaptada al estilo de Caleta y sin asignacion a otros usuarios.
        </p>
      </div>
      <CaletaTasksBoard />
    </div>
  );
}
