import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";
import { build } from "esbuild";

const obsidianStub = `
export class Plugin {
  constructor(app) {
    this.app = app;
    this.protocolHandlers = new Map();
  }
  async loadData() { return {}; }
  async saveData() {}
  addSettingTab() {}
  registerObsidianProtocolHandler(action, handler) {
    this.protocolHandlers.set(action, handler);
  }
}
export class PluginSettingTab {
  constructor(app, plugin) {
    this.app = app;
    this.plugin = plugin;
    this.containerEl = { empty() {} };
  }
}
export class Setting {
  setName() { return this; }
  setDesc() { return this; }
  addToggle() { return this; }
}
export class Notice {
  static messages = [];
  constructor(message) {
    Notice.messages.push(message);
    globalThis.__notices.push(String(message));
  }
}
export class TFolder {}
export function normalizePath(path) {
  return path.replaceAll("\\\\", "/").replace(/\\/{2,}/g, "/").replace(/^\\.\\//, "").replace(/\\/$/, "");
}
`;

async function bundle(entryPoint) {
	const result = await build({
		absWorkingDir: new URL("..", import.meta.url).pathname,
		bundle: true,
		entryPoints: [entryPoint],
		format: "cjs",
		platform: "node",
		write: false,
		plugins: [
			{
				name: "obsidian-stub",
				setup(buildApi) {
					buildApi.onResolve({ filter: /^obsidian$/ }, () => ({
						path: "obsidian",
						namespace: "obsidian-stub",
					}));
					buildApi.onLoad(
						{ filter: /.*/, namespace: "obsidian-stub" },
						() => ({ contents: obsidianStub, loader: "js" })
					);
				},
			},
		],
	});

	const module = { exports: {} };
	const notices = [];
	vm.runInNewContext(result.outputFiles[0].text, {
		__notices: notices,
		console: { ...console, error() {} },
		module,
		exports: module.exports,
		setTimeout,
	});
	Object.defineProperty(module.exports, "__testNotices", { value: notices });
	return module.exports;
}

function getPopclipScript(readme) {
	const block = readme.match(/```ya?ml\n([\s\S]*?)```/i)?.[1];
	assert.ok(block, "README contains an installable PopClip YAML snippet");
	assert.match(block, /^#popclip(?:\s|$)/i);
	assert.match(block, /^identifier:\s*ObsidianClipper\s*$/im);

	const marker = /^javaScript:\s*\|\s*$/im;
	const markerMatch = marker.exec(block);
	assert.ok(markerMatch, "snippet contains a javaScript action");
	return block
		.slice(markerMatch.index + markerMatch[0].length)
		.split("\n")
		.filter((line) => line.trim() !== "#end")
		.map((line) => line.replace(/^ {2,4}/, ""))
		.join("\n");
}

test("the README PopClip snippet sends one encoded payload to the plugin action", async () => {
	const readme = await readFile(new URL("../README.md", import.meta.url), "utf8");
	const script = getPopclipScript(readme);
	let openedUrl;
	const popclip = {
		context: {
			browserTitle: "A useful page",
			browserUrl: "https://example.com/article?q=one&lang=en",
		},
		input: { markdown: "**Selected** text", text: "Selected text" },
		openUrl(url) {
			openedUrl = String(url);
		},
		options: { path: "Research notes", vault: "Personal Vault" },
	};

	await vm.runInNewContext(`(async () => { ${script} })()`, {
		popclip,
		URL,
		URLSearchParams,
	});

	const url = new URL(openedUrl);
	assert.equal(url.protocol, "obsidian:");
	assert.equal(url.hostname, "popclip");
	assert.equal(url.searchParams.get("vault"), "Personal Vault");
	assert.deepEqual(JSON.parse(url.searchParams.get("data")), {
		clipping: "**Selected** text",
		path: "Research notes",
		title: "A useful page",
		source: "https://example.com/article?q=one&lang=en",
	});
});

test("the Obsidian plugin owns the popclip protocol action", async () => {
	const { default: PopclipPlugin } = await bundle("main.ts");
	const plugin = new PopclipPlugin({ vault: {} });
	await plugin.onload();

	assert.ok(plugin.protocolHandlers.has("popclip"));
	assert.equal(plugin.protocolHandlers.has("advanced-uri"), false);
});

test("the Obsidian plugin reports malformed protocol requests without writing", async () => {
	const bundled = await bundle("main.ts");
	const plugin = new bundled.default({ vault: {} });
	await plugin.onload();

	await assert.doesNotReject(
		plugin.protocolHandlers.get("popclip")({
			action: "popclip",
			data: "not-json",
		})
	);
	assert.match(
		bundled.__testNotices.at(-1),
		/^Unable to save PopClip selection: The clip data is not valid JSON\.$/
	);
});

test("the writer creates the target folder and note through the Vault API", async () => {
	const { FileWriter } = await bundle("src/modules/file-writer.ts");
	const calls = [];
	const folders = new Set();
	const app = {
		vault: {
			adapter: {
				async write(path) {
					calls.push(["adapter.write", path]);
				},
			},
			async create(path, content) {
				calls.push(["vault.create", path, content]);
				return { path };
			},
			async createFolder(path) {
				calls.push(["vault.createFolder", path]);
				folders.add(path);
			},
			getAbstractFileByPath(path) {
				return folders.has(path) ? { path } : null;
			},
		},
	};
	const plugin = {
		settings: {
			useDatetimeAsFileName: false,
			useFrontmatter: true,
			useHeader: true,
		},
	};

	const file = await new FileWriter(app, plugin).writeToFile({
		clipping: "A clipped paragraph.",
		path: "Clippings/Web",
		title: "An article/title",
		source: "https://example.com",
	});

	assert.deepEqual(
		calls.map(([method]) => method),
		["vault.createFolder", "vault.create"]
	);
	assert.equal(file.path, "Clippings/Web/An article-title.md");
	assert.match(calls[1][2], /title: "An article\/title"/);
});

test("the protocol payload parser rejects malformed and mistyped data", async () => {
	const { parsePopclipData } = await bundle("src/utils/popclip-data.ts");

	assert.throws(
		() => parsePopclipData("not-json"),
		/The clip data is not valid JSON/
	);
	assert.throws(
		() => parsePopclipData('{"clipping":"text","path":42}'),
		/The clip path must be text/
	);
	assert.throws(
		() => parsePopclipData('{"title":"Missing clipping"}'),
		/does not contain selected text/
	);
});

test("the writer keeps destinations inside the vault", async () => {
	const { FileWriter } = await bundle("src/modules/file-writer.ts");
	const writes = [];
	const app = {
		vault: {
			async create(path) {
				writes.push(path);
				return { path };
			},
			async createFolder(path) {
				writes.push(path);
			},
			getAbstractFileByPath() {
				return null;
			},
		},
	};
	const plugin = {
		settings: {
			useDatetimeAsFileName: false,
			useFrontmatter: false,
			useHeader: false,
		},
	};

	await assert.rejects(
		new FileWriter(app, plugin).writeToFile({
			clipping: "text",
			path: "../Outside",
		}),
		/The destination must be a folder inside the vault/
	);
	assert.deepEqual(writes, []);
});

test("the writer preserves an existing note by choosing a unique filename", async () => {
	const { FileWriter } = await bundle("src/modules/file-writer.ts");
	const files = new Set(["Clippings/Article.md"]);
	const created = [];
	const app = {
		vault: {
			async create(path) {
				created.push(path);
				files.add(path);
				return { path };
			},
			async createFolder() {},
			getAbstractFileByPath(path) {
				return files.has(path) ? { path } : null;
			},
		},
	};
	const plugin = {
		settings: {
			useDatetimeAsFileName: false,
			useFrontmatter: false,
			useHeader: false,
		},
	};

	const file = await new FileWriter(app, plugin).writeToFile({
		clipping: "text",
		path: "Clippings",
		title: "Article",
	});

	assert.equal(file.path, "Clippings/Article-1.md");
	assert.deepEqual(created, ["Clippings/Article-1.md"]);
});
