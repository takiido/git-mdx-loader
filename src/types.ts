import type { Components } from "react-markdown";

export type CacheMode = "default" | "force-cache" | "no-store";

export interface RequestOptions {
  cache?: CacheMode;
  revalidateSeconds?: number | false;
}

export interface SourceOptions {
  owner: string;
  repo: string;
  folder?: string;
  token?: string;
  ref?: string;
  apiBaseUrl?: string;
  fetch?: typeof fetch;
  cache?: CacheMode;
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
  listEntries(options?: RequestOptions): Promise<ArticleSummary[]>;
  getEntry(slug: string, options?: RequestOptions): Promise<Entry>;
}
