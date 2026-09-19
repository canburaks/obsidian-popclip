import { Notice, ObsidianProtocolData, Plugin } from "obsidian";
import { FileWriter, PopclipSettingsTab } from "./src/modules";
import { parsePopclipData } from "./src/utils";
import { loadSettings, PROTOCOL_ACTION } from "./settings";

export default class PopclipPlugin extends Plugin {
	settings: Settings;
	private requests: Promise<void> = Promise.resolve();

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new PopclipSettingsTab(this.app, this));
		this.registerObsidianProtocolHandler(
			PROTOCOL_ACTION,
			(params) => this.handleProtocolRequest(params)
		);
	}

	async loadSettings() {
		this.settings = loadSettings(await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	private handleProtocolRequest(params: ObsidianProtocolData) {
		const next = this.requests.then(() => this.saveSelection(params));
		this.requests = next.catch(() => undefined);
		return next;
	}

	private async saveSelection(params: ObsidianProtocolData) {
		try {
			const payload = parsePopclipData(params.data);
			const file = await new FileWriter(this.app, this).writeToFile(payload);
			if (payload.openAfterSave ?? this.settings.openAfterSave) {
				try {
					await this.app.workspace.getLeaf(this.settings.openInNewTab ? "tab" : false).openFile(file);
				} catch {
					new Notice(`PopClip saved the selection to ${file.path}, but could not open the note.`);
					return;
				}
			}
			new Notice(`Saved PopClip selection to ${file.path}`);
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			console.error("Unable to save PopClip selection", error);
			new Notice(`Unable to save PopClip selection: ${message}`);
		}
	}
}
