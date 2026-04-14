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

export interface Source {
  listArticles(): Promise<ArticleSummary[]>;
  getArticle(slug: string): Promise<string>;
}
