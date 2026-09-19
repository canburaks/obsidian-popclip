import assert from "node:assert/strict";
import test from "node:test";
import { bundle, createVault, moment, yaml } from "./helpers.mjs";

test("version-2 metadata round-trips while legacy clips remain valid", async () => {
	const { parsePopclipData } = await bundle("src/utils/popclip-data.ts");
	const data = {
		schemaVersion: 2, clipping: "選択 **text** + % &", path: "Research%20notes",
		title: 'A "title"', source: "https://example.com/?q=a+b&n=2",
		capturedAt: "2026-09-19T23:30:00+03:00", format: "markdown",
		appName: "Safari", appIdentifier: "com.apple.Safari",
		tags: ["#research", "research", "工作/笔记"], mode: "append",
		target: "Inbox.md", heading: "Clips", openAfterSave: false,
	};
	const actual = JSON.parse(JSON.stringify(parsePopclipData(JSON.stringify(data))));
	assert.deepEqual(actual, { ...data, tags: ["research", "工作/笔记"] });
	assert.equal(parsePopclipData('{"clipping":"legacy"}').clipping, "legacy");
});

test("invalid messages fail before any write", async () => {
	const { parsePopclipData } = await bundle("src/utils/popclip-data.ts");
	for (const extra of [
		{ clipping: " " }, { schemaVersion: 3 }, { schemaVersion: "2" },
		{ mode: "replace" }, { format: "html" }, { capturedAt: "yesterday" },
		{ capturedAt: "2026-02-30T12:00:00Z" }, { appName: 42 },
		{ capturedAt: "2026-09-19T12:00:00+99:99" }, { capturedAt: "2026-09-19T12:00:00+24:00" },
		{ tags: "clip" }, { tags: [42] }, { tags: ["two words"] },
		{ tags: ["123"] }, { tags: ["a//b"] }, { openAfterSave: "true" },
		{ target: 4 }, { heading: "a\nb" }, { clipping: "x".repeat(100001) },
	]) {
		assert.throws(() => parsePopclipData(JSON.stringify({ clipping: "text", ...extra })), JSON.stringify(extra).slice(0, 80));
	}
});

test("new notes contain valid YAML metadata and merged tags", async () => {
	const { FileWriter } = await bundle("src/modules/file-writer.ts");
	const state = createVault();
	const writer = new FileWriter({ vault: state.vault }, { settings: {
		useDatetimeAsFileName: false, useFrontmatter: true, useHeader: true,
		defaultTags: "clip, research",
	} });
	const file = await writer.writeToFile({
		clipping: "Body", title: 'Title: "quoted"\nsecond line', source: "https://example.com/a",
		capturedAt: "2026-09-19T12:00:00Z", format: "markdown", appName: "Safari",
		appIdentifier: "com.apple.Safari", tags: ["research", "nested/tag"], path: "Web",
	});
	const content = state.contents.get(file.path);
	const data = yaml.load(content.split("---")[1]);
	assert.equal(data.title, 'Title: "quoted"\nsecond line');
	assert.equal(data.captured, "2026-09-19T12:00:00Z");
	assert.equal(data.domain, "example.com");
	assert.equal(data.source_app, "Safari");
	assert.equal(data.source_app_id, "com.apple.Safari");
	assert.equal(data.format, "markdown");
	assert.deepEqual(data.tags, ["clip", "research", "nested/tag"]);
	assert.ok(Number.isFinite(Date.parse(data.date)));
	assert.match(content, /# Title: "quoted" second line/);
});

test("append preserves existing properties and inserts before the next section", async () => {
	const { FileWriter } = await bundle("src/modules/file-writer.ts");
	const original = '---\ntags: [original]\ntitle: Inbox\n---\n# Inbox\n\n## Clips\nOld\n\n## Tasks\n- [ ] Work\n';
	const state = createVault({ "Inbox.md": original });
	const writer = new FileWriter({ vault: state.vault }, { settings: {
		defaultMode: "append", appendFile: "Inbox.md", appendHeading: "Clips", useFrontmatter: true,
	} });
	const file = await writer.writeToFile({ clipping: "New clip", title: "Page", tags: ["research"], capturedAt: "2026-09-19T12:00:00Z", source: "https://example.com" });
	assert.equal(file.path, "Inbox.md");
	const text = state.contents.get(file.path);
	assert.ok(text.startsWith('---\ntags: [original]\ntitle: Inbox\n---\n# Inbox'));
	assert.ok(text.indexOf("New clip") < text.indexOf("## Tasks"));
	assert.match(text, /2026-09-19T12:00:00Z/);
	assert.match(text, /#research/);
	assert.match(text, /https:\/\/example.com/);
	assert.deepEqual(state.calls.map(c => c[0]), ["process"]);
});

test("concurrent first appends create one target and retain both clips", async () => {
	const { FileWriter } = await bundle("src/modules/file-writer.ts");
	const state = createVault();
	const writer = new FileWriter({ vault: state.vault }, { settings: { defaultMode: "append", appendFile: "Clips/Inbox.md" } });
	await Promise.all([writer.writeToFile({ clipping: "First unique clip" }), writer.writeToFile({ clipping: "Second unique clip" })]);
	assert.equal(state.contents.size, 1);
	assert.match(state.contents.get("Clips/Inbox.md"), /First unique clip/);
	assert.match(state.contents.get("Clips/Inbox.md"), /Second unique clip/);
});

test("daily notes use local capture dates, custom formats, and the configured folder", async () => {
	const { FileWriter } = await bundle("src/modules/file-writer.ts");
	const state = createVault();
	const capturedAt = "2026-09-19T23:30:00-08:00";
	const writer = new FileWriter({ vault: state.vault }, { settings: { defaultMode: "daily", dailyFolder: "Journal", dailyFormat: "YYYY/MM/YYYY-MM-DD" } });
	const file = await writer.writeToFile({ clipping: "Daily clip", capturedAt, path: "Ignored" });
	assert.equal(file.path, `Journal/${moment(capturedAt).format("YYYY/MM/YYYY-MM-DD")}.md`);
	await writer.writeToFile({ clipping: "Second", capturedAt });
	assert.equal(state.contents.size, 1);
	assert.match(state.contents.get(file.path), /Second/);
});

test("destination validation rejects traversal and non-note targets without writes", async () => {
	const { FileWriter } = await bundle("src/modules/file-writer.ts");
	for (const target of ["../secret.md", "..\\secret.md", "/tmp/a.md", "C:\\a.md", ".obsidian/config.md", "foo/../a.md", "file.txt", "foo\u0000.md", "foo/#a.md", "file.md/"]) {
		const state = createVault();
		await assert.rejects(new FileWriter({ vault: state.vault }, { settings: {} }).writeToFile({ clipping: "text", mode: "append", target }));
		assert.deepEqual(state.calls, [], target);
	}
	const state = createVault();
	const writer = new FileWriter({ vault: state.vault }, { settings: { useDatetimeAsFileName: false } });
	const file = await writer.writeToFile({ clipping: "text", path: "Percent%20name" });
	assert.equal(file.path, "Percent%20name/text.md");
});

test("request fields override plugin defaults including an explicit root folder", async () => {
	const { FileWriter } = await bundle("src/modules/file-writer.ts");
	const state = createVault();
	const writer = new FileWriter({ vault: state.vault }, { settings: { defaultMode: "append", defaultFolder: "Configured", useDatetimeAsFileName: false } });
	const file = await writer.writeToFile({ clipping: "Root", path: "", mode: "create" });
	assert.equal(file.path, "Root.md");
});

test("title filenames cannot become hidden or split a Unicode character", async () => {
	const { sanitizeFileName } = await bundle("src/utils/popclip-data.ts");
	assert.equal(sanitizeFileName(" .hidden"), "hidden");
	assert.equal(sanitizeFileName("a".repeat(59) + "😀"), "a".repeat(59) + "😀");
});

test("existing note changes made before an append are retained", async () => {
	const { FileWriter } = await bundle("src/modules/file-writer.ts");
	const state = createVault({ "Inbox.md": "Initial\n" });
	const process = state.vault.process;
	state.vault.process = async (file, transform) => {
		state.contents.set(file.path, state.contents.get(file.path) + "External edit\n");
		return process(file, transform);
	};
	await new FileWriter({ vault: state.vault }, { settings: {} }).writeToFile({ clipping: "New", mode: "append", target: "Inbox.md" });
	assert.match(state.contents.get("Inbox.md"), /^Initial\nExternal edit\n/);
	assert.match(state.contents.get("Inbox.md"), /New/);
});

test("an ambiguous destination rejects the append without changing the note", async () => {
	const { FileWriter } = await bundle("src/modules/file-writer.ts");
	const original = "## Clips\nFirst\n## Clips\nSecond\n";
	const state = createVault({ "Inbox.md": original });
	await assert.rejects(new FileWriter({ vault: state.vault }, { settings: {} }).writeToFile({ clipping: "New", mode: "append", target: "Inbox.md", heading: "Clips" }), /more than one/);
	assert.equal(state.contents.get("Inbox.md"), original);
});

test("simultaneous new-note captures never overwrite either selection", async () => {
	const { FileWriter } = await bundle("src/modules/file-writer.ts");
	const state = createVault();
	const writer = new FileWriter({ vault: state.vault }, { settings: { useDatetimeAsFileName: false } });
	const results = await Promise.all([writer.writeToFile({ clipping: "First", title: "Same" }), writer.writeToFile({ clipping: "Second", title: "Same" })]);
	assert.notEqual(results[0].path, results[1].path);
	assert.equal(state.contents.size, 2);
});
