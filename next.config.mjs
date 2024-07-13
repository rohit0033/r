/** @type {import('next').NextConfig} */
const nextConfig = {
    webpack: (config, { isServer }) => {
      if (!isServer) {
        config.resolve.fallback = {
          ...config.resolve.fallback,
          net: false,
          os: false,
          tls: false,
        };
      }
      return config;
    },
  };
  
  export default nextConfig;