import type { Components } from "react-markdown";

export interface SourceOptions {
  owner: string;
  repo: string;
  folder?: string;
  token?: string;
  ref?: string;
  apiBaseUrl?: string;
  fetch?: typeof fetch;
  revalidateSeconds?: number | false;
  debug?: boolean;
}

export interface ArticleSummary {
  slug: string;
  path: string;
  filename: string;
}

export interface Entry extends ArticleSummary {
  content: string;
  frontmatter: Record<string, unknown>;
}

export interface RenderContentProps {
  content: string;
  components?: Components;
  className?: string;
}

export interface Source {
  listEntries(): Promise<ArticleSummary[]>;
  getEntry(slug: string): Promise<Entry>;
}
