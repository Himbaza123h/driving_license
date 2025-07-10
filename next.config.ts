/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable standalone output for Docker
  output: 'standalone',
  
  // Add any other configuration you need
  experimental: {
    // Enable if you need server actions
    serverActions: true,
  },
}

module.exports = nextConfig