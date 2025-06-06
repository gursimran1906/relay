import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  devIndicators: false,

  // Security headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://*.supabase.co https://*.stripe.com https://generativelanguage.googleapis.com;",
          },
        ],
      },
    ];
  },

  // Redirect HTTP to HTTPS in production
  async redirects() {
    return process.env.NODE_ENV === "production"
      ? [
          {
            source: "/(.*)",
            has: [
              {
                type: "header",
                key: "x-forwarded-proto",
                value: "http",
              },
            ],
            destination: "https://:host/:path*",
            permanent: true,
          },
        ]
      : [];
  },

  webpack: (config) => {
    // Fix for jose library module resolution
    config.resolve.fallback = {
      ...config.resolve.fallback,
      crypto: false,
      stream: false,
      util: false,
    };

    // Handle ESM modules properly
    config.experiments = {
      ...config.experiments,
      topLevelAwait: true,
    };

    // Specific fix for jose library
    config.resolve.alias = {
      ...config.resolve.alias,
      jose: require.resolve("jose"),
    };

    return config;
  },
  experimental: {
    esmExternals: true,
  },
  transpilePackages: ["jose"],
};

export default nextConfig;
