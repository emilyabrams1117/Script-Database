import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdf-parse (via pdfjs-dist) resolves its worker script relative to its own
  // file on disk at runtime; bundling it rewrites that path and breaks it.
  // Opting out of bundling lets Node's native require find the real file.
  serverExternalPackages: ["pdf-parse", "pdfjs-dist"],
};

export default nextConfig;
