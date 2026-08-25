import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // App volta a ser 100% client-side: a análise de currículos chama o
  // Gemini via Firebase AI Logic direto do navegador, sem servidor nosso.
  output: "export",
};

export default nextConfig;
