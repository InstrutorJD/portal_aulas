import type { Metadata } from 'next'
import Link from 'next/link'
import './globals.css'

export const metadata: Metadata = {
  title: 'Checklist de Inspeção',
  description: 'Inspeção de equipamentos antes do turno',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <nav className="menu">
          <Link href="/">Inspeção</Link>
          <Link href="/historico">Histórico</Link>
        </nav>
        {children}
      </body>
    </html>
  )
}
