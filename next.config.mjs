/** @type {import('next').NextConfig} */
const nextConfig = {
  swcMinify: true,
  compiler: {
    removeConsole: true,
  },
  typescript: {
    ignoreBuildErrors: true, // ignora errores de TypeScript
  },
  basePath: process.env.BASEPATH,
  // Configuración para evitar problemas con rutas dinámicas
  experimental: {
    serverComponentsExternalPackages: [],
  },
  // Configuración de generación estática
  output: 'standalone',
  redirects: async () => {
    return [
      {
        source: '/',
        destination: '/home',
        permanent: true,
        locale: false
      }
    ]
  }
}

export default nextConfig
