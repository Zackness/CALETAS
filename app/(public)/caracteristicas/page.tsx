import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BookOpen, 
  GraduationCap, 
  Users, 
  Brain, 
  Target, 
  BarChart3, 
  FileText, 
  Share2, 
  Shield, 
  Zap,
  CheckCircle,
  TrendingUp,
  Calendar,
  MessageSquare,
  Download,
  Heart,
  Search,
  Bell,
  Lightbulb,
  ArrowRight,
  Sparkles,
  PenLine,
} from "lucide-react";
import Link from "next/link";
import { PublicPageShell } from "@/app/(public)/components/PublicPageShell";
import { PublicPageHero } from "@/app/(public)/components/PublicPageHero";
import { PublicSectionHeader } from "@/app/(public)/components/PublicSectionHeader";

export default function CaracteristicasPage() {
  return (
    <PublicPageShell>
      <PublicPageHero
        title="CARACTERÍSTICAS DE CALETAS"
        description="Descubre todas las herramientas y funcionalidades que hacen de Caletas la plataforma académica colaborativa más completa para estudiantes de universidades, colegios, liceos, institutos y otras instituciones educativas."
      />

      <div className="chalk-container min-w-0 pb-14 sm:pb-16 md:pb-20">
        {/* Sistema Académico */}
        <section className="mb-20">
          <PublicSectionHeader
            icon={GraduationCap}
            title="Sistema académico integral"
            description="Gestiona tu progreso académico de manera inteligente y eficiente"
          />

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="chalk-card">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[color-mix(in_oklab,var(--caleta-accent)_10%,transparent)] rounded-lg">
                    <BarChart3 className="h-6 w-6 text-[var(--caleta-accent)]" />
                  </div>
                  <CardTitle className="text-white">Panel de Control</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-white/70 mb-4">
                  Dashboard personalizado con estadísticas de progreso, materias cursadas y rendimiento académico.
                </CardDescription>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-white/60">
                    <CheckCircle className="h-4 w-4 text-[var(--caleta-accent)]" />
                    <span>Progreso visual por semestre</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/60">
                    <CheckCircle className="h-4 w-4 text-[var(--caleta-accent)]" />
                    <span>Estadísticas de rendimiento</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/60">
                    <CheckCircle className="h-4 w-4 text-[var(--caleta-accent)]" />
                    <span>Resumen de materias actuales</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="chalk-card">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[color-mix(in_oklab,var(--caleta-accent)_10%,transparent)] rounded-lg">
                    <Target className="h-6 w-6 text-[var(--caleta-accent)]" />
                  </div>
                  <CardTitle className="text-white">Metas Académicas</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-white/70 mb-4">
                  Establece y gestiona objetivos académicos personalizados con seguimiento automático.
                </CardDescription>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-white/60">
                    <CheckCircle className="h-4 w-4 text-[var(--caleta-accent)]" />
                    <span>Metas por GPA, materias o créditos</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/60">
                    <CheckCircle className="h-4 w-4 text-[var(--caleta-accent)]" />
                    <span>Seguimiento automático de progreso</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/60">
                    <CheckCircle className="h-4 w-4 text-[var(--caleta-accent)]" />
                    <span>Notificaciones de logros</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="chalk-card">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[color-mix(in_oklab,var(--caleta-accent)_10%,transparent)] rounded-lg">
                    <BookOpen className="h-6 w-6 text-[var(--caleta-accent)]" />
                  </div>
                  <CardTitle className="text-white">Historial Académico</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-white/70 mb-4">
                  Registra y gestiona tu historial completo de materias cursadas con notas y estados.
                </CardDescription>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-white/60">
                    <CheckCircle className="h-4 w-4 text-[var(--caleta-accent)]" />
                    <span>Registro de materias aprobadas</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/60">
                    <CheckCircle className="h-4 w-4 text-[var(--caleta-accent)]" />
                    <span>Gestión de estados (cursando, retirada)</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/60">
                    <CheckCircle className="h-4 w-4 text-[var(--caleta-accent)]" />
                    <span>Validación automática de prerrequisitos</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="chalk-card">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[color-mix(in_oklab,var(--caleta-accent)_10%,transparent)] rounded-lg">
                    <Lightbulb className="h-6 w-6 text-[var(--caleta-accent)]" />
                  </div>
                  <CardTitle className="text-white">Recomendaciones</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-white/70 mb-4">
                  Recibe sugerencias inteligentes de materias para el próximo semestre.
                </CardDescription>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-white/60">
                    <CheckCircle className="h-4 w-4 text-[var(--caleta-accent)]" />
                    <span>Análisis de prerrequisitos</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/60">
                    <CheckCircle className="h-4 w-4 text-[var(--caleta-accent)]" />
                    <span>Sugerencias optimizadas</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/60">
                    <CheckCircle className="h-4 w-4 text-[var(--caleta-accent)]" />
                    <span>Planificación semestral</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="chalk-card">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[color-mix(in_oklab,var(--caleta-accent)_10%,transparent)] rounded-lg">
                    <TrendingUp className="h-6 w-6 text-[var(--caleta-accent)]" />
                  </div>
                  <CardTitle className="text-white">Estadísticas Avanzadas</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-white/70 mb-4">
                  Visualiza tu progreso académico con gráficos interactivos y análisis detallados.
                </CardDescription>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-white/60">
                    <CheckCircle className="h-4 w-4 text-[var(--caleta-accent)]" />
                    <span>Gráficos de rendimiento</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/60">
                    <CheckCircle className="h-4 w-4 text-[var(--caleta-accent)]" />
                    <span>Comparación con otros estudiantes</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/60">
                    <CheckCircle className="h-4 w-4 text-[var(--caleta-accent)]" />
                    <span>Proyecciones académicas</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="chalk-card">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[color-mix(in_oklab,var(--caleta-accent)_10%,transparent)] rounded-lg">
                    <Bell className="h-6 w-6 text-[var(--caleta-accent)]" />
                  </div>
                  <CardTitle className="text-white">Notificaciones</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-white/70 mb-4">
                  Sistema de alertas inteligentes para mantenerte al día con tu progreso académico.
                </CardDescription>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-white/60">
                    <CheckCircle className="h-4 w-4 text-[var(--caleta-accent)]" />
                    <span>Recordatorios de metas</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/60">
                    <CheckCircle className="h-4 w-4 text-[var(--caleta-accent)]" />
                    <span>Alertas de materias próximas a vencer</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/60">
                    <CheckCircle className="h-4 w-4 text-[var(--caleta-accent)]" />
                    <span>Notificaciones de logros</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Plataforma Colaborativa */}
        <section className="mb-20">
          <PublicSectionHeader
            icon={Share2}
            title="Plataforma colaborativa"
            description="Comparte y descubre recursos académicos con la comunidad estudiantil"
          />

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="chalk-card">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[color-mix(in_oklab,var(--caleta-accent)_10%,transparent)] rounded-lg">
                    <FileText className="h-6 w-6 text-[var(--caleta-accent)]" />
                  </div>
                  <CardTitle className="text-white">Subir Caletas</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-white/70 mb-4">
                  Comparte tus mejores recursos académicos con la comunidad estudiantil.
                </CardDescription>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-white/60">
                    <CheckCircle className="h-4 w-4 text-[var(--caleta-accent)]" />
                    <span>Subida de PDFs e imágenes</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/60">
                    <CheckCircle className="h-4 w-4 text-[var(--caleta-accent)]" />
                    <span>Moderación automática con IA</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/60">
                    <CheckCircle className="h-4 w-4 text-[var(--caleta-accent)]" />
                    <span>Organización por materias</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="chalk-card">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[color-mix(in_oklab,var(--caleta-accent)_10%,transparent)] rounded-lg">
                    <Search className="h-6 w-6 text-[var(--caleta-accent)]" />
                  </div>
                  <CardTitle className="text-white">Descubrir Recursos</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-white/70 mb-4">
                  Encuentra recursos académicos relevantes para tus materias actuales.
                </CardDescription>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-white/60">
                    <CheckCircle className="h-4 w-4 text-[var(--caleta-accent)]" />
                    <span>Búsqueda avanzada por materias</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/60">
                    <CheckCircle className="h-4 w-4 text-[var(--caleta-accent)]" />
                    <span>Filtros por tipo de contenido</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/60">
                    <CheckCircle className="h-4 w-4 text-[var(--caleta-accent)]" />
                    <span>Recursos populares y destacados</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="chalk-card">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[color-mix(in_oklab,var(--caleta-accent)_10%,transparent)] rounded-lg">
                    <Heart className="h-6 w-6 text-[var(--caleta-accent)]" />
                  </div>
                  <CardTitle className="text-white">Favoritos</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-white/70 mb-4">
                  Guarda y organiza tus recursos favoritos para acceso rápido.
                </CardDescription>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-white/60">
                    <CheckCircle className="h-4 w-4 text-[var(--caleta-accent)]" />
                    <span>Marcar recursos como favoritos</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/60">
                    <CheckCircle className="h-4 w-4 text-[var(--caleta-accent)]" />
                    <span>Organización personalizada</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/60">
                    <CheckCircle className="h-4 w-4 text-[var(--caleta-accent)]" />
                    <span>Acceso rápido desde dashboard</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="chalk-card">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[color-mix(in_oklab,var(--caleta-accent)_10%,transparent)] rounded-lg">
                    <MessageSquare className="h-6 w-6 text-[var(--caleta-accent)]" />
                  </div>
                  <CardTitle className="text-white">Comentarios</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-white/70 mb-4">
                  Comenta en cada caleta desde la web y conversa con otros estudiantes sobre el material.
                </CardDescription>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-white/60">
                    <CheckCircle className="h-4 w-4 text-[var(--caleta-accent)]" />
                    <span>Comentarios en la ficha de cada caleta</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/60">
                    <CheckCircle className="h-4 w-4 text-[var(--caleta-accent)]" />
                    <span>Notificaciones al autor cuando comentan</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/60">
                    <CheckCircle className="h-4 w-4 text-[var(--caleta-accent)]" />
                    <span>Comunidad colaborativa en torno a los apuntes</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="chalk-card">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[color-mix(in_oklab,var(--caleta-accent)_10%,transparent)] rounded-lg">
                    <Download className="h-6 w-6 text-[var(--caleta-accent)]" />
                  </div>
                  <CardTitle className="text-white">Descargas en la app</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-white/70 mb-4">
                  En la web consultas las caletas en modo seguro. Para guardar archivos offline, usa la App de
                  CALETA (antes Zeno Notes).
                </CardDescription>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-white/60">
                    <CheckCircle className="h-4 w-4 text-[var(--caleta-accent)]" />
                    <span>Descarga de caletas solo desde la app móvil</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/60">
                    <CheckCircle className="h-4 w-4 text-[var(--caleta-accent)]" />
                    <span>Contador de descargas visible en la plataforma web</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/60">
                    <CheckCircle className="h-4 w-4 text-[var(--caleta-accent)]" />
                    <span>Misma cuenta CALETAS en web y app</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="chalk-card">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[color-mix(in_oklab,var(--caleta-accent)_10%,transparent)] rounded-lg">
                    <Shield className="h-6 w-6 text-[var(--caleta-accent)]" />
                  </div>
                  <CardTitle className="text-white">Moderación IA</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-white/70 mb-4">
                  Sistema de moderación automática para mantener la calidad del contenido.
                </CardDescription>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-white/60">
                    <CheckCircle className="h-4 w-4 text-[var(--caleta-accent)]" />
                    <span>Análisis automático de contenido</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/60">
                    <CheckCircle className="h-4 w-4 text-[var(--caleta-accent)]" />
                    <span>Filtrado de contenido inapropiado</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/60">
                    <CheckCircle className="h-4 w-4 text-[var(--caleta-accent)]" />
                    <span>Comunidad académica segura</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Herramientas de IA */}
        <section className="mb-20">
          <PublicSectionHeader
            icon={Brain}
            title="Herramientas de inteligencia artificial"
            description="Chat con GPT, Claude y Gemini, además de fichas, resúmenes y cuestionarios para estudiar mejor"
          />

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="chalk-card chalk-card-featured">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[color-mix(in_oklab,var(--caleta-accent)_10%,transparent)] rounded-lg">
                    <Sparkles className="h-6 w-6 text-[var(--caleta-accent)]" />
                  </div>
                  <CardTitle className="text-white">Chat de IA</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-white/70 mb-4">
                  Conversa con las IAs más conocidas del mercado desde CALETAS: elige modelo, adjunta tus caletas y
                  mantén el historial de cada chat.
                </CardDescription>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-white/60">
                    <CheckCircle className="h-4 w-4 text-[var(--caleta-accent)]" />
                    <span>GPT-5, Claude y Gemini disponibles</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/60">
                    <CheckCircle className="h-4 w-4 text-[var(--caleta-accent)]" />
                    <span>Modo automático que elige el mejor modelo según tu pregunta</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/60">
                    <CheckCircle className="h-4 w-4 text-[var(--caleta-accent)]" />
                    <span>Contexto con tus caletas y conversaciones guardadas</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="chalk-card">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[color-mix(in_oklab,var(--caleta-accent)_10%,transparent)] rounded-lg">
                    <FileText className="h-6 w-6 text-[var(--caleta-accent)]" />
                  </div>
                  <CardTitle className="text-white">Fichas de Estudio</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-white/70 mb-4">
                  Genera fichas de estudio automáticamente basadas en tus recursos favoritos.
                </CardDescription>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-white/60">
                    <CheckCircle className="h-4 w-4 text-[var(--caleta-accent)]" />
                    <span>Generación automática de flashcards</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/60">
                    <CheckCircle className="h-4 w-4 text-[var(--caleta-accent)]" />
                    <span>Basado en tus caletas favoritas</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/60">
                    <CheckCircle className="h-4 w-4 text-[var(--caleta-accent)]" />
                    <span>Personalización por materia</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="chalk-card">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[color-mix(in_oklab,var(--caleta-accent)_10%,transparent)] rounded-lg">
                    <BookOpen className="h-6 w-6 text-[var(--caleta-accent)]" />
                  </div>
                  <CardTitle className="text-white">Resúmenes de PDF</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-white/70 mb-4">
                  Obtén resúmenes automáticos de documentos PDF para estudio rápido.
                </CardDescription>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-white/60">
                    <CheckCircle className="h-4 w-4 text-[var(--caleta-accent)]" />
                    <span>Análisis completo de documentos</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/60">
                    <CheckCircle className="h-4 w-4 text-[var(--caleta-accent)]" />
                    <span>Extracción de puntos clave</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/60">
                    <CheckCircle className="h-4 w-4 text-[var(--caleta-accent)]" />
                    <span>Resúmenes estructurados</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="chalk-card">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[color-mix(in_oklab,var(--caleta-accent)_10%,transparent)] rounded-lg">
                    <Target className="h-6 w-6 text-[var(--caleta-accent)]" />
                  </div>
                  <CardTitle className="text-white">Cuestionarios</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-white/70 mb-4">
                  Crea cuestionarios personalizados para evaluar tu conocimiento.
                </CardDescription>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-white/60">
                    <CheckCircle className="h-4 w-4 text-[var(--caleta-accent)]" />
                    <span>Generación automática de preguntas</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/60">
                    <CheckCircle className="h-4 w-4 text-[var(--caleta-accent)]" />
                    <span>Diferentes tipos de preguntas</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/60">
                    <CheckCircle className="h-4 w-4 text-[var(--caleta-accent)]" />
                    <span>Guardado opcional de cuestionarios</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Características Técnicas */}
        <section className="mb-20">
          <PublicSectionHeader
            icon={Zap}
            title="Características técnicas"
            description="Tecnología de vanguardia para una experiencia excepcional"
          />

          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <Card className="chalk-card">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Shield className="h-5 w-5 text-[var(--caleta-accent)]" />
                    Seguridad y Privacidad
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-white/70">
                    <CheckCircle className="h-4 w-4 text-[var(--caleta-accent)]" />
                    <span>Autenticación segura con Better Auth</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/70">
                    <CheckCircle className="h-4 w-4 text-[var(--caleta-accent)]" />
                    <span>Protección de rutas y datos</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/70">
                    <CheckCircle className="h-4 w-4 text-[var(--caleta-accent)]" />
                    <span>Almacenamiento seguro en la nube</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/70">
                    <CheckCircle className="h-4 w-4 text-[var(--caleta-accent)]" />
                    <span>Cumplimiento de estándares de privacidad</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="chalk-card">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-[var(--caleta-accent)]" />
                    Rendimiento
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-white/70">
                    <CheckCircle className="h-4 w-4 text-[var(--caleta-accent)]" />
                    <span>Optimización con Next.js 15</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/70">
                    <CheckCircle className="h-4 w-4 text-[var(--caleta-accent)]" />
                    <span>Base de datos PostgreSQL (Neon)</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/70">
                    <CheckCircle className="h-4 w-4 text-[var(--caleta-accent)]" />
                    <span>Carga rápida de archivos</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/70">
                    <CheckCircle className="h-4 w-4 text-[var(--caleta-accent)]" />
                    <span>Interfaz responsive y fluida</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="chalk-card">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Users className="h-5 w-5 text-[var(--caleta-accent)]" />
                    Experiencia de Usuario
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-white/70">
                    <CheckCircle className="h-4 w-4 text-[var(--caleta-accent)]" />
                    <span>Interfaz moderna y intuitiva</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/70">
                    <CheckCircle className="h-4 w-4 text-[var(--caleta-accent)]" />
                    <span>Diseño responsive para todos los dispositivos</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/70">
                    <CheckCircle className="h-4 w-4 text-[var(--caleta-accent)]" />
                    <span>Navegación fluida y accesible</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/70">
                    <CheckCircle className="h-4 w-4 text-[var(--caleta-accent)]" />
                    <span>Feedback visual en tiempo real</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="chalk-card">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-[var(--caleta-accent)]" />
                    Integración y Compatibilidad
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-white/70">
                    <CheckCircle className="h-4 w-4 text-[var(--caleta-accent)]" />
                    <span>Compatible con múltiples navegadores</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/70">
                    <CheckCircle className="h-4 w-4 text-[var(--caleta-accent)]" />
                    <span>Funciona en dispositivos móviles</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/70">
                    <CheckCircle className="h-4 w-4 text-[var(--caleta-accent)]" />
                    <span>IA con Vercel AI Gateway (múltiples modelos)</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/70">
                    <CheckCircle className="h-4 w-4 text-[var(--caleta-accent)]" />
                    <span>API RESTful para futuras integraciones</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Final */}
        <section className="pb-6 pt-2">
          <div className="chalk-card chalk-card-featured relative mx-auto max-w-3xl overflow-hidden px-6 py-10 text-center sm:px-10 sm:py-14 md:px-14">
            <span className="chalk-section-label mx-auto justify-center">
              <PenLine className="h-4 w-4" />
              Tu próximo paso
            </span>

            <h2 className="chalk-title mx-auto mt-5 max-w-2xl font-special text-balance text-[1.55rem] leading-[1.12] sm:text-[2rem] md:text-[2.35rem]">
              ¿LISTO PARA{" "}
              <span className="text-[var(--caleta-accent)]">CALETEAR</span>?
            </h2>

            <p className="mx-auto mt-5 max-w-xl text-base font-semibold leading-relaxed text-white/78 sm:text-lg">
              Crea tu cuenta, accede a apuntes de tu institución y usa el chat de IA, fichas y
              cuestionarios desde un solo lugar.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/register" className="chalk-hero-btn chalk-hero-btn-secondary sm:min-w-[260px]">
                <span>Crear cuenta gratis</span>
                <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
              </Link>
              <Link href="/" className="chalk-hero-btn chalk-hero-btn-primary sm:min-w-[240px]">
                <span>Volver al inicio</span>
                <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
              </Link>
            </div>

            <p className="mx-auto mt-6 max-w-lg text-center text-sm text-white/55">
              Costo simbólico • Tarifas acordadas con instituciones educativas • Sin compromisos
            </p>
          </div>
        </section>
      </div>
    </PublicPageShell>
  );
} 