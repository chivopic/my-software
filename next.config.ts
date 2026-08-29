import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: true,
  // AGENTS.md 是我们自己维护的执行规范，不让 next dev 往里追加托管段落。
  // Next 16 的 API 差异提示已手工写进 AGENTS.md 第 3 节。
  agentRules: false,
};

export default nextConfig;
