import './globals.css'

export const metadata = {
  title: 'FiberNet Conciliador',
  description: 'Conciliação financeira IXC × Sicoob — Telecom Fiber Net Ltda',
}

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
