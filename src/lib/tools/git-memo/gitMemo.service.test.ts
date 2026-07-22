import { describe, expect, it } from "vitest";

import { gitMemoSections } from "./gitMemo.data";
import {
  countGitMemoEntries,
  countGitMemoSections,
  filterGitMemoSections,
  findGitMemoEntryByCommand,
  flattenGitMemoEntries,
  slugifyGitMemoTitle,
} from "./gitMemo.service";

describe("git-memo", () => {
  describe("data table", () => {
    it("includes the five source sections in order", () => {
      expect(gitMemoSections.map((section) => section.title)).toEqual([
        "Configuration",
        "Get started",
        "Commit",
        "I’ve made a mistake",
        "Miscellaneous",
      ]);
    });

    it("counts sections and entries consistently", () => {
      const flat = flattenGitMemoEntries();
      expect(countGitMemoSections()).toBe(5);
      expect(countGitMemoEntries()).toBe(flat.length);
      expect(flat.length).toBe(11);
      expect(flat.every((entry) => entry.section.length > 0)).toBe(true);
      expect(flat.every((entry) => entry.command.includes("git"))).toBe(true);
    });

    it("preserves multi-line commands from the source memo", () => {
      const config = findGitMemoEntryByCommand("user.email");
      expect(config?.description).toBe("Set the global config");
      expect(config?.command).toContain("\n");
      expect(config?.command).toContain('user.name "[name]"');

      const resetRemote = findGitMemoEntryByCommand("origin/[branch-name]");
      expect(resetRemote?.command.split("\n")).toEqual([
        "git fetch origin",
        "git reset --hard origin/[branch-name]",
      ]);
    });

    it("includes amend / reset / rename recipes", () => {
      expect(findGitMemoEntryByCommand("commit --amend --no-edit")).toBeTruthy();
      expect(findGitMemoEntryByCommand("reset HEAD~1 --hard")).toBeTruthy();
      expect(findGitMemoEntryByCommand("branch -m master main")?.section).toBe(
        "Miscellaneous",
      );
    });
  });

  describe("filterGitMemoSections", () => {
    it("returns all sections when the query is blank", () => {
      expect(filterGitMemoSections("")).toBe(gitMemoSections);
      expect(filterGitMemoSections("   ")).toBe(gitMemoSections);
    });

    it("collapses matches into a Search results group", () => {
      const result = filterGitMemoSections("amend");
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe("Search results");
      expect(result[0].entries.length).toBeGreaterThanOrEqual(2);
      expect(
        result[0].entries.every((entry) =>
          entry.command.toLowerCase().includes("amend"),
        ),
      ).toBe(true);
    });

    it("matches by section title", () => {
      const result = filterGitMemoSections("miscellaneous");
      expect(result[0].entries).toHaveLength(1);
      expect(result[0].entries[0].command).toBe("git branch -m master main");
    });

    it("matches by description text", () => {
      const result = filterGitMemoSections("clone an existing");
      expect(result[0].entries).toHaveLength(1);
      expect(result[0].entries[0].command).toBe("git clone [url]");
    });

    it("returns an empty Search results group when nothing matches", () => {
      expect(filterGitMemoSections("zzzz-no-such-git-cmd")).toEqual([
        { title: "Search results", entries: [] },
      ]);
    });
  });

  describe("slugifyGitMemoTitle", () => {
    it("slugifies section titles for ids", () => {
      expect(slugifyGitMemoTitle("Get started")).toBe("get-started");
      expect(slugifyGitMemoTitle("I’ve made a mistake")).toBe(
        "i-ve-made-a-mistake",
      );
    });
  });
});
