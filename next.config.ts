import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  // GitHub Pages 部署在子路径下，需要配置 basePath
  // 格式：/仓库名
  basePath: "/ai-assessment",
  // 生成 index.html 子目录结构，解决直接访问子路径 404 问题
  trailingSlash: true,
  // 静态导出不支持图片优化
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
