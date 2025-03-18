"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  FileText,
  FileSignature,
  Calendar,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  MoreHorizontal,
  Search,
  Filter,
  Plus,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"

// ----- Datos y funciones de ejemplo -----
const documentCategories = [
  {
    id: "automovil",
    name: "Automóvil",
    icon: /* icono importado: */ require("lucide-react").Car,
    color: "text-blue-500 dark:text-blue-400",
    bgColor: "bg-blue-500/10 dark:bg-blue-500/20",
    documents: [{ id: "compra-venta-vehiculos", name: "Compra-venta de vehículos" }],
  },
  {
    id: "vivienda",
    name: "Vivienda",
    icon: require("lucide-react").Building,
    color: "text-green-500 dark:text-green-400",
    bgColor: "bg-green-500/10 dark:bg-green-500/20",
    documents: [
      { id: "declaracion-no-vivienda", name: "Declaración de no poseer vivienda" },
      { id: "compra-venta-vivienda", name: "Compra-venta de vivienda" },
    ],
  },
  {
    id: "viajero",
    name: "Viajero",
    icon: require("lucide-react").Plane,
    color: "text-purple-500 dark:text-purple-400",
    bgColor: "bg-purple-500/10 dark:bg-purple-500/20",
    documents: [
      { id: "autorizaciones-viaje", name: "Autorizaciones de viaje" },
      { id: "poder-representacion-viajes", name: "Poder para representación durante viajes" },
    ],
  },
  {
    id: "herencia",
    name: "Herencia",
    icon: require("lucide-react").HeartHandshake,
    color: "text-amber-500 dark:text-amber-400",
    bgColor: "bg-amber-500/10 dark:bg-amber-500/20",
    documents: [{ id: "declaracion-sucesiones", name: "Declaración de Sucesiones" }],
  },
  {
    id: "personal",
    name: "Personal",
    icon: require("lucide-react").User,
    color: "text-pink-500 dark:text-pink-400",
    bgColor: "bg-pink-500/10 dark:bg-pink-500/20",
    documents: [
      { id: "justificativo-solteria", name: "Justificativo de soltería" },
      { id: "poder-especial-general", name: "Poder especial o general" },
    ],
  },
  {
    id: "empresarial",
    name: "Empresarial",
    icon: require("lucide-react").Briefcase,
    color: "text-indigo-500 dark:text-indigo-400",
    bgColor: "bg-indigo-500/10 dark:bg-indigo-500/20",
    documents: [
      { id: "constitucion-empresa-pyme", name: "Constitución de empresa PYME" },
      { id: "acta-asamblea-accionistas", name: "Acta de Asamblea de Accionistas" },
    ],
  },
  {
    id: "migrante",
    name: "Migrante",
    icon: require("lucide-react").Globe,
    color: "text-teal-500 dark:text-teal-400",
    bgColor: "bg-teal-500/10 dark:bg-teal-500/20",
    documents: [{ id: "poder-desde-exterior", name: "Poder desde el exterior" }],
  },
  {
    id: "financiera",
    name: "Financiera",
    icon: require("lucide-react").CreditCard,
    color: "text-emerald-500 dark:text-emerald-400",
    bgColor: "bg-emerald-500/10 dark:bg-emerald-500/20",
    documents: [
      { id: "certificacion-ingresos", name: "Certificación de ingresos" },
      { id: "balance-personal", name: "Balance personal" },
    ],
  },
]

const requestsByCategory: Record<string, any[]> = {
  automovil: [
    {
      id: "AUTO-001",
      client: {
        name: "Carlos Rodríguez",
        email: "carlos@ejemplo.com",
        avatar: "/placeholder.svg?height=32&width=32",
      },
      documentType: "Compra-venta de vehículos",
      status: "completed",
      date: "2025-02-15",
      priority: "normal",
    },
    {
      id: "AUTO-002",
      client: {
        name: "Roberto Díaz",
        email: "roberto@ejemplo.com",
        avatar: "/placeholder.svg?height=32&width=32",
      },
      documentType: "Compra-venta de vehículos",
      status: "pending",
      date: "2025-02-22",
      priority: "high",
    },
  ],
  vivienda: [
    {
      id: "VIV-001",
      client: {
        name: "María González",
        email: "maria@ejemplo.com",
        avatar: "/placeholder.svg?height=32&width=32",
      },
      documentType: "Declaración de no poseer vivienda",
      status: "in-progress",
      date: "2025-02-18",
      priority: "high",
    },
    {
      id: "VIV-002",
      client: {
        name: "Roberto Díaz",
        email: "roberto@ejemplo.com",
        avatar: "/placeholder.svg?height=32&width=32",
      },
      documentType: "Compra-venta de vivienda",
      status: "pending",
      date: "2025-02-25",
      priority: "high",
    },
  ],
  viajero: [
    {
      id: "VIAJ-001",
      client: {
        name: "Juan Pérez",
        email: "juan@ejemplo.com",
        avatar: "/placeholder.svg?height=32&width=32",
      },
      documentType: "Autorizaciones de viaje",
      status: "pending",
      date: "2025-02-20",
      priority: "normal",
    },
  ],
  herencia: [
    {
      id: "HER-001",
      client: {
        name: "Elena Torres",
        email: "elena@ejemplo.com",
        avatar: "/placeholder.svg?height=32&width=32",
      },
      documentType: "Declaración de Sucesiones",
      status: "in-progress",
      date: "2025-02-19",
      priority: "normal",
    },
  ],
  personal: [
    {
      id: "PER-001",
      client: {
        name: "Ana Martínez",
        email: "ana@ejemplo.com",
        avatar: "/placeholder.svg?height=32&width=32",
      },
      documentType: "Poder especial o general",
      status: "completed",
      date: "2025-02-10",
      priority: "low",
    },
    {
      id: "PER-002",
      client: {
        name: "Carmen López",
        email: "carmen@ejemplo.com",
        avatar: "/placeholder.svg?height=32&width=32",
      },
      documentType: "Justificativo de soltería",
      status: "completed",
      date: "2025-02-12",
      priority: "normal",
    },
  ],
  empresarial: [
    {
      id: "EMP-001",
      client: {
        name: "Luis Sánchez",
        email: "luis@ejemplo.com",
        avatar: "/placeholder.svg?height=32&width=32",
      },
      documentType: "Constitución de empresa PYME",
      status: "pending",
      date: "2025-02-22",
      priority: "high",
    },
  ],
  migrante: [],
  financiera: [
    {
      id: "FIN-001",
      client: {
        name: "Elena Torres",
        email: "elena@ejemplo.com",
        avatar: "/placeholder.svg?height=32&width=32",
      },
      documentType: "Certificación de ingresos",
      status: "in-progress",
      date: "2025-02-19",
      priority: "normal",
    },
  ],
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case "completed":
      return <span className="bg-green-500 hover:bg-green-600 text-white rounded px-2 py-1 text-xs">Completado</span>
    case "in-progress":
      return <span className="bg-blue-500 hover:bg-blue-600 text-white rounded px-2 py-1 text-xs">En progreso</span>
    case "pending":
      return <span className="bg-amber-500 hover:bg-amber-600 text-white rounded px-2 py-1 text-xs">Pendiente</span>
    default:
      return <span className="border rounded px-2 py-1 text-xs">Desconocido</span>
  }
}

const getPriorityIcon = (priority: string) => {
  switch (priority) {
    case "high":
      return <AlertCircle className="h-4 w-4 text-red-500" />
    case "normal":
      return <CheckCircle2 className="h-4 w-4 text-blue-500" />
    case "low":
      return <HelpCircle className="h-4 w-4 text-gray-500" />
    default:
      return null
  }
}

const countAllRequests = () => {
  let count = 0
  Object.values(requestsByCategory).forEach((requests) => {
    count += requests.length
  })
  return count
}

const countCompletedRequests = () => {
  let count = 0
  Object.values(requestsByCategory).forEach((requests) => {
    count += requests.filter((r) => r.status === "completed").length
  })
  return count
}

const countPendingRequests = () => {
  let count = 0
  Object.values(requestsByCategory).forEach((requests) => {
    count += requests.filter((r) => r.status === "pending" || r.status === "in-progress").length
  })
  return count
}

// ----- Componente de la página -----
export default function DashboardPage() {
  const [mounted, setMounted] = useState(false)
  const [activeCategory, setActiveCategory] = useState(documentCategories[0].id)
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredRequests, setFilteredRequests] = useState<any[]>([])
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({})

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const requests = requestsByCategory[activeCategory] || []
    const filtered = requests.filter((request) =>
      request.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.documentType.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    setFilteredRequests(filtered)
  }, [searchTerm, activeCategory])

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }))
  }

  const navigateToDocumentForm = (categoryId: string, documentId: string) => {
    console.log(`Navegando a formulario: categoría ${categoryId}, documento ${documentId}`)
    setActiveCategory(categoryId)
  }

  if (!mounted) return null

  return (

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total de solicitudes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{countAllRequests()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Solicitudes completadas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{countCompletedRequests()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Solicitudes pendientes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{countPendingRequests()}</div>
            </CardContent>
          </Card>
        </div>

        <div className="mb-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle>Solicitudes de documentos</CardTitle>
                  <CardDescription>
                    Gestiona las solicitudes de documentos legales de tus clientes
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <FileText className="h-4 w-4 mr-2" />
                    Exportar
                  </Button>
                  <Button size="sm">
                    <FileSignature className="h-4 w-4 mr-2" />
                    Nueva solicitud
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue={documentCategories[0].id} value={activeCategory} onValueChange={setActiveCategory} className="w-full">
                <div className="flex items-center justify-between mb-6">
                  <TabsList className="bg-muted/50 p-1 rounded-lg">
                    {documentCategories.map((category) => (
                      <TabsTrigger key={category.id} value={category.id} className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                        <category.icon className="h-4 w-4" />
                        <span className="hidden md:inline">{category.name}</span>
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="search"
                        placeholder="Buscar solicitudes..."
                        className="pl-8 h-9 md:w-[200px] lg:w-[300px]"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon" className="h-9 w-9">
                          <Filter className="h-4 w-4" />
                          <span className="sr-only">Filtrar</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Filtrar por estado</DropdownMenuLabel>
                        <DropdownMenuItem>Todos</DropdownMenuItem>
                        <DropdownMenuItem>Completados</DropdownMenuItem>
                        <DropdownMenuItem>En progreso</DropdownMenuItem>
                        <DropdownMenuItem>Pendientes</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel>Filtrar por prioridad</DropdownMenuLabel>
                        <DropdownMenuItem>Todas</DropdownMenuItem>
                        <DropdownMenuItem>Alta</DropdownMenuItem>
                        <DropdownMenuItem>Normal</DropdownMenuItem>
                        <DropdownMenuItem>Baja</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {documentCategories.map((category) => (
                  <TabsContent key={category.id} value={category.id} className="mt-0">
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Cliente</TableHead>
                            <TableHead>Tipo de documento</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Prioridad</TableHead>
                            <TableHead className="w-[80px]"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredRequests.length > 0 ? (
                            filteredRequests.map((request) => (
                              <TableRow key={request.id}>
                                <TableCell className="font-medium">{request.id}</TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Avatar className="h-8 w-8">
                                      <AvatarImage src={request.client.avatar} alt={request.client.name} />
                                      <AvatarFallback>
                                        {request.client.name.substring(0, 2).toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <div className="font-medium">{request.client.name}</div>
                                      <div className="text-xs text-muted-foreground">{request.client.email}</div>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>{request.documentType}</TableCell>
                                <TableCell>{getStatusBadge(request.status)}</TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <span>{new Date(request.date).toLocaleDateString()}</span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    {getPriorityIcon(request.priority)}
                                    <span className="capitalize">{request.priority}</span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon">
                                        <MoreHorizontal className="h-4 w-4" />
                                        <span className="sr-only">Abrir menú</span>
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem>Ver detalles</DropdownMenuItem>
                                      <DropdownMenuItem>Editar solicitud</DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem className="text-destructive">
                                        Eliminar solicitud
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                                {requestsByCategory[category.id]?.length === 0
                                  ? "No hay solicitudes en esta categoría."
                                  : "No se encontraron solicitudes que coincidan con la búsqueda."}
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </motion.div>

  )
}
