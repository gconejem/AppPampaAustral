/** @type {import('next').NextConfig} */
const nextConfig = {
  swcMinify: true,
  compiler: {
    removeConsole: { exclude: ["error"] },
  },
  typescript: {
    ignoreBuildErrors: true, // ignora errores de TypeScript
  },
  basePath: process.env.BASEPATH,
  // Configuración para evitar problemas con rutas dinámicas
  experimental: {
    serverComponentsExternalPackages: [],
  },
  // Headers CORS para app móvil
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: 'https://localhost' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
        ],
      },
    ]
  },
  // Configuración de generación estática
  //output: 'standalone',
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
