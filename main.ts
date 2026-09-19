import { Notice, ObsidianProtocolData, Plugin } from "obsidian";
import { FileWriter, PopclipSettingsTab } from "./src/modules";
import { parsePopclipData } from "./src/utils";
import { DEFAULT_SETTINGS, PROTOCOL_ACTION } from "./settings";

export default class PopclipPlugin extends Plugin {
	settings: Settings;

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new PopclipSettingsTab(this.app, this));
		this.registerObsidianProtocolHandler(
			PROTOCOL_ACTION,
			(params) => this.handleProtocolRequest(params)
		);
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	private async handleProtocolRequest(params: ObsidianProtocolData) {
		try {
			const payload = parsePopclipData(params.data);
			const file = await new FileWriter(this.app, this).writeToFile(payload);
			new Notice(`Saved PopClip selection to ${file.path}`);
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			console.error("Unable to save PopClip selection", error);
			new Notice(`Unable to save PopClip selection: ${message}`);
		}
	}
}
