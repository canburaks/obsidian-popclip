/**
 * Settings configuration for the Obsidian Popclip plugin
 * Defines default and custom settings that control plugin behavior
 */

// Default settings that should not be changed
const DEFAULT_SETTINGS: DefaultSettings = {
	// Default placeholder setting
	mySetting: "default",
	// The heading used to identify Popclip actions
	actionHeading: "popclip",
	// The URI action type for handling Popclip data
	action: "advanced-uri"
};

/**
 * Custom settings that can be configured by users
 * These control how notes are created and formatted
 */
const CUSTOM_SETTINGS: CustomSettings = {
    // Whether to add YAML frontmatter to notes
    useFrontmatter: true,
    // Whether to require Popclip heading in data
    usePopclipHeading: true,
    // Whether to add a header to notes using the title
    useHeader: true,
    // Whether to use datetime as the filename instead of title/content
    useDatetimeAsFileName: true,
    // Whether to include a metadata table in notes (future feature)
    useTable: true,
};

// Export combined settings
export const SETTINGS = {
    ...DEFAULT_SETTINGS,
    ...CUSTOM_SETTINGS
}
