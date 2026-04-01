"use client";

import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { settings } from "@/actions/settings";
import { Button } from "@/components/ui/button";
import { useTransition, useState, useEffect } from "react";
import { SettingsSchema } from "@/schemas";
import { Form, FormField, FormControl, FormItem, FormLabel, FormDescription, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { FormSucces } from "@/components/form-succes";
import { FormError } from "@/components/form-error";
import { UserRole } from "@prisma/client";
import { toast } from "react-hot-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Settings, User, Shield, Phone, MapPin, Eye, EyeOff, CreditCard } from "lucide-react";
import QRCode from "react-qr-code";
import { authClient } from "@/lib/auth-client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type ExtendedUser = {
    id: string;
    name?: string;
    apellido?: string | null;
    email?: string;
    role?: UserRole;
    isTwoFactorEnabled?: boolean;
    twoFactorPreferredMethod?: "TOTP" | "PASSKEY" | "EMAIL_OTP";
    twoFactorEmailFallbackEnabled?: boolean;
    telefono?: string | null;
    ciudadDeResidencia?: string | null;
};

type PasskeyItem = {
  id: string;
  name?: string | null;
  createdAt?: string | null;
  deviceType?: string;
};

type ProfileResponse = {
  user: ExtendedUser;
  isOAuth: boolean;
  hasCredentialAccount: boolean;
};

type SubscriptionStatusResponse = {
  isActive: boolean;
  subscription: null | {
    subscriptionType: null | {
      id: string;
      name: string;
      price: number;
      period: string;
    };
    currentPeriodEnd: string;
  };
};

export default function Ajustes() {
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [subStatus, setSubStatus] = useState<SubscriptionStatusResponse | null>(null);
  const [subLoading, setSubLoading] = useState(true);

  const [error, setError] = useState<string | undefined>();
  const [succes, setSucces] = useState<string | undefined>();
  const [hasChanges, setHasChanges] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isPending, startTransition] = useTransition();
  const [twoFaBusy, setTwoFaBusy] = useState(false);
  const [twoFaPassword, setTwoFaPassword] = useState("");
  const [twoFaCode, setTwoFaCode] = useState("");
  const [twoFaTotpUri, setTwoFaTotpUri] = useState<string | null>(null);
  const [twoFaBackupCodes, setTwoFaBackupCodes] = useState<string[] | null>(null);
  const [twoFaStep, setTwoFaStep] = useState<"idle" | "setup" | "verify">(
    "idle",
  );
  const [twoFaDialogOpen, setTwoFaDialogOpen] = useState(false);
  const [twoFaPanelOpen, setTwoFaPanelOpen] = useState(false);
  const [twoFaDialogMode, setTwoFaDialogMode] = useState<"enable" | "disable">(
    "enable",
  );
  const [showTwoFaPassword, setShowTwoFaPassword] = useState(false);
  const [preferredTwoFaMethod, setPreferredTwoFaMethod] = useState<
    "TOTP" | "PASSKEY" | "EMAIL_OTP"
  >("TOTP");
  const [emailFallbackEnabled, setEmailFallbackEnabled] = useState(true);
  const [saving2FaPrefs, setSaving2FaPrefs] = useState(false);
  const [passkeys, setPasskeys] = useState<PasskeyItem[]>([]);
  const [passkeyBusy, setPasskeyBusy] = useState(false);

  const form = useForm<z.infer<typeof SettingsSchema>>({
      resolver: zodResolver(SettingsSchema),
      defaultValues: {
          name: undefined,
          apellido: undefined,
          telefono: undefined,
          ciudadDeResidencia: undefined,
          email: undefined,
          password: undefined,
          newPassword: undefined,
          isTwoFactorEnabled: undefined,
      }
  });

  const user = profile?.user;
  const isOAuth = profile?.isOAuth ?? false;
  const hasCredentialAccount = profile?.hasCredentialAccount ?? false;
  const twoFactorEnabled = !!user?.isTwoFactorEnabled;

  const refreshProfile = async () => {
    const res = await fetch("/api/user");
    if (!res.ok) throw new Error("No se pudo recargar tu perfil");
    const data = (await res.json()) as ProfileResponse;
    setProfile(data);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setProfileLoading(true);
        const res = await fetch("/api/user");
        if (!res.ok) {
          throw new Error("No se pudo cargar tu perfil");
        }
        const data = (await res.json()) as ProfileResponse;
        if (cancelled) return;
        setProfile(data);
      } catch (e) {
        if (cancelled) return;
        console.error(e);
        setError("No se pudo cargar tu información.");
      } finally {
        if (!cancelled) setProfileLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setSubLoading(true);
        const res = await fetch("/api/subscription/status");
        if (!res.ok) {
          if (!cancelled) setSubStatus(null);
          return;
        }
        const data = (await res.json()) as SubscriptionStatusResponse;
        if (!cancelled) setSubStatus(data);
      } catch {
        if (!cancelled) setSubStatus(null);
      } finally {
        if (!cancelled) setSubLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!user) return;
    form.reset({
      name: user.name ?? "",
      apellido: user.apellido ?? "",
      telefono: user.telefono ?? "",
      ciudadDeResidencia: user.ciudadDeResidencia ?? "",
      email: user.email ?? "",
      password: undefined,
      newPassword: undefined,
      isTwoFactorEnabled: undefined,
    });
    setHasChanges(false);
    setPreferredTwoFaMethod(user.twoFactorPreferredMethod || "TOTP");
    setEmailFallbackEnabled(user.twoFactorEmailFallbackEnabled ?? true);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        "caletas-2fa-preferred",
        user.twoFactorPreferredMethod || "TOTP",
      );
    }
  }, [user, form]);

  const loadPasskeys = async () => {
    try {
      const res: any = await authClient.passkey.listUserPasskeys();
      if (res?.error) return;
      setPasskeys(Array.isArray(res?.data) ? res.data : []);
    } catch {
      // silencioso
    }
  };

  useEffect(() => {
    if (!profile?.user?.isTwoFactorEnabled) return;
    void loadPasskeys();
  }, [profile?.user?.isTwoFactorEnabled]);

  const saveTwoFactorPreferences = async () => {
    setSaving2FaPrefs(true);
    try {
      const res = await fetch("/api/user/2fa/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          preferredMethod: preferredTwoFaMethod,
          emailFallbackEnabled,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "No se pudo guardar");
      toast.success("Preferencias de 2FA actualizadas");
      if (typeof window !== "undefined") {
        window.localStorage.setItem("caletas-2fa-preferred", preferredTwoFaMethod);
      }
      await refreshProfile();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error guardando 2FA");
    } finally {
      setSaving2FaPrefs(false);
    }
  };

  // Detectar cambios en el formulario
  useEffect(() => {
    const subscription = form.watch((value: any, { name, type }: any) => {
      if (type === "change") {
        setHasChanges(true);
      }
    });
    
    return () => subscription.unsubscribe();
  }, [form]);

  const onSubmit = (values: z.infer<typeof SettingsSchema>) => {
    setError(undefined);
    setSucces(undefined);
    setIsSubmitting(true);
    
    console.log("Enviando valores:", values);
    
    startTransition(() => {
      settings(values)
      .then(async (data) => {
        setIsSubmitting(false);
        
        if (data.error) {
          console.error("Error al guardar:", data.error);
          setError(data.error);
          toast.error(data.error);
        }

        if (data.succes) {
          console.log("Éxito al guardar:", data.succes);
          setSucces(data.succes);
          toast.success(data.succes);
          setHasChanges(false);
          
          // Recargar la página después de actualizar la sesión
          window.location.reload();
        }
      })
      .catch((error) => {
        setIsSubmitting(false);
        console.error("Error al guardar:", error);
        const errorMsg = "Algo ha salido mal!";
        setError(errorMsg);
        toast.error(errorMsg);
      });
    });
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-t from-mygreen to-mygreen-light px-4 py-8">
      <div className="w-full max-w-4xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-special text-[#40C9A9] mb-2">Ajustes de la Cuenta</h1>
          <p className="text-white/70 text-base md:text-lg">
            Gestiona tu información personal y configuración de seguridad
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Información Personal */}
            <Card className="bg-[#354B3A] border-white/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <User className="w-5 h-5 text-[#40C9A9]" />
                  Información Personal
                </CardTitle>
                <CardDescription className="text-white/70">
                  Datos básicos de tu perfil (solo lectura)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField 
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white/80">Nombre</FormLabel>
                        <FormControl>
                          <Input
                            className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-[#40C9A9] focus:ring-[#40C9A9] rounded-lg"
                            {...field}
                            disabled={true}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField 
                    control={form.control}
                    name="apellido"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white/80">Apellido</FormLabel>
                        <FormControl>
                          <Input
                            className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-[#40C9A9] focus:ring-[#40C9A9] rounded-lg"
                            {...field}
                            disabled={true}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField 
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white/80">Correo</FormLabel>
                        <FormControl>
                          <Input
                            className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-[#40C9A9] focus:ring-[#40C9A9] rounded-lg"
                            {...field}
                            disabled={isPending || isSubmitting || isOAuth}
                            type="email"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {profileLoading ? (
                  <div className="text-white/60 text-sm">Cargando tu información...</div>
                ) : null}
              </CardContent>
            </Card>



            {/* Información de Contacto */}
            <Card className="bg-[#354B3A] border-white/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Phone className="w-5 h-5 text-[#40C9A9]" />
                  Información de Contacto
                </CardTitle>
                <CardDescription className="text-white/70">
                  Datos de contacto y ubicación
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
            <FormField 
              control={form.control}
              name="telefono"
              render={({ field }) => (
                <FormItem>
                      <FormLabel className="text-white/80">Teléfono</FormLabel>
                  <FormControl>
                    <Input
                          className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-[#40C9A9] focus:ring-[#40C9A9] rounded-lg"
                      {...field}
                      disabled={isPending || isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField 
              control={form.control}
              name="ciudadDeResidencia"
              render={({ field }) => (
                <FormItem>
                      <FormLabel className="text-white/80">Ciudad de residencia</FormLabel>
                  <FormControl>
                    <Input
                          className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-[#40C9A9] focus:ring-[#40C9A9] rounded-lg"
                      {...field}
                      disabled={isPending || isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
              </CardContent>
            </Card>

            {/* Suscripción */}
            <Card className="bg-[#354B3A] border-white/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <CreditCard className="w-5 h-5 text-[#40C9A9]" />
                  Suscripción
                </CardTitle>
                <CardDescription className="text-white/70">
                  Estado de tu plan y acceso a herramientas de IA
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start justify-between gap-3 flex-col md:flex-row">
                  <div className="space-y-1">
                    <div className="text-white/80 text-sm">
                      {subLoading ? (
                        "Cargando estado..."
                      ) : subStatus?.isActive ? (
                        <>
                          Plan:{" "}
                          <span className="text-[#40C9A9] font-semibold">
                            {subStatus.subscription?.subscriptionType?.name || "Activo"}
                          </span>
                        </>
                      ) : (
                        "No tienes una suscripción activa."
                      )}
                    </div>
                    {subStatus?.subscription?.currentPeriodEnd ? (
                      <div className="text-white/60 text-xs">
                        Vence:{" "}
                        {new Date(subStatus.subscription.currentPeriodEnd).toLocaleString()}
                      </div>
                    ) : null}
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge
                      className={`border ${
                        subStatus?.isActive
                          ? "bg-green-500/10 text-green-300 border-green-500/20"
                          : "bg-white/10 text-white/80 border-white/10"
                      }`}
                    >
                      {subStatus?.isActive ? "Activa" : "Inactiva"}
                    </Badge>

                    <Button
                      asChild
                      type="button"
                      variant="outline"
                      className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                    >
                      <Link href="/suscripcion">Ver suscripción</Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Seguridad y Autenticación */}
              <Card className="bg-[#354B3A] border-white/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Shield className="w-5 h-5 text-[#40C9A9]" />
                    Seguridad y Autenticación
                  </CardTitle>
                  <CardDescription className="text-white/70">
                    Configura tu email, contraseña y autenticación en dos pasos
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!hasCredentialAccount ? (
                    <div className="rounded-lg p-4 bg-white/5 border border-white/10 text-white/70 text-sm">
                      Tu cuenta está conectada con un proveedor (Google/Twitch). Por ahora esta sección de contraseña
                      requiere que tengas una cuenta con contraseña (email + password).
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField 
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white/80">Contraseña actual</FormLabel>
                            <FormControl>
                              <Input
                                className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-[#40C9A9] focus:ring-[#40C9A9] rounded-lg"
                                {...field}
                                disabled={isPending || isSubmitting}
                                type="password"
                                placeholder="******"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField 
                        control={form.control}
                        name="newPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white/80">Nueva contraseña</FormLabel>
                            <FormControl>
                              <Input
                                className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-[#40C9A9] focus:ring-[#40C9A9] rounded-lg"
                                {...field}
                                disabled={isPending || isSubmitting}
                                type="password"
                                placeholder="******"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
              <div className="rounded-lg p-4 bg-white/5 border border-white/10">
                <div className="flex items-start justify-between gap-4 flex-col md:flex-row">
                  <div className="space-y-1">
                    <div className="text-white/80 font-semibold">
                      Autenticación en dos pasos (2FA)
                    </div>
                    <div className="text-white/60 text-sm">
                      Estado: {twoFactorEnabled ? "Activado" : "Desactivado"}. Gestiona métodos, passkeys y recuperación desde un panel rápido.
                    </div>
                  </div>
                  <Button
                    type="button"
                    className="bg-[#40C9A9] hover:bg-[#40C9A9]/80 text-white font-special"
                    onClick={() => setTwoFaPanelOpen(true)}
                  >
                    Abrir panel 2FA
                  </Button>
                </div>
              </div>

              <Dialog open={twoFaPanelOpen} onOpenChange={setTwoFaPanelOpen}>
                <DialogContent className="bg-[#203324] border-white/10 text-white max-w-3xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-white flex items-center gap-2">
                      <Shield className="w-5 h-5 text-[#40C9A9]" />
                      Panel 2FA
                    </DialogTitle>
                    <DialogDescription className="text-white/70">
                      Activación, método preferido, passkeys y backup codes en un solo lugar.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4">
                    <div className="rounded-lg p-4 bg-white/5 border border-white/10">
                      <div className="flex items-start justify-between gap-4 flex-col md:flex-row">
                        <div className="space-y-1">
                          <div className="text-white/80 font-semibold">Estado 2FA</div>
                          <div className="text-white/60 text-sm">
                            {twoFactorEnabled ? "Actualmente activado" : "Actualmente desactivado"}
                          </div>
                        </div>
                        <Button
                          type="button"
                          disabled={twoFaBusy || !hasCredentialAccount}
                          className={
                            twoFactorEnabled
                              ? "bg-red-500/80 hover:bg-red-500 text-white font-special"
                              : "bg-[#40C9A9] hover:bg-[#40C9A9]/80 text-white font-special"
                          }
                          onClick={() => {
                            setError(undefined);
                            setSucces(undefined);
                            setTwoFaPassword("");
                            setTwoFaCode("");
                            setTwoFaTotpUri(null);
                            setTwoFaBackupCodes(null);
                            setTwoFaStep("idle");
                            setTwoFaDialogMode(twoFactorEnabled ? "disable" : "enable");
                            setTwoFaDialogOpen(true);
                          }}
                        >
                          {twoFactorEnabled ? "Desactivar 2FA" : "Activar 2FA"}
                        </Button>
                      </div>
                    </div>

                    <div className="rounded-lg p-4 bg-white/5 border border-white/10 space-y-4">
                      <div className="flex items-center justify-between flex-wrap gap-3">
                        <div>
                          <div className="text-white/80 font-semibold">Método preferido de 2FA</div>
                          <div className="text-white/60 text-sm">
                            Elige tu factor principal y fallback por correo.
                          </div>
                        </div>
                        <Button
                          type="button"
                          className="bg-[#40C9A9] hover:bg-[#40C9A9]/80 text-white"
                          disabled={saving2FaPrefs}
                          onClick={() => void saveTwoFactorPreferences()}
                        >
                          Guardar preferencia
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        {[
                          { value: "TOTP", label: "App Authenticator (TOTP)" },
                          { value: "PASSKEY", label: "Passkey (WebAuthn)" },
                          { value: "EMAIL_OTP", label: "Correo (OTP)" },
                        ].map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() =>
                              setPreferredTwoFaMethod(opt.value as "TOTP" | "PASSKEY" | "EMAIL_OTP")
                            }
                            className={`text-left rounded-lg border px-3 py-2 text-sm transition-colors ${
                              preferredTwoFaMethod === opt.value
                                ? "bg-[#40C9A9]/20 border-[#40C9A9]/50 text-white"
                                : "bg-white/10 border-white/10 text-white/80 hover:bg-white/20"
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>

                      <label className="flex items-center gap-2 text-white/80 text-sm">
                        <input
                          type="checkbox"
                          checked={emailFallbackEnabled}
                          onChange={(e) => setEmailFallbackEnabled(e.target.checked)}
                          className="h-4 w-4 rounded border-white/20 bg-transparent"
                        />
                        Permitir fallback por correo si falla el método principal
                      </label>
                    </div>

                    <div className="rounded-lg p-4 bg-white/5 border border-white/10 space-y-3">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="text-white/80 font-semibold">Passkeys registradas</div>
                        <Button
                          type="button"
                          className="bg-[#40C9A9] hover:bg-[#40C9A9]/80 text-white"
                          disabled={passkeyBusy}
                          onClick={async () => {
                            setPasskeyBusy(true);
                            try {
                              const name = window.prompt("Nombre de la passkey", "Mi dispositivo");
                              const res: any = await authClient.passkey.addPasskey({
                                name: name?.trim() || "Mi dispositivo",
                              });
                              if (res?.error) throw new Error(res.error.message || "No se pudo registrar passkey");
                              toast.success("Passkey agregada");
                              await loadPasskeys();
                            } catch (e) {
                              toast.error(e instanceof Error ? e.message : "Error registrando passkey");
                            } finally {
                              setPasskeyBusy(false);
                            }
                          }}
                        >
                          Agregar passkey
                        </Button>
                      </div>

                      {passkeys.length === 0 ? (
                        <p className="text-white/60 text-sm">No tienes passkeys registradas.</p>
                      ) : (
                        <div className="space-y-2">
                          {passkeys.map((pk) => (
                            <div
                              key={pk.id}
                              className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2"
                            >
                              <div>
                                <div className="text-white text-sm">{pk.name || "Passkey sin nombre"}</div>
                                <div className="text-white/60 text-xs">
                                  {pk.deviceType || "dispositivo"} · {pk.createdAt ? new Date(pk.createdAt).toLocaleDateString() : "fecha desconocida"}
                                </div>
                              </div>
                              <Button
                                type="button"
                                variant="outline"
                                className="border-red-500/30 text-red-300 hover:bg-red-500/10"
                                onClick={async () => {
                                  try {
                                    setPasskeyBusy(true);
                                    const res: any = await authClient.passkey.deletePasskey({ id: pk.id });
                                    if (res?.error) throw new Error(res.error.message || "No se pudo eliminar");
                                    toast.success("Passkey eliminada");
                                    await loadPasskeys();
                                  } catch (e) {
                                    toast.error(e instanceof Error ? e.message : "Error eliminando passkey");
                                  } finally {
                                    setPasskeyBusy(false);
                                  }
                                }}
                              >
                                Eliminar
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="rounded-lg p-4 bg-white/5 border border-white/10 space-y-2">
                      <div className="text-white/80 font-semibold">Recuperación (backup codes)</div>
                      <p className="text-white/60 text-sm">
                        Regenera códigos de respaldo para recuperar tu cuenta si pierdes acceso al segundo factor.
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                        disabled={!twoFactorEnabled || twoFaBusy || !hasCredentialAccount}
                        onClick={async () => {
                          const password = window.prompt("Confirma tu contraseña para generar nuevos backup codes");
                          if (!password) return;
                          setTwoFaBusy(true);
                          try {
                            const res: any = await authClient.twoFactor.generateBackupCodes({ password });
                            if (res?.error) throw new Error(res.error.message || "No se pudieron generar");
                            const codes = Array.isArray(res?.data?.backupCodes) ? res.data.backupCodes : [];
                            setTwoFaBackupCodes(codes);
                            toast.success("Nuevos backup codes generados");
                          } catch (e) {
                            toast.error(e instanceof Error ? e.message : "Error generando backup codes");
                          } finally {
                            setTwoFaBusy(false);
                          }
                        }}
                      >
                        Regenerar backup codes
                      </Button>
                      {twoFaBackupCodes?.length ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 pt-1">
                          {twoFaBackupCodes.map((c) => (
                            <div key={c} className="font-mono text-xs text-white bg-white/10 border border-white/10 rounded-md px-2 py-1">
                              {c}
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog
                open={twoFaDialogOpen}
                onOpenChange={(open) => {
                  setTwoFaDialogOpen(open);
                  if (!open) {
                    setTwoFaPassword("");
                    setTwoFaCode("");
                    setTwoFaTotpUri(null);
                    setTwoFaBackupCodes(null);
                    setTwoFaStep("idle");
                    setTwoFaBusy(false);
                      setShowTwoFaPassword(false);
                  }
                }}
              >
                <DialogContent className="bg-[#203324] border-white/10 text-white">
                  <DialogHeader>
                    <DialogTitle className="text-white flex items-center gap-2">
                      <Shield className="w-5 h-5 text-[#40C9A9]" />
                      {twoFaDialogMode === "enable" ? "Activar 2FA" : "Desactivar 2FA"}
                    </DialogTitle>
                    <DialogDescription className="text-white/70">
                      {twoFaDialogMode === "enable"
                        ? "Primero confirma tu contraseña, luego escanea el QR y verifica el código."
                        : "Confirma tu contraseña para desactivar la autenticación en dos pasos."}
                    </DialogDescription>
                  </DialogHeader>

                  {twoFaDialogMode === "enable" ? (
                    <>
                      {twoFaStep !== "verify" ? (
                        <div className="space-y-3">
                          <div className="space-y-2">
                            <FormLabel className="text-white/80">Contraseña</FormLabel>
                            <div className="relative">
                              <Input
                                className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-[#40C9A9] focus:ring-[#40C9A9] rounded-lg pr-10"
                                value={twoFaPassword}
                                onChange={(e) => setTwoFaPassword(e.target.value)}
                                placeholder="Tu contraseña"
                                type={showTwoFaPassword ? "text" : "password"}
                                disabled={twoFaBusy}
                              />
                              <button
                                type="button"
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors"
                                onClick={() => setShowTwoFaPassword((v) => !v)}
                                aria-label={showTwoFaPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                                disabled={twoFaBusy}
                              >
                                {showTwoFaPassword ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <div className="bg-[#1C2D20] border border-white/10 rounded-lg p-4 min-w-0">
                              <div className="text-white font-semibold mb-2">Escanea el QR</div>
                              {twoFaTotpUri ? (
                                <div className="bg-[#E8F3ED] p-3 rounded-lg border border-white/10 w-full flex items-center justify-center overflow-hidden">
                                  <QRCode
                                    value={twoFaTotpUri}
                                    bgColor="#E8F3ED"
                                    fgColor="#0B1B10"
                                    size={220}
                                    style={{ width: "100%", maxWidth: 220, height: "auto" }}
                                  />
                                </div>
                              ) : (
                                <div className="text-white/70 text-sm">
                                  No se pudo generar el QR. Intenta de nuevo.
                                </div>
                              )}
                              <div className="text-white/70 text-xs mt-2">
                                Usa Google Authenticator, Authy u otra app TOTP.
                              </div>
                            </div>

                            <div className="bg-[#1C2D20] border border-white/10 rounded-lg p-4 space-y-3 min-w-0">
                              <div className="text-white font-semibold">Confirmar código</div>
                              <Input
                                className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-[#40C9A9] focus:ring-[#40C9A9] rounded-lg"
                                value={twoFaCode}
                                onChange={(e) => setTwoFaCode(e.target.value)}
                                placeholder="Código de 6 dígitos"
                                disabled={twoFaBusy}
                              />
                              <Button
                                type="button"
                                disabled={twoFaBusy || !twoFaCode}
                                className="w-full bg-[#40C9A9] hover:bg-[#40C9A9]/80 text-white"
                                onClick={async () => {
                                  setError(undefined);
                                  setSucces(undefined);
                                  setTwoFaBusy(true);
                                  try {
                                    const res: any = await authClient.twoFactor.verifyTotp({
                                      code: twoFaCode,
                                      trustDevice: true,
                                    });
                                    if (res?.error) {
                                      setError(res.error.message || "Código inválido");
                                      return;
                                    }
                                    toast.success("2FA activado correctamente");
                                    await refreshProfile();
                                    setTwoFaDialogOpen(false);
                                  } catch {
                                    setError("Código inválido");
                                  } finally {
                                    setTwoFaBusy(false);
                                  }
                                }}
                              >
                                Confirmar 2FA
                              </Button>
                            </div>
                          </div>

                          {twoFaBackupCodes?.length ? (
                            <div className="bg-[#1C2D20] border border-white/10 rounded-lg p-4">
                              <div className="text-white font-semibold mb-2">Códigos de respaldo</div>
                              <div className="text-white/70 text-sm mb-3">
                                Guárdalos en un lugar seguro. Sirven si pierdes acceso a la app.
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                {twoFaBackupCodes.map((c) => (
                                  <div
                                    key={c}
                                    className="font-mono text-xs text-white bg-white/10 border border-white/10 rounded-md px-2 py-1"
                                  >
                                    {c}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : null}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <FormLabel className="text-white/80">Contraseña</FormLabel>
                        <div className="relative">
                          <Input
                            className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-[#40C9A9] focus:ring-[#40C9A9] rounded-lg pr-10"
                            value={twoFaPassword}
                            onChange={(e) => setTwoFaPassword(e.target.value)}
                            placeholder="Tu contraseña"
                            type={showTwoFaPassword ? "text" : "password"}
                            disabled={twoFaBusy}
                          />
                          <button
                            type="button"
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors"
                            onClick={() => setShowTwoFaPassword((v) => !v)}
                            aria-label={showTwoFaPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                            disabled={twoFaBusy}
                          >
                            {showTwoFaPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  <DialogFooter className="gap-2 sm:gap-2">
                    {twoFaDialogMode === "enable" && twoFaStep === "verify" ? (
                      <Button
                        type="button"
                        variant="outline"
                        className="border-white/20 text-white hover:bg-white/10"
                        disabled={twoFaBusy}
                        onClick={() => {
                          setTwoFaStep("idle");
                          setTwoFaTotpUri(null);
                          setTwoFaBackupCodes(null);
                          setTwoFaCode("");
                        }}
                      >
                        Volver
                      </Button>
                    ) : null}

                    <Button
                      type="button"
                      variant="outline"
                      className="bg-[#354B3A] border-white/30 text-white hover:bg-[#3f5a45]"
                      disabled={twoFaBusy}
                      onClick={() => setTwoFaDialogOpen(false)}
                    >
                      Cerrar
                    </Button>

                    {twoFaDialogMode === "enable" ? (
                      twoFaStep !== "verify" ? (
                        <Button
                          type="button"
                          disabled={twoFaBusy || !twoFaPassword || !hasCredentialAccount}
                          className="bg-[#40C9A9] hover:bg-[#40C9A9]/80 text-white"
                          onClick={async () => {
                            setError(undefined);
                            setSucces(undefined);
                            setTwoFaBusy(true);
                            try {
                              const res: any = await authClient.twoFactor.enable({
                                password: twoFaPassword,
                              });
                              if (res?.error) {
                                setError(res.error.message || "No se pudo activar 2FA");
                                return;
                              }
                              const totpURI =
                                res?.data?.totpURI || res?.data?.totpUri || res?.data?.totpURI;
                              const backupCodes = res?.data?.backupCodes;
                              setTwoFaTotpUri(totpURI || null);
                              setTwoFaBackupCodes(Array.isArray(backupCodes) ? backupCodes : null);
                              setTwoFaStep("verify");
                            } catch {
                              setError("No se pudo activar 2FA");
                            } finally {
                              setTwoFaBusy(false);
                            }
                          }}
                        >
                          Continuar
                        </Button>
                      ) : null
                    ) : (
                      <Button
                        type="button"
                        disabled={twoFaBusy || !twoFaPassword || !hasCredentialAccount}
                        className="bg-red-500/90 hover:bg-red-500 text-white"
                        onClick={async () => {
                          setError(undefined);
                          setSucces(undefined);
                          setTwoFaBusy(true);
                          try {
                            const res: any = await authClient.twoFactor.disable({
                              password: twoFaPassword,
                            });
                            if (res?.error) {
                              setError(res.error.message || "No se pudo desactivar 2FA");
                              return;
                            }
                            toast.success("2FA desactivado");
                            await refreshProfile();
                            setTwoFaDialogOpen(false);
                          } catch {
                            setError("No se pudo desactivar 2FA");
                          } finally {
                            setTwoFaBusy(false);
                          }
                        }}
                      >
                        Desactivar
                      </Button>
                    )}
                  </DialogFooter>
                </DialogContent>
              </Dialog>
                </CardContent>
              </Card>

            {/* Mensajes de estado */}
          <FormError message={error}/>
          <FormSucces message={succes}/>

            {/* Botón de guardar */}
          <Button 
            disabled={isPending || isSubmitting || !hasChanges} 
            type="submit"
              className="w-full bg-[#40C9A9] hover:bg-[#40C9A9]/80 text-white font-bold text-lg py-3 rounded-xl shadow-lg transition-colors"
          >
            {isPending || isSubmitting ? (
              <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Guardando...
              </div>
              ) : "Guardar Ajustes"}
          </Button>
        </form>
      </Form>
      </div>
    </div>
  );
}