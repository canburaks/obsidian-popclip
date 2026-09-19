import { moment } from "obsidian";

// Application safeguards for URI transport, not OS URL limits.
export const MAX_MESSAGE_LENGTH = 120000;
export const MAX_CLIP_LENGTH = 100000;

export function parsePopclipData(data: string | undefined): PopclipData {
	if (!data) {
		throw new Error("The URL does not contain clip data.");
	}
	if (data.length > MAX_MESSAGE_LENGTH) {
		throw new Error("The clip is too large. Select a shorter passage.");
	}

	let value: unknown;
	try {
		value = JSON.parse(data);
	} catch {
		throw new Error("The clip data is not valid JSON.");
	}

	if (!isRecord(value) || typeof value.clipping !== "string") {
		throw new Error("The clip data does not contain selected text.");
	}
	if (!value.clipping.trim()) throw new Error("The selection is empty.");
	if (value.clipping.length > MAX_CLIP_LENGTH) {
		throw new Error("The clip is too large. Select a shorter passage.");
	}
	if (value.schemaVersion !== undefined && value.schemaVersion !== 2) {
		throw new Error("Unsupported clip version. Update the PopClip extension and Obsidian plugin.");
	}
	const capturedAt = optionalString(value.capturedAt, "capturedAt");
	if (capturedAt !== undefined && (
		!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{1,3})?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)$/.test(capturedAt) ||
		!moment(capturedAt, moment.ISO_8601, true).isValid()
	)) throw new Error("The capture date must be a valid ISO timestamp with a timezone.");
	if (value.openAfterSave !== undefined && typeof value.openAfterSave !== "boolean") {
		throw new Error("The clip openAfterSave must be true or false.");
	}
	const heading = optionalString(value.heading, "heading");
	if (heading !== undefined) normalizeHeading(heading);

	return {
		schemaVersion: value.schemaVersion as 2 | undefined,
		clipping: value.clipping,
		path: optionalString(value.path, "path"),
		title: optionalString(value.title, "title"),
		source: optionalString(value.source, "source"),
		capturedAt,
		format: optionalChoice(value.format, "format", ["markdown", "text"]),
		appName: optionalString(value.appName, "appName"),
		appIdentifier: optionalString(value.appIdentifier, "appIdentifier"),
		tags: value.tags === undefined ? undefined : normalizeTags(value.tags),
		mode: optionalChoice(value.mode, "mode", ["create", "append", "daily"]),
		target: optionalString(value.target, "target"),
		heading,
		openAfterSave: value.openAfterSave as boolean | undefined,
	};
}

export function normalizeTags(value: unknown): string[] {
	if (!Array.isArray(value) || value.length > 100 || value.some(tag => typeof tag !== "string")) {
		throw new Error("Tags must be a list of up to 100 text values.");
	}
	const tags = value.map(tag => (tag as string).trim().replace(/^#+/, "")).filter(Boolean);
	for (const tag of tags) {
		if (tag.length > 100 || !/^[\p{L}\p{M}\p{N}_/-]+$/u.test(tag) ||
			!/[\p{L}\p{M}_-]/u.test(tag) || tag.split("/").some(part => !part)) {
			throw new Error("Tags must use letters, numbers, underscores, hyphens, or nested slashes, and cannot be only numbers.");
		}
	}
	return [...new Set(tags)];
}

export function parseTagSetting(value: string): string[] {
	return normalizeTags(value.split(/[,\s]+/).filter(Boolean));
}

export function normalizeHeading(value: string): string {
	if (/[\r\n]/.test(value) || value.length > 200) {
		throw new Error("The heading must be one line of up to 200 characters.");
	}
	return value.trim().replace(/^#{1,6}\s+/, "").replace(/\s+#+$/, "").trim();
}

export function sanitizeFileName(value: string, maximumLength = 60) {
	const withoutControlCharacters = Array.from(value, (character) =>
		character.charCodeAt(0) < 32 ? " " : character
	).join("");
	const sanitized = withoutControlCharacters
		.replace(/[\\/:*?"<>|#[\]^]/g, "-")
		.replace(/\s+/g, " ")
		.trim()
		.replace(/^\.+|\.+$/g, "")
		.trim();

	return Array.from(sanitized).slice(0, maximumLength).join("").replace(/[. ]+$/, "") || "clip";
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function optionalString(value: unknown, property: string) {
	if (value === undefined) {
		return undefined;
	}
	if (typeof value !== "string") {
		throw new Error(`The clip ${property} must be text.`);
	}
	if (value.length > 4096) throw new Error(`The clip ${property} is too long.`);
	return value;
}

function optionalChoice<T extends string>(value: unknown, name: string, choices: T[]): T | undefined {
	if (value === undefined) return undefined;
	if (typeof value !== "string" || !choices.includes(value as T)) {
		throw new Error(`The clip ${name} must be one of: ${choices.join(", ")}.`);
	}
	return value as T;
}
