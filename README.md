# git-mdx-loader

Load markdown articles from a GitHub repo and render them in React / Next.js.

## v0.1.0

This first version supports:

- GitHub repo source via the GitHub API
- `.md` files only
- frontmatter parsing with `gray-matter`
- React rendering with `react-markdown`

## Usage

```ts
import { createGitHubMarkdownSource } from "git-mdx-loader";

export const source = createGitHubMarkdownSource({
  owner: "your-github-user",
  repo: "your-articles-repo",
  ref: "main",
  directory: "articles",
  token: process.env.GITHUB_TOKEN,
});
```

### List articles

```ts
const articles = await source.listArticles();
```

Each item includes:

- `slug`
- `path`
- `filename`
- `frontmatter`

### Load a single article

```ts
const article = await source.getArticle("my-post");
```

### Render article content

```tsx
import { MarkdownArticleView } from "git-mdx-loader";

export default function ArticlePage() {
  return <MarkdownArticleView article={article} />;
}
```

## Frontmatter

Example markdown file:

```md
---
title: Hello world
description: My first post
date: 2026-04-10
tags:
  - nextjs
  - markdown
---

# Hello world

This is my article.
```

## API

### `createGitHubMarkdownSource(options)`

Options:

- `owner`: GitHub owner
- `repo`: GitHub repository name
- `token`: optional GitHub token for private repos
- `ref`: branch, tag, or commit
- `directory`: folder containing markdown files, defaults to `articles`
- `apiBaseUrl`: optional GitHub API base URL
- `fetch`: optional custom fetch implementation

Returns:

- `listArticles()`
- `getArticle(slug)`

### `MarkdownRenderer`

Low-level renderer for markdown content.

### `MarkdownArticleView`

Renders a parsed article object.

Supports a `renderMeta` prop for custom metadata layouts like title, date, and tags.

### `parseMarkdown(source, slug, path, filename)`

Parses markdown and frontmatter into the internal article shape.

## Notes

- This version is markdown only, not MDX.
- Rendering happens on the server in Next.js.
- For private repos, pass a GitHub token.
