"use client";

import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Shield, Zap, Users } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      <div className="container mx-auto px-4 py-8">
        <header className="flex justify-between items-center mb-16">
          <motion.h1
            className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            LegalDocs
          </motion.h1>
          <nav>
            <motion.div
              className="space-x-4"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Link href="/auth/login">
                <Button variant="ghost" className="text-white hover:text-blue-400 transition-colors">
                  Iniciar sesión
                </Button>
              </Link>
              <Link href="/auth/register">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white transition-colors">Registrarse</Button>
              </Link>
            </motion.div>
          </nav>
        </header>

        <main className="text-center">
          <motion.h2
            className="text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Documentos legales a tu alcance
          </motion.h2>
          <motion.p
            className="text-xl mb-8 max-w-2xl mx-auto text-gray-300"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Por solo $12 al año, obtén acceso a documentos legales genéricos. Perfecto para familias y individuos.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Button
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white text-lg px-8 py-4 rounded-full transition-colors"
            >
              Comienza ahora
            </Button>
          </motion.div>

          <motion.div
            className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            {[
              {
                icon: Shield,
                title: "Seguro y confiable",
                description: "Tus documentos protegidos con la más alta seguridad.",
              },
              { icon: Zap, title: "Rápido y eficiente", description: "Obtén tus documentos en minutos, no en días." },
              {
                icon: Users,
                title: "Para toda la familia",
                description: "Crea perfiles para cada miembro de la familia.",
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                className="bg-gray-800 bg-opacity-50 backdrop-blur-sm p-6 rounded-lg"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <feature.icon className="w-12 h-12 mb-4 text-blue-400 mx-auto" />
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </main>
      </div>
    </div>
  )
}
