import { unstable_cache } from "next/cache";
import type { ArticleSummary, Source, SourceOptions } from "./types.js";

type GitHubItem = {
  type: string;
  path: string;
  name: string;
};

function log(debug: boolean | undefined, message: string) {
  if (debug) console.log(`[github-md] ${message}`);
}

function warn(debug: boolean | undefined, message: string) {
  if (debug) console.warn(`[github-md] ${message}`);
}

function resolveFetch(fetchImpl?: typeof fetch) {
  if (fetchImpl) return fetchImpl;
  if (typeof fetch === "undefined") throw new Error("fetch is not available in this runtime.");
  return fetch;
}

function cleanFolder(folder = "") {
  return folder.replace(/^\/+|\/+$/g, "");
}

function slugFromPath(path: string, folder: string) {
  const prefix = folder ? `${folder}/` : "";
  const relative = prefix && path.startsWith(prefix) ? path.slice(prefix.length) : path;
  return relative.replace(/\.[^.\/]+$/, "");
}

function apiUrl(baseUrl: string, owner: string, repo: string, path: string, ref?: string) {
  const url = new URL(path ? `/repos/${owner}/${repo}/contents/${path}` : `/repos/${owner}/${repo}/contents`, baseUrl);
  if (ref) url.searchParams.set("ref", ref);
  return url;
}

async function readJson<T>(response: Response): Promise<T> {
  if (!response.ok) throw new Error(`github request failed with status ${response.status}`);
  return (await response.json()) as T;
}

export function createSource(options: SourceOptions): Source {
  const fetchImpl = resolveFetch(options.fetch);
  const folder = cleanFolder(options.folder);
  const baseUrl = options.apiBaseUrl ?? "https://api.github.com";
  const revalidate = options.revalidateSeconds ?? 300;
  const debug = options.debug ?? false;

  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  if (options.token) headers.Authorization = `Bearer ${options.token}`;

  function cacheOptions() {
    return revalidate === false ? undefined : { revalidate };
  }

  async function loadList(): Promise<ArticleSummary[]> {
    log(debug, "listEntries");

    try {
      const url = apiUrl(baseUrl, options.owner, options.repo, folder, options.ref);
      log(debug, "fetch GitHub directory");
      const response = await fetchImpl(url, { headers });
      const data = await readJson<GitHubItem | GitHubItem[]>(response);
      const items = Array.isArray(data) ? data : [data];

      return items
        .filter((item) => item.type === "file" && item.name.endsWith(".md"))
        .map((item) => ({
          slug: slugFromPath(item.path, folder),
          path: item.path,
          filename: item.name,
        }));
    } catch {
      warn(debug, "source unavailable: listEntries");
      return [];
    }
  }

  const cacheKey = ["github-md", options.owner, options.repo, folder, options.ref ?? ""].join(":");
  const cachedList =
    revalidate === 0
      ? loadList
      : unstable_cache(loadList, [cacheKey, String(revalidate)], cacheOptions());

  async function loadArticle(slug: string): Promise<string> {
    const cleanSlug = slug.replace(/^\/+/, "").replace(/\.(md)$/, "");
    const path = folder ? `${folder}/${cleanSlug}.md` : `${cleanSlug}.md`;

    log(debug, `getEntry: ${cleanSlug}`);

    return revalidate === 0
      ? fetchArticle(path)
      : unstable_cache(() => fetchArticle(path), [cacheKey, cleanSlug, String(revalidate)], cacheOptions())();
  }

  async function fetchArticle(path: string) {
    try {
      log(debug, `fetch GitHub file: ${path.split("/").pop() ?? path}`);
      const url = apiUrl(baseUrl, options.owner, options.repo, path, options.ref);
      const response = await fetchImpl(url, { headers });
      return await response.text();
    } catch {
      warn(debug, `source unavailable: ${path.split("/").pop() ?? path}`);
      return "";
    }
  }

  return {
    listEntries() {
      return cachedList();
    },
    getEntry(slug: string) {
      return loadArticle(slug);
    },
  };
}
