import { build } from "esbuild";
import { createRequire } from "node:module";
import vm from "node:vm";

const require = createRequire(import.meta.url);
const obsidianRequire = createRequire(require.resolve("obsidian/package.json"));
const eslintRequire = createRequire(
	createRequire(require.resolve("@typescript-eslint/eslint-plugin")).resolve("eslint")
);
export const yaml = eslintRequire("js-yaml");
export const moment = obsidianRequire("moment");

class TFile {
	constructor(path) { this.path = path; this.extension = path.split(".").at(-1); }
}
class TFolder {
	constructor(path) { this.path = path; }
}

const obsidianStub = `
export const TFile = __api.TFile;
export const TFolder = __api.TFolder;
export const moment = __api.moment;
export const stringifyYaml = __api.stringifyYaml;
export class Plugin {
  constructor(app) { this.app = app; this.protocolHandlers = new Map(); }
  async loadData() { return this.savedData || {}; }
  async saveData(data) { this.savedData = data; }
  addSettingTab(tab) { this.settingTab = tab; }
  registerObsidianProtocolHandler(action, handler) { this.protocolHandlers.set(action, handler); }
}
export class PluginSettingTab {
  constructor(app, plugin) {
    this.app = app;
    this.plugin = plugin;
    this.containerEl = { empty() {} };
  }
}
export class Setting {
  constructor() {}
  setName(name) { this.name = name; return this; }
  setDesc() { return this; }
  addToggle(cb) { cb(__control(this.name, "toggle")); return this; }
  addText(cb) { cb(__control(this.name, "text")); return this; }
  addDropdown(cb) { cb(__control(this.name, "dropdown")); return this; }
}
export class Notice {
  constructor(message) { __notices.push(String(message)); }
}
export function normalizePath(path) {
  return path.replaceAll("\\\\", "/").replace(/\\/{2,}/g, "/").replace(/^\\.\\//, "").replace(/\\/$/, "");
}
`;

export async function bundle(entryPoint) {
	const result = await build({
		absWorkingDir: new URL("..", import.meta.url).pathname,
		bundle: true, entryPoints: [entryPoint], format: "cjs", platform: "node", write: false,
		plugins: [{ name: "obsidian-stub", setup(api) {
			api.onResolve({ filter: /^obsidian$/ }, () => ({ path: "obsidian", namespace: "stub" }));
			api.onLoad({ filter: /.*/, namespace: "stub" }, () => ({ contents: obsidianStub, loader: "js" }));
		} }],
	});
	const module = { exports: {} };
	const notices = [];
	const controls = [];
	vm.runInNewContext(result.outputFiles[0].text, {
		__control(name, kind) {
			const control = {
				name, kind, value: "", validity: "", events: {},
				setValue(value) { this.value = value; return this; },
				getValue() { return this.value; },
				onChange(fn) { this.change = fn; return this; },
				addOptions(options) { this.options = options; return this; },
				inputEl: {
					setCustomValidity(message) { control.validity = message; },
					reportValidity() {},
					addEventListener(event, fn) { control.events[event] = fn; },
				},
			};
			controls.push(control);
			return control;
		},
		__api: { TFile, TFolder, moment, stringifyYaml: yaml.dump },
		__notices: notices, console: { ...console, error() {} },
		module, exports: module.exports, setTimeout, URL,
	});
	Object.defineProperty(module.exports, "__testNotices", { value: notices });
	Object.defineProperty(module.exports, "__testControls", { value: controls });
	return module.exports;
}

export function createVault(initial = {}) {
	const files = new Map();
	const contents = new Map();
	const calls = [];
	const queues = new Map();
	function folders(path) {
		const parts = path.split("/").slice(0, -1);
		for (let i = 1; i <= parts.length; i++) {
			const parent = parts.slice(0, i).join("/");
			files.set(parent, new TFolder(parent));
		}
	}
	for (const [path, content] of Object.entries(initial)) {
		folders(path);
		files.set(path, new TFile(path));
		contents.set(path, content);
	}
	const vault = {
		getAbstractFileByPath(path) { return files.get(path) || null; },
		async createFolder(path) {
			calls.push(["createFolder", path]);
			if (files.has(path)) throw new Error("Folder already exists");
			folders(path);
			files.set(path, new TFolder(path));
		},
		async create(path, content) {
			calls.push(["create", path]);
			await Promise.resolve();
			if (files.has(path)) throw new Error("File already exists");
			const parent = path.split("/").slice(0, -1).join("/");
			if (parent && !(files.get(parent) instanceof TFolder)) throw new Error("Missing parent");
			const file = new TFile(path);
			files.set(path, file);
			contents.set(path, content);
			return file;
		},
		process(file, transform) {
			const next = (queues.get(file.path) || Promise.resolve()).then(() => {
				calls.push(["process", file.path]);
				const content = transform(contents.get(file.path));
				contents.set(file.path, content);
				return content;
			});
			queues.set(file.path, next.catch(() => {}));
			return next;
		},
	};
	return { vault, contents, files, calls };
}
