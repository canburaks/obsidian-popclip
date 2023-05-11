import ExamplePlugin from "../../main";
import { App, PluginSettingTab, Setting } from "obsidian";
import PopclipPlugin from "../../main";

export class PopclipSettingsTab extends PluginSettingTab {
	plugin: PopclipPlugin;

	constructor(app: App, plugin: PopclipPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		let { containerEl } = this;
		containerEl.empty();
		new Setting(containerEl)
			.setName("Frontmatter")
			.setDesc("Add frontmatter to the top of the file")
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.useFrontmatter)
					.onChange(async (value) => {
						this.plugin.settings.useFrontmatter = value;
						console.log("useFrontmatter", value);
						await this.plugin.saveSettings();
					});
			});
		new Setting(containerEl)
			.setName("Header")
			.setDesc(
				"Use the title of the source page if exists as header of note."
			)
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.useHeader)
					.onChange(async (value) => {
						this.plugin.settings.useHeader = value;
						await this.plugin.saveSettings();
					});
			});
		// new Setting(containerEl)
		// 	.setName("Datetime Filename")
		// 	.setDesc(
		// 		"Use datetime of clipping as filename. If not selected, use slugified title of clipping."
		// 	)
		// 	.addToggle((toggle) => {
		// 		toggle
		// 			.setValue(this.plugin.settings.useDatetimeAsFileName)
		// 			.onChange(async (value) => {
		// 				this.plugin.settings.useDatetimeAsFileName = value;
		// 				await this.plugin.saveSettings();
		// 			});
		// 	});
	}
}
