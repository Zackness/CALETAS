"use client"

import Link from "next/link"

export default function Footer() {
  return (
    <footer className="container mx-auto px-4 py-8 mt-16 border-t border-border">
    <div className="flex flex-col md:flex-row justify-between items-center">
      <p className="text-muted-foreground mb-4 md:mb-0">© 2025 LegalDocs. Todos los derechos reservados.</p>
      <div className="flex space-x-6">
        <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
          Términos y condiciones
        </a>
        <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
          Política de privacidad
        </a>
        <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
          Contacto
        </a>
      </div>
    </div>
  </footer>
  )
}
