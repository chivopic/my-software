import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/** 笔记正文渲染。样式写在 globals.css 的 .markdown 里，避免每个元素挂一长串类名。 */
export function Markdown({ children }: { children: string }) {
  return (
    <div className="markdown">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
    </div>
  );
}
