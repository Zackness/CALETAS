export const IA_LLM_MODE = {
  AUTO: "auto",
  MANUAL: "manual",
} as const;

export type IaLlmMode = (typeof IA_LLM_MODE)[keyof typeof IA_LLM_MODE];

export function parseIaLlmMode(raw: string | null | undefined): IaLlmMode {
  const s = (raw || "").trim().toLowerCase();
  if (s === IA_LLM_MODE.AUTO) return IA_LLM_MODE.AUTO;
  return IA_LLM_MODE.MANUAL;
}
