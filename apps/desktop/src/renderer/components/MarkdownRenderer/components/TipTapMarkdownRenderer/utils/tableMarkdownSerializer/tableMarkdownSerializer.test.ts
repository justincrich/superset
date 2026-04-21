import { describe, expect, test } from "bun:test";
import { MarkdownSerializer } from "@tiptap/pm/markdown";
import { type Node as PMNode, Schema } from "@tiptap/pm/model";
import { serializeTableAsMarkdown } from "./tableMarkdownSerializer";

const schema = new Schema({
	nodes: {
		doc: { content: "block+" },
		paragraph: {
			group: "block",
			content: "inline*",
			toDOM: () => ["p", 0],
		},
		hardBreak: {
			group: "inline",
			inline: true,
			selectable: false,
			toDOM: () => ["br"],
		},
		text: { group: "inline" },
		table: {
			group: "block",
			content: "tableRow+",
			isolating: true,
			toDOM: () => ["table", ["tbody", 0]],
		},
		tableRow: {
			content: "(tableCell | tableHeader)+",
			toDOM: () => ["tr", 0],
		},
		tableCell: {
			content: "block+",
			attrs: {
				colspan: { default: 1 },
				rowspan: { default: 1 },
				colwidth: { default: null },
			},
			isolating: true,
			toDOM: () => ["td", 0],
		},
		tableHeader: {
			content: "block+",
			attrs: {
				colspan: { default: 1 },
				rowspan: { default: 1 },
				colwidth: { default: null },
			},
			isolating: true,
			toDOM: () => ["th", 0],
		},
	},
	marks: {
		em: { toDOM: () => ["em", 0] },
		strong: { toDOM: () => ["strong", 0] },
	},
});

function p(text: string): PMNode {
	return schema.nodes.paragraph.create(null, text ? [schema.text(text)] : []);
}

function header(text: string): PMNode {
	return schema.nodes.tableHeader.create(null, [p(text)]);
}

function cell(...blocks: PMNode[]): PMNode {
	return schema.nodes.tableCell.create(null, blocks);
}

function row(...cells: PMNode[]): PMNode {
	return schema.nodes.tableRow.create(null, cells);
}

function table(...rows: PMNode[]): PMNode {
	return schema.nodes.table.create(null, rows);
}

function doc(...blocks: PMNode[]): PMNode {
	return schema.nodes.doc.create(null, blocks);
}

type NodeSerializers = ConstructorParameters<typeof MarkdownSerializer>[0];
type MarkSerializers = ConstructorParameters<typeof MarkdownSerializer>[1];

function serialize(node: PMNode): string {
	const nodes: NodeSerializers = {
		doc: (s, n) => s.renderContent(n),
		paragraph: (s, n) => {
			s.renderInline(n);
			s.closeBlock(n);
		},
		text: (s, n) => {
			s.text(n.text ?? "", true);
		},
		hardBreak: (s) => s.write("  \n"),
		// biome-ignore lint/suspicious/noExplicitAny: test-only cast — serializeTableAsMarkdown uses a slightly richer state surface than prosemirror-markdown's public types expose (reads state.out to capture inline output)
		table: serializeTableAsMarkdown as any,
		tableRow: () => {},
		tableCell: () => {},
		tableHeader: () => {},
	};
	const marks: MarkSerializers = {
		em: {
			open: "*",
			close: "*",
			mixable: true,
			expelEnclosingWhitespace: true,
		},
		strong: {
			open: "**",
			close: "**",
			mixable: true,
			expelEnclosingWhitespace: true,
		},
	};
	return new MarkdownSerializer(nodes, marks).serialize(node);
}

describe("serializeTableAsMarkdown — issue #3613", () => {
	test("simple single-paragraph-per-cell table roundtrips to markdown", () => {
		const tree = doc(
			table(
				row(header("Col A"), header("Col B")),
				row(cell(p("a1")), cell(p("b1"))),
			),
		);

		const output = serialize(tree);

		expect(output).not.toContain("[table]");
		expect(output).toContain("| Col A | Col B |");
		expect(output).toContain("| --- | --- |");
		expect(output).toContain("| a1 | b1 |");
	});

	test("cell with multiple paragraphs (user added notes) still serializes as a markdown table", () => {
		// This is the exact shape produced when a user edits a cell in the
		// rendered view and hits Enter to add a second paragraph of notes.
		// The stock tiptap-markdown serializer falls back to the HTML branch
		// and emits the literal string "[table]" when html mode is disabled.
		const tree = doc(
			table(
				row(header("Ingredient"), header("Notes")),
				row(cell(p("flour"), p("sift before use")), cell(p("200 g"))),
			),
		);

		const output = serialize(tree);

		expect(output).not.toContain("[table]");
		expect(output).toContain("| Ingredient | Notes |");
		expect(output).toContain("| --- | --- |");
		expect(output).toContain("flour<br>sift before use");
	});

	test("escapes pipe characters inside cell content", () => {
		const tree = doc(
			table(
				row(header("a"), header("b")),
				row(cell(p("pipe | here")), cell(p("ok"))),
			),
		);

		const output = serialize(tree);

		expect(output).not.toContain("[table]");
		expect(output).toContain("pipe \\| here");
	});

	test("renders a headerless table with an empty header row and all rows as body", () => {
		const tree = doc(
			table(row(cell(p("a")), cell(p("b"))), row(cell(p("c")), cell(p("d")))),
		);

		const output = serialize(tree);
		const lines = output.trim().split("\n");

		expect(output).not.toContain("[table]");
		expect(lines[0]).toBe("|  |  |");
		expect(lines[1]).toBe("| --- | --- |");
		expect(lines[2]).toBe("| a | b |");
		expect(lines[3]).toBe("| c | d |");
	});
});
