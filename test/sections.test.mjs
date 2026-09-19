import assert from "node:assert/strict";
import test from "node:test";
import { bundle } from "./helpers.mjs";

test("appending locates real headings and keeps nested sections", async () => {
	const { appendToSection } = await bundle("src/utils/append-section.ts");
	const text = '---\nexample: |\n  ## Clips\n---\n```md\n## Clips\n```\n<!--\n## Clips\n-->\n## Clips\nOld\n### Child\nNested\n## Next\nLast\n';
	const result = appendToSection(text, "NEW", "Clips", "create");
	assert.equal(result, text.replace("## Next", "\nNEW\n\n## Next"));
});

test("missing headings can be created or fall back to the end", async () => {
	const { appendToSection } = await bundle("src/utils/append-section.ts");
	assert.equal(appendToSection("Original", "NEW", "## Clips", "create"), "Original\n\n## Clips\n\nNEW\n");
	assert.equal(appendToSection("Original", "NEW", "Clips", "end"), "Original\n\nNEW\n");
	assert.equal(appendToSection("", "NEW", "", "create"), "NEW\n");
});

test("Setext headings and CRLF boundaries are supported", async () => {
	const { appendToSection } = await bundle("src/utils/append-section.ts");
	const text = "Clips\r\n-----\r\nOld\r\n\r\nNext\r\n====\r\nLast\r\n";
	const result = appendToSection(text, "NEW\nLINE", "Clips", "create");
	assert.equal(result, text.replace("Next", "NEW\r\nLINE\r\n\r\nNext"));
});

test("ambiguous headings and unclosed Markdown blocks leave notes unchanged", async () => {
	const { appendToSection } = await bundle("src/utils/append-section.ts");
	assert.throws(() => appendToSection("## Clips\nA\n## Clips\nB", "NEW", "Clips", "create"), /more than one/i);
	for (const text of ["---\ntitle: Open", "```md\nOpen", "<!-- open"]) {
		assert.throws(() => appendToSection(text, "NEW", "", "create"), /unclosed/i);
	}
});

test("inline comments cannot hide a section boundary", async () => {
	const { appendToSection } = await bundle("src/utils/append-section.ts");
	const text = "## Clips\nOld\n## Next <!-- comment -->\nOther\n";
	assert.equal(appendToSection(text, "NEW", "Clips", "create"), text.replace("## Next", "\nNEW\n\n## Next"));
});

test("literal comments in code and long headings do not block appending", async () => {
	const { appendToSection } = await bundle("src/utils/append-section.ts");
	for (const text of ["This is `<!--` text.\n", "    <!--\n", `## ${"Long".repeat(60)}\n`]) {
		assert.equal(appendToSection(text, "NEW", "", "create"), text + "\nNEW\n");
	}
});

test("multiline Setext headings stay together at the section boundary", async () => {
	const { appendToSection } = await bundle("src/utils/append-section.ts");
	const text = "## Clips\nOld\n\nNew\nsection\n=======\nLast\n";
	assert.equal(appendToSection(text, "NEW", "Clips", "create"), text.replace("New\nsection", "NEW\n\nNew\nsection"));
});

test("text after a closing block comment cannot move insertion inside the comment", async () => {
	const { appendToSection } = await bundle("src/utils/append-section.ts");
	const text = "## Clips\nOld\n<!-- comment\n--> ## Next\nOther\n";
	assert.equal(appendToSection(text, "NEW", "Clips", "create"), text + "\nNEW\n");
});
