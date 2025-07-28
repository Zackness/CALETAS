import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Star, 
  Quote, 
  GraduationCap, 
  Users, 
  TrendingUp, 
  Heart, 
  ArrowRight,
  Calendar,
  BookOpen,
  Target,
  Award,
  MessageSquare
} from "lucide-react";
import Link from "next/link";
import { Header } from "../caracteristicas/components/Header";

interface Testimonio {
  id: string;
  nombre: string;
  carrera: string;
  universidad: string;
  semestre: string;
  foto?: string;
  calificacion: number;
  testimonio: string;
  beneficios: string[];
  fecha: string;
  destacado?: boolean;
}

const testimonios: Testimonio[] = [
  {
    id: '1',
    nombre: 'María González',
    carrera: 'Ingeniería Mecatrónica',
    universidad: 'UNEXPO',
    semestre: '8vo Semestre',
    calificacion: 5,
    testimonio: 'Caletas ha revolucionado mi forma de estudiar. Antes perdía horas buscando material de calidad, ahora tengo acceso a recursos excelentes compartidos por otros estudiantes. Las fichas de estudio generadas por IA son increíbles para repasar antes de los exámenes.',
    beneficios: ['Acceso a recursos de calidad', 'Fichas de estudio con IA', 'Comunidad colaborativa'],
    fecha: '2024-01-15',
    destacado: true
  },
  {
    id: '2',
    nombre: 'Carlos Rodríguez',
    carrera: 'Ingeniería Eléctrica',
    universidad: 'UNEXPO',
    semestre: '6to Semestre',
    calificacion: 5,
    testimonio: 'El sistema de metas académicas me ha ayudado a mantener el foco en mis objetivos. Poder ver mi progreso visualmente y recibir notificaciones de mis logros me motiva a seguir mejorando. ¡Excelente herramienta!',
    beneficios: ['Seguimiento de metas', 'Progreso visual', 'Motivación constante'],
    fecha: '2024-01-10'
  },
  {
    id: '3',
    nombre: 'Ana Martínez',
    carrera: 'TSU. Electricidad',
    universidad: 'UNEXPO',
    semestre: '4to Semestre',
    calificacion: 5,
    testimonio: 'Como estudiante de TSU, encontrar material específico para mi carrera era difícil. Caletas me ha conectado con otros estudiantes que comparten recursos perfectos para mis materias. La moderación de contenido me da confianza.',
    beneficios: ['Material específico por carrera', 'Contenido moderado', 'Conexión con pares'],
    fecha: '2024-01-08'
  },
  {
    id: '4',
    nombre: 'Luis Pérez',
    carrera: 'Ingeniería Rural',
    universidad: 'UNEXPO',
    semestre: '7mo Semestre',
    calificacion: 5,
    testimonio: 'Los cuestionarios generados por IA me han ayudado mucho a prepararme para los exámenes. Es como tener un tutor personal que crea preguntas específicas sobre los temas que estoy estudiando.',
    beneficios: ['Cuestionarios personalizados', 'Preparación para exámenes', 'Estudio dirigido'],
    fecha: '2024-01-05'
  },
  {
    id: '5',
    nombre: 'Isabella Torres',
    carrera: 'TSU. Mecánica',
    universidad: 'UNEXPO',
    semestre: '5to Semestre',
    calificacion: 5,
    testimonio: 'El historial académico me ha ayudado a organizar mejor mi carrera. Poder ver todas mis materias cursadas, notas y estados en un solo lugar es invaluable. La validación automática de prerrequisitos es genial.',
    beneficios: ['Organización académica', 'Historial completo', 'Validación automática'],
    fecha: '2024-01-03'
  },
  {
    id: '6',
    nombre: 'Diego Silva',
    carrera: 'Ingeniería Mecatrónica',
    universidad: 'UNEXPO',
    semestre: '9no Semestre',
    calificacion: 5,
    testimonio: 'Las recomendaciones de materias para el próximo semestre me han salvado. Antes me confundía con los prerrequisitos, ahora el sistema me sugiere exactamente qué materias puedo cursar. ¡Muy útil!',
    beneficios: ['Recomendaciones inteligentes', 'Planificación semestral', 'Claridad en prerrequisitos'],
    fecha: '2024-01-01'
  }
];

export default function TestimoniosPage() {
  const renderStars = (calificacion: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < calificacion ? 'text-yellow-400 fill-current' : 'text-gray-400'}`}
      />
    ));
  };

  const getInitials = (nombre: string) => {
    return nombre.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const testimoniosDestacados = testimonios.filter(t => t.destacado);
  const testimoniosRegulares = testimonios.filter(t => !t.destacado);

  return (
    <div className="min-h-screen bg-gradient-to-t from-mygreen to-mygreen-light">
      <Header />
      
      {/* Header */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-special text-white mb-6">
            Testimonios de Estudiantes
          </h1>
          <p className="text-xl text-white/80 max-w-3xl mx-auto">
            Descubre cómo Caletas está transformando la experiencia académica de estudiantes universitarios en Venezuela.
          </p>
        </div>

        {/* Estadísticas */}
        <section className="mb-20">
          <div className="grid md:grid-cols-4 gap-6 mb-12">
            <Card className="bg-[#354B3A] border-white/10 text-center">
              <CardContent className="pt-6">
                <div className="mx-auto p-3 bg-[#40C9A9]/10 rounded-full w-fit mb-4">
                  <Users className="h-8 w-8 text-[#40C9A9]" />
                </div>
                <h3 className="text-2xl font-special text-white mb-2">500+</h3>
                <p className="text-white/70">Estudiantes Activos</p>
              </CardContent>
            </Card>

            <Card className="bg-[#354B3A] border-white/10 text-center">
              <CardContent className="pt-6">
                <div className="mx-auto p-3 bg-[#40C9A9]/10 rounded-full w-fit mb-4">
                  <Star className="h-8 w-8 text-[#40C9A9]" />
                </div>
                <h3 className="text-2xl font-special text-white mb-2">4.9/5</h3>
                <p className="text-white/70">Calificación Promedio</p>
              </CardContent>
            </Card>

            <Card className="bg-[#354B3A] border-white/10 text-center">
              <CardContent className="pt-6">
                <div className="mx-auto p-3 bg-[#40C9A9]/10 rounded-full w-fit mb-4">
                  <BookOpen className="h-8 w-8 text-[#40C9A9]" />
                </div>
                <h3 className="text-2xl font-special text-white mb-2">1,200+</h3>
                <p className="text-white/70">Recursos Compartidos</p>
              </CardContent>
            </Card>

            <Card className="bg-[#354B3A] border-white/10 text-center">
              <CardContent className="pt-6">
                <div className="mx-auto p-3 bg-[#40C9A9]/10 rounded-full w-fit mb-4">
                  <TrendingUp className="h-8 w-8 text-[#40C9A9]" />
                </div>
                <h3 className="text-2xl font-special text-white mb-2">85%</h3>
                <p className="text-white/70">Mejora en Rendimiento</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Testimonio Destacado */}
        {testimoniosDestacados.length > 0 && (
          <section className="mb-20">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-3 mb-4">
                <Award className="h-8 w-8 text-[#40C9A9]" />
                <h2 className="text-3xl font-special text-white">Testimonio Destacado</h2>
              </div>
            </div>

            <Card className="bg-[#354B3A] border-[#40C9A9]/30 max-w-4xl mx-auto">
              <CardHeader>
                <div className="flex items-start gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={testimoniosDestacados[0].foto} />
                    <AvatarFallback className="bg-[#40C9A9] text-white text-lg font-medium">
                      {getInitials(testimoniosDestacados[0].nombre)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-special text-white">{testimoniosDestacados[0].nombre}</h3>
                      <Badge className="bg-[#40C9A9]/10 text-[#40C9A9] border-[#40C9A9]/20">
                        Destacado
                      </Badge>
                    </div>
                    <p className="text-white/70 mb-2">
                      {testimoniosDestacados[0].carrera} • {testimoniosDestacados[0].universidad} • {testimoniosDestacados[0].semestre}
                    </p>
                    <div className="flex items-center gap-1">
                      {renderStars(testimoniosDestacados[0].calificacion)}
                    </div>
                  </div>
                  <Quote className="h-8 w-8 text-[#40C9A9] opacity-50" />
                </div>
              </CardHeader>
              <CardContent>
                <blockquote className="text-lg text-white/90 italic mb-6 leading-relaxed">
                  &quot;{testimoniosDestacados[0].testimonio}&quot;
                </blockquote>
                
                <div className="space-y-3">
                  <h4 className="text-white font-medium">Beneficios experimentados:</h4>
                  <div className="grid md:grid-cols-3 gap-2">
                    {testimoniosDestacados[0].beneficios.map((beneficio, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm text-white/70">
                        <Heart className="h-4 w-4 text-[#40C9A9]" />
                        <span>{beneficio}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="mt-6 text-sm text-white/50">
                  {formatDate(testimoniosDestacados[0].fecha)}
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {/* Testimonios Regulares */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-3 mb-4">
              <MessageSquare className="h-8 w-8 text-[#40C9A9]" />
              <h2 className="text-3xl font-special text-white">Más Experiencias</h2>
            </div>
            <p className="text-white/70 text-lg">
              Historias reales de estudiantes que han transformado su experiencia académica
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimoniosRegulares.map((testimonio) => (
              <Card key={testimonio.id} className="bg-[#354B3A] border-white/10 hover:border-[#40C9A9]/30 transition-all">
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={testimonio.foto} />
                      <AvatarFallback className="bg-[#40C9A9] text-white font-medium">
                        {getInitials(testimonio.nombre)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="text-white font-medium">{testimonio.nombre}</h3>
                      <p className="text-sm text-white/70 mb-1">
                        {testimonio.carrera} • {testimonio.semestre}
                      </p>
                      <div className="flex items-center gap-1">
                        {renderStars(testimonio.calificacion)}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <blockquote className="text-white/80 italic mb-4 leading-relaxed">
                    &quot;{testimonio.testimonio}&quot;
                  </blockquote>
                  
                  <div className="space-y-2">
                    <h4 className="text-white font-medium text-sm">Beneficios:</h4>
                    {testimonio.beneficios.map((beneficio, index) => (
                      <div key={index} className="flex items-center gap-2 text-xs text-white/60">
                        <Heart className="h-3 w-3 text-[#40C9A9]" />
                        <span>{beneficio}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-4 text-xs text-white/50">
                    {formatDate(testimonio.fecha)}
                  </div>
                </CardContent>
              </Card>
            ))}
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
                Únete a cientos de estudiantes que ya están aprovechando el poder de Caletas para mejorar su rendimiento académico.
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
                <Link href="/caracteristicas">
                  <Button variant="outline" className="border-white/20 text-mygreen hover:bg-white/10 px-8 py-3 text-lg">
                    Conocer Más
                  </Button>
                </Link>
              </div>
              <p className="text-sm text-white/60">
                Únete a la comunidad • Comparte tu experiencia • Mejora tu rendimiento
              </p>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
} 