/**
 * Git memo cheatsheet content.
 * Parity with it-tools `git-memo.content.md`.
 */

export type GitMemoEntry = {
  /** Short description shown above the command block. */
  description: string;
  /** Shell command(s), one or more lines. */
  command: string;
};

export type GitMemoSection = {
  title: string;
  entries: GitMemoEntry[];
};

export const gitMemoSections: GitMemoSection[] = [
  {
    title: "Configuration",
    entries: [
      {
        description: "Set the global config",
        command:
          'git config --global user.name "[name]"\ngit config --global user.email "[email]"',
      },
    ],
  },
  {
    title: "Get started",
    entries: [
      {
        description: "Create a git repository",
        command: "git init",
      },
      {
        description: "Clone an existing git repository",
        command: "git clone [url]",
      },
    ],
  },
  {
    title: "Commit",
    entries: [
      {
        description: "Commit all tracked changes",
        command: 'git commit -am "[commit message]"',
      },
      {
        description: "Add new modifications to the last commit",
        command: "git commit --amend --no-edit",
      },
    ],
  },
  {
    title: "I’ve made a mistake",
    entries: [
      {
        description: "Change last commit message",
        command: "git commit --amend",
      },
      {
        description: "Undo most recent commit and keep changes",
        command: "git reset HEAD~1",
      },
      {
        description: "Undo the `N` most recent commit and keep changes",
        command: "git reset HEAD~N",
      },
      {
        description: "Undo most recent commit and get rid of changes",
        command: "git reset HEAD~1 --hard",
      },
      {
        description: "Reset branch to remote state",
        command: "git fetch origin\ngit reset --hard origin/[branch-name]",
      },
    ],
  },
  {
    title: "Miscellaneous",
    entries: [
      {
        description: "Renaming the local master branch to main",
        command: "git branch -m master main",
      },
    ],
  },
];
