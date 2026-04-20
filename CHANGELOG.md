# changelog

## 0.4.1

- add `RenderContent` for markdown render
- add `createdAt` to article list entries
- let `RenderContent` accept render plugins

## 0.4.0

- this update doesn't mean anything. just bumping version for easier development

## 0.3.9

- load raw markdown for `getEntry(slug)`
- bump entry cache key to drop stale json cache

## 0.3.8

- remove `gray-matter`
- add local frontmatter parse
- keep `entry` object output

## 0.3.7

- add `entry` type
- parse frontmatter with `gray-matter`
- make `getEntry(slug)` return full entry object

## 0.3.6

- rename `listArticles()` to `listEntries()`
- rename `getArticle()` to `getEntry()`

## 0.3.5

- return empty result when github source is down
- add short debug warn for missing source

## 0.3.4

- add debug logs for list fetch flow

## 0.3.3

- cache `getEntry(slug)` by slug
- keep list cache separate from entry cache

## 0.3.2

- note `cachecomponents: true` in readme

## 0.3.1

- widen next peer range to support next 16

## 0.3.0

- add `createSource`
- cache github article list in next.js server cache
- add `listEntries()` api
