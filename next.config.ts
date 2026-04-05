import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export for Capacitor Android packaging
  output: "export",
  // Disable image optimization for static export (Capacitor bundles assets locally)
  images: {
    unoptimized: true,
  },
  // Trailing slash for correct asset resolution in Capacitor WebView
  trailingSlash: true,
};

export default nextConfig;
