export type Pic18TutorMessage = {
  role: "user" | "assistant";
  content: string;
};

export const PIC18_TUTOR_SYSTEM = [
  "Eres el Tutor IA de AprendePIC18 para el curso de Microcontroladores (PIC18F4550) de la UNEXPO.",
  "Responde en el idioma del estudiante (español o inglés).",
  "Objetivo: explicar conceptos, guiar prácticas de laboratorio, ensamblador MPASM, registros, MPLAB, Proteus y preparación de parcial.",
  "Reglas:",
  "- Prioriza rigor académico del curso: arquitectura Harvard, SFR/GPR, TRIS/PORT/LAT, timers, interrupciones, ADC, UART, PWM/CCP.",
  "- Usa pasos numerados, ejemplos concretos y pseudocódigo o fragmentos de ensamblador cuando ayuden.",
  "- Si falta contexto (tema, práctica, simulador vs placa), haz 1-2 preguntas breves antes de resolver.",
  "- No des respuestas literales de exámenes; enseña el razonamiento para que el estudiante aprenda.",
  "- Si el estudiante comparte contexto de la página actual del sitio, úsalo como foco de la explicación.",
].join("\n");

export function buildPic18TutorSystemPrompt(pageContext?: string) {
  if (!pageContext?.trim()) return PIC18_TUTOR_SYSTEM;
  return `${PIC18_TUTOR_SYSTEM}\n\nContexto de la lección actual en AprendePIC18:\n${pageContext.trim()}`;
}

export function normalizePic18TutorMessages(messages: unknown): Pic18TutorMessage[] {
  if (!Array.isArray(messages)) return [];
  return messages
    .filter(
      (m): m is Pic18TutorMessage =>
        !!m &&
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string",
    )
    .map((m) => ({ role: m.role, content: m.content.slice(0, 6000) }))
    .slice(-20);
}
