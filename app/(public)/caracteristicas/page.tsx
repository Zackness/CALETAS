import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  Star,
  TrendingUp,
  Calendar,
  MessageSquare,
  Download,
  Eye,
  Heart,
  Search,
  Filter,
  Bell,
  Award,
  Lightbulb,
  ArrowRight
} from "lucide-react";
import Link from "next/link";
import { Header } from "./components/Header";

export default function CaracteristicasPage() {
  return (
    <div className="min-h-screen bg-gradient-to-t from-mygreen to-mygreen-light">
      <Header />
      
      {/* Header */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-special text-white mb-6">
            Características de Caletas
          </h1>
          <p className="text-xl text-white/80 max-w-3xl mx-auto">
            Descubre todas las herramientas y funcionalidades que hacen de Caletas la plataforma académica colaborativa más completa para estudiantes universitarios.
          </p>
        </div>

        {/* Sistema Académico */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-3 mb-4">
              <GraduationCap className="h-8 w-8 text-[#40C9A9]" />
              <h2 className="text-3xl font-special text-white">Sistema Académico Integral</h2>
            </div>
            <p className="text-white/70 text-lg">
              Gestiona tu progreso académico de manera inteligente y eficiente
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="bg-[#354B3A] border-white/10 hover:border-[#40C9A9]/30 transition-all">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#40C9A9]/10 rounded-lg">
                    <BarChart3 className="h-6 w-6 text-[#40C9A9]" />
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
                    <CheckCircle className="h-4 w-4 text-[#40C9A9]" />
                    <span>Progreso visual por semestre</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/60">
                    <CheckCircle className="h-4 w-4 text-[#40C9A9]" />
                    <span>Estadísticas de rendimiento</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/60">
                    <CheckCircle className="h-4 w-4 text-[#40C9A9]" />
                    <span>Resumen de materias actuales</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#354B3A] border-white/10 hover:border-[#40C9A9]/30 transition-all">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#40C9A9]/10 rounded-lg">
                    <Target className="h-6 w-6 text-[#40C9A9]" />
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
                    <CheckCircle className="h-4 w-4 text-[#40C9A9]" />
                    <span>Metas por GPA, materias o créditos</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/60">
                    <CheckCircle className="h-4 w-4 text-[#40C9A9]" />
                    <span>Seguimiento automático de progreso</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/60">
                    <CheckCircle className="h-4 w-4 text-[#40C9A9]" />
                    <span>Notificaciones de logros</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#354B3A] border-white/10 hover:border-[#40C9A9]/30 transition-all">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#40C9A9]/10 rounded-lg">
                    <BookOpen className="h-6 w-6 text-[#40C9A9]" />
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
                    <CheckCircle className="h-4 w-4 text-[#40C9A9]" />
                    <span>Registro de materias aprobadas</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/60">
                    <CheckCircle className="h-4 w-4 text-[#40C9A9]" />
                    <span>Gestión de estados (cursando, retirada)</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/60">
                    <CheckCircle className="h-4 w-4 text-[#40C9A9]" />
                    <span>Validación automática de prerrequisitos</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#354B3A] border-white/10 hover:border-[#40C9A9]/30 transition-all">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#40C9A9]/10 rounded-lg">
                    <Lightbulb className="h-6 w-6 text-[#40C9A9]" />
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
                    <CheckCircle className="h-4 w-4 text-[#40C9A9]" />
                    <span>Análisis de prerrequisitos</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/60">
                    <CheckCircle className="h-4 w-4 text-[#40C9A9]" />
                    <span>Sugerencias optimizadas</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/60">
                    <CheckCircle className="h-4 w-4 text-[#40C9A9]" />
                    <span>Planificación semestral</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#354B3A] border-white/10 hover:border-[#40C9A9]/30 transition-all">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#40C9A9]/10 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-[#40C9A9]" />
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
                    <CheckCircle className="h-4 w-4 text-[#40C9A9]" />
                    <span>Gráficos de rendimiento</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/60">
                    <CheckCircle className="h-4 w-4 text-[#40C9A9]" />
                    <span>Comparación con otros estudiantes</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/60">
                    <CheckCircle className="h-4 w-4 text-[#40C9A9]" />
                    <span>Proyecciones académicas</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#354B3A] border-white/10 hover:border-[#40C9A9]/30 transition-all">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#40C9A9]/10 rounded-lg">
                    <Bell className="h-6 w-6 text-[#40C9A9]" />
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
                    <CheckCircle className="h-4 w-4 text-[#40C9A9]" />
                    <span>Recordatorios de metas</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/60">
                    <CheckCircle className="h-4 w-4 text-[#40C9A9]" />
                    <span>Alertas de materias próximas a vencer</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/60">
                    <CheckCircle className="h-4 w-4 text-[#40C9A9]" />
                    <span>Notificaciones de logros</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Plataforma Colaborativa */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-3 mb-4">
              <Share2 className="h-8 w-8 text-[#40C9A9]" />
              <h2 className="text-3xl font-special text-white">Plataforma Colaborativa</h2>
            </div>
            <p className="text-white/70 text-lg">
              Comparte y descubre recursos académicos con la comunidad estudiantil
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="bg-[#354B3A] border-white/10 hover:border-[#40C9A9]/30 transition-all">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#40C9A9]/10 rounded-lg">
                    <FileText className="h-6 w-6 text-[#40C9A9]" />
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
                    <CheckCircle className="h-4 w-4 text-[#40C9A9]" />
                    <span>Subida de PDFs e imágenes</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/60">
                    <CheckCircle className="h-4 w-4 text-[#40C9A9]" />
                    <span>Moderación automática con IA</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/60">
                    <CheckCircle className="h-4 w-4 text-[#40C9A9]" />
                    <span>Organización por materias</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#354B3A] border-white/10 hover:border-[#40C9A9]/30 transition-all">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#40C9A9]/10 rounded-lg">
                    <Search className="h-6 w-6 text-[#40C9A9]" />
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
                    <CheckCircle className="h-4 w-4 text-[#40C9A9]" />
                    <span>Búsqueda avanzada por materias</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/60">
                    <CheckCircle className="h-4 w-4 text-[#40C9A9]" />
                    <span>Filtros por tipo de contenido</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/60">
                    <CheckCircle className="h-4 w-4 text-[#40C9A9]" />
                    <span>Recursos populares y destacados</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#354B3A] border-white/10 hover:border-[#40C9A9]/30 transition-all">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#40C9A9]/10 rounded-lg">
                    <Heart className="h-6 w-6 text-[#40C9A9]" />
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
                    <CheckCircle className="h-4 w-4 text-[#40C9A9]" />
                    <span>Marcar recursos como favoritos</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/60">
                    <CheckCircle className="h-4 w-4 text-[#40C9A9]" />
                    <span>Organización personalizada</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/60">
                    <CheckCircle className="h-4 w-4 text-[#40C9A9]" />
                    <span>Acceso rápido desde dashboard</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#354B3A] border-white/10 hover:border-[#40C9A9]/30 transition-all">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#40C9A9]/10 rounded-lg">
                    <MessageSquare className="h-6 w-6 text-[#40C9A9]" />
                  </div>
                  <CardTitle className="text-white">Comentarios</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-white/70 mb-4">
                  Interactúa con otros estudiantes a través de comentarios y valoraciones.
                </CardDescription>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-white/60">
                    <CheckCircle className="h-4 w-4 text-[#40C9A9]" />
                    <span>Sistema de comentarios</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/60">
                    <CheckCircle className="h-4 w-4 text-[#40C9A9]" />
                    <span>Valoraciones con estrellas</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/60">
                    <CheckCircle className="h-4 w-4 text-[#40C9A9]" />
                    <span>Comunidad colaborativa</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#354B3A] border-white/10 hover:border-[#40C9A9]/30 transition-all">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#40C9A9]/10 rounded-lg">
                    <Download className="h-6 w-6 text-[#40C9A9]" />
                  </div>
                  <CardTitle className="text-white">Descargas</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-white/70 mb-4">
                  Descarga recursos académicos para uso offline y estudio personal.
                </CardDescription>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-white/60">
                    <CheckCircle className="h-4 w-4 text-[#40C9A9]" />
                    <span>Descarga directa de archivos</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/60">
                    <CheckCircle className="h-4 w-4 text-[#40C9A9]" />
                    <span>Almacenamiento seguro</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/60">
                    <CheckCircle className="h-4 w-4 text-[#40C9A9]" />
                    <span>Acceso sin conexión</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#354B3A] border-white/10 hover:border-[#40C9A9]/30 transition-all">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#40C9A9]/10 rounded-lg">
                    <Shield className="h-6 w-6 text-[#40C9A9]" />
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
                    <CheckCircle className="h-4 w-4 text-[#40C9A9]" />
                    <span>Análisis automático de contenido</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/60">
                    <CheckCircle className="h-4 w-4 text-[#40C9A9]" />
                    <span>Filtrado de contenido inapropiado</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/60">
                    <CheckCircle className="h-4 w-4 text-[#40C9A9]" />
                    <span>Comunidad académica segura</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Herramientas de IA */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-3 mb-4">
              <Brain className="h-8 w-8 text-[#40C9A9]" />
              <h2 className="text-3xl font-special text-white">Herramientas de Inteligencia Artificial</h2>
            </div>
            <p className="text-white/70 text-lg">
              Potencia tu aprendizaje con herramientas de IA avanzadas
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="bg-[#354B3A] border-white/10 hover:border-[#40C9A9]/30 transition-all">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#40C9A9]/10 rounded-lg">
                    <FileText className="h-6 w-6 text-[#40C9A9]" />
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
                    <CheckCircle className="h-4 w-4 text-[#40C9A9]" />
                    <span>Generación automática de flashcards</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/60">
                    <CheckCircle className="h-4 w-4 text-[#40C9A9]" />
                    <span>Basado en tus caletas favoritas</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/60">
                    <CheckCircle className="h-4 w-4 text-[#40C9A9]" />
                    <span>Personalización por materia</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#354B3A] border-white/10 hover:border-[#40C9A9]/30 transition-all">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#40C9A9]/10 rounded-lg">
                    <BookOpen className="h-6 w-6 text-[#40C9A9]" />
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
                    <CheckCircle className="h-4 w-4 text-[#40C9A9]" />
                    <span>Análisis completo de documentos</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/60">
                    <CheckCircle className="h-4 w-4 text-[#40C9A9]" />
                    <span>Extracción de puntos clave</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/60">
                    <CheckCircle className="h-4 w-4 text-[#40C9A9]" />
                    <span>Resúmenes estructurados</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#354B3A] border-white/10 hover:border-[#40C9A9]/30 transition-all">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#40C9A9]/10 rounded-lg">
                    <Target className="h-6 w-6 text-[#40C9A9]" />
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
                    <CheckCircle className="h-4 w-4 text-[#40C9A9]" />
                    <span>Generación automática de preguntas</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/60">
                    <CheckCircle className="h-4 w-4 text-[#40C9A9]" />
                    <span>Diferentes tipos de preguntas</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/60">
                    <CheckCircle className="h-4 w-4 text-[#40C9A9]" />
                    <span>Guardado opcional de cuestionarios</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Características Técnicas */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-3 mb-4">
              <Zap className="h-8 w-8 text-[#40C9A9]" />
              <h2 className="text-3xl font-special text-white">Características Técnicas</h2>
            </div>
            <p className="text-white/70 text-lg">
              Tecnología de vanguardia para una experiencia excepcional
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <Card className="bg-[#354B3A] border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Shield className="h-5 w-5 text-[#40C9A9]" />
                    Seguridad y Privacidad
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-white/70">
                    <CheckCircle className="h-4 w-4 text-[#40C9A9]" />
                    <span>Autenticación segura con NextAuth.js</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/70">
                    <CheckCircle className="h-4 w-4 text-[#40C9A9]" />
                    <span>Protección de rutas y datos</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/70">
                    <CheckCircle className="h-4 w-4 text-[#40C9A9]" />
                    <span>Almacenamiento seguro en la nube</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/70">
                    <CheckCircle className="h-4 w-4 text-[#40C9A9]" />
                    <span>Cumplimiento de estándares de privacidad</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[#354B3A] border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-[#40C9A9]" />
                    Rendimiento
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-white/70">
                    <CheckCircle className="h-4 w-4 text-[#40C9A9]" />
                    <span>Optimización con Next.js 15</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/70">
                    <CheckCircle className="h-4 w-4 text-[#40C9A9]" />
                    <span>Base de datos MySQL optimizada</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/70">
                    <CheckCircle className="h-4 w-4 text-[#40C9A9]" />
                    <span>Carga rápida de archivos</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/70">
                    <CheckCircle className="h-4 w-4 text-[#40C9A9]" />
                    <span>Interfaz responsive y fluida</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="bg-[#354B3A] border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Users className="h-5 w-5 text-[#40C9A9]" />
                    Experiencia de Usuario
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-white/70">
                    <CheckCircle className="h-4 w-4 text-[#40C9A9]" />
                    <span>Interfaz moderna y intuitiva</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/70">
                    <CheckCircle className="h-4 w-4 text-[#40C9A9]" />
                    <span>Diseño responsive para todos los dispositivos</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/70">
                    <CheckCircle className="h-4 w-4 text-[#40C9A9]" />
                    <span>Navegación fluida y accesible</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/70">
                    <CheckCircle className="h-4 w-4 text-[#40C9A9]" />
                    <span>Feedback visual en tiempo real</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[#354B3A] border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-[#40C9A9]" />
                    Integración y Compatibilidad
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-white/70">
                    <CheckCircle className="h-4 w-4 text-[#40C9A9]" />
                    <span>Compatible con múltiples navegadores</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/70">
                    <CheckCircle className="h-4 w-4 text-[#40C9A9]" />
                    <span>Funciona en dispositivos móviles</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/70">
                    <CheckCircle className="h-4 w-4 text-[#40C9A9]" />
                    <span>Integración con OpenAI para IA</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/70">
                    <CheckCircle className="h-4 w-4 text-[#40C9A9]" />
                    <span>API RESTful para futuras integraciones</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Final */}
        <section className="text-center">
          <Card className="bg-[#354B3A] border-[#40C9A9]/30 max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl font-special text-white mb-4">
                ¿Listo para transformar tu experiencia académica?
              </CardTitle>
              <CardDescription className="text-white/70 text-lg">
                Únete a miles de estudiantes que ya están aprovechando el poder de Caletas para mejorar su rendimiento académico.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/auth/register">
                  <Button className="bg-[#40C9A9] hover:bg-[#40C9A9]/80 text-white px-8 py-3 text-lg">
                    Comenzar Ahora
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/">
                  <Button variant="outline" className="border-white/20 text-mygreen hover:bg-white/10 px-8 py-3 text-lg">
                    Volver al Inicio
                  </Button>
                </Link>
              </div>
              <p className="text-sm text-white/60">
                Costo simbólico • Tarifas establecidas con universidades • Sin compromisos
              </p>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
} 