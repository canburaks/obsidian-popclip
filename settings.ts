export const PROTOCOL_ACTION = "popclip";

export const DEFAULT_SETTINGS: Settings = {
	useFrontmatter: true,
	useHeader: true,
	useDatetimeAsFileName: true,
	defaultMode: "create",
	defaultFolder: "Clippings",
	defaultTags: "",
	appendFile: "Clippings/Inbox.md",
	appendHeading: "",
	missingHeading: "create",
	dailyFolder: "Daily notes",
	dailyFormat: "YYYY-MM-DD",
	openAfterSave: false,
	openInNewTab: false,
};

export function loadSettings(value: unknown): Settings {
	const result = { ...DEFAULT_SETTINGS };
	if (!value || typeof value !== "object" || Array.isArray(value)) return result;
	for (const key of Object.keys(DEFAULT_SETTINGS) as (keyof Settings)[]) {
		const candidate = (value as Record<string, unknown>)[key];
		if (typeof candidate === typeof DEFAULT_SETTINGS[key]) {
			Object.assign(result, { [key]: candidate });
		}
	}
	if (!["create", "append", "daily"].includes(result.defaultMode)) result.defaultMode = "create";
	if (!["create", "end"].includes(result.missingHeading)) result.missingHeading = "create";
	return result;
}
