/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The preview host on Hearth serves this dev server behind Caddy at lossner.cora.
  // Next 16 blocks cross-origin dev-resource requests unless the host is listed here.
  allowedDevOrigins: ['lossner.cora'],
}

module.exports = nextConfig