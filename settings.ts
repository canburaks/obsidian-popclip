

// Don't change this
const DEFAULT_SETTINGS: DefaultSettings = {
	mySetting: "default",
	actionHeading: "popclip",
	action: "advanced-uri"
};

const CUSTOM_SETTINGS: CustomSettings = {
    useFrontmatter: true,
    usePopclipHeading: true,
    useHeader: true,
    useDatetimeAsFileName: true,
    useTable: true,
};

export const SETTINGS = {
    ...DEFAULT_SETTINGS,
    ...CUSTOM_SETTINGS
}