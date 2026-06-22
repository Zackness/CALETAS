export type BlogEditorFormatAction =
  | "bold"
  | "italic"
  | "h2"
  | "ul"
  | "ol"
  | "link";

export type BlogPostBodyEditorApi = {
  runFormat: (action: BlogEditorFormatAction) => void;
  insertImageMarkdown: (url: string, alt: string) => void;
  insertImageRich: (url: string, alt: string) => void;
};
