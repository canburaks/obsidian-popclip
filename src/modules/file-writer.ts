import { App, moment, normalizePath, stringifyYaml, TFile, TFolder } from "obsidian";
import type PopclipPlugin from "../../main";
import { loadSettings } from "../../settings";
import { appendToSection, normalizeFolderPath, normalizeNotePath, normalizeTags, parseTagSetting, sanitizeFileName } from "../utils";

export class FileWriter {
	private settings: Settings;

	constructor(private app: App, plugin: Pick<PopclipPlugin, "settings">) {
		this.settings = loadSettings(plugin.settings);
	}

	async writeToFile(payload: PopclipData): Promise<TFile> {
		const clip = {
			...payload,
			capturedAt: payload.capturedAt ?? new Date().toISOString(),
			tags: normalizeTags([...parseTagSetting(this.settings.defaultTags), ...(payload.tags ?? [])]),
		};
		const mode = payload.mode ?? this.settings.defaultMode;
		if (mode === "create") {
			const folder = normalizeFolderPath(payload.path ?? this.settings.defaultFolder);
			const content = this.setContent(clip);
			await this.ensureFolder(folder);
			return this.createUniqueFile(folder, this.getFileName(clip), content);
		}

		const path = mode === "daily"
			? this.dailyNotePath(clip.capturedAt)
			: normalizeNotePath(payload.target ?? this.settings.appendFile);
		const heading = payload.heading ?? this.settings.appendHeading;
		const entry = this.appendEntry(clip);
		const transform = (text: string) => appendToSection(text, entry, heading, this.settings.missingHeading);
		const existing = this.app.vault.getAbstractFileByPath(path);
		if (existing) return this.appendToFile(existing, transform);

		// Validate the entry/heading before creating any folders.
		const content = transform("");
		await this.ensureFolder(path.split("/").slice(0, -1).join("/"));
		try {
			return await this.app.vault.create(path, content);
		} catch (error) {
			const racedFile = this.app.vault.getAbstractFileByPath(path);
			if (!racedFile) throw error;
			return this.appendToFile(racedFile, transform);
		}
	}

	normalizePath(payload: PopclipData) {
		const folder = normalizeFolderPath(payload.path ?? this.settings.defaultFolder);
		return normalizePath([folder, `${this.getFileName(payload)}.md`].filter(Boolean).join("/"));
	}

	normalizedDate(date = new Date()) {
		return date.toISOString().split(".")[0].replaceAll("-", "").replaceAll(":", "").replace("T", "");
	}

	setFrontmatter(payload: PopclipData) {
		const data: Record<string, string | string[]> = {};
		if (payload.title) data.title = payload.title;
		if (payload.source) data.source = payload.source;
		data.date = new Date().toISOString();
		data.captured = payload.capturedAt ?? data.date;
		if (payload.format) data.format = payload.format;
		if (payload.appName) data.source_app = payload.appName;
		if (payload.appIdentifier) data.source_app_id = payload.appIdentifier;
		const source = webSource(payload.source);
		if (source) data.domain = source.hostname;
		if (payload.tags?.length) data.tags = payload.tags;
		return `---\n${stringifyYaml(data).trimEnd()}\n---`;
	}

	setHeader(payload: PopclipData) {
		return `# ${payload.title?.replace(/\s+/g, " ").trim()}`;
	}

	setContent(payload: PopclipData) {
		const elements: string[] = [];
		if (this.settings.useFrontmatter) elements.push(this.setFrontmatter(payload));
		if (this.settings.useHeader && payload.title) elements.push(this.setHeader(payload));
		elements.push(payload.clipping);
		return elements.join("\n\n");
	}

	private appendEntry(payload: PopclipData) {
		const elements: string[] = [];
		if (this.settings.useHeader && payload.title) elements.push(`**${escapeMarkdown(payload.title)}**`);
		elements.push(payload.clipping);
		if (this.settings.useFrontmatter) {
			const metadata = [`Captured: ${payload.capturedAt}`];
			if (payload.title) metadata.push(`Title: ${escapeMarkdown(payload.title)}`);
			const source = webSource(payload.source);
			if (source) metadata.push(`Source: <${source.href.replace(/[<>]/g, character => encodeURIComponent(character))}>`);
			else if (payload.source) metadata.push(`Source: ${escapeMarkdown(payload.source)}`);
			if (payload.appName) metadata.push(`App: ${escapeMarkdown(payload.appName)}`);
			if (payload.appIdentifier) metadata.push(`App ID: ${escapeMarkdown(payload.appIdentifier)}`);
			if (payload.format) metadata.push(`Format: ${payload.format}`);
			if (payload.tags?.length) metadata.push(`Tags: ${payload.tags.map(tag => `#${tag}`).join(" ")}`);
			elements.push(metadata.map(line => `> ${line}`).join("\n"));
		}
		return elements.join("\n\n");
	}

	private dailyNotePath(capturedAt: string) {
		if (!this.settings.dailyFormat.trim()) throw new Error("Set a daily note date format in PopClip settings.");
		const folder = normalizeFolderPath(this.settings.dailyFolder);
		const datePath = moment(capturedAt).format(this.settings.dailyFormat);
		return normalizeNotePath([folder, `${datePath}.md`].filter(Boolean).join("/"));
	}

	private async appendToFile(file: unknown, transform: (text: string) => string): Promise<TFile> {
		if (!(file instanceof TFile) || file.extension.toLowerCase() !== "md") {
			throw new Error("The append destination is not a Markdown file.");
		}
		await this.app.vault.process(file, transform);
		return file;
	}

	private getFileName(payload: PopclipData) {
		if (this.settings.useDatetimeAsFileName) return this.normalizedDate();
		return sanitizeFileName(payload.title || payload.clipping, 60);
	}

	private async ensureFolder(folderPath: string) {
		if (!folderPath) return;
		const existing = this.app.vault.getAbstractFileByPath(folderPath);
		if (existing instanceof TFolder) return;
		if (existing) throw new Error(`The destination "${folderPath}" is not a folder.`);
		try {
			await this.app.vault.createFolder(folderPath);
		} catch (error) {
			if (!(this.app.vault.getAbstractFileByPath(folderPath) instanceof TFolder)) throw error;
		}
	}

	private async createUniqueFile(folderPath: string, fileName: string, content: string): Promise<TFile> {
		for (let index = 0; index < 1000; index += 1) {
			const suffix = index === 0 ? "" : `-${index}`;
			const path = normalizePath([folderPath, `${fileName}${suffix}.md`].filter(Boolean).join("/"));
			if (!this.app.vault.getAbstractFileByPath(path)) {
				try {
					return await this.app.vault.create(path, content);
				} catch (error) {
					if (!this.app.vault.getAbstractFileByPath(path)) throw error;
				}
			}
		}
		throw new Error("Could not find an available filename for the clip.");
	}
}

function escapeMarkdown(value: string) {
	return value.replace(/\s+/g, " ").replace(/[\\`*_[\]<>#|]/g, "\\$&");
}

function webSource(value?: string) {
	try {
		const url = new URL(value ?? "");
		return ["http:", "https:"].includes(url.protocol) ? url : undefined;
	} catch {
		return undefined;
	}
}
