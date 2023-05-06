interface DefaultSettings {
	mySetting: string;
	actionHeading: string;
	action: string;
}

interface CustomSettings {
    useFrontmatter: boolean;
    useHeader: boolean;
}
export type Settings = DefaultSettings & CustomSettings;

// Don't change this
const DEFAULT_SETTINGS: DefaultSettings = {
	mySetting: "default",
	actionHeading: "popclip",
	action: "advanced-uri"
};

const CUSTOM_SETTINGS: CustomSettings = {
    useFrontmatter: true,
    useHeader: true
};

export const SETTINGS = {
    ...DEFAULT_SETTINGS,
    ...CUSTOM_SETTINGS
}