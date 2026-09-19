export function parsePopclipData(data: string | undefined): PopclipData {
	if (!data) {
		throw new Error("The URL does not contain clip data.");
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

	return {
		clipping: value.clipping,
		path: optionalString(value.path, "path"),
		title: optionalString(value.title, "title"),
		source: optionalString(value.source, "source"),
	};
}

export function sanitizeFileName(value: string, maximumLength = 60) {
	const withoutControlCharacters = Array.from(value, (character) =>
		character.charCodeAt(0) < 32 ? " " : character
	).join("");
	const sanitized = withoutControlCharacters
		.replace(/[\\/:*?"<>|]/g, "-")
		.replace(/\s+/g, " ")
		.replace(/^\.+|\.+$/g, "")
		.trim()
		.slice(0, maximumLength)
		.trim();

	return sanitized || "clip";
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
	return value;
}
