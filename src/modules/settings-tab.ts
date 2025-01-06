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

		// Frontmatter toggle setting
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

		// Header toggle setting
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

		// Popclip heading toggle setting
		new Setting(containerEl)
			.setName("Popclip Heading")
			.setDesc(
				"IMPORTANT!!! Deactivate this if you got error when using popclip with this plugin. This settings can broke things. Thus, always take a backup before changing this setting."
			)
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.usePopclipHeading)
					.onChange(async (value) => {
						console.log("setting usePopclipHeading", value);
						this.plugin.settings.usePopclipHeading = value;
						await this.plugin.saveSettings();
					});
			});
	}
}
