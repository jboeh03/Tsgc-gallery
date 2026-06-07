/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Bundle the COO's soul.md into the serverless function so it's readable
    // at runtime on Vercel (lib/agents/coo.ts reads it as the system charter).
    outputFileTracingIncludes: {
      "/api/admin/coo": ["./lib/agents/soul.md"],
    },
  },
};

export default nextConfig;
