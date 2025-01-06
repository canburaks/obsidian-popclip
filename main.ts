/**
 * This is the main plugin file for the Obsidian Popclip integration.
 * It handles the core functionality of receiving data from Popclip and creating notes in Obsidian.
 */

import { Plugin } from "obsidian";
import { SETTINGS } from "./settings";
import { FileWriter, PopclipSettingsTab } from "src/modules";

/**
 * Main plugin class that extends Obsidian's Plugin class
 * Handles plugin initialization, settings management, and protocol handling
 */
export default class PopclipPlugin extends Plugin {
	settings: Settings;

	/**
	 * Called when the plugin is loaded
	 * Initializes settings and sets up protocol handler for receiving Popclip data
	 */
	async onload() {
		// Load saved settings
		await this.loadSettings();

		// Add the settings tab to Obsidian's settings panel
		this.addSettingTab(new PopclipSettingsTab(this.app, this));

		// Register protocol handler for receiving data from Popclip
		this.registerObsidianProtocolHandler(SETTINGS.action, async (ev) => {
			// Check if the event has a heading and matches our expected heading
			if (ev?.heading) {
				if (ev?.heading === SETTINGS.actionHeading) {
					new FileWriter(this.app, this).writeToFile(
						JSON.parse(ev.data)
					);
				}
			} else if (!this.settings.usePopclipHeading) {
				// If no heading check is required, process the data directly
				new FileWriter(this.app, this).writeToFile(JSON.parse(ev.data));
			}
		});
	}

	/**
	 * Called when the plugin is disabled
	 */
	onunload() {
		// Cleanup code can be added here if needed
	}

	/**
	 * Loads settings from Obsidian's data storage
	 * Merges default settings with saved user settings
	 */
	async loadSettings() {
		this.settings = Object.assign({}, SETTINGS, await this.loadData());
	}

	/**
	 * Saves current settings to Obsidian's data storage
	 */
	async saveSettings() {
		await this.saveData(this.settings);
	}

	/**
	 * Reserved for future use - could be used to activate specific views
	 */
	async activateView() {}
}
