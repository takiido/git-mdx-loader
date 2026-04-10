import matter from "gray-matter";
import ReactMarkdown from "react-markdown";
import type {
  FrontmatterData,
  MarkdownArticle,
  MarkdownDateFormat,
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
    rawFrontmatter: typeof parsed.matter === "string" && parsed.matter.length > 0 ? parsed.matter : source,
    content: parsed.content,
  };
}

function extractRawDate(rawFrontmatter: unknown) {
  if (typeof rawFrontmatter !== "string" || rawFrontmatter.length === 0) {
    return undefined;
  }

  const block = rawFrontmatter.match(/^---\s*\n([\s\S]*?)\n---/);
  const frontmatter = block?.[1] ?? rawFrontmatter;
  const match = frontmatter.match(/^date:\s*(.+)$/m);
  return match?.[1]?.trim();
}

function formatDate(article: MarkdownArticle<FrontmatterData>, dateFormat: MarkdownDateFormat) {
  if (dateFormat === "date") {
    return extractRawDate(article.rawFrontmatter);
  }

  return article.frontmatter.date;
}

function displayDate(date: string | Date | undefined) {
  if (!date) {
    return null;
  }

  return date instanceof Date ? date.toString() : date;
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
  dateFormat = "raw",
  renderMeta,
}: MarkdownArticleViewProps<TFrontmatter>) {
  const frontmatter = article.frontmatter as FrontmatterData;
  const date = formatDate(article, dateFormat);
  const defaultMeta =
    frontmatter.title || date || frontmatter.tags?.length ? (
      <header>
        {frontmatter.title ? <h1>{frontmatter.title}</h1> : null}
        {displayDate(date) ? <p>{displayDate(date)}</p> : null}
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
      {renderMeta ? renderMeta({ article, frontmatter: article.frontmatter, date }) : defaultMeta}
      <MarkdownRenderer content={article.content} components={components} className={className} />
    </article>
  );
}
