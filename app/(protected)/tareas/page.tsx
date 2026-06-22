import { CaletaTasksBoard } from "./tasks-board";

export default function TareasPage() {
  return (
    <div className="flex h-[calc(100svh-8rem)] min-h-0 flex-col gap-4 md:h-[calc(100svh-6.5rem)]">
      <div className="shrink-0">
        <h1 className="font-special text-2xl text-white sm:text-3xl">Tareas y notas</h1>
        <p className="mt-1 text-sm text-white/70">
          Tablero personalizable: arrastra entre columnas, haz clic en una tarjeta para escribir dentro.
        </p>
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        <CaletaTasksBoard />
      </div>
    </div>
  );
}
