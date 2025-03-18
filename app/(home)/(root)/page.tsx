"use client"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import {
  Zap,
  Users,
  FileText,
  Clock,
  DollarSign,
  Lock,
  Briefcase,
  User,
  Building,
  ArrowRight,
  CheckCircle,
  Car,
  Home,
  Plane,
  HeartHandshake,
  Globe,
  CreditCard,
} from "lucide-react"
import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { useTheme } from "next-themes"

// Animación para elementos que aparecen en secuencia
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

export default function LandingPage() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Asegurarse de que el componente está montado para evitar problemas de hidratación
  useEffect(() => {
    setMounted(true)
  }, [])

  // Datos de documentos legales organizados por categoría
  const legalDocuments = [
    {
      category: "Automóvil",
      icon: Car,
      color: "from-blue-500 to-cyan-500 dark:from-blue-600 dark:to-cyan-600",
      documents: [
        {
          title: "Compra-venta de vehículos",
          description:
            "Documento legal para la compra o venta de cualquier vehículo automotor, incluyendo transacciones familiares con padres o hijos.",
        },
      ],
    },
    {
      category: "Vivienda",
      icon: Home,
      color: "from-green-500 to-emerald-500 dark:from-green-600 dark:to-emerald-600",
      documents: [
        {
          title: "Declaración de no poseer vivienda",
          description:
            "Documento requerido por organismos públicos para otorgar créditos de adquisición, ampliación o remodelación de vivienda.",
        },
        {
          title: "Compra-venta de vivienda",
          description:
            "Documento legal para la compra o venta de casas o apartamentos, incluyendo transacciones familiares con padres o hijos.",
        },
      ],
    },
    {
      category: "Viajero",
      icon: Plane,
      color: "from-purple-500 to-indigo-500 dark:from-purple-600 dark:to-indigo-600",
      documents: [
        {
          title: "Autorizaciones de viaje",
          description:
            "Permisos para que niños y adolescentes viajen dentro o fuera del país, solos o acompañados por uno de sus padres o terceras personas.",
        },
        {
          title: "Poder para representación durante viajes",
          description:
            "Autorización a personas de confianza para que le representen y se encarguen de sus asuntos durante su ausencia por viaje.",
        },
      ],
    },
    {
      category: "Herencia",
      icon: HeartHandshake,
      color: "from-amber-500 to-orange-500 dark:from-amber-600 dark:to-orange-600",
      documents: [
        {
          title: "Declaración de Sucesiones",
          description:
            "Asistencia completa para el trámite de declaración de sucesiones ante el SENIAT, incluyendo revisión de documentos, orientación y presentación de la declaración.",
        },
      ],
    },
    {
      category: "Personal",
      icon: User,
      color: "from-pink-500 to-rose-500 dark:from-pink-600 dark:to-rose-600",
      documents: [
        {
          title: "Justificativo de soltería",
          description:
            "Documento requerido para contraer matrimonio, válido tanto en territorio nacional como en el exterior a través de consulados.",
        },
        {
          title: "Poder especial o general",
          description:
            "Autorización para que una persona de confianza le represente en asuntos específicos o generales, incluyendo contratos y gestiones legales.",
        },
      ],
    },
    {
      category: "Empresarial",
      icon: Briefcase,
      color: "from-blue-600 to-violet-600 dark:from-blue-700 dark:to-violet-700",
      documents: [
        {
          title: "Constitución de empresa PYME",
          description:
            "Documento para la creación y registro de pequeñas y medianas empresas donde usted, su cónyuge, padres o hijos sean accionistas.",
        },
        {
          title: "Acta de Asamblea de Accionistas",
          description:
            "Documento para formalizar decisiones de accionistas, como aumentos de capital por reconversiones monetarias en Venezuela.",
        },
      ],
    },
    {
      category: "Migrante",
      icon: Globe,
      color: "from-teal-500 to-cyan-500 dark:from-teal-600 dark:to-cyan-600",
      documents: [
        {
          title: "Poder desde el exterior",
          description:
            "Autorización otorgada desde el exterior para que personas de confianza le representen legalmente en Venezuela, gestionando sus bienes y trámites.",
        },
      ],
    },
    {
      category: "Financiera",
      icon: CreditCard,
      color: "from-emerald-500 to-green-600 dark:from-emerald-600 dark:to-green-700",
      documents: [
        {
          title: "Certificación de ingresos",
          description:
            "Documento que certifica sus ingresos como profesional independiente o comerciante para trámites con bancos, instituciones financieras o entes gubernamentales.",
        },
        {
          title: "Balance personal",
          description:
            "Estado financiero personal requerido por bancos, instituciones financieras, cajas de ahorro u otros entes para diversos trámites.",
        },
      ],
    },
  ]

  // Datos de testimonios
  const testimonials = [
    {
      name: "Carlos Rodríguez",
      role: "Emprendedor",
      content:
        "Gracias a este servicio pude gestionar todos los contratos para mi startup sin gastar una fortuna en abogados.",
      avatar: "/placeholder.svg?height=60&width=60",
    },
    {
      name: "María González",
      role: "Propietaria de PYME",
      content: "La facilidad para crear documentos legales me ha ahorrado tiempo y dinero. Totalmente recomendado.",
      avatar: "/placeholder.svg?height=60&width=60",
    },
    {
      name: "Juan Pérez",
      role: "Profesional independiente",
      content: "Un servicio excepcional. He podido gestionar todos mis trámites legales sin salir de casa.",
      avatar: "/placeholder.svg?height=60&width=60",
    },
  ]

  // Datos de aliados
  const partners = [
    { name: "Empresa Legal A", logo: "/placeholder.svg?height=40&width=120" },
    { name: "Consultora B", logo: "/placeholder.svg?height=40&width=120" },
    { name: "Aseguradora C", logo: "/placeholder.svg?height=40&width=120" },
    { name: "Firma Legal D", logo: "/placeholder.svg?height=40&width=120" },
  ]

  // Estado para la categoría activa en la vista móvil
  const [activeCategory, setActiveCategory] = useState("Automóvil")

  if (!mounted) {
    return null // Evitar problemas de hidratación
  }

  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* Resto del contenido... */}
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
          <h2 className="text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-600 dark:from-blue-400 dark:to-purple-500">
            Asistencia Legal Documental
          </h2>
          <p className="text-2xl mb-8 max-w-3xl mx-auto text-muted-foreground">
            Simplifica tus trámites legales con un servicio integral y económico
          </p>
          <p className="text-xl mb-10 max-w-2xl mx-auto text-muted-foreground/80">
            ¿Necesitas gestionar documentos legales de manera rápida, segura y sin complicaciones? Con nuestro servicio,
            obtienes 12 documentos legales al año por solo $36.
          </p>
          <Button
            size="lg"
            className="bg-primary hover:bg-primary/90 text-primary-foreground text-lg px-8 py-6 rounded-full transition-colors"
          >
            Comienza ahora por solo $3/mes <ArrowRight className="ml-2" />
          </Button>
        </motion.div>
      </section>

      {/* What's Included Section */}
      <section className="container mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-600 dark:from-blue-400 dark:to-purple-500">
            ¿Qué incluye?
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Todo lo que necesitas para gestionar tus documentos legales sin complicaciones
          </p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {[
            {
              icon: FileText,
              title: "12 documentos legales anuales",
              description: "Elaboración y revisión de contratos, poderes, cartas formales, entre otros.",
            },
            {
              icon: Users,
              title: "Asesoría personalizada",
              description: "Garantizamos que cada documento se ajuste perfectamente a tus necesidades.",
            },
            {
              icon: Zap,
              title: "Acceso 100% online",
              description: "Sin desplazamientos, sin papeleos, sin estrés. Todo desde tu dispositivo.",
            },
            {
              icon: DollarSign,
              title: "Ahorro de tiempo y dinero",
              description: "Evita costosos honorarios de abogados para trámites sencillos.",
            },
          ].map((feature, index) => (
            <motion.div
              key={index}
              className="bg-card/50 backdrop-blur-sm p-6 rounded-lg flex items-start border border-border"
              variants={itemVariants}
              whileHover={{ scale: 1.03 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <feature.icon className="w-10 h-10 mr-4 text-primary flex-shrink-0" />
              <div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* 12 Documents Section */}
      <section className="container mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-600 dark:from-blue-400 dark:to-purple-500">
            Los 12 documentos legales incluidos
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Conoce en detalle todos los documentos que tendrás a tu disposición
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <motion.div
            className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 dark:from-blue-500/20 dark:to-cyan-500/20 p-6 rounded-xl border border-blue-200/20 dark:border-blue-500/30"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <div className="flex items-center mb-4">
              <div className="bg-blue-500/20 dark:bg-blue-500/30 p-2 rounded-full mr-3">
                <Car className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold">1. Compra-venta de vehículos</h3>
            </div>
            <p className="text-muted-foreground text-sm">
              Documento legal para la compra o venta de cualquier vehículo automotor, incluyendo transacciones
              familiares con padres o hijos.
            </p>
          </motion.div>

          <motion.div
            className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 dark:from-green-500/20 dark:to-emerald-500/20 p-6 rounded-xl border border-green-200/20 dark:border-green-500/30"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <div className="flex items-center mb-4">
              <div className="bg-green-500/20 dark:bg-green-500/30 p-2 rounded-full mr-3">
                <Home className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-semibold">2. Declaración de no poseer vivienda</h3>
            </div>
            <p className="text-muted-foreground text-sm">
              Documento requerido por organismos públicos para otorgar créditos de adquisición, ampliación o
              remodelación de vivienda.
            </p>
          </motion.div>

          <motion.div
            className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 dark:from-green-500/20 dark:to-emerald-500/20 p-6 rounded-xl border border-green-200/20 dark:border-green-500/30"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <div className="flex items-center mb-4">
              <div className="bg-green-500/20 dark:bg-green-500/30 p-2 rounded-full mr-3">
                <Home className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-semibold">3. Compra-venta de vivienda</h3>
            </div>
            <p className="text-muted-foreground text-sm">
              Documento legal para la compra o venta de casas o apartamentos, incluyendo transacciones familiares con
              padres o hijos.
            </p>
          </motion.div>

          <motion.div
            className="bg-gradient-to-br from-purple-500/10 to-indigo-500/10 dark:from-purple-500/20 dark:to-indigo-500/20 p-6 rounded-xl border border-purple-200/20 dark:border-purple-500/30"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
          >
            <div className="flex items-center mb-4">
              <div className="bg-purple-500/20 dark:bg-purple-500/30 p-2 rounded-full mr-3">
                <Plane className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold">4. Autorizaciones de viaje</h3>
            </div>
            <p className="text-muted-foreground text-sm">
              Permisos para que niños y adolescentes viajen dentro o fuera del país, solos o acompañados por uno de sus
              padres o terceras personas.
            </p>
          </motion.div>

          <motion.div
            className="bg-gradient-to-br from-purple-500/10 to-indigo-500/10 dark:from-purple-500/20 dark:to-indigo-500/20 p-6 rounded-xl border border-purple-200/20 dark:border-purple-500/30"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.5 }}
          >
            <div className="flex items-center mb-4">
              <div className="bg-purple-500/20 dark:bg-purple-500/30 p-2 rounded-full mr-3">
                <Plane className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold">5. Poder para representación durante viajes</h3>
            </div>
            <p className="text-muted-foreground text-sm">
              Autorización a personas de confianza para que le representen y se encarguen de sus asuntos durante su
              ausencia por viaje.
            </p>
          </motion.div>

          <motion.div
            className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 dark:from-amber-500/20 dark:to-orange-500/20 p-6 rounded-xl border border-amber-200/20 dark:border-amber-500/30"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.6 }}
          >
            <div className="flex items-center mb-4">
              <div className="bg-amber-500/20 dark:bg-amber-500/30 p-2 rounded-full mr-3">
                <HeartHandshake className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="text-lg font-semibold">6. Declaración de Sucesiones</h3>
            </div>
            <p className="text-muted-foreground text-sm">
              Asistencia completa para el trámite de declaración de sucesiones ante el SENIAT, incluyendo revisión de
              documentos y orientación.
            </p>
          </motion.div>

          <motion.div
            className="bg-gradient-to-br from-pink-500/10 to-rose-500/10 dark:from-pink-500/20 dark:to-rose-500/20 p-6 rounded-xl border border-pink-200/20 dark:border-pink-500/30"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.7 }}
          >
            <div className="flex items-center mb-4">
              <div className="bg-pink-500/20 dark:bg-pink-500/30 p-2 rounded-full mr-3">
                <User className="w-5 h-5 text-pink-600 dark:text-pink-400" />
              </div>
              <h3 className="text-lg font-semibold">7. Justificativo de soltería</h3>
            </div>
            <p className="text-muted-foreground text-sm">
              Documento requerido para contraer matrimonio, válido tanto en territorio nacional como en el exterior a
              través de consulados.
            </p>
          </motion.div>

          <motion.div
            className="bg-gradient-to-br from-pink-500/10 to-rose-500/10 dark:from-pink-500/20 dark:to-rose-500/20 p-6 rounded-xl border border-pink-200/20 dark:border-pink-500/30"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.8 }}
          >
            <div className="flex items-center mb-4">
              <div className="bg-pink-500/20 dark:bg-pink-500/30 p-2 rounded-full mr-3">
                <User className="w-5 h-5 text-pink-600 dark:text-pink-400" />
              </div>
              <h3 className="text-lg font-semibold">8. Poder especial o general</h3>
            </div>
            <p className="text-muted-foreground text-sm">
              Autorización para que una persona de confianza le represente en asuntos específicos o generales,
              incluyendo contratos y gestiones legales.
            </p>
          </motion.div>

          <motion.div
            className="bg-gradient-to-br from-blue-600/10 to-violet-600/10 dark:from-blue-600/20 dark:to-violet-600/20 p-6 rounded-xl border border-blue-300/20 dark:border-blue-600/30"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.9 }}
          >
            <div className="flex items-center mb-4">
              <div className="bg-blue-600/20 dark:bg-blue-600/30 p-2 rounded-full mr-3">
                <Briefcase className="w-5 h-5 text-blue-700 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold">9. Constitución de empresa PYME</h3>
            </div>
            <p className="text-muted-foreground text-sm">
              Documento para la creación y registro de pequeñas y medianas empresas donde usted, su cónyuge, padres o
              hijos sean accionistas.
            </p>
          </motion.div>

          <motion.div
            className="bg-gradient-to-br from-blue-600/10 to-violet-600/10 dark:from-blue-600/20 dark:to-violet-600/20 p-6 rounded-xl border border-blue-300/20 dark:border-blue-600/30"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 1.0 }}
          >
            <div className="flex items-center mb-4">
              <div className="bg-blue-600/20 dark:bg-blue-600/30 p-2 rounded-full mr-3">
                <Briefcase className="w-5 h-5 text-blue-700 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold">10. Acta de Asamblea de Accionistas</h3>
            </div>
            <p className="text-muted-foreground text-sm">
              Documento para formalizar decisiones de accionistas, como aumentos de capital por reconversiones
              monetarias en Venezuela.
            </p>
          </motion.div>

          <motion.div
            className="bg-gradient-to-br from-teal-500/10 to-cyan-500/10 dark:from-teal-500/20 dark:to-cyan-500/20 p-6 rounded-xl border border-teal-200/20 dark:border-teal-500/30"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 1.1 }}
          >
            <div className="flex items-center mb-4">
              <div className="bg-teal-500/20 dark:bg-teal-500/30 p-2 rounded-full mr-3">
                <Globe className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              </div>
              <h3 className="text-lg font-semibold">11. Poder desde el exterior</h3>
            </div>
            <p className="text-muted-foreground text-sm">
              Autorización otorgada desde el exterior para que personas de confianza le representen legalmente en
              Venezuela, gestionando sus bienes y trámites.
            </p>
          </motion.div>

          <motion.div
            className="bg-gradient-to-br from-emerald-500/10 to-green-600/10 dark:from-emerald-500/20 dark:to-green-600/20 p-6 rounded-xl border border-emerald-200/20 dark:border-emerald-500/30"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 1.2 }}
          >
            <div className="flex items-center mb-4">
              <div className="bg-emerald-500/20 dark:bg-emerald-500/30 p-2 rounded-full mr-3">
                <CreditCard className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="text-lg font-semibold">12. Certificación de ingresos y Balance personal</h3>
            </div>
            <p className="text-muted-foreground text-sm">
              Documentos que certifican su situación financiera como profesional independiente o comerciante para
              trámites con instituciones financieras y entes gubernamentales.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Documents by Category Section - Desktop View with Tabs */}
      <section className="container mx-auto px-4 py-16 hidden md:block">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-600 dark:from-blue-400 dark:to-purple-500">
            Documentos por categoría
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Explora nuestros documentos organizados por tipo de protección
          </p>
        </motion.div>

        <Tabs defaultValue={legalDocuments[0].category} className="w-full space-between-4">
          <TabsList className="w-full bg-muted/50 p-1 rounded-lg flex flex-wrap justify-center mb-8">
            {legalDocuments.map((category) => (
              <TabsTrigger
                key={category.category}
                value={category.category}
                className="flex items-center gap-2 py-2 px-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md transition-colors"
              >
                <category.icon className="w-5 h-5" />
                <span>{category.category}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {legalDocuments.map((category) => (
            <TabsContent key={category.category} value={category.category}>
              <motion.div
                className={`p-8 rounded-xl bg-gradient-to-br ${category.color} bg-opacity-10 border border-border`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-center mb-6">
                  <div className="bg-background/30 p-3 rounded-full mr-4">
                    <category.icon className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-bold">Protección {category.category}</h3>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {category.documents.map((doc, idx) => (
                    <motion.div
                      key={idx}
                      className="bg-background/30 backdrop-blur-sm p-6 rounded-lg border border-border"
                      whileHover={{ scale: 1.02 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <h4 className="text-xl font-semibold mb-2">{doc.title}</h4>
                      <p className="text-muted-foreground">{doc.description}</p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </TabsContent>
          ))}
        </Tabs>
      </section>

      {/* Documents by Category Section - Mobile View with Accordion */}
      <section className="container mx-auto px-4 py-16 md:hidden">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-600 dark:from-blue-400 dark:to-purple-500">
            Documentos por categoría
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Explora nuestros documentos organizados por tipo de protección
          </p>
        </motion.div>

        <Accordion type="single" collapsible className="w-full">
          {legalDocuments.map((category, idx) => (
            <AccordionItem key={idx} value={category.category} className="border-b border-border">
              <AccordionTrigger className="py-4 flex items-center">
                <div className="flex items-center">
                  <div className={`bg-gradient-to-r ${category.color} p-2 rounded-full mr-3`}>
                    <category.icon className="w-5 h-5" />
                  </div>
                  <span>Protección {category.category}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 pt-2 pb-4">
                  {category.documents.map((doc, docIdx) => (
                    <div key={docIdx} className="bg-card/50 p-4 rounded-lg border border-border">
                      <h4 className="text-lg font-medium mb-2">{doc.title}</h4>
                      <p className="text-muted-foreground text-sm">{doc.description}</p>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      {/* Why Choose Us Section */}
      <section className="container mx-auto px-4 py-16 bg-muted/30 backdrop-blur-sm rounded-xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-600 dark:from-blue-400 dark:to-purple-500">
            ¿Por qué elegirnos?
          </h2>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {[
            {
              icon: DollarSign,
              title: "Precio único y sin sorpresas",
              description: "Todo incluido por solo $36 al año, equivalente a $3 al mes.",
            },
            {
              icon: Clock,
              title: "Facilidad y rapidez",
              description: "Obtén tus documentos en pocos pasos, desde cualquier dispositivo.",
            },
            {
              icon: Lock,
              title: "Seguridad y confidencialidad",
              description: "Tus datos están protegidos con los más altos estándares de seguridad.",
            },
          ].map((feature, index) => (
            <motion.div key={index} className="p-6 rounded-lg text-center" variants={itemVariants}>
              <div className="bg-primary/20 p-4 rounded-full inline-flex items-center justify-center mb-4">
                <feature.icon className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Ideal For Section */}
      <section className="container mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-600 dark:from-blue-400 dark:to-purple-500">
            Ideal para
          </h2>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {[
            {
              icon: Briefcase,
              title: "Emprendedores",
              description:
                "Que necesitan contratos o acuerdos para su negocio sin gastar en costosos servicios legales.",
            },
            {
              icon: User,
              title: "Personas",
              description: "Que gestionan trámites personales como poderes, cartas y otros documentos legales.",
            },
            {
              icon: Building,
              title: "Pequeñas empresas",
              description: "Que buscan ahorrar en servicios legales sin comprometer la calidad y seguridad.",
            },
          ].map((feature, index) => (
            <motion.div
              key={index}
              className="bg-card/50 backdrop-blur-sm p-6 rounded-lg border border-border"
              variants={itemVariants}
              whileHover={{ scale: 1.05 }}
            >
              <feature.icon className="w-12 h-12 mb-4 text-primary mx-auto" />
              <h3 className="text-xl font-semibold mb-2 text-center">{feature.title}</h3>
              <p className="text-muted-foreground text-center">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Testimonials Section */}
      <section className="container mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-600 dark:from-blue-400 dark:to-purple-500">
            Lo que dicen nuestros clientes
          </h2>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              className="bg-card/50 backdrop-blur-sm p-6 rounded-lg border border-border"
              variants={itemVariants}
            >
              <div className="flex items-center mb-4">
                <img
                  src={testimonial.avatar || "/placeholder.svg"}
                  alt={testimonial.name}
                  className="w-12 h-12 rounded-full mr-4"
                />
                <div>
                  <h4 className="font-semibold">{testimonial.name}</h4>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                </div>
              </div>
              <p className="text-muted-foreground italic">&ldquo;{testimonial.content}&rdquo;</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Partners Section */}
      <section className="container mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-600 dark:from-blue-400 dark:to-purple-500">
            Nuestros aliados
          </h2>
        </motion.div>

        <motion.div
          className="flex flex-wrap justify-center items-center gap-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {partners.map((partner, index) => (
            <motion.div
              key={index}
              className="bg-card/50 backdrop-blur-sm p-4 rounded-lg border border-border"
              variants={itemVariants}
              whileHover={{ scale: 1.05 }}
            >
              <img src={partner.logo || "/placeholder.svg"} alt={partner.name} className="h-10 object-contain" />
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Final CTA Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <motion.div
          className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 dark:from-blue-500/30 dark:to-purple-500/30 p-10 rounded-2xl border border-blue-200/20 dark:border-blue-500/30"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl font-bold mb-4">¡No esperes más!</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Simplifica tu vida legal hoy mismo. Por solo $3 al mes, tendrás la tranquilidad de contar con un aliado
            legal confiable y accesible.
          </p>
          <Button
            size="lg"
            className="bg-primary hover:bg-primary/90 text-primary-foreground text-lg px-8 py-6 rounded-full transition-colors"
          >
            Contrata ahora y obtén tu primer documento en minutos <CheckCircle className="ml-2" />
          </Button>
        </motion.div>
      </section>
    </div>
  )
}