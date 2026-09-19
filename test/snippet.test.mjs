import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import test from "node:test";
import { bundle, yaml } from "./helpers.mjs";

async function execute(options = {}, input = {}, context = {}) {
	const readme = await readFile(new URL("../README.md", import.meta.url), "utf8");
	const block = readme.match(/```yaml\n([\s\S]*?)```/)[1];
	const config = yaml.load(block);
	let url;
	const popclip = {
		input: { text: "plain selection + % & 漢字", ...input }, context,
		options: { vault: "Personal Vault", path: "Inbox", ...options },
		openUrl(value) { url = value; },
	};
	await vm.runInNewContext(`(async () => {${config.javaScript}})()`, { popclip });
	return { url, config, data: JSON.parse(decodeURIComponent(url.split("&data=")[1])) };
}

test("snippet sends plain-text app metadata, tags, and an explicit save mode", async () => {
	const result = await execute({ mode: "daily", tags: "#work, research/web" }, {}, { appName: "Preview", appIdentifier: "com.apple.Preview" });
	assert.equal(result.data.schemaVersion, 2);
	assert.equal(result.data.format, "text");
	assert.equal(result.data.mode, "daily");
	assert.equal(result.data.source, undefined);
	assert.equal(result.data.appName, "Preview");
	assert.deepEqual(result.data.tags, ["#work", "research/web"]);
	const { parsePopclipData } = await bundle("src/utils/popclip-data.ts");
	assert.equal(parsePopclipData(JSON.stringify(result.data)).clipping, "plain selection + % & 漢字");
});

test("snippet delegates default mode and keeps literal percent signs in paths", async () => {
	const result = await execute({ mode: "default", path: "Reports%20notes" });
	assert.equal(result.data.mode, undefined);
	assert.equal(result.data.path, "Reports%20notes");
	assert.equal(new URL(result.url).searchParams.get("vault"), "Personal Vault");
});

test("snippet blocks empty vaults and overly large URIs with actionable errors", async () => {
	await assert.rejects(execute({ vault: " " }), /vault name/);
	await assert.rejects(execute({}, { text: "漢字".repeat(10000) }), /shorter selection/i);
});
