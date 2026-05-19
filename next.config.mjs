/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      // Field-agent PWA — static files live in public/field/. Without these
      // rewrites Next.js doesn't auto-serve index.html for /field or /field/.
      { source: "/field", destination: "/field/index.html" },
      { source: "/field/", destination: "/field/index.html" },
    ];
  },
};

export default nextConfig;
