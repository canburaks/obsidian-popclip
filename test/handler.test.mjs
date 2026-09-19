import assert from "node:assert/strict";
import test from "node:test";
import { bundle, createVault } from "./helpers.mjs";

test("saved settings keep legacy choices and fill invalid or absent fields", async () => {
	const { default: Plugin } = await bundle("main.ts");
	const plugin = new Plugin({});
	plugin.savedData = { useHeader: false, useDatetimeAsFileName: false, defaultMode: "delete", openAfterSave: "yes", defaultFolder: null };
	await plugin.onload();
	assert.equal(plugin.settings.useHeader, false);
	assert.equal(plugin.settings.useDatetimeAsFileName, false);
	assert.equal(plugin.settings.defaultMode, "create");
	assert.equal(plugin.settings.openAfterSave, false);
	assert.equal(plugin.settings.defaultFolder, "Clippings");
});

test("handler opens the saved note after writing and respects request overrides", async () => {
	const bundled = await bundle("main.ts");
	const state = createVault();
	const opened = [];
	const plugin = new bundled.default({ vault: state.vault, workspace: {
		getLeaf(newTab) { return { async openFile(file) { assert.ok(state.contents.has(file.path)); opened.push([newTab, file.path]); } }; },
	} });
	await plugin.onload();
	plugin.settings.openAfterSave = true;
	plugin.settings.openInNewTab = true;
	const handle = plugin.protocolHandlers.get("popclip");
	await handle({ data: JSON.stringify({ clipping: "first" }) });
	await handle({ data: JSON.stringify({ clipping: "second", openAfterSave: false }) });
	assert.equal(opened.length, 1);
	assert.equal(opened[0][0], "tab");
	plugin.settings.openAfterSave = false;
	await handle({ data: JSON.stringify({ clipping: "third", openAfterSave: true }) });
	assert.equal(opened.length, 2);
});

test("an open failure reports a successful save without asking users to retry saving", async () => {
	const bundled = await bundle("main.ts");
	const state = createVault();
	const plugin = new bundled.default({ vault: state.vault, workspace: { getLeaf() { throw new Error("No pane"); } } });
	await plugin.onload();
	await plugin.protocolHandlers.get("popclip")({ data: JSON.stringify({ clipping: "Saved", openAfterSave: true }) });
	assert.equal(state.contents.size, 1);
	assert.match(bundled.__testNotices.at(-1), /saved.*could not.*open/i);
	assert.doesNotMatch(bundled.__testNotices.at(-1), /Unable to save/);
});

test("incoming clips are ordered and a failed request does not block the queue", async () => {
	const bundled = await bundle("main.ts");
	const state = createVault({ "Inbox.md": "# Inbox\n" });
	const processed = [];
	let release;
	const original = state.vault.process;
	state.vault.process = async (file, change) => {
		processed.push(file.path);
		if (processed.length === 1) await new Promise(resolve => { release = resolve; });
		return original(file, change);
	};
	const plugin = new bundled.default({ vault: state.vault });
	await plugin.onload();
	plugin.settings.defaultMode = "append";
	plugin.settings.appendFile = "Inbox.md";
	const handle = plugin.protocolHandlers.get("popclip");
	const first = handle({ data: JSON.stringify({ clipping: "FIRST" }) });
	const bad = handle({ data: "invalid" });
	const last = handle({ data: JSON.stringify({ clipping: "LAST" }) });
	await new Promise(resolve => setTimeout(resolve, 10));
	assert.equal(processed.length, 1);
	release();
	await Promise.all([first, bad, last]);
	assert.equal(processed.length, 2);
	const content = state.contents.get("Inbox.md");
	assert.ok(content.indexOf("FIRST") < content.indexOf("LAST"));
});

test("a write failure shows an error and does not open or report a saved note", async () => {
	const bundled = await bundle("main.ts");
	const state = createVault();
	state.vault.create = async () => { throw new Error("Disk full"); };
	let opened = false;
	const plugin = new bundled.default({ vault: state.vault, workspace: { getLeaf() { opened = true; } } });
	await plugin.onload();
	await plugin.protocolHandlers.get("popclip")({ data: JSON.stringify({ clipping: "Do not lose this", openAfterSave: true }) });
	assert.equal(opened, false);
	assert.equal(state.contents.size, 0);
	assert.match(bundled.__testNotices.at(-1), /Unable to save.*Disk full/);
});
