import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  // GitHub Pages 部署在子路径下，需要配置 basePath
  // 格式：/仓库名
  basePath: "/ai-assessment",
  // 静态导出不支持图片优化
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
