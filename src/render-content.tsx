import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { RenderContentProps } from "./types.js";

export function RenderContent({ content, components, className }: RenderContentProps) {
  return (
    <div className={className}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>{content}</ReactMarkdown>
    </div>
  );
}
