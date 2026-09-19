export {};
declare global {
	type SaveMode = "create" | "append" | "daily";
	type MissingHeading = "create" | "end";

	interface PopclipData {
		schemaVersion?: 2;
		clipping: string;
		path?: string;
		title?: string;
		source?: string;
		capturedAt?: string;
		format?: "markdown" | "text";
		appName?: string;
		appIdentifier?: string;
		tags?: string[];
		mode?: SaveMode;
		target?: string;
		heading?: string;
		openAfterSave?: boolean;
	}

	interface Settings {
		useFrontmatter: boolean;
		useHeader: boolean;
		useDatetimeAsFileName: boolean;
		defaultMode: SaveMode;
		defaultFolder: string;
		defaultTags: string;
		appendFile: string;
		appendHeading: string;
		missingHeading: MissingHeading;
		dailyFolder: string;
		dailyFormat: string;
		openAfterSave: boolean;
		openInNewTab: boolean;
	}
}
