import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Users, 
  Building2, 
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
import { PublicPageShell } from "@/app/(public)/components/PublicPageShell";
import { PublicPageHero } from "@/app/(public)/components/PublicPageHero";
import { PublicSectionHeader } from "@/app/(public)/components/PublicSectionHeader";

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
    descripcion: 'Startup de desarrollo de software especializada en soluciones tecnológicas innovadoras. Desarrolladora de la plataforma Caletas.',
    tipo: 'startup',
    logo: '/aliados/startupven.svg',
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
    logo: '/aliados/microdelta.svg',
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
      case "movimiento":
        return "chalk-badge";
      case "empresa":
        return "chalk-badge";
      case "startup":
        return "aprende-badge";
      default:
        return "chalk-badge";
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

  const getTipoLabel = (tipo: Aliado['tipo']) => {
    switch (tipo) {
      case 'movimiento':
        return 'Movimiento Estudiantil';
      case 'empresa':
        return 'Empresa';
      case 'startup':
        return 'Startup';
    }
  };

  const getEstadoColor = (estado: string) => {
    return estado === "activo"
      ? "chalk-badge"
      : "rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-white/65";
  };

  return (
    <PublicPageShell>
      <PublicPageHero
        title="NUESTROS ALIADOS"
        description="Conoce a las organizaciones y empresas que hacen posible Caletas, trabajando juntos para transformar la experiencia académica de los estudiantes universitarios."
      />

      <div className="chalk-container min-w-0 pb-14 sm:pb-16 md:pb-20">
        {/* Aliados Principales */}
        <section className="mb-20">
          <PublicSectionHeader
            icon={Handshake}
            title="Aliados estratégicos"
            description="Organizaciones que comparten nuestra visión de mejorar la educación universitaria"
          />

          <div className="grid lg:grid-cols-3 gap-8">
            {aliados.map((aliado) => (
              <Card key={aliado.id} className="chalk-card">
                <CardHeader>
                  {aliado.logo ? (
                    <div className="mb-5 flex h-24 w-full items-center justify-center rounded-2xl border border-white/10 bg-[color-mix(in_srgb,var(--mygreen-dark)_92%,black)] p-4 sm:h-28">
                      <img
                        src={aliado.logo}
                        alt={`Logo ${aliado.nombre}`}
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="mb-5 flex h-24 w-full items-center justify-center rounded-2xl border border-white/10 bg-[color-mix(in_srgb,var(--mygreen-dark)_92%,black)] p-4 sm:h-28">
                      <div className="rounded-lg bg-[color-mix(in_oklab,var(--caleta-accent)_10%,transparent)] p-3 text-[var(--caleta-accent)]">
                        {getTipoIcon(aliado.tipo)}
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    <CardTitle className="text-white text-xl">{aliado.nombre}</CardTitle>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={getTipoColor(aliado.tipo)}>{getTipoLabel(aliado.tipo)}</span>
                      <span className={getEstadoColor(aliado.estado)}>
                        {aliado.estado === "activo" ? "Activo" : "Próximamente"}
                      </span>
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
                        <Star className="h-4 w-4 text-[var(--caleta-accent)] mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-white/70">{beneficio}</span>
                      </div>
                    ))}
                  </div>

                  {aliado.website && (
                    <div className="flex gap-2">
                      <Link href={aliado.website} target="_blank" rel="noopener noreferrer">
                        <span className="chalk-hero-btn chalk-hero-btn-secondary inline-flex text-sm">
                          <ExternalLink className="h-4 w-4" />
                          Visitar sitio
                        </span>
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
              <Target className="h-8 w-8 text-[var(--caleta-accent)]" />
              <h2 className="text-3xl font-special text-white">¿Quieres Ser Aliado?</h2>
            </div>
            <p className="text-white/70 text-lg">
              Únete a nuestra red de aliados y forma parte del futuro de la educación universitaria
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <Card className="chalk-card">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <GraduationCap className="h-6 w-6 text-[var(--caleta-accent)]" />
                  Movimientos Estudiantiles
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-white/70 mb-4">
                  Si representas un movimiento estudiantil y quieres llevar Caletas a tu universidad:
                </CardDescription>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-white/70">
                    <CheckCircle className="h-4 w-4 text-[var(--caleta-accent)]" />
                    <span>Contacta con nuestro equipo</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/70">
                    <CheckCircle className="h-4 w-4 text-[var(--caleta-accent)]" />
                    <span>Presenta tu universidad y necesidades</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/70">
                    <CheckCircle className="h-4 w-4 text-[var(--caleta-accent)]" />
                    <span>Recibe soporte para la implementación</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/70">
                    <CheckCircle className="h-4 w-4 text-[var(--caleta-accent)]" />
                    <span>Acceso a recursos exclusivos</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="chalk-card">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Building2 className="h-6 w-6 text-[var(--caleta-accent)]" />
                  Empresas y Startups
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-white/70 mb-4">
                  Si tienes una empresa o startup que quiere colaborar con Caletas:
                </CardDescription>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-white/70">
                    <CheckCircle className="h-4 w-4 text-[var(--caleta-accent)]" />
                    <span>Propón tu idea de colaboración</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/70">
                    <CheckCircle className="h-4 w-4 text-[var(--caleta-accent)]" />
                    <span>Integración con nuestra plataforma</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/70">
                    <CheckCircle className="h-4 w-4 text-[var(--caleta-accent)]" />
                    <span>Acceso a nuestra comunidad estudiantil</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/70">
                    <CheckCircle className="h-4 w-4 text-[var(--caleta-accent)]" />
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
              <Award className="h-8 w-8 text-[var(--caleta-accent)]" />
              <h2 className="text-3xl font-special text-white">Beneficios de Ser Aliado</h2>
            </div>
            <p className="text-white/70 text-lg">
              Descubre las ventajas de formar parte de nuestra red de aliados
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <Card className="chalk-card text-center">
              <CardHeader>
                <div className="mx-auto p-3 bg-[color-mix(in_oklab,var(--caleta-accent)_10%,transparent)] rounded-full w-fit mb-4">
                  <Globe className="h-8 w-8 text-[var(--caleta-accent)]" />
                </div>
                <CardTitle className="text-white">Alcance Nacional</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-white/70">
                  Accede a estudiantes de universidades de todo el país y expande tu presencia en el mercado educativo.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="chalk-card text-center">
              <CardHeader>
                <div className="mx-auto p-3 bg-[color-mix(in_oklab,var(--caleta-accent)_10%,transparent)] rounded-full w-fit mb-4">
                  <Heart className="h-8 w-8 text-[var(--caleta-accent)]" />
                </div>
                <CardTitle className="text-white">Comunidad Comprometida</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-white/70">
                  Conecta con una comunidad de estudiantes activos y comprometidos con su desarrollo académico.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="chalk-card text-center">
              <CardHeader>
                <div className="mx-auto p-3 bg-[color-mix(in_oklab,var(--caleta-accent)_10%,transparent)] rounded-full w-fit mb-4">
                  <Code className="h-8 w-8 text-[var(--caleta-accent)]" />
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
          <Card className="chalk-card chalk-card-featured max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl font-special text-white mb-4">
                ¿Listo para ser parte del cambio?
              </CardTitle>
              <CardDescription className="text-white/70 text-lg">
                Únete a nuestra red de aliados y ayúdanos a transformar la educación universitaria en Venezuela.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
                <a href="mailto:aliados@caletas.com" className="chalk-hero-btn chalk-hero-btn-secondary sm:min-w-[240px]">
                  Contactar equipo
                  <ArrowRight className="h-4 w-4 shrink-0" />
                </a>
                <Link href="/caracteristicas" className="chalk-hero-btn chalk-hero-btn-primary sm:min-w-[240px]">
                  Conocer más
                  <ArrowRight className="h-4 w-4 shrink-0" />
                </Link>
              </div>
              <p className="text-center text-sm text-white/60">
                Alianzas estratégicas • Crecimiento conjunto • Impacto educativo
              </p>
            </CardContent>
          </Card>
        </section>
      </div>
    </PublicPageShell>
  );
} 