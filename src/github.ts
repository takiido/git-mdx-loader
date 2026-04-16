import { unstable_cache } from "next/cache";
import type { ArticleSummary, CacheMode, Entry, RequestOptions, Source, SourceOptions } from "./types.js";

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

type FetchOptions = {
  cache: CacheMode;
  next?: { revalidate: number };
};

function resolveFetchOptions(sourceDefaults: RequestOptions, requestOverrides?: RequestOptions): FetchOptions {
  const cache = requestOverrides?.cache ?? sourceDefaults.cache ?? "default";
  const revalidateSeconds = requestOverrides?.revalidateSeconds ?? sourceDefaults.revalidateSeconds ?? 300;

  if (cache === "no-store") {
    return { cache };
  }

  if (revalidateSeconds === false) {
    return { cache };
  }

  return {
    cache,
    next: { revalidate: revalidateSeconds },
  };
}

function parseValue(value: string) {
  const trimmed = value.trim();

  if (trimmed === "true") return true;
  if (trimmed === "false") return false;
  if (trimmed === "null") return null;
  if (/^-?\d+(?:\.\d+)?$/.test(trimmed)) return Number(trimmed);
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1);
  }

  return trimmed;
}

function parseFrontmatter(source: string) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);

  if (!match) {
    return { content: source, frontmatter: {} as Record<string, unknown> };
  }

  const frontmatter: Record<string, unknown> = {};
  let currentKey = "";

  for (const rawLine of match[1].split(/\r?\n/)) {
    if (!rawLine.trim()) continue;

    const keyValue = rawLine.match(/^([A-Za-z0-9_-]+):(?:\s*(.*))?$/);
    if (keyValue) {
      const key = keyValue[1];
      const value = keyValue[2] ?? "";

      if (!value) {
        frontmatter[key] = [];
        currentKey = key;
      } else {
        frontmatter[key] = parseValue(value);
        currentKey = "";
      }

      continue;
    }

    const listItem = rawLine.match(/^\s*-\s+(.*)$/);
    if (listItem && currentKey && Array.isArray(frontmatter[currentKey])) {
      (frontmatter[currentKey] as unknown[]).push(parseValue(listItem[1]));
    }
  }

  return {
    content: source.slice(match[0].length),
    frontmatter,
  };
}

async function readJson<T>(response: Response): Promise<T> {
  if (!response.ok) throw new Error(`github request failed with status ${response.status}`);
  return (await response.json()) as T;
}

async function readText(response: Response): Promise<string> {
  if (!response.ok) throw new Error(`github request failed with status ${response.status}`);
  return await response.text();
}

export function createSource(options: SourceOptions): Source {
  const fetchImpl = resolveFetch(options.fetch);
  const folder = cleanFolder(options.folder);
  const baseUrl = options.apiBaseUrl ?? "https://api.github.com";
  const defaults: RequestOptions = {
    cache: options.cache ?? "default",
    revalidateSeconds: options.revalidateSeconds ?? 300,
  };
  const debug = options.debug ?? false;
  const cacheVersion = "2";

  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  const rawHeaders: Record<string, string> = {
    Accept: "application/vnd.github.raw",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  if (options.token) headers.Authorization = `Bearer ${options.token}`;
  if (options.token) rawHeaders.Authorization = `Bearer ${options.token}`;

  function cacheOptions(revalidate: number | false) {
    return revalidate === false ? undefined : { revalidate };
  }

  function logFetchOptions(label: string, fetchOptions: FetchOptions) {
    if (!debug) return;
    const revalidate = fetchOptions.next?.revalidate;
    log(debug, `${label} cache=${fetchOptions.cache}${revalidate ? ` revalidate=${revalidate}` : ""}`);
  }

  async function loadList(requestOptions?: RequestOptions): Promise<ArticleSummary[]> {
    const fetchOptions = resolveFetchOptions(defaults, requestOptions);
    logFetchOptions("listEntries", fetchOptions);

    try {
      const url = apiUrl(baseUrl, options.owner, options.repo, folder, options.ref);
      log(debug, "fetch GitHub directory");
      const response = await fetchImpl(url, { headers, ...fetchOptions });
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

  const cacheKey = ["github-md", cacheVersion, options.owner, options.repo, folder, options.ref ?? ""].join(":");
  function listCacheKey(requestOptions?: RequestOptions) {
    const fetchOptions = resolveFetchOptions(defaults, requestOptions);
    return [cacheKey, fetchOptions.cache, fetchOptions.next?.revalidate ?? ""].join(":");
  }

  async function loadArticle(slug: string, requestOptions?: RequestOptions): Promise<Entry> {
    const fetchOptions = resolveFetchOptions(defaults, requestOptions);
    const cleanSlug = slug.replace(/^\/+/, "").replace(/\.(md)$/, "");
    const path = folder ? `${folder}/${cleanSlug}.md` : `${cleanSlug}.md`;

    logFetchOptions(`getEntry:${cleanSlug}`, fetchOptions);

    return fetchOptions.cache === "no-store"
      ? fetchArticle(path, fetchOptions)
      : unstable_cache(
          () => fetchArticle(path, fetchOptions),
          [cacheKey, cleanSlug, fetchOptions.cache, String(fetchOptions.next?.revalidate ?? "")],
          cacheOptions(fetchOptions.next?.revalidate ?? false),
        )();
  }

  async function fetchArticle(path: string, fetchOptions: FetchOptions): Promise<Entry> {
    try {
      log(debug, `fetch GitHub file: ${path.split("/").pop() ?? path}`);
      const url = apiUrl(baseUrl, options.owner, options.repo, path, options.ref);
      const response = await fetchImpl(url, { headers: rawHeaders, ...fetchOptions });
      const content = await readText(response);
      const parsed = parseFrontmatter(content);
      const filename = path.split("/").pop() ?? path;

      return {
        slug: slugFromPath(path, folder),
        path,
        filename,
        content: parsed.content,
        frontmatter: parsed.frontmatter,
      };
    } catch {
      warn(debug, `source unavailable: ${path.split("/").pop() ?? path}`);
      const filename = path.split("/").pop() ?? path;
      return {
        slug: slugFromPath(path, folder),
        path,
        filename,
        content: "",
        frontmatter: {},
      };
    }
  }

  return {
    listEntries(requestOptions?: RequestOptions) {
      const fetchOptions = resolveFetchOptions(defaults, requestOptions);
      const cacheKeyParts = [listCacheKey(requestOptions)];

      if (fetchOptions.cache === "no-store") {
        return loadList(requestOptions);
      }

      return unstable_cache(() => loadList(requestOptions), cacheKeyParts, cacheOptions(fetchOptions.next?.revalidate ?? false))();
    },
    getEntry(slug: string, requestOptions?: RequestOptions) {
      return loadArticle(slug, requestOptions);
    },
  };
}
