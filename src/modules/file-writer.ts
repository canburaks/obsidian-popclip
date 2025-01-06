/**
 * FileWriter class handles the creation and writing of notes in Obsidian
 * from Popclip data. It manages file naming, content formatting, and actual file operations.
 */

import { App, normalizePath } from "obsidian";
import { slugify } from "../utils";
import PopclipPlugin from "../../main";

export class FileWriter {
	app: App;
	plugin: PopclipPlugin;

	/**
	 * Creates a new FileWriter instance
	 * @param app - The Obsidian App instance
	 * @param plugin - The PopclipPlugin instance for accessing settings
	 */
	constructor(app: App, plugin: PopclipPlugin) {
		this.app = app;
		this.plugin = plugin;
	}

	/**
	 * Main method to write Popclip data to a new file
	 * @param payload - The data received from Popclip containing clipping and metadata
	 */
	async writeToFile(payload: PopclipData) {
		const path = this.normalizePath(payload);

		this.app.vault.adapter.write(
			normalizePath(path),
			this.setContent(payload)
		);
	}

	/**
	 * Generates a normalized file path based on settings and payload
	 * @param payload - The Popclip data containing path and title information
	 * @returns A normalized file path string
	 */
	normalizePath(payload: PopclipData) {
		let fileName = this.normalizedDate();

		if (!this.plugin.settings.useDatetimeAsFileName) {
			// Use title or clipping text for filename if datetime is not preferred
			fileName = payload.title
				? payload.title.slice(0, 20).trim()
				: slugify(payload.clipping.slice(0, 20).trim());
		} else {
			fileName = this.normalizedDate();
		}
		fileName = fileName + ".md";

		const filePath: string = decodeURIComponent(payload.path);
		const path = normalizePath(filePath + "/" + fileName);
		return path;
	}

	/**
	 * Creates a normalized date string for use in filenames
	 * @returns A string representation of current date/time without special characters
	 */
	normalizedDate() {
		const datetime = new Date().toISOString().split(".")[0];
		return datetime
			.replaceAll("-", "")
			.replaceAll(":", "")
			.replace("T", "");
	}

	/**
	 * Generates YAML frontmatter for the note
	 * @param payload - The Popclip data containing title and source information
	 * @returns A string containing the formatted frontmatter
	 */
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

	/**
	 * Creates a header for the note using the title
	 * @param payload - The Popclip data containing the title
	 * @returns A string containing the formatted header
	 */
	setHeader(payload: PopclipData) {
		return `# ${payload?.title}\n`;
	}

	/**
	 * Combines all elements to create the final note content
	 * @param payload - The Popclip data containing all note information
	 * @returns A string containing the complete note content
	 */
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
