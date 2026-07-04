/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Keep the build resilient on Vercel: type/lint errors shouldn't block a preview deploy.
  // (CI runs `npm run lint` / `tsc` separately.)
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
