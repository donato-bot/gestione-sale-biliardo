import './globals.css'

export const metadata = {
  title: 'Torre di Controllo - Il Campione',
  description: 'Gestionale avanzato per sale biliardo',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="it">
      <head>
        {/* Codici per far funzionare la Web-App sui cellulari */}
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Il Campione" />
      </head>
      <body>
        {/* Qui è dove Next.js disegnerà tutte le nostre pagine, Login compreso */}
        {children}
      </body>
    </html>
  )
}