"use client";

/** 根布局本身崩溃时的兜底，必须自带 html/body。 */
export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="zh-CN">
      <body
        style={{
          fontFamily: "system-ui, sans-serif",
          display: "flex",
          minHeight: "100dvh",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          margin: 0,
        }}
      >
        <h2>应用崩溃了</h2>
        <p style={{ color: "#71717a", maxWidth: "32rem", textAlign: "center" }}>{error.message}</p>
        <button type="button" onClick={reset} style={{ padding: "0.5rem 1rem", cursor: "pointer" }}>
          重试
        </button>
      </body>
    </html>
  );
}
