import matter from "gray-matter";
import ReactMarkdown from "react-markdown";
import type { MarkdownArticle, MarkdownRendererProps } from "./types.js";

export function parseMarkdown<TFrontmatter extends Record<string, unknown> = Record<string, unknown>>(
  source: string,
  slug: string,
  path: string,
  filename: string,
): MarkdownArticle<TFrontmatter> {
  const parsed = matter(source);

  return {
    slug,
    path,
    filename,
    frontmatter: parsed.data as TFrontmatter,
    content: parsed.content,
  };
}

export function MarkdownRenderer({ content, components, className }: MarkdownRendererProps) {
  return (
    <div className={className}>
      <ReactMarkdown components={components}>{content}</ReactMarkdown>
    </div>
  );
}

export function MarkdownArticleView<TFrontmatter extends Record<string, unknown> = Record<string, unknown>>({
  article,
  components,
  className,
}: {
  article: MarkdownArticle<TFrontmatter>;
  components?: MarkdownRendererProps["components"];
  className?: string;
}) {
  return <MarkdownRenderer content={article.content} components={components} className={className} />;
}
