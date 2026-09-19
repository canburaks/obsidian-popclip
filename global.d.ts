export {};
declare global {
	interface PopclipData {
		clipping: string;
		path?: string;
		title?: string;
		source?: string;
	}

	interface Settings {
		useFrontmatter: boolean;
		useHeader: boolean;
		useDatetimeAsFileName: boolean;
	}
}
