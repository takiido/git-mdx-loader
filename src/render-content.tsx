import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeHighlight from "rehype-highlight";
import rehypeKatex from "rehype-katex";
import type { RenderContentProps } from "./types.js";

export function RenderContent({ content, components, className }: RenderContentProps) {
  return (
    <div className={className}>
      <Markdown 
        remarkPlugins={[remarkGfm, remarkMath]} 
        rehypePlugins={[rehypeKatex, rehypeHighlight]}
        components={components}>
          {content}
      </Markdown>
    </div>
  );
}
