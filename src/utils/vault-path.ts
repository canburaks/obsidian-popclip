import { normalizePath } from "obsidian";

export function normalizeFolderPath(value: string): string {
	const path = value.trim().replace(/\\/g, "/");
	if (path.startsWith("/") || /[:*?"<>|#]/.test(path) ||
		Array.from(path).some(character => character.charCodeAt(0) < 32) ||
		path.split("/").some(part => part.startsWith(".") || /[. ]$/.test(part))) {
		throw new Error("The destination must be a folder inside the vault, without hidden folders, traversal, or invalid path characters.");
	}
	return path ? normalizePath(path) : "";
}

export function normalizeNotePath(value: string): string {
	if (/[\\/]$/.test(value.trim())) throw new Error("The append destination must be a Markdown file ending in .md.");
	const path = normalizeFolderPath(value);
	if (!path || path.endsWith("/") || !/\.md$/i.test(path)) {
		throw new Error("The append destination must be a Markdown file ending in .md.");
	}
	return path;
}
