import { normalizeHeading } from "./popclip-data";

interface Heading {
	text: string;
	level: number;
	start: number;
}

// Scan the current text inside Vault.process; cached headings can be stale.
function scanHeadings(content: string): Heading[] {
	const headings: Heading[] = [];
	let frontmatter = false;
	let fence = "";
	let comment = false;
	let offset = 0;
	let previous: { text: string; start: number } | undefined;
	for (const [index, raw] of content.split("\n").entries()) {
		let line = raw.replace(/\r$/, "");
		const start = offset;
		offset += raw.length + 1;
		if (index === 0 && line.replace(/^\uFEFF/, "").trim() === "---") {
			frontmatter = true;
			continue;
		}
		if (frontmatter) {
			if (/^(---|\.\.\.)\s*$/.test(line)) frontmatter = false;
			continue;
		}
		if (fence) {
			const closing = /^ {0,3}(`{3,}|~{3,})\s*$/.exec(line);
			if (closing && closing[1][0] === fence[0] && closing[1].length >= fence.length) fence = "";
			continue;
		}
		if (!comment && /^(?: {4}|\t)/.test(line)) {
			previous = undefined;
			continue;
		}
		const opening = /^ {0,3}(`{3,}|~{3,})(.*)$/.exec(line);
		if (!comment && opening && (opening[1][0] === "~" || !opening[2].includes("`"))) {
			fence = opening[1];
			previous = undefined;
			continue;
		}
		const startsInComment = comment || /^\s*<!--/.test(line);
		const visible = withoutComments(line, comment);
		line = visible.text;
		comment = visible.open;
		if (startsInComment) {
			previous = undefined;
			continue;
		}
		const atx = /^ {0,3}(#{1,6})(?:[\t ]+(.*?)|)[\t ]*$/.exec(line);
		const setext = /^ {0,3}(=+|-+)[\t ]*$/.exec(line);
		if (atx) {
			headings.push({ text: (atx[2] || "").replace(/\s+#+$/, "").trim(), level: atx[1].length, start });
			previous = undefined;
		} else if (setext && previous) {
			headings.push({ text: previous.text.trim(), level: setext[1][0] === "=" ? 1 : 2, start: previous.start });
			previous = undefined;
		} else {
			previous = line.trim() && !/^(?: {4}|\t| {0,3}(?:>|[-+*]\s|\d+[.)]\s|[-*_]{3,}\s*$))/.test(line)
				? { text: previous ? `${previous.text} ${line.trim()}` : line.trim(), start: previous?.start ?? start }
				: undefined;
		}
	}
	if (frontmatter || fence || comment) {
		throw new Error("The destination has an unclosed frontmatter, code fence, or HTML comment. Close it before appending.");
	}
	return headings;
}

function withoutComments(line: string, open: boolean): { text: string; open: boolean } {
	let text = "";
	let index = 0;
	while (index < line.length) {
		if (open) {
			const end = line.indexOf("-->", index);
			if (end < 0) return { text, open: true };
			index = end + 3;
			open = false;
		} else if (line.startsWith("<!--", index)) {
			open = true;
			index += 4;
		} else if (line[index] === "\\") {
			text += line.slice(index, index + 2);
			index += 2;
		} else if (line[index] === "`") {
			const run = /^`+/.exec(line.slice(index))?.[0] ?? "`";
			const closing = [...line.slice(index + run.length).matchAll(/`+/g)]
				.find(match => match[0].length === run.length);
			const end = closing ? index + run.length + (closing.index ?? 0) + run.length : index + run.length;
			text += line.slice(index, end);
			index = end;
		} else {
			text += line[index++];
		}
	}
	return { text, open };
}

export function appendToSection(content: string, entry: string, heading: string, missing: MissingHeading): string {
	const target = normalizeHeading(heading);
	const headings = scanHeadings(content);
	const matches = target ? headings.filter(item => item.text === target) : [];
	if (matches.length > 1) throw new Error("The destination has more than one matching heading. Choose a unique heading.");
	const eol = content.includes("\r\n") ? "\r\n" : "\n";
	let insertAt = content.length;
	let prefix = "";
	if (matches.length) {
		const selected = matches[0];
		insertAt = headings.find(item => item.start > selected.start && item.level <= selected.level)?.start ?? content.length;
	} else if (target && missing === "create") {
		prefix = `## ${target}${eol}${eol}`;
	}
	const before = content.slice(0, insertAt);
	const after = content.slice(insertAt);
	const gap = !before || before.endsWith(eol + eol) ? "" : before.endsWith(eol) ? eol : eol + eol;
	const body = entry.replace(/\r\n|\n/g, eol).replace(/(?:\r?\n)+$/, "");
	return before + gap + prefix + body + eol + (after ? eol + after : "");
}
