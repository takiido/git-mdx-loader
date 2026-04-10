import type { Components } from "react-markdown";
import type { ReactNode } from "react";

export interface FrontmatterData {
  [key: string]: unknown;
  title?: string;
  description?: string;
  date?: string | Date;
  tags?: string[];
  draft?: boolean;
}

export interface MarkdownArticle<TFrontmatter extends FrontmatterData = FrontmatterData> {
  slug: string;
  path: string;
  filename: string;
  frontmatter: TFrontmatter;
  rawFrontmatter: string;
  content: string;
}

export interface GitHubMarkdownSourceOptions {
  owner: string;
  repo: string;
  token?: string;
  ref?: string;
  directory?: string;
  apiBaseUrl?: string;
  fetch?: typeof fetch;
}

export interface GitHubMarkdownArticleSummary {
  slug: string;
  path: string;
  filename: string;
  frontmatter: FrontmatterData;
}

export interface MarkdownRendererProps {
  content: string;
  components?: Components;
  className?: string;
}

export interface MarkdownArticleMetaProps<TFrontmatter extends FrontmatterData = FrontmatterData> {
  article: MarkdownArticle<TFrontmatter>;
  frontmatter: TFrontmatter;
  date?: string | Date;
}

export type MarkdownDateFormat = "raw" | "date";

export interface MarkdownArticleViewProps<TFrontmatter extends FrontmatterData = FrontmatterData> {
  article: MarkdownArticle<TFrontmatter>;
  components?: Components;
  className?: string;
  dateFormat?: MarkdownDateFormat;
  renderMeta?: (props: MarkdownArticleMetaProps<TFrontmatter>) => ReactNode;
}
