/**
 * Settings tab module for the Obsidian Popclip plugin
 * Handles the UI components for configuring plugin settings
 */

import { App, moment, Notice, PluginSettingTab, Setting } from "obsidian";
import PopclipPlugin from "../../main";
import { normalizeFolderPath, normalizeHeading, normalizeNotePath, parseTagSetting } from "../utils";

type BooleanSetting = "useFrontmatter" | "useHeader" | "useDatetimeAsFileName" | "openAfterSave" | "openInNewTab";
type TextSetting = "defaultFolder" | "defaultTags" | "appendFile" | "appendHeading" | "dailyFolder" | "dailyFormat";

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

	display() {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName("Default save mode")
			.setDesc("Used when the PopClip extension follows Obsidian settings.")
			.addDropdown(dropdown => dropdown
				.addOptions({ create: "Create a new note", append: "Append to a note", daily: "Append to a daily note" })
				.setValue(this.plugin.settings.defaultMode)
				.onChange(value => this.persist("defaultMode", value)));

		this.text("defaultFolder", "Default new-note folder", "Used if the extension sends no folder. Leave empty for the vault root.", normalizeFolderPath);
		this.text("appendFile", "Append note", "Vault-relative Markdown file, such as Clippings/Inbox.md. Created if missing.", normalizeNotePath);
		this.text("dailyFolder", "Daily note folder", "Match your existing daily-note folder, or choose a separate one. Empty means vault root.", normalizeFolderPath);
		this.text("dailyFormat", "Daily note date format", "Moment format, such as YYYY-MM-DD or YYYY/MM/YYYY-MM-DD. Uses local capture time; core daily-note templates are not applied.", value => {
			if (!value.trim()) throw new Error("Enter a date format, such as YYYY-MM-DD.");
			normalizeNotePath(`${moment().format(value)}.md`);
		});
		this.text("appendHeading", "Append heading", "Append and daily modes only. Use the exact heading text; leave empty to append at the end.", normalizeHeading);

		new Setting(containerEl)
			.setName("When the heading is missing")
			.setDesc("Applies to both existing and newly created append/daily notes.")
			.addDropdown(dropdown => dropdown
				.addOptions({ create: "Create the heading", end: "Append at the end" })
				.setValue(this.plugin.settings.missingHeading)
				.onChange(value => this.persist("missingHeading", value)));

		this.text("defaultTags", "Default tags", "Comma- or space-separated tags, merged with tags from PopClip. Nested tags such as research/web are supported.", parseTagSetting);
		this.toggle("useFrontmatter", "Add clip metadata", "Add note properties for new notes, or a metadata block below each appended clip. Includes capture time, source, application, and tags.");
		this.toggle("useHeader", "Include page title", "Use the source title as a heading in new notes, or as bold text above appended clips.");
		this.toggle("useDatetimeAsFileName", "Use date and time as filename", "New-note mode only. Turn off to use the page title or selection.");
		this.toggle("openAfterSave", "Open note after saving", "Show the destination note once the clip has been saved.");
		this.toggle("openInNewTab", "Open in a new tab", "Applies when opening a note after saving is enabled.");
	}

	private toggle(key: BooleanSetting, name: string, description: string) {
		new Setting(this.containerEl).setName(name).setDesc(description)
			.addToggle(toggle => toggle.setValue(this.plugin.settings[key])
				.onChange(value => this.persist(key, value)));
	}

	private text(key: TextSetting, name: string, description: string, validate: (value: string) => unknown) {
		new Setting(this.containerEl).setName(name).setDesc(description).addText(text => {
			text.setValue(this.plugin.settings[key]);
			text.onChange(() => text.inputEl.setCustomValidity(""));
			text.inputEl.addEventListener("blur", async () => {
				const value = text.getValue().trim();
				try {
					if (value.length > 4096) throw new Error("This setting is too long.");
					validate(value);
					text.inputEl.setCustomValidity("");
					await this.persist(key, value);
				} catch (error) {
					text.inputEl.setCustomValidity(error instanceof Error ? error.message : String(error));
					text.inputEl.reportValidity();
				}
			});
		});
	}

	private async persist(key: keyof Settings, value: string | boolean) {
		const previous = this.plugin.settings[key];
		Object.assign(this.plugin.settings, { [key]: value });
		try {
			await this.plugin.saveSettings();
		} catch {
			Object.assign(this.plugin.settings, { [key]: previous });
			new Notice("Could not save PopClip settings. Please try again.");
		}
	}
}
