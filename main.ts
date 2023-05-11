import {
	App,
	normalizePath,
	Plugin,
	FileManager,
	TFile,
	TFolder,
} from "obsidian";
import { SETTINGS } from "./settings";
import { FileWriter, PopclipSettingsTab } from "src/modules";

export default class PopclipPlugin extends Plugin {
	settings: Settings;
	async onload() {
		await this.loadSettings();
		this.addSettingTab(new PopclipSettingsTab(this.app, this));

		this.registerObsidianProtocolHandler(SETTINGS.action, async (ev) => {
			if (ev.heading === SETTINGS.actionHeading) {
				new FileWriter(this.app, this).writeToFile(JSON.parse(ev.data));
			}
		});
	}

	onunload() {
		// this.app.workspace.detachLeavesOfType(VIEW_TYPE_EXAMPLE);
	}

	async loadSettings() {
		this.settings = Object.assign({}, SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	async activateView() {}
}
