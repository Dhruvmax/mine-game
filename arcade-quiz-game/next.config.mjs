/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Disable tracing to fix Windows permission issues
  experimental: {
    trace: false,
  },
  // Disable telemetry
  telemetry: false,
}

export default nextConfig
