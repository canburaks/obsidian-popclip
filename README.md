# Obsidian PopClip

Save text selected on macOS as a new Markdown note in an Obsidian vault. The integration has two parts: a PopClip extension sends the selection through an Obsidian URL, and this Obsidian plugin creates the note.

## Requirements

- [PopClip](https://www.popclip.app/) on macOS
- [Obsidian](https://obsidian.md/) with community plugins enabled

![Obsidian plugin for PopClip](https://static.cbsofyalioglu.com/public/projects/cbsofyalioglu-com/media/video/popclip-obsidian-demo.gif)

## 1. Install the PopClip extension

Select the entire YAML block below. PopClip will offer to install it. In the extension options, enter the vault name exactly as it appears in Obsidian and choose a destination folder relative to the vault root. The default folder is `Clippings`.

If you installed an older version of this snippet, selecting and installing this block replaces it.

```yaml
#popclip
name: Obsidian Clipper
identifier: ObsidianClipper
icon: O
requirements: [text]
captureHtml: true
app:
  name: Obsidian
  link: https://obsidian.md/
  bundleIdentifiers: [md.obsidian]
  checkInstalled: true
options:
  - identifier: vault
    label: Vault name
    description: Enter the vault name exactly as it appears in Obsidian.
    type: string
  - identifier: path
    label: Destination folder
    description: Use a path relative to the vault root. Missing folders are created automatically.
    type: string
    defaultValue: Clippings
javaScript: |
  const vaultName = String(popclip.options.vault ?? "").trim();
  if (!vaultName) {
    throw new Error("Settings error: enter your Obsidian vault name.");
  }

  const data = {
    clipping: popclip.input.markdown || popclip.input.text,
    path: String(popclip.options.path ?? "").trim(),
  };
  if (popclip.context.browserUrl) {
    data.title = popclip.context.browserTitle;
    data.source = popclip.context.browserUrl;
  }

  const url = `obsidian://popclip?vault=${encodeURIComponent(vaultName)}&data=${encodeURIComponent(JSON.stringify(data))}`;
  await popclip.openUrl(url);
```

## 2. Install the Obsidian plugin

The plugin is not yet in the Obsidian Community plugins directory, so install it manually:

1. Download or clone this repository.
2. Copy the `dist/popclip` folder to `<your-vault>/.obsidian/plugins/popclip`.
3. Restart Obsidian.
4. Open **Settings → Community plugins** and enable **PopClip**.

The installed folder must contain `main.js`, `manifest.json`, and `styles.css`. To build those files from source, run `npm install` followed by `npm run deploy`.

## Development

- `npm test` runs the PopClip-to-Obsidian contract tests.
- `npm run build` type-checks and creates the production `main.js` bundle.
- `npm run deploy:test-vault` builds and installs the plugin into the included development vault.

Use a disposable vault for development and testing.

Special thanks to Nick and EdM for their contributions in this [PopClip forum discussion](https://forum.popclip.app/t/clip-selection-to-obsidian/359/5).
