import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Building2, 
  ShoppingCart, 
  Code, 
  GraduationCap, 
  Handshake, 
  Star, 
  ArrowRight,
  ExternalLink,
  Heart,
  Zap,
  Target,
  Globe,
  Award,
  CheckCircle
} from "lucide-react";
import Link from "next/link";
import { Header } from "../caracteristicas/components/Header";

interface Aliado {
  id: string;
  nombre: string;
  descripcion: string;
  tipo: 'movimiento' | 'empresa' | 'startup';
  logo?: string;
  beneficios: string[];
  estado: 'activo' | 'proximo';
  website?: string;
  contacto?: string;
}

const aliados: Aliado[] = [
  {
    id: '1',
    nombre: 'Movimientos Estudiantiles',
    descripcion: 'Organizaciones estudiantiles que facilitan la adopción de Caletas en sus universidades, promoviendo la colaboración académica y el intercambio de recursos.',
    tipo: 'movimiento',
    beneficios: [
      'Facilitan la integración de Caletas en universidades',
      'Promueven la colaboración académica',
      'Conectan estudiantes con recursos educativos',
      'Organizan eventos y talleres de estudio'
    ],
    estado: 'activo'
  },
  {
    id: '2',
    nombre: 'StartupVen',
    descripcion: 'Empresa de desarrollo de software especializada en soluciones tecnológicas innovadoras. Desarrolladora de la plataforma Caletas.',
    tipo: 'empresa',
    beneficios: [
      'Desarrollo y mantenimiento de la plataforma',
      'Soporte técnico especializado',
      'Innovación continua en funcionalidades',
      'Integración de tecnologías de IA'
    ],
    estado: 'activo',
    website: 'https://startupven.com'
  },
  {
    id: '3',
    nombre: 'MicroDelta',
    descripcion: 'Próximo aliado que permitirá la compra de componentes electrónicos para estudiantes de ingeniería de manera simplificada a través de la aplicación.',
    tipo: 'startup',
    beneficios: [
      'Compra directa de componentes electrónicos',
      'Precios especiales para estudiantes',
      'Integración con el sistema de Caletas',
      'Entrega rápida y confiable'
    ],
    estado: 'proximo'
  }
];

export default function AliadosPage() {
  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'movimiento':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'empresa':
        return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'startup':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'movimiento':
        return <Users className="h-5 w-5" />;
      case 'empresa':
        return <Building2 className="h-5 w-5" />;
      case 'startup':
        return <Zap className="h-5 w-5" />;
      default:
        return <Handshake className="h-5 w-5" />;
    }
  };

  const getEstadoColor = (estado: string) => {
    return estado === 'activo' 
      ? 'bg-[#40C9A9]/10 text-[#40C9A9] border-[#40C9A9]/20'
      : 'bg-orange-500/10 text-orange-400 border-orange-500/20';
  };

  return (
    <div className="min-h-screen bg-gradient-to-t from-mygreen to-mygreen-light">
      <Header />
      
      {/* Header */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-special text-white mb-6">
            Nuestros Aliados
          </h1>
          <p className="text-xl text-white/80 max-w-3xl mx-auto">
            Conoce a las organizaciones y empresas que hacen posible Caletas, trabajando juntos para transformar la experiencia académica de los estudiantes universitarios.
          </p>
        </div>

        {/* Aliados Principales */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-3 mb-4">
              <Handshake className="h-8 w-8 text-[#40C9A9]" />
              <h2 className="text-3xl font-special text-white">Aliados Estratégicos</h2>
            </div>
            <p className="text-white/70 text-lg">
              Organizaciones que comparten nuestra visión de mejorar la educación universitaria
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {aliados.map((aliado) => (
              <Card key={aliado.id} className="bg-[#354B3A] border-white/10 hover:border-[#40C9A9]/30 transition-all">
                <CardHeader>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-[#40C9A9]/10 rounded-lg">
                        {getTipoIcon(aliado.tipo)}
                      </div>
                      <div>
                        <CardTitle className="text-white text-xl">{aliado.nombre}</CardTitle>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge className={getTipoColor(aliado.tipo)}>
                            {aliado.tipo === 'movimiento' ? 'Movimiento Estudiantil' : 
                             aliado.tipo === 'empresa' ? 'Empresa' : 'Startup'}
                          </Badge>
                          <Badge className={getEstadoColor(aliado.estado)}>
                            {aliado.estado === 'activo' ? 'Activo' : 'Próximamente'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-white/70 mb-6 text-base">
                    {aliado.descripcion}
                  </CardDescription>
                  
                  <div className="space-y-3 mb-6">
                    <h4 className="text-white font-medium mb-3">Beneficios:</h4>
                    {aliado.beneficios.map((beneficio, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <Star className="h-4 w-4 text-[#40C9A9] mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-white/70">{beneficio}</span>
                      </div>
                    ))}
                  </div>

                  {aliado.website && (
                    <div className="flex gap-2">
                      <Link href={aliado.website} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm" className="border-[#40C9A9] text-[#40C9A9] hover:bg-[#40C9A9] hover:text-white">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Visitar Sitio
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Cómo Ser Aliado */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-3 mb-4">
              <Target className="h-8 w-8 text-[#40C9A9]" />
              <h2 className="text-3xl font-special text-white">¿Quieres Ser Aliado?</h2>
            </div>
            <p className="text-white/70 text-lg">
              Únete a nuestra red de aliados y forma parte del futuro de la educación universitaria
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <Card className="bg-[#354B3A] border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <GraduationCap className="h-6 w-6 text-[#40C9A9]" />
                  Movimientos Estudiantiles
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-white/70 mb-4">
                  Si representas un movimiento estudiantil y quieres llevar Caletas a tu universidad:
                </CardDescription>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-white/70">
                    <CheckCircle className="h-4 w-4 text-[#40C9A9]" />
                    <span>Contacta con nuestro equipo</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/70">
                    <CheckCircle className="h-4 w-4 text-[#40C9A9]" />
                    <span>Presenta tu universidad y necesidades</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/70">
                    <CheckCircle className="h-4 w-4 text-[#40C9A9]" />
                    <span>Recibe soporte para la implementación</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/70">
                    <CheckCircle className="h-4 w-4 text-[#40C9A9]" />
                    <span>Acceso a recursos exclusivos</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#354B3A] border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Building2 className="h-6 w-6 text-[#40C9A9]" />
                  Empresas y Startups
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-white/70 mb-4">
                  Si tienes una empresa o startup que quiere colaborar con Caletas:
                </CardDescription>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-white/70">
                    <CheckCircle className="h-4 w-4 text-[#40C9A9]" />
                    <span>Propón tu idea de colaboración</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/70">
                    <CheckCircle className="h-4 w-4 text-[#40C9A9]" />
                    <span>Integración con nuestra plataforma</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/70">
                    <CheckCircle className="h-4 w-4 text-[#40C9A9]" />
                    <span>Acceso a nuestra comunidad estudiantil</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/70">
                    <CheckCircle className="h-4 w-4 text-[#40C9A9]" />
                    <span>Desarrollo conjunto de soluciones</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Beneficios de Ser Aliado */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-3 mb-4">
              <Award className="h-8 w-8 text-[#40C9A9]" />
              <h2 className="text-3xl font-special text-white">Beneficios de Ser Aliado</h2>
            </div>
            <p className="text-white/70 text-lg">
              Descubre las ventajas de formar parte de nuestra red de aliados
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <Card className="bg-[#354B3A] border-white/10 text-center">
              <CardHeader>
                <div className="mx-auto p-3 bg-[#40C9A9]/10 rounded-full w-fit mb-4">
                  <Globe className="h-8 w-8 text-[#40C9A9]" />
                </div>
                <CardTitle className="text-white">Alcance Nacional</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-white/70">
                  Accede a estudiantes de universidades de todo el país y expande tu presencia en el mercado educativo.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="bg-[#354B3A] border-white/10 text-center">
              <CardHeader>
                <div className="mx-auto p-3 bg-[#40C9A9]/10 rounded-full w-fit mb-4">
                  <Heart className="h-8 w-8 text-[#40C9A9]" />
                </div>
                <CardTitle className="text-white">Comunidad Comprometida</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-white/70">
                  Conecta con una comunidad de estudiantes activos y comprometidos con su desarrollo académico.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="bg-[#354B3A] border-white/10 text-center">
              <CardHeader>
                <div className="mx-auto p-3 bg-[#40C9A9]/10 rounded-full w-fit mb-4">
                  <Code className="h-8 w-8 text-[#40C9A9]" />
                </div>
                <CardTitle className="text-white">Tecnología Avanzada</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-white/70">
                  Aprovecha nuestra plataforma tecnológica moderna con integración de IA y herramientas colaborativas.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* CTA Final */}
        <section className="text-center">
          <Card className="bg-[#354B3A] border-[#40C9A9]/30 max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl font-special text-white mb-4">
                ¿Listo para ser parte del cambio?
              </CardTitle>
              <CardDescription className="text-white/70 text-lg">
                Únete a nuestra red de aliados y ayúdanos a transformar la educación universitaria en Venezuela.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="mailto:aliados@caletas.com">
                  <Button className="bg-[#40C9A9] hover:bg-[#40C9A9]/80 text-white px-8 py-3 text-lg">
                    Contactar Equipo
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
                Alianzas estratégicas • Crecimiento conjunto • Impacto educativo
              </p>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
} 