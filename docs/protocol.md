# Clip protocol

Send a URL with separately percent-encoded `vault` and `data` values:

```js
const url = `obsidian://popclip?vault=${encodeURIComponent(vault)}&data=${encodeURIComponent(JSON.stringify(clip))}`;
```

The Obsidian plugin handles the `popclip` action. Advanced URI is not involved.
Obsidian decodes the query before calling the handler, so the plugin does not
decode JSON fields or folder names a second time.

## Accepted fields

| Field | Type | Meaning/default |
| --- | --- | --- |
| `schemaVersion` | `2`, optional | Omit for legacy messages; other values are rejected. |
| `clipping` | Nonempty string | Required selected content; retained as sent. |
| `format` | `markdown` or `text` | Optional description of the content; no second content copy is needed. |
| `capturedAt` | ISO timestamp with timezone | Capture time; falls back to receipt time. |
| `title` | String | Optional source title. |
| `source` | String | Optional source URL; HTTP(S) URLs also provide `domain`. |
| `appName` | String | Source application display name. |
| `appIdentifier` | String | Source application bundle identifier. |
| `tags` | String array | Merged with plugin defaults; normalized and deduplicated. |
| `mode` | `create`, `append`, or `daily` | Overrides the plugin's default mode. |
| `path` | String | Create-mode folder; omitted uses plugin default; empty means vault root. |
| `target` | String | Append-mode Markdown filename; omitted uses plugin default. |
| `heading` | String | Append/daily section; omitted uses plugin default; empty means end of note. |
| `openAfterSave` | Boolean | Overrides the plugin's opening setting, including explicit `false`. |

`target`, `heading`, and `openAfterSave` are supported for custom snippets;
the standard README snippet uses Obsidian settings for these choices.

Unknown optional fields are ignored. Unsupported versions and malformed known
fields are rejected before file creation. Maximum decoded JSON size is 120,000
JavaScript characters, selected content is limited to 100,000 characters, each
optional text field to 4,096, and heading names to 200 characters on one line.
Tags allow at most 100 input values, each at most 100 characters. The standard
snippet separately rejects an encoded URL over 60,000 characters. These are
application limits, not guarantees that every OS/browser transports that size.

## Example

```json
{
  "schemaVersion": 2,
  "clipping": "A **useful** selection.",
  "format": "markdown",
  "capturedAt": "2026-09-19T18:00:00.000Z",
  "title": "An article",
  "source": "https://example.com/article",
  "appName": "Safari",
  "appIdentifier": "com.apple.Safari",
  "tags": ["research", "reading/web"],
  "mode": "append",
  "target": "Clippings/Inbox.md",
  "heading": "Reading",
  "openAfterSave": true
}
```

## Storage and guarantees

- New notes receive a unique filename and optional frontmatter.
- Append/daily entries retain per-clip metadata in the body and do not change
  destination frontmatter. Missing files/folders are created.
- Pending requests are handled in arrival order; one failure does not stop the
  queue. `Vault.process()` reads and updates existing notes atomically.
- Daily routing uses the capture instant in the machine's local timezone and
  the plugin's configured Moment date format.
- Heading matching uses Markdown source text, with optional leading `#`
  markers in the setting. It is case-sensitive and does not resolve links or
  inline formatting to rendered text. Duplicate matches are rejected.
- Failure to open a note after saving is reported separately from write failure.
- No content/source deduplication or request-ID deduplication is performed.
- `date` remains the save time for compatibility; `captured` is capture time.
- No network requests, external metadata extraction, or attachment downloads
  are made by the plugin.
