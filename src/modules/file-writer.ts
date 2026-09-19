import { App, normalizePath, TFile, TFolder } from "obsidian";
import PopclipPlugin from "../../main";
import { sanitizeFileName } from "../utils";

export class FileWriter {
	constructor(
		private app: App,
		private plugin: PopclipPlugin
	) {}

	async writeToFile(payload: PopclipData): Promise<TFile> {
		const folderPath = this.normalizeFolderPath(payload.path);
		await this.ensureFolder(folderPath);

		const fileName = this.getFileName(payload);
		const content = this.setContent(payload);
		return this.createUniqueFile(folderPath, fileName, content);
	}

	normalizePath(payload: PopclipData) {
		const folderPath = this.normalizeFolderPath(payload.path);
		return normalizePath(
			[folderPath, `${this.getFileName(payload)}.md`]
				.filter(Boolean)
				.join("/")
		);
	}

	normalizedDate(date = new Date()) {
		return date
			.toISOString()
			.split(".")[0]
			.replaceAll("-", "")
			.replaceAll(":", "")
			.replace("T", "");
	}

	setFrontmatter(payload: PopclipData) {
		const elements = ["---"];
		if (payload.title) {
			elements.push(`title: ${JSON.stringify(payload.title)}`);
		}
		if (payload.source) {
			elements.push(`source: ${JSON.stringify(payload.source)}`);
		}
		elements.push(`date: ${JSON.stringify(new Date().toISOString())}`, "---");
		return elements.join("\n");
	}

	setHeader(payload: PopclipData) {
		return `# ${payload.title?.replace(/\s+/g, " ").trim()}`;
	}

	setContent(payload: PopclipData) {
		const elements: string[] = [];
		if (this.plugin.settings.useFrontmatter) {
			elements.push(this.setFrontmatter(payload));
		}
		if (this.plugin.settings.useHeader && payload.title) {
			elements.push(this.setHeader(payload));
		}
		elements.push(payload.clipping);
		return elements.join("\n\n");
	}

	private getFileName(payload: PopclipData) {
		if (this.plugin.settings.useDatetimeAsFileName) {
			return this.normalizedDate();
		}

		return sanitizeFileName(payload.title || payload.clipping, 60);
	}

	private normalizeFolderPath(path?: string) {
		if (!path?.trim()) {
			return "";
		}

		let decodedPath = path.trim();
		try {
			decodedPath = decodeURIComponent(decodedPath);
		} catch {
			// Treat literal percent signs as part of the folder name.
		}

		const segments = decodedPath.split("/");
		if (
			decodedPath.startsWith("/") ||
			segments.some((segment) => segment === "." || segment === "..")
		) {
			throw new Error("The destination must be a folder inside the vault.");
		}

		return normalizePath(decodedPath);
	}

	private async ensureFolder(folderPath: string) {
		if (!folderPath) {
			return;
		}

		const existing = this.app.vault.getAbstractFileByPath(folderPath);
		if (existing instanceof TFolder) {
			return;
		}
		if (existing) {
			throw new Error(`The destination "${folderPath}" is not a folder.`);
		}

		try {
			await this.app.vault.createFolder(folderPath);
		} catch (error) {
			if (!(this.app.vault.getAbstractFileByPath(folderPath) instanceof TFolder)) {
				throw error;
			}
		}
	}

	private async createUniqueFile(
		folderPath: string,
		fileName: string,
		content: string
	): Promise<TFile> {
		for (let index = 0; index < 1000; index += 1) {
			const suffix = index === 0 ? "" : `-${index}`;
			const path = normalizePath(
				[folderPath, `${fileName}${suffix}.md`].filter(Boolean).join("/")
			);

			if (!this.app.vault.getAbstractFileByPath(path)) {
				try {
					return await this.app.vault.create(path, content);
				} catch (error) {
					if (!this.app.vault.getAbstractFileByPath(path)) {
						throw error;
					}
				}
			}
		}

		throw new Error("Could not find an available filename for the clip.");
	}
}
