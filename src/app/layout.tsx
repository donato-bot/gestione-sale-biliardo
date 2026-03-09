import "./globals.css";

export const metadata = {
  title: 'Torre di Controllo - Sale Biliardo',
  description: 'Gestione multi-tenant sale biliardo',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="it">
      <body>{children}</body>
    </html>
  )
}