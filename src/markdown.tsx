import matter from "gray-matter";
import ReactMarkdown from "react-markdown";
import type {
  FrontmatterData,
  MarkdownArticle,
  MarkdownArticleViewProps,
  MarkdownRendererProps,
} from "./types.js";

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

export function MarkdownArticleView<TFrontmatter extends FrontmatterData = FrontmatterData>({
  article,
  components,
  className,
  renderMeta,
}: MarkdownArticleViewProps<TFrontmatter>) {
  const frontmatter = article.frontmatter as FrontmatterData;
  const defaultMeta =
    frontmatter.title || frontmatter.date || frontmatter.tags?.length ? (
      <header>
        {frontmatter.title ? <h1>{frontmatter.title}</h1> : null}
        {frontmatter.date ? <p>{frontmatter.date}</p> : null}
        {frontmatter.tags?.length ? (
          <ul>
            {frontmatter.tags.map((tag) => (
              <li key={tag}>{tag}</li>
            ))}
          </ul>
        ) : null}
      </header>
    ) : null;

  return (
    <article>
      {renderMeta ? renderMeta({ article, frontmatter: article.frontmatter }) : defaultMeta}
      <MarkdownRenderer content={article.content} components={components} className={className} />
    </article>
  );
}
