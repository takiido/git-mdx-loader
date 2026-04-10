import type {
  GitHubMarkdownArticleSummary,
  GitHubMarkdownSourceOptions,
  MarkdownArticle,
} from "./types.js";
import { parseMarkdown } from "./markdown.js";

type GitHubDirectoryItem = {
  type: string;
  path: string;
  name: string;
};

function resolveFetch(fetchImpl?: typeof fetch) {
  if (fetchImpl) {
    return fetchImpl;
  }

  if (typeof fetch === "undefined") {
    throw new Error("Fetch is not available in this runtime.");
  }

  return fetch;
}

function normalizeDirectory(directory = "articles") {
  return directory.replace(/^\/+|\/+$/g, "");
}

function stripExtension(path: string) {
  return path.replace(/\.[^.\/]+$/, "");
}

function toSlug(path: string, directory: string) {
  const relative = path.startsWith(`${directory}/`) ? path.slice(directory.length + 1) : path;
  return stripExtension(relative);
}

function buildApiUrl(baseUrl: string, owner: string, repo: string, path: string, ref?: string) {
  const url = new URL(`/repos/${owner}/${repo}/contents/${path}`, baseUrl);
  if (ref) {
    url.searchParams.set("ref", ref);
  }
  return url;
}

async function readJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new Error(`GitHub request failed with status ${response.status}`);
  }

  return (await response.json()) as T;
}

async function readText(response: Response): Promise<string> {
  if (!response.ok) {
    throw new Error(`GitHub request failed with status ${response.status}`);
  }

  return await response.text();
}

export function createGitHubMarkdownSource(options: GitHubMarkdownSourceOptions) {
  const fetchImpl = resolveFetch(options.fetch);
  const apiBaseUrl = options.apiBaseUrl ?? "https://api.github.com";
  const directory = normalizeDirectory(options.directory);

  const jsonHeaders: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  const rawHeaders: Record<string, string> = {
    Accept: "application/vnd.github.raw",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  if (options.token) {
    jsonHeaders.Authorization = `Bearer ${options.token}`;
    rawHeaders.Authorization = `Bearer ${options.token}`;
  }

  async function loadArticleByPath<TFrontmatter extends Record<string, unknown> = Record<string, unknown>>(
    path: string,
  ): Promise<MarkdownArticle<TFrontmatter>> {
    const url = buildApiUrl(apiBaseUrl, options.owner, options.repo, path, options.ref);
    const response = await fetchImpl(url, { headers: rawHeaders });
    const source = await readText(response);
    const slug = toSlug(path, directory);

    return parseMarkdown<TFrontmatter>(source, slug, path, path.split("/").pop() ?? path);
  }

  async function listArticles(): Promise<GitHubMarkdownArticleSummary[]> {
    const url = buildApiUrl(apiBaseUrl, options.owner, options.repo, directory, options.ref);
    const response = await fetchImpl(url, { headers: jsonHeaders });
    const data = await readJson<GitHubDirectoryItem | GitHubDirectoryItem[]>(response);
    const items = Array.isArray(data) ? data : [data];

    const articles = await Promise.all(
      items.filter((item) => item.type === "file" && item.name.endsWith(".md")).map((item) => loadArticleByPath(item.path)),
    );

    return articles.map((article) => ({
      slug: article.slug,
      path: article.path,
      filename: article.filename,
      frontmatter: article.frontmatter,
    }));
  }

  async function getArticle<TFrontmatter extends Record<string, unknown> = Record<string, unknown>>(
    slug: string,
  ): Promise<MarkdownArticle<TFrontmatter>> {
    const normalizedSlug = slug.replace(/^\/+/, "").replace(/\.(md)$/, "");
    const articlePath = `${directory}/${normalizedSlug}.md`;
    return loadArticleByPath<TFrontmatter>(articlePath);
  }

  return { listArticles, getArticle };
}
