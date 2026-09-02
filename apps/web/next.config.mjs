/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@vanijya/shared-types', '@vanijya/shared-utils'],
  async rewrites() {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:4000';
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
      {
        source: '/uploads/:path*',
        destination: `${backendUrl}/api/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;
