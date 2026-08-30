import coreWebVitals from "eslint-config-next/core-web-vitals";
import typescriptConfig from "eslint-config-next/typescript";

const config = [
  {
    ignores: [".next/**", "node_modules/**", "next-env.d.ts", "lib/generated/**"],
  },
  ...coreWebVitals,
  ...typescriptConfig,
  {
    // eslint-plugin-react 的自动版本探测在 ESLint 10 下会崩，显式指定版本绕开。
    settings: { react: { version: "19.2" } },
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      // 必须是 separate（import type { X }）而不是 inline（import { type X }）：
      // 开了 verbatimModuleSyntax 后，内联写法仍会生成运行时 import，
      // 客户端组件从 lib/queries 只取类型时会把 pg 打进浏览器包。
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "separate-type-imports" },
      ],
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
];

export default config;
