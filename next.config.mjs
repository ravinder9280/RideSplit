/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  images: {
    domains: ["img.clerk.com","mjgabypipvmocqpgnytf.supabase.co"], // ✅ allow Clerk profile images
  },

  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
