"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, ChevronsUpDown, Lock, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { ModelCostTier } from "@/lib/ia-model-access";
import { toast } from "sonner";

export type IaModelPickerRole = "chat" | "heavy" | "cronograma";

/** Valor interno cuando el modo es automático (no es un id de modelo). */
const IA_AUTO_INTERNAL = "__caletas_ia_auto__";
/** Valor en cmdk (incluye texto para búsqueda “automático”, “auto”, etc.). */
const IA_AUTO_CMDK_VALUE = `${IA_AUTO_INTERNAL} automático recomendado`;

type ModelAccessRow = {
  id: string;
  tier: ModelCostTier;
  inputUsdPer1M: number | null;
  canAffordWithWalletHold: boolean;
  hasActiveSubscription: boolean;
  selectable: boolean;
};

type PrefsResponse = {
  modes: Record<IaModelPickerRole, "auto" | "manual">;
  stored: Record<IaModelPickerRole, string | null>;
  resolved: Record<IaModelPickerRole, string>;
  choices: Record<IaModelPickerRole, string[]>;
  choiceAccess: Record<IaModelPickerRole, ModelAccessRow[]>;
  freeTier?: {
    active: boolean;
    tokensRemaining: number;
    tokensLimit: number;
    requestsRemaining: number;
    resetsAtLabel: string;
    message: string;
  };
  freeModelIds?: string[];
  gatewayConfigured?: boolean;
  useFreeDailyPicker?: boolean;
};

function resolveChoiceId(choices: string[], cmdkValue: string): string {
  const exact = choices.find((c) => c === cmdkValue);
  if (exact) return exact;
  const ci = choices.find((c) => c.toLowerCase() === cmdkValue.toLowerCase());
  return ci ?? cmdkValue;
}

function isAutoCmdkValue(v: string): boolean {
  return v.includes(IA_AUTO_INTERNAL);
}

function tierLabel(t: ModelAccessRow["tier"]) {
  if (t === "gratis") return "Gratis";
  if (t === "sin_precio") return "Sin tarifa listada";
  if (t === "economico") return "Económico";
  if (t === "medio") return "Coste medio";
  return "Coste alto";
}

function tierBadgeClass(t: ModelAccessRow["tier"]) {
  if (t === "gratis") return "border-sky-500/45 bg-sky-950/40 text-sky-100";
  if (t === "sin_precio") return "border-white/20 bg-white/5 text-white/70";
  if (t === "economico") return "border-emerald-500/50 bg-emerald-950/40 text-emerald-200";
  if (t === "medio") return "border-amber-500/40 bg-amber-950/30 text-amber-100";
  return "border-rose-500/40 bg-rose-950/35 text-rose-100";
}

function accessHint(row: ModelAccessRow, opts?: { useFreeDaily?: boolean }): string {
  if (!row.selectable) {
    return "Bloqueado: requiere suscripción activa o saldo en wallet para usar este modelo.";
  }
  if (row.tier === "gratis") {
    if (opts?.useFreeDaily) {
      return "Incluido en tu cupo gratuito diario (Gemini Flash, Llama, etc.).";
    }
    return "Tarifa de lista 0 USD/1M en el catálogo del AI Gateway.";
  }
  if (row.tier === "sin_precio") {
    return "El JSON público del Gateway no incluye tarifa input/output; la reserva de saldo usa una estimación genérica.";
  }
  if (row.canAffordWithWalletHold) return "Tu saldo cubre la reserva estimada.";
  if (row.hasActiveSubscription) return "Plan activo: el cargo real depende de tokens incluidos y del modelo.";
  return "Saldo bajo para la reserva estimada: recarga o revisa tu plan.";
}

export function IaModelPicker({
  role,
  label = "Modelo de IA",
  disabled,
  className,
  compact = false,
}: {
  role: IaModelPickerRole;
  label?: string;
  disabled?: boolean;
  className?: string;
  /** Toolbar compacto del chat (sin etiquetas largas). */
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [choices, setChoices] = useState<string[]>([]);
  const [choiceAccess, setChoiceAccess] = useState<ModelAccessRow[]>([]);
  /** `IA_AUTO_INTERNAL` = modo automático; si no, id de modelo (manual). */
  const [selection, setSelection] = useState<string>(IA_AUTO_INTERNAL);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [freeTierInfo, setFreeTierInfo] = useState<PrefsResponse["freeTier"] | null>(null);
  const [gatewayConfigured, setGatewayConfigured] = useState(true);
  const [useFreeDailyPicker, setUseFreeDailyPicker] = useState(false);
  const [freeModelIds, setFreeModelIds] = useState<string[]>([]);

  const modePatchKey = role === "chat" ? "chatMode" : role === "heavy" ? "heavyMode" : "cronogramaMode";

  const accessById = useMemo(() => {
    const m: Record<string, ModelAccessRow> = {};
    for (const r of choiceAccess) m[r.id] = r;
    return m;
  }, [choiceAccess]);

  const freeChoices = useMemo(
    () => choices.filter((id) => accessById[id]?.tier === "gratis" || freeModelIds.includes(id)),
    [choices, accessById, freeModelIds],
  );
  const paidChoices = useMemo(
    () => choices.filter((id) => !freeChoices.includes(id)),
    [choices, freeChoices],
  );
  const gpt5Choices = useMemo(
    () => paidChoices.filter((id) => id.startsWith("openai/gpt-5")),
    [paidChoices],
  );
  const claudeChoices = useMemo(
    () => paidChoices.filter((id) => id.startsWith("anthropic/claude")),
    [paidChoices],
  );
  const otherPaidChoices = useMemo(
    () => paidChoices.filter((id) => !gpt5Choices.includes(id) && !claudeChoices.includes(id)),
    [paidChoices, gpt5Choices, claudeChoices],
  );

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/ia/model-preferences");
      if (!res.ok) return;
      const data = (await res.json()) as PrefsResponse;
      const list = Array.isArray(data.choices?.[role]) ? data.choices[role] : [];
      setChoices(list);
      setChoiceAccess(Array.isArray(data.choiceAccess?.[role]) ? data.choiceAccess[role] : []);
      setFreeTierInfo(data.freeTier ?? null);
      setGatewayConfigured(data.gatewayConfigured !== false);
      setUseFreeDailyPicker(data.useFreeDailyPicker === true);
      setFreeModelIds(Array.isArray(data.freeModelIds) ? data.freeModelIds : []);

      const accessRows = Array.isArray(data.choiceAccess?.[role]) ? data.choiceAccess[role] : [];
      const selectableIds = new Set(
        accessRows.filter((r) => r.selectable !== false).map((r) => r.id),
      );

      if (data.modes?.[role] === "auto") {
        setSelection(IA_AUTO_INTERNAL);
      } else {
        const stored = data.stored?.[role];
        const resolved = typeof data.resolved?.[role] === "string" ? data.resolved[role] : "";
        const pick =
          (typeof stored === "string" && stored && selectableIds.has(stored) ? stored : null) ||
          (resolved && selectableIds.has(resolved) ? resolved : null) ||
          list.find((id) => selectableIds.has(id)) ||
          IA_AUTO_INTERNAL;
        setSelection(pick);
      }
    } catch {
      // silencioso
    } finally {
      setLoading(false);
    }
  }, [role]);

  useEffect(() => {
    void load();
  }, [load]);

  const patchJson = async (body: Record<string, unknown>) => {
    const res = await fetch("/api/ia/model-preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "No se pudo guardar");
    return data as { modes?: PrefsResponse["modes"]; resolved?: PrefsResponse["resolved"] };
  };

  const applyAuto = async () => {
    if (selection === IA_AUTO_INTERNAL) {
      setOpen(false);
      return;
    }
    const prev = selection;
    setSelection(IA_AUTO_INTERNAL);
    try {
      setSaving(true);
      await patchJson({ [modePatchKey]: "auto" });
      toast.success("Automático: el modelo se elige al enviar");
      await load();
    } catch (e) {
      setSelection(prev);
      toast.error(e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const applyModel = async (modelId: string) => {
    if (!modelId || modelId === IA_AUTO_INTERNAL) return;
    if (selection === modelId && selection !== IA_AUTO_INTERNAL) {
      setOpen(false);
      return;
    }
    const prev = selection;
    setSelection(modelId);
    try {
      setSaving(true);
      await patchJson({ [modePatchKey]: "manual", [role]: modelId });
      toast.success("Modelo fijado (manual)");
      await load();
    } catch (e) {
      setSelection(prev);
      toast.error(e instanceof Error ? e.message : "Error al guardar modelo");
    } finally {
      setSaving(false);
    }
  };

  const handleSelect = (raw: string) => {
    if (isAutoCmdkValue(raw)) {
      setOpen(false);
      void applyAuto();
      return;
    }
    const modelId = resolveChoiceId(choices, raw);
    const row = accessById[modelId];
    if (row && !row.selectable) {
      toast.error("Este modelo requiere suscripción o saldo en wallet.");
      return;
    }
    setOpen(false);
    void applyModel(modelId);
  };

  const autoLabel = role === "chat" ? "IA Pro" : "Automático";

  if (loading) {
    return (
      <div className={className}>
        {!compact ? <Label className="text-white/70 text-xs">{label}</Label> : null}
        <div
          className={cn(
            "rounded-md border border-white/10 bg-white/5 px-2 text-xs text-white/50 flex items-center",
            compact ? "h-8" : "mt-1 h-9",
          )}
        >
          Cargando…
        </div>
      </div>
    );
  }

  if (!choices.length) {
    return (
      <div className={className}>
        {!compact ? <Label className="text-white/70 text-xs">{label}</Label> : null}
        <p className={cn("text-xs text-white/55", !compact && "mt-1")}>
          No se pudo cargar el catálogo de modelos.
        </p>
      </div>
    );
  }

  const isAuto = selection === IA_AUTO_INTERNAL;

  const renderModelItem = (id: string) => {
    const row = accessById[id];
    const picked = !isAuto && selection === id;
    const locked = row ? !row.selectable : false;
    return (
      <CommandItem
        key={id}
        value={id}
        keywords={[id.replace(/\//g, " ")]}
        disabled={locked}
        onSelect={(v) => handleSelect(v)}
        className={cn(
          "flex-col items-start gap-1 py-2 aria-selected:bg-white/15",
          locked ? "cursor-not-allowed opacity-55" : "cursor-pointer",
        )}
      >
        <div className="flex w-full items-start gap-2">
          <Check
            className={cn(
              "mr-0.5 mt-0.5 h-3.5 w-3.5 shrink-0",
              picked ? "opacity-100 text-[var(--accent-hex)]" : "opacity-0",
            )}
          />
          <span className="font-mono text-[11px] leading-tight break-all">{id}</span>
          {locked ? (
            <Badge
              variant="outline"
              className="ml-auto shrink-0 border-white/25 bg-white/5 text-[10px] px-1.5 py-0 text-white/55"
            >
              <Lock className="mr-1 h-2.5 w-2.5" />
              Bloqueado
            </Badge>
          ) : row ? (
            <Badge
              variant="outline"
              className={cn("ml-auto shrink-0 text-[10px] px-1.5 py-0", tierBadgeClass(row.tier))}
            >
              {tierLabel(row.tier)}
            </Badge>
          ) : null}
        </div>
        {row ? (
          <p className="pl-6 text-[10px] leading-snug text-white/55">
            {accessHint(row, { useFreeDaily: useFreeDailyPicker })}
          </p>
        ) : null}
      </CommandItem>
    );
  };

  return (
    <div className={className}>
      {!compact ? (
        <>
          <Label className="text-white/70 text-xs">{label}</Label>
          <p className="mt-0.5 text-[10px] leading-snug text-white/50">
            {useFreeDailyPicker && freeTierInfo?.active ? (
              <>
                Cupo gratis: ~{freeTierInfo.tokensRemaining.toLocaleString("es-VE")} tokens · se renueva{" "}
                {freeTierInfo.resetsAtLabel}.
              </>
            ) : role === "chat" ? (
              <>
                <span className="text-white/70">IA Pro</span> elige el mejor modelo según tu mensaje (código,
                imágenes, razonamiento…).
              </>
            ) : (
              <>
                Elige <span className="text-white/70">Automático</span> o un modelo concreto (manual).
              </>
            )}
          </p>
          {!gatewayConfigured ? (
            <p className="mt-1 text-[10px] leading-snug text-amber-200/90">
              Añade <span className="font-mono">AI_GATEWAY_API_KEY</span> en el servidor para ejecutar GPT-5, Claude
              y el resto de modelos del Gateway.
            </p>
          ) : null}
        </>
      ) : null}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled || saving}
            className={cn(
              "justify-between border-white/15 bg-[#1C2D20] px-2 font-normal text-white hover:bg-white/10 hover:text-white",
              compact ? "h-8 w-auto min-w-[7rem] max-w-[11rem] text-xs" : "mt-1 h-9 w-full",
            )}
          >
            {isAuto ? (
              <span className="flex items-center gap-1.5 truncate text-left text-white">
                <Sparkles className="h-3.5 w-3.5 shrink-0 text-[var(--accent-hex)]" />
                {autoLabel}
              </span>
            ) : (
              <span className="truncate font-mono text-[11px] text-left">{selection}</span>
            )}
            <ChevronsUpDown className="ml-1 h-3.5 w-3.5 shrink-0 text-white/50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[min(100vw-1.5rem,30rem)] border-white/10 bg-[var(--mygreen)] p-0 text-white shadow-xl"
          align="start"
        >
          <Command
            className="rounded-md border-0"
            filter={(value, search) =>
              value.toLowerCase().includes(search.trim().toLowerCase()) ? 1 : 0
            }
          >
            <CommandInput placeholder={`Buscar ${autoLabel.toLowerCase()} o modelo…`} className="h-9 border-white/10" />
            <CommandList className="max-h-[min(360px,55vh)]">
              <CommandEmpty className="py-3 text-sm text-white/60">Sin coincidencias.</CommandEmpty>
              <CommandGroup
                heading="Modo"
                className="text-white/50 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wide"
              >
                <CommandItem
                  value={IA_AUTO_CMDK_VALUE}
                  keywords={["automático", "automatico", "auto", "ia pro", "pro", "recomendado", "inteligente"]}
                  onSelect={(v) => handleSelect(v)}
                  className="cursor-pointer flex-col items-start gap-0.5 py-2.5 aria-selected:bg-white/15"
                >
                  <div className="flex w-full items-center gap-2">
                    <Check
                      className={cn(
                        "h-3.5 w-3.5 shrink-0",
                        isAuto ? "opacity-100 text-[var(--accent-hex)]" : "opacity-0",
                      )}
                    />
                    <Sparkles className="h-3.5 w-3.5 shrink-0 text-[var(--accent-hex)]" />
                    <span className="text-sm font-medium text-white">{autoLabel}</span>
                  </div>
                  <p className="pl-7 text-[10px] leading-snug text-white/55">
                    {role === "chat"
                      ? useFreeDailyPicker
                        ? "Elige el mejor modelo gratis según tu mensaje (código, PDF, razonamiento…)."
                        : "Elige el mejor modelo según tu mensaje: código, archivos/imágenes, razonamiento o chat general."
                      : useFreeDailyPicker
                        ? "Elige el mejor modelo gratis según tu mensaje."
                        : "Según tu mensaje, saldo y plan (si aplica)."}
                  </p>
                </CommandItem>
              </CommandGroup>
              {freeChoices.length > 0 ? (
                <CommandGroup
                  heading={useFreeDailyPicker ? "Gratis (cupo diario)" : "Gratis en Gateway"}
                  className="text-white/50 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wide"
                >
                  {freeChoices.map((id) => renderModelItem(id))}
                </CommandGroup>
              ) : null}
              {gpt5Choices.length > 0 ? (
                <CommandGroup
                  heading="GPT-5 (OpenAI)"
                  className="text-white/50 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wide"
                >
                  {gpt5Choices.map((id) => renderModelItem(id))}
                </CommandGroup>
              ) : null}
              {claudeChoices.length > 0 ? (
                <CommandGroup
                  heading="Claude (Anthropic)"
                  className="text-white/50 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wide"
                >
                  {claudeChoices.map((id) => renderModelItem(id))}
                </CommandGroup>
              ) : null}
              {otherPaidChoices.length > 0 ? (
                <CommandGroup
                  heading={useFreeDailyPicker ? "Otros (suscripción o wallet)" : "Otros modelos"}
                  className="text-white/50 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wide"
                >
                  {otherPaidChoices.map((id) => renderModelItem(id))}
                </CommandGroup>
              ) : null}
              {freeChoices.length === 0 &&
              gpt5Choices.length === 0 &&
              claudeChoices.length === 0 &&
              otherPaidChoices.length === 0
                ? choices.map((id) => renderModelItem(id))
                : null}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
