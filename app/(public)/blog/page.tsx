import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Header } from "../(root)/components/Header";
import { 
  BookOpen, 
  GraduationCap, 
  Users, 
  TrendingUp, 
  Lightbulb, 
  Calendar,
  ArrowRight,
  Clock,
  Star,
  MessageSquare,
  Share2,
  Bookmark
} from "lucide-react";

export default function BlogPage() {
  // Contenido de ejemplo que se mostrará
  const contenidoEjemplo = [
    {
      id: 1,
      titulo: "Cómo Organizar tu Tiempo de Estudio en la Universidad",
      descripcion: "Estrategias probadas para maximizar tu productividad académica y mantener un equilibrio saludable entre estudio y vida personal.",
      categoria: "Productividad",
      tiempoLectura: "5 min",
      fecha: "Próximamente",
      autor: "Equipo Caletas",
      tags: ["Productividad", "Estudio", "Tiempo"],
      icon: Clock
    },
    {
      id: 2,
      titulo: "Las Mejores Técnicas de Memorización para Exámenes",
      descripcion: "Descubre métodos científicos para retener información de manera efectiva y superar cualquier examen universitario.",
      categoria: "Técnicas de Estudio",
      tiempoLectura: "7 min",
      fecha: "Próximamente",
      autor: "Equipo Caletas",
      tags: ["Memorización", "Exámenes", "Técnicas"],
      icon: Lightbulb
    },
    {
      id: 3,
      titulo: "Guía Completa para Presentaciones Universitarias",
      descripcion: "Aprende a crear presentaciones impactantes que capten la atención de tu audiencia y obtengan las mejores calificaciones.",
      categoria: "Comunicación",
      tiempoLectura: "8 min",
      fecha: "Próximamente",
      autor: "Equipo Caletas",
      tags: ["Presentaciones", "Comunicación", "Habilidades"],
      icon: TrendingUp
    },
    {
      id: 4,
      titulo: "Networking Estudiantil: Construye tu Red Profesional",
      descripcion: "Cómo aprovechar las oportunidades de networking en la universidad para impulsar tu carrera profesional desde el primer día.",
      categoria: "Desarrollo Profesional",
      tiempoLectura: "6 min",
      fecha: "Próximamente",
      autor: "Equipo Caletas",
      tags: ["Networking", "Carrera", "Profesional"],
      icon: Users
    },
    {
      id: 5,
      titulo: "Manejo del Estrés Académico: Guía para Estudiantes",
      descripcion: "Técnicas y consejos prácticos para mantener la calma durante períodos de alta presión académica.",
      categoria: "Bienestar",
      tiempoLectura: "9 min",
      fecha: "Próximamente",
      autor: "Equipo Caletas",
      tags: ["Estrés", "Bienestar", "Salud Mental"],
      icon: Star
    },
    {
      id: 6,
      titulo: "Cómo Elegir tu Especialización: Guía Definitiva",
      descripcion: "Factores clave a considerar al momento de elegir tu área de especialización y cómo tomar la mejor decisión para tu futuro.",
      categoria: "Orientación",
      tiempoLectura: "10 min",
      fecha: "Próximamente",
      autor: "Equipo Caletas",
      tags: ["Orientación", "Carrera", "Decisión"],
      icon: GraduationCap
    }
  ];

  const categorias = [
    { nombre: "Productividad", icon: Clock, color: "bg-blue-500" },
    { nombre: "Técnicas de Estudio", icon: BookOpen, color: "bg-green-500" },
    { nombre: "Comunicación", icon: MessageSquare, color: "bg-purple-500" },
    { nombre: "Desarrollo Profesional", icon: TrendingUp, color: "bg-orange-500" },
    { nombre: "Bienestar", icon: Star, color: "bg-pink-500" },
    { nombre: "Orientación", icon: GraduationCap, color: "bg-indigo-500" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-t from-mygreen to-mygreen-light">
      <Header />
      
      <div className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-[#40C9A9]/20 text-[#40C9A9] px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Clock className="h-4 w-4" />
            Próximamente
          </div>
          
          <h1 className="text-4xl md:text-6xl font-special text-white mb-6">
            Blog de Caletas
          </h1>
          
          <p className="text-xl text-white/80 max-w-3xl mx-auto mb-8 leading-relaxed">
            Descubre consejos, estrategias y recursos para maximizar tu experiencia universitaria. 
            Contenido creado por estudiantes, para estudiantes.
          </p>
          
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            {categorias.map((categoria) => (
              <Badge 
                key={categoria.nombre}
                variant="secondary" 
                className="bg-white/10 text-white border-white/20 hover:bg-white/20"
              >
                <categoria.icon className="h-3 w-3 mr-1" />
                {categoria.nombre}
              </Badge>
            ))}
          </div>
        </div>

        {/* Próximamente Banner */}
        <Card className="bg-[#354B3A] border-[#40C9A9]/30 mb-12">
          <CardContent className="p-8 text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="animate-pulse">
                <Calendar className="h-8 w-8 text-[#40C9A9]" />
              </div>
              <h2 className="text-2xl font-special text-[#40C9A9]">¡Próximamente Disponible!</h2>
            </div>
            <p className="text-white/80 text-lg mb-6 max-w-2xl mx-auto">
              Estamos trabajando en crear contenido valioso para tu desarrollo académico. 
              Suscríbete para ser el primero en conocer cuando lancemos nuestro blog.
            </p>
            <Button 
              className="bg-[#40C9A9] hover:bg-[#40C9A9]/80 text-white font-bold px-8 py-3 rounded-xl"
              disabled
            >
              <Bookmark className="h-4 w-4 mr-2" />
              Suscribirse (Próximamente)
            </Button>
          </CardContent>
        </Card>

        {/* Contenido de Ejemplo */}
        <div className="mb-12">
          <h2 className="text-3xl font-special text-white text-center mb-8">
            Tipo de Contenido que Tendremos
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {contenidoEjemplo.map((articulo) => (
              <Card key={articulo.id} className="bg-[#354B3A] border-white/10 hover:border-[#40C9A9]/30 transition-all duration-300 hover:shadow-lg hover:shadow-[#40C9A9]/10">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between mb-3">
                    <Badge variant="secondary" className="bg-[#40C9A9]/20 text-[#40C9A9] border-[#40C9A9]/30">
                      {articulo.categoria}
                    </Badge>
                    <div className="flex items-center gap-1 text-white/60 text-sm">
                      <Clock className="h-3 w-3" />
                      {articulo.tiempoLectura}
                    </div>
                  </div>
                  
                  <CardTitle className="text-white text-lg leading-tight mb-2">
                    {articulo.titulo}
                  </CardTitle>
                  
                  <CardDescription className="text-white/70 text-sm leading-relaxed">
                    {articulo.descripcion}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-white/60 text-sm">
                      <Users className="h-3 w-3" />
                      {articulo.autor}
                    </div>
                    <div className="text-white/40 text-xs">
                      {articulo.fecha}
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-1 mb-4">
                    {articulo.tags.map((tag) => (
                      <Badge 
                        key={tag}
                        variant="outline" 
                        className="text-xs bg-transparent text-white/60 border-white/20"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  
                  <Button 
                    variant="ghost" 
                    className="w-full text-[#40C9A9] hover:text-[#40C9A9] hover:bg-[#40C9A9]/10 border border-[#40C9A9]/20"
                    disabled
                  >
                    <ArrowRight className="h-3 w-3 mr-2" />
                    Leer Próximamente
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Sección de Beneficios */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <Card className="bg-[#354B3A] border-white/10 text-center">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-[#40C9A9]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="h-6 w-6 text-[#40C9A9]" />
              </div>
              <h3 className="text-white font-semibold mb-2">Contenido Educativo</h3>
              <p className="text-white/70 text-sm">
                Artículos escritos por expertos y estudiantes experimentados
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-[#354B3A] border-white/10 text-center">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-[#40C9A9]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-6 w-6 text-[#40C9A9]" />
              </div>
              <h3 className="text-white font-semibold mb-2">Comunidad Estudiantil</h3>
              <p className="text-white/70 text-sm">
                Conecta con otros estudiantes y comparte experiencias
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-[#354B3A] border-white/10 text-center">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-[#40C9A9]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-6 w-6 text-[#40C9A9]" />
              </div>
              <h3 className="text-white font-semibold mb-2">Desarrollo Personal</h3>
              <p className="text-white/70 text-sm">
                Herramientas y consejos para tu crecimiento académico
              </p>
            </CardContent>
          </Card>
        </div>

        {/* CTA Final */}
        <Card className="bg-gradient-to-r from-[#1C2D20] to-[#203324] border-[#40C9A9]/30 shadow-lg">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-special text-white mb-4">
              ¿Quieres ser el primero en saber cuando lancemos el blog?
            </h2>
            <p className="text-white/80 mb-6">
              Recibe notificaciones sobre nuevos artículos y contenido exclusivo
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                className="bg-[#40C9A9] hover:bg-[#40C9A9]/80 text-white font-bold px-8 py-3 rounded-xl shadow-lg"
                disabled
              >
                <Share2 className="h-4 w-4 mr-2" />
                Suscribirse al Newsletter
              </Button>
              <Button 
                variant="outline" 
                className="border-[#40C9A9] text-[#40C9A9] hover:bg-[#40C9A9]/10 px-8 py-3 rounded-xl"
                disabled
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Enviar Sugerencias
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 