import ReactMarkdown from "react-markdown";
import type { RenderContentProps } from "./types.js";

export function RenderContent({ content, components, className }: RenderContentProps) {
  return (
    <div className={className}>
      <ReactMarkdown components={components}>{content}</ReactMarkdown>
    </div>
  );
}
