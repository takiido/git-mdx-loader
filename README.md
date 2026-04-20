# git-mdx-loader

cache github article list in next.js.

## use

```ts
import { createSource } from "git-mdx-loader";

const source = createSource({
  owner: "your-github-user",
  repo: "your-articles-repo",
  folder: "articles",
  token: process.env.GITHUB_TOKEN,
  revalidateSeconds: 300,
  debug: true,
});

const articles = await source.listEntries();
const article = await source.getEntry("hello-world");
```

## api

- `createSource(options)`
- `source.listEntries()`
- `source.getEntry(slug)`
- `RenderContent`

## options

- `owner`: github owner
- `repo`: github repo name
- `folder`: folder with `.md` files
- `token`: github token for private repos
- `ref`: branch, tag, or commit
- `apiBaseUrl`: custom github api url
- `fetch`: custom fetch function
- `revalidateSeconds`: cache ttl in seconds, use `false` for forever
- `debug`: print short server logs

## entry

- `slug`
- `path`
- `filename`
- `createdAt`
- `content`
- `frontmatter`
- frontmatter parse is simple yaml-like fields only

## render

```tsx
import { RenderContent } from "git-mdx-loader";

<RenderContent content={entry.content} />
```

## notes

- set `cachecomponents: true` in `next.config.js`
- next.js 15 and 16 app router and server components only
- no markdown render here
- no update, delete, or webhook
- github list stored in next cache

## debug logs

- `[github-md] listEntries`
- `[github-md] listEntries`
- `[github-md] fetch GitHub directory`
- `[github-md] getEntry:hello-world`
- `[github-md] fetch GitHub file: hello-world.md`
- `[github-md] source unavailable: listEntries`
- `[github-md] source unavailable: hello-world.md`
