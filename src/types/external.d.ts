declare module "double-metaphone" {
  const doubleMetaphone: (word: string) => [string, string];
  export default doubleMetaphone;
}

declare module "diff-match-patch" {
  export default class DiffMatchPatch {
    diff_main(text1: string, text2: string): [number, string][];
    diff_cleanupSemantic(diffs: [number, string][]): void;
  }
}
