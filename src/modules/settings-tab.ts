/**
 * Settings tab module for the Obsidian Popclip plugin
 * Handles the UI components for configuring plugin settings
 */

import { App, PluginSettingTab, Setting } from "obsidian";
import PopclipPlugin from "../../main";

/**
 * Settings tab class that extends Obsidian's PluginSettingTab
 * Creates and manages the settings interface in Obsidian's settings panel
 */
export class PopclipSettingsTab extends PluginSettingTab {
	plugin: PopclipPlugin;

	constructor(app: App, plugin: PopclipPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	/**
	 * Displays the settings interface
	 * Creates toggle switches for various plugin features
	 */
	display() {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName("Add frontmatter")
			.setDesc("Add frontmatter to the top of the file")
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.useFrontmatter)
					.onChange(async (value) => {
						this.plugin.settings.useFrontmatter = value;
						await this.plugin.saveSettings();
					});
			});

		new Setting(containerEl)
			.setName("Use page title as heading")
			.setDesc("Add the source page title as the note heading when available")
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.useHeader)
					.onChange(async (value) => {
						this.plugin.settings.useHeader = value;
						await this.plugin.saveSettings();
					});
			});

		new Setting(containerEl)
			.setName("Use date and time as filename")
			.setDesc("Turn off to derive the filename from the page title or selection")
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.useDatetimeAsFileName)
					.onChange(async (value) => {
						this.plugin.settings.useDatetimeAsFileName = value;
						await this.plugin.saveSettings();
					});
			});
	}
}
