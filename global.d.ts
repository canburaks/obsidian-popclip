export {};
declare global {
	interface PopclipData {
		clipping: string;
		path: string;
		title?: string;
		source?: string;
	}

	interface DefaultSettings {
		mySetting: string;
		actionHeading: string;
		action: string;
	}

	interface CustomSettings {
		useFrontmatter: boolean;
		useHeader: boolean;
		usePopclipHeading: boolean;
		useSlugifyFileName?: boolean;
		useTable: boolean;
		useDatetimeAsFileName: boolean;
	}
	type Settings = DefaultSettings & CustomSettings;

	interface PopclipSettingsTab {
		dateFormat: string;
	  }
}
