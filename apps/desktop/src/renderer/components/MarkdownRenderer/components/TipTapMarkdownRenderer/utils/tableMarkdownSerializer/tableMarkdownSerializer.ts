import type { Node as PMNode } from "@tiptap/pm/model";

export interface TableSerializerState {
	out: string;
	write(content?: string): void;
	ensureNewLine(): void;
	closeBlock(node: PMNode): void;
	renderInline(parent: PMNode, fromBlockStart?: boolean): void;
	inTable?: boolean;
}

function renderCellToString(state: TableSerializerState, cell: PMNode): string {
	const parts: string[] = [];

	cell.forEach((child) => {
		if (child.isTextblock) {
			const before = state.out.length;
			state.renderInline(child);
			const rendered = state.out.slice(before);
			state.out = state.out.slice(0, before);
			const trimmed = rendered.replace(/\s+/g, " ").trim();
			if (trimmed) parts.push(trimmed);
			return;
		}

		const fallback = child.textContent.replace(/\s+/g, " ").trim();
		if (fallback) parts.push(fallback);
	});

	return parts.join("<br>").replace(/\|/g, "\\|");
}

export function serializeTableAsMarkdown(
	state: TableSerializerState,
	node: PMNode,
): void {
	const rows: PMNode[] = [];
	node.forEach((row) => {
		rows.push(row);
	});

	if (rows.length === 0) {
		state.closeBlock(node);
		return;
	}

	const columnCount = rows.reduce(
		(max, row) => Math.max(max, row.childCount),
		0,
	);

	if (columnCount === 0) {
		state.closeBlock(node);
		return;
	}

	const renderedRows: string[][] = rows.map((row) => {
		const cells: string[] = [];
		row.forEach((cell) => {
			cells.push(renderCellToString(state, cell));
		});
		while (cells.length < columnCount) cells.push("");
		return cells;
	});

	const firstRow = rows[0];
	let firstRowIsHeader = false;
	firstRow.forEach((cell) => {
		if (cell.type.name === "tableHeader") firstRowIsHeader = true;
	});

	state.inTable = true;

	const headerTexts = firstRowIsHeader
		? renderedRows[0]
		: new Array(columnCount).fill("");

	state.write(`| ${headerTexts.join(" | ")} |`);
	state.ensureNewLine();
	state.write(`| ${new Array(columnCount).fill("---").join(" | ")} |`);
	state.ensureNewLine();

	const bodyRows = firstRowIsHeader ? renderedRows.slice(1) : renderedRows;
	for (const row of bodyRows) {
		state.write(`| ${row.join(" | ")} |`);
		state.ensureNewLine();
	}

	state.closeBlock(node);
	state.inTable = false;
}
