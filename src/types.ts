import type { Components } from "react-markdown";

export interface FrontmatterData {
  [key: string]: unknown;
  title?: string;
  description?: string;
  date?: string;
  tags?: string[];
  draft?: boolean;
}

export interface MarkdownArticle<TFrontmatter extends FrontmatterData = FrontmatterData> {
  slug: string;
  path: string;
  filename: string;
  frontmatter: TFrontmatter;
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
