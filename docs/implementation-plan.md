# PopClip 1.2 implementation plan

## Delivery status

Implemented as version 1.2.0. All 37 automated tests pass, the TypeScript and
production build pass, ESLint reports no errors or warnings, and the README's
YAML parses successfully. The installable snippet is 4,501 characters. Root,
distribution, and development-vault bundles/manifests are identical.

Independent review found Markdown comment/Setext edge cases, timestamp-offset
validation gaps, and title-filename issues; each received a regression test and
a fix. Tests also simulate write failure, concurrent first appends, concurrent
new-note creation, external edits, queue failure recovery, and opening failure.

The updated extension has not been reinstalled or exercised in live PopClip,
and the 1.2 settings screen/URI handler have not been smoke-tested in a running
Obsidian instance. No personal vault files or installed personal plugins were
changed. Templates, routing rules, and the other deferred items remain future
work, as scoped below.

## Goal and scope

Build the next release proposed in the discussion: richer clip metadata, tags,
new-note and append workflows, safe heading handling, daily-note destinations,
and an option to open the saved note. Keep installation possible by selecting
the README snippet, including its purple SVG icon.

This release does not include templates, website routing rules, attachment
downloads, AI processing, source-based merging, or multiple toolbar buttons.
Those remain later roadmap items; they require separate product choices and
are not needed for the capture workflows below.

## Current behavior

- The README snippet sends selected Markdown (plain text as fallback), folder,
  browser title, and source URL through the `obsidian://popclip` action.
- The plugin validates four fields and always creates a new note.
- New notes can contain frontmatter and a page-title heading.
- Filenames use a timestamp or the title/selection, with collision suffixes.
- Installation and transport are independent: the README selection limit is
  5,000 characters; clip data is sent later through a separate URL.

## Behavior and acceptance criteria

### 1. Versioned messages and metadata

- Accept unversioned messages from existing snippets and schema version 2.
- Reject unknown versions, wrong types, empty selections, invalid capture
  dates, invalid modes, invalid tags, and excessively large messages before
  writing. Limits are product safeguards, not claims about macOS URL limits.
- Add optional `capturedAt`, `format`, `appName`, `appIdentifier`, `tags`,
  `mode`, `target`, `heading`, and `openAfterSave` fields.
- Send only one content representation. Use `markdown` when available and
  `text` otherwise. Capture application context without additional requests.
- Retain the existing `date` property as the save time; add `captured` as the
  capture time. Derive `domain` from valid HTTP(S) source URLs in Obsidian.
- Quote strings using Obsidian's YAML serializer. Unicode, quotes, multiline
  titles, and URL query strings must round-trip without changing note structure.
- Merge plugin default tags with request tags; trim leading `#`, remove exact
  duplicates, allow nested/Unicode tags, and reject invalid tag characters.

### 2. Destination modes

| Mode | Result | Defaults |
| --- | --- | --- |
| Create | A separate note per clip | Existing timestamp/title behavior |
| Append | Append to one Markdown file; create it if absent | `Clippings/Inbox.md` |
| Daily | Append to the local-date note; create it if absent | `Daily notes/YYYY-MM-DD.md` |

- A request mode overrides the plugin's default mode.
- `path` remains the create-mode folder; an explicit empty folder means root.
- Append uses the request `target` or the configured append file.
- Daily uses the configured daily folder/date format and the capture timestamp
  converted to the machine's local timezone, including around midnight.
- Daily mode is independent of the core Daily notes plugin. Users can set the
  same folder and Moment date format; core templates are not applied.
- Missing parent folders are created, including nested folders.
- Validate paths before side effects: reject absolute paths, traversal using
  either slash style, hidden/configuration paths, and non-Markdown targets.
- Do not decode paths twice: a `%20` typed in a folder name is literal text.
- Keep create-mode filename collision handling and never overwrite a note.
- Append through `Vault.process()` so concurrent changes are retained; if two
  requests create the same target, the loser appends to the resulting file.

### 3. Appended entries and headings

- Keep the destination note's existing frontmatter and content intact.
- Each entry contains the clip plus its own capture time, title/source,
  application, format, and tags when metadata is enabled. Do not insert a
  second frontmatter block into the middle of an existing note.
- An empty heading appends at the end. A heading name appends at the end of
  that section, before the next heading of the same or higher level.
- Recognize ATX headings (`## Clips`) and Setext headings, but ignore heading
  lookalikes inside YAML frontmatter, fenced code, and HTML comments.
- Compare heading text exactly after trimming Markdown heading markers;
  if several headings match, report an ambiguity without modifying the note.
- For missing headings, settings choose either creating a level-2 heading or
  appending to the end. Missing headings must not produce the old fatal error.
- Preserve CRLF documents and ensure inserted content has paragraph spacing.

### 4. Settings and opening notes

- Retain the three existing options and load older settings with new defaults.
- Add default save mode, default create folder, default tags, append file,
  daily folder/date format, append heading, missing-heading behavior,
  open-after-save, and open-in-new-tab.
- Use standard Obsidian Setting controls and explain where each destination
  setting applies. Surface invalid input before committing it to settings.
- A request's explicit `openAfterSave` overrides the plugin setting.
- Open only after a successful write. If opening fails, report that the clip
  was saved but could not be opened; do not suggest that saving failed.
- Serialize incoming requests within the plugin so fast repeated clicks have
  predictable ordering. Failure of one request must not stop later requests.

### 5. PopClip snippet and installation

- Keep `identifier: ObsidianClipper` and the embedded full-color icon.
- Add tags and mode options, with mode defaulting to the Obsidian setting.
- Keep vault and folder configuration; explain that append/daily destinations
  are configured in Obsidian.
- Send version-2 metadata and correctly percent-encode all values as strings.
- Check the resulting URL length before opening it and provide a helpful
  message asking for a shorter selection if the configured limit is exceeded.
- Stay below 5,000 characters and verify actual YAML parsing plus execution of
  the JavaScript extracted from that YAML.
- Existing snippets continue to work with the updated plugin. Install the
  plugin first, then reinstall the README snippet for the new options/metadata.

## Implementation structure

| File/area | Responsibility |
| --- | --- |
| `global.d.ts` | Message, mode, and settings types |
| `settings.ts` | Defaults and safe loading of stored settings |
| `src/utils/popclip-data.ts` | Validate messages and tags |
| `src/utils/vault-path.ts` | Shared folder/file path validation |
| `src/utils/append-section.ts` | Pure Markdown section insertion |
| `src/modules/file-writer.ts` | Destination resolution, rendering, Vault writes |
| `src/modules/settings-tab.ts` | Settings controls and field validation |
| `main.ts` | Ordered handling, save notices, optional opening |
| `README.md` | Snippet, usage, upgrade steps, limitations |
| `test/` | Contract, filesystem behavior, error and concurrency tests |
| manifests and `dist/popclip` | Version 1.2.0 and installable build |

Reuse the existing TypeScript/esbuild/Node-test setup. No runtime dependency is
needed: Obsidian supplies Moment, YAML serialization, settings, and Vault APIs.
Raise `minAppVersion` to 1.1.0 because that is when `Vault.process()` was added.

## Effects and failure cases

- Direct: create mode gains metadata; append/daily add explicitly selected write
  behaviors; settings and the snippet expose them.
- Internal: the parser, settings defaults, renderer, writer, and handler must
  agree about missing versus explicit values and precedence.
- External: the README remains self-contained; older snippets remain accepted;
  published bundles and manifests must agree. Existing note structure must
  survive appending, simultaneous writes, failures, and repeated capture.
- Repeated intentional captures remain separate entries; this release does not
  silently discard clips based on matching content or source.
- Do not log selection contents or full incoming URLs on failure.
- Test with in-memory Vault behavior and the repository's disposable test vault;
  do not install into or modify the user's personal vault during this release.

## Verification and delivery

1. Add failing tests for parsing, tags, and backward compatibility; implement.
2. Add failing tests for path validation and section insertion; implement.
3. Add failing writer tests for metadata, all three modes, collisions, concurrent
   appends/creation, heading fallbacks, and unchanged existing frontmatter.
4. Test handler ordering, failure recovery, opening overrides, and open errors.
5. Execute the actual snippet with browser/non-browser inputs, Unicode, symbols,
   absent options, tags, modes, and oversized selections.
6. Run the full test suite, TypeScript build, targeted ESLint, YAML parsing,
   manifest consistency, bundle equality, and `git diff --check`.
7. Update `main.js`, `dist/popclip`, and the included development plugin build.
8. Document passed automated checks separately from any unrun live PopClip or
   Obsidian UI verification, and provide clear installation instructions.

## Documentation consulted

- https://www.popclip.app/dev/api/interfaces/Input.html
- https://www.popclip.app/dev/api/interfaces/Context.html
- https://www.popclip.app/dev/options
- https://www.popclip.app/dev/snippets
- https://docs.obsidian.md/Plugins/Vault
- Installed official `obsidian.d.ts` for API availability/version annotations.
