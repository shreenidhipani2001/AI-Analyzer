import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  env: {
    BACKEND_URL: process.env.BACKEND_URL ?? "http://localhost:8000",
  },
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
