import { App, normalizePath, Plugin } from "obsidian";
import { SETTINGS } from "./settings";
import type { Settings } from "./settings";


export default class MyPlugin extends Plugin {
	settings: Settings;
	async onload() {
		await this.loadSettings();
		this.registerObsidianProtocolHandler(SETTINGS.action, async (ev) => {
			if (ev.heading === SETTINGS.actionHeading) {
				new FileWriter(this.app).writeToFile(
					JSON.parse(decodeURI(ev.data))
				);
			}
		});
	}

	onunload() {
		// this.app.workspace.detachLeavesOfType(VIEW_TYPE_EXAMPLE);
	}

	async loadSettings() {
		this.settings = Object.assign({}, SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	async activateView() {}
}

interface PopclipData {
	clipping: string;
	path: string;
	title?: string;
	source?: string;
}

export class FileWriter {
	app: App;
	constructor(app: App) {
		this.app = app;
	}
	async writeToFile(payload: PopclipData) {
		console.log("write", payload);
		const path = this.normalizePath(payload);

		this.app.vault.create(normalizePath(path), this.setContent(payload));
	}

	normalizePath(payload: PopclipData) {
		const fileName =
			payload.title &&
			typeof payload.title === "string" &&
			payload.title.length < 60
				? payload.title
				: this.normalizeDate();

		let filePath: string = payload.path || "";
		const path = slugify(`${filePath.trim()}/${fileName.trim()}`) + ".md";
		return path;
	}

	normalizeDate() {
		const datetime = new Date().toISOString().split(".")[0];
		return datetime
			.replaceAll("-", "")
			.replaceAll(":", "")
			.replace("t", "");
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
		return `# ${payload?.title}`;
	}

	setContent(payload: PopclipData) {
		const elements = [
			this.setFrontmatter(payload),
			this.setHeader(payload),
			payload?.clipping,
		];
		return elements.join("\n\n");
	}
}

export function slugify(str: string) {
	str = str.replace(/^\s+|\s+$/g, ""); // trim
	str = str.toLowerCase();

	// remove accents, swap ñ for n, etc
	var from = "ıüöçğàáäâèéëêìíïîòóöôùúüûñç·/_,:;";
	var to = "iuocgaaaaeeeeiiiioooouuuunc------";
	for (var i = 0, l = from.length; i < l; i++) {
		str = str.replace(new RegExp(from.charAt(i), "g"), to.charAt(i));
	}

	str = str
		.replace(/[^a-z0-9 -]/g, "") // remove invalid chars
		.replace(/\s+/g, "-") // collapse whitespace and replace by -
		.replace(/-+/g, "-"); // collapse dashes
	// remove trailing dashes
	if (str.startsWith("-")) {
		str = str.substring(1);
	} else if (str.endsWith("-")) {
		str = str.substring(0, str.length - 1);
	}
	return str;
}
