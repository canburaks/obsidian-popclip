import assert from "node:assert/strict";
import test from "node:test";
import { bundle } from "./helpers.mjs";

test("settings controls save modes and only commit valid destination fields", async () => {
	const bundled = await bundle("main.ts");
	const plugin = new bundled.default({});
	await plugin.onload();
	plugin.settingTab.display();
	const get = name => bundled.__testControls.find(control => control.name === name);
	await get("Default save mode").change("append");
	assert.equal(plugin.savedData.defaultMode, "append");
	const append = get("Append note");
	append.value = "../outside.md";
	await append.events.blur();
	assert.match(append.validity, /inside the vault/);
	assert.equal(plugin.settings.appendFile, "Clippings/Inbox.md");
	append.value = "Research/Inbox.md";
	await append.events.blur();
	assert.equal(append.validity, "");
	assert.equal(plugin.savedData.appendFile, "Research/Inbox.md");
	await get("Open note after saving").change(true);
	assert.equal(plugin.savedData.openAfterSave, true);
	const tags = get("Default tags");
	tags.value = "work, nested/tag";
	await tags.events.blur();
	assert.equal(plugin.savedData.defaultTags, "work, nested/tag");
});
