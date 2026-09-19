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
icon: |-
  preserve-color svg:<svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><radialGradient id="a" cx="0" cy="0" gradientTransform="matrix(-59 -225 150 -39 161.4 470)" gradientUnits="userSpaceOnUse" r="1"><stop offset="0" stop-color="#fff" stop-opacity=".4"/><stop offset="1" stop-opacity=".1"/></radialGradient><radialGradient id="b" cx="0" cy="0" gradientTransform="matrix(50 -379 280 37 360 374.2)" gradientUnits="userSpaceOnUse" r="1"><stop offset="0" stop-color="#fff" stop-opacity=".6"/><stop offset="1" stop-color="#fff" stop-opacity=".1"/></radialGradient><radialGradient id="c" cx="0" cy="0" gradientTransform="matrix(69 -319 218 47 175.4 307)" gradientUnits="userSpaceOnUse" r="1"><stop offset="0" stop-color="#fff" stop-opacity=".8"/><stop offset="1" stop-color="#fff" stop-opacity=".4"/></radialGradient><radialGradient id="d" cx="0" cy="0" gradientTransform="matrix(-96 -163 187 -111 335.3 512.2)" gradientUnits="userSpaceOnUse" r="1"><stop offset="0" stop-color="#fff" stop-opacity=".3"/><stop offset="1" stop-opacity=".3"/></radialGradient><path d="M382.3 475.6c-3.1 23.4-26 41.6-48.7 35.3-32.4-8.9-69.9-22.8-103.6-25.4l-51.7-4a34 34 0 0 1-22-10.2l-89-91.7a34 34 0 0 1-6.7-37.7s55-121 57.1-127.3c2-6.3 9.6-61.2 14-90.6 1.2-7.9 5-15 11-20.3L248 8.9a34.1 34.1 0 0 1 49.6 4.3L386 125.6a37 37 0 0 1 7.6 22.4c0 21.3 1.8 65 13.6 93.2 11.5 27.3 32.5 57 43.5 71.5a17.3 17.3 0 0 1 1.3 19.2 1494 1494 0 0 1-44.8 70.6c-15 22.3-21.9 49.9-25 73.1z" fill="#6c31e3"/><path d="M165.9 478.3c41.4-84 40.2-144.2 22.6-187-16.2-39.6-46.3-64.5-70-80-.6 2.3-1.3 4.4-2.2 6.5L60.6 342a34 34 0 0 0 6.6 37.7l89.1 91.7a34 34 0 0 0 9.6 7z" fill="url(#a)"/><path d="M278.4 307.8c11.2 1.2 22.2 3.6 32.8 7.6 34 12.7 65 41.2 90.5 96.3 1.8-3.1 3.6-6.2 5.6-9.2a1536 1536 0 0 0 44.8-70.6 17 17 0 0 0-1.3-19.2c-11-14.6-32-44.2-43.5-71.5-11.8-28.2-13.5-72-13.6-93.2 0-8.1-2.6-16-7.6-22.4L297.6 13.2a34 34 0 0 0-1.5-1.7 96 96 0 0 1 2 54 198.3 198.3 0 0 1-17.6 41.3l-7.2 14.2a171 171 0 0 0-19.4 71c-1.2 29.4 4.8 66.4 24.5 115.8z" fill="url(#b)"/><path d="M278.4 307.8c-19.7-49.4-25.8-86.4-24.5-115.9a171 171 0 0 1 19.4-71c2.3-4.8 4.8-9.5 7.2-14.1 7.1-13.9 14-27 17.6-41.4a96 96 0 0 0-2-54A34.1 34.1 0 0 0 248 9l-105.4 94.8a34.1 34.1 0 0 0-10.9 20.3l-12.8 85-.5 2.3c23.8 15.5 54 40.4 70.1 80a147 147 0 0 1 7.8 24.8c28-6.8 55.7-11 82.1-8.3z" fill="url(#c)"/><path d="M333.6 511c22.7 6.2 45.6-12 48.7-35.4a187 187 0 0 1 19.4-63.9c-25.6-55-56.5-83.6-90.4-96.3-36-13.4-75.2-9-115 .7 8.9 40.4 3.6 93.3-30.4 162.2 4 1.8 8.1 3 12.5 3.3 0 0 24.4 2 53.6 4.1 29 2 72.4 17.1 101.6 25.2z" fill="url(#d)"/></svg>
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
