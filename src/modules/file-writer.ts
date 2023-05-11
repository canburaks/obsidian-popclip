import {
	App,
	normalizePath,
	Plugin,
	FileManager,
	TFile,
	TFolder,
} from "obsidian";
import { slugify } from "../utils";
import { SETTINGS } from "../../settings";
import PopclipPlugin from "../../main";

export class FileWriter {
	app: App;
	plugin: PopclipPlugin;
	constructor(app: App, plugin: PopclipPlugin) {
		this.app = app;
		this.plugin = plugin;
	}
	async writeToFile(payload: PopclipData) {
		const path = this.normalizePath(payload);

		this.app.vault.adapter.write(
			normalizePath(path),
			this.setContent(payload)
		);
	}

	normalizePath(payload: PopclipData) {
		let fileName = this.normalizedDate();

		if (!this.plugin.settings.useDatetimeAsFileName) {
			fileName = payload.title
				? payload.title.slice(0, 20).trim()
				: slugify(payload.clipping.slice(0, 20).trim());
		} else {
			fileName = this.normalizedDate();
		}
		fileName = fileName + ".md";

		let filePath: string = decodeURIComponent(payload.path);
		const path = normalizePath(filePath + "/" + fileName);
		return path;
	}

	normalizedDate() {
		const datetime = new Date().toISOString().split(".")[0];
		return datetime
			.replaceAll("-", "")
			.replaceAll(":", "")
			.replace("T", "");
	}

	setFrontmatter(payload: PopclipData) {
		const elements = [
			"---",
			`title: "${payload?.title}"`,
			`source: ${payload?.source || ""}`,
			`date: ${new Date().toISOString()}`,
			"---",
		];
		return elements.join("\n");
	}

	setHeader(payload: PopclipData) {
		return `# ${payload?.title}\n`;
	}

	setTable(payload: PopclipData) {
		const currentDate = new Date().toISOString();
		const source = payload?.source || "";
	}

	setContent(payload: PopclipData) {
		const elements = [];
		if (this.plugin.settings.useFrontmatter) {
			elements.push(this.setFrontmatter(payload));
		}
		if (this.plugin.settings.useHeader && payload?.title) {
			elements.push(this.setHeader(payload));
		}
		elements.push(payload?.clipping || "");
		return elements.join("\n");
	}
}
