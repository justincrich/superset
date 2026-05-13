import { describe, expect, test } from "bun:test";
import { indexBy } from "./indexBy";

describe("indexBy", () => {
	test("skips nullish rows before selecting keys", () => {
		const items: Array<{ id: string; name: string } | null | undefined> = [
			{ id: "a", name: "Alice" },
			undefined,
			null,
			{ id: "b", name: "Bob" },
		];
		const selectedIds: string[] = [];

		const result = indexBy(items, (item) => {
			selectedIds.push(item.id);
			return item.id;
		});

		expect(result.size).toBe(2);
		expect(selectedIds).toEqual(["a", "b"]);
		expect(result.get("a")?.name).toBe("Alice");
		expect(result.get("b")?.name).toBe("Bob");
	});

	test("supports custom key selectors", () => {
		const hosts = [
			{ machineId: "m1", name: "Mac" },
			{ machineId: "m2", name: "Linux" },
		];

		const result = indexBy(hosts, (host) => host.machineId);

		expect(result.get("m1")?.name).toBe("Mac");
		expect(result.get("m2")?.name).toBe("Linux");
	});
});
