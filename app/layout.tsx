import type { Metadata } from 'next'
import './globals.css'
import 'leaflet/dist/leaflet.css'

export const metadata: Metadata = {
  title: {
    default: 'RAMX',
    template: '%s · RAMX',
  },
  description:
    'RAMX es una plataforma para proteger la identidad digital de mascotas, gestionar expedientes y facilitar su localización.',
}

const themeScript = `
(function () {
  try {
    var storedTheme = window.localStorage.getItem('ramx-theme');

    if (storedTheme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.style.colorScheme = 'dark';
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.style.colorScheme = 'light';
      window.localStorage.setItem('ramx-theme', 'light');
    }
  } catch (error) {}
})();
`

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  )
}