import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // App é 100% client-side (parseia o .xlsx no navegador, sem API routes
  // nem dados server-only) — exporta como site estático, sem depender de
  // runtime serverless na hospedagem.
  output: "export",
};

export default nextConfig;
