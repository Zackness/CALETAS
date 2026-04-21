"use client";

import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";

import CodeMirror from "@uiw/react-codemirror";
import { markdown } from "@codemirror/lang-markdown";
import { EditorView } from "@codemirror/view";
import { undo, redo } from "@codemirror/commands";
import { autocompletion, type Completion, type CompletionContext } from "@codemirror/autocomplete";

import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";

export type EditorMode = "tiptap" | "codemirror";

type DualMarkdownEditorProps = {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  className?: string;
  minHeightClassName?: string;
  codeMirrorHeight?: string;
  defaultMode?: EditorMode;
  showToolbar?: boolean;
  onModeChange?: (mode: EditorMode) => void;
};

export type DualMarkdownEditorHandle = {
  mode: EditorMode;
  setMode: (mode: EditorMode) => void;
  applyBold: () => void;
  applyItalic: () => void;
  insertHeading: (level: 1 | 2 | 3) => void;
  insertList: () => void;
  insertFormulaBlock: () => void;
   insertInlineMath: () => void;
   insertIntegral: () => void;
   insertSummation: () => void;
   insertFraction: () => void;
   insertSymbol: (latex: string) => void;
  getSelectedText: () => string;
  replaceSelection: (text: string) => void;
  insertAtCursor: (text: string) => void;
  undo: () => void;
  redo: () => void;
};

export const DualMarkdownEditor = forwardRef<DualMarkdownEditorHandle, DualMarkdownEditorProps>(
  function DualMarkdownEditor(
    {
      value,
      onChange,
      placeholder = "Escribe aquí…",
      className,
      minHeightClassName = "min-h-[200px]",
      codeMirrorHeight = "520px",
      defaultMode = "tiptap",
      showToolbar = true,
      onModeChange,
    }: DualMarkdownEditorProps,
    ref,
  ) {
  const [mode, setMode] = useState<EditorMode>(defaultMode);
  const [cmView, setCmView] = useState<EditorView | null>(null);

  // TipTap (edición rápida). Nota: no es un editor Markdown nativo; guardamos el texto plano.
  const editor = useEditor({
    // Next.js + React 19: evitar mismatches de hidratación
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: false,
        bulletList: false,
        orderedList: false,
        blockquote: false,
        codeBlock: false,
        horizontalRule: false,
      }),
      Placeholder.configure({ placeholder }),
    ],
    content: value || "",
    editorProps: {
      attributes: {
        class:
          [
            "rounded-b-lg border-x border-b border-white/10 bg-[#1C2D20] px-4 py-3 text-white/90 text-[15px] leading-7",
            "focus:outline-none focus:ring-2 focus:ring-[#40C9A9]/40 focus:border-[#40C9A9]/40",
            minHeightClassName,
            "whitespace-pre-wrap break-words",
          ].join(" "),
      },
    },
    onUpdate({ editor }) {
      const next = editor.getText();
      // Evitar loops por cambios externos
      if (next !== value) onChange(next);
    },
  });

  // Mantener TipTap sincronizado cuando el value cambia externamente (ej: cargar obra)
  useEffect(() => {
    if (!editor) return;
    const current = editor.getText();
    if (current !== value) {
      editor.commands.setContent(value || "", { emitUpdate: false });
    }
  }, [editor, value]);

  const latexCompletions = useMemo<Completion[]>(
    () => [
      { label: "\\alpha", type: "keyword", detail: "α" },
      { label: "\\beta", type: "keyword", detail: "β" },
      { label: "\\gamma", type: "keyword", detail: "γ" },
      { label: "\\theta", type: "keyword", detail: "θ" },
      { label: "\\pi", type: "keyword", detail: "π" },
      { label: "\\Delta", type: "keyword", detail: "Δ" },
      { label: "\\sqrt{}", type: "function", detail: "Raíz" },
      { label: "\\frac{}{}", type: "function", detail: "Fracción" },
      { label: "\\sum_{}^{}", type: "function", detail: "Sumatoria" },
      { label: "\\int_{}^{}", type: "function", detail: "Integral" },
      { label: "\\infty", type: "keyword", detail: "∞" },
      { label: "\\approx", type: "keyword", detail: "≈" },
      { label: "\\leq", type: "keyword", detail: "≤" },
      { label: "\\geq", type: "keyword", detail: "≥" },
      { label: "\\to", type: "keyword", detail: "→" },
      { label: "\\in", type: "keyword", detail: "∈" },
      { label: "\\notin", type: "keyword", detail: "∉" },
      { label: "\\pm", type: "keyword", detail: "±" },
      { label: "\\cdot", type: "keyword", detail: "·" },
      { label: "\\mathbb{R}", type: "keyword", detail: "ℝ" },
      { label: "\\mathbb{N}", type: "keyword", detail: "ℕ" },
      { label: "\\mathbb{Z}", type: "keyword", detail: "ℤ" },
    ],
    [],
  );

  const latexCompletionSource = useCallback(
    (context: CompletionContext) => {
      const m = context.matchBefore(/\\[a-zA-Z]*$/);
      if (!m) return null;
      // Mostrar también cuando solo se escribió "\" (m.to === cursor)
      return {
        from: m.from,
        options: latexCompletions,
        filter: true,
      };
    },
    [latexCompletions],
  );

  const codemirrorExtensions = useMemo(
    () => [
      markdown(),
      autocompletion({
        override: [latexCompletionSource],
        maxRenderedOptions: 14,
      }),
    ],
    [latexCompletionSource],
  );

  const applyWrap = useCallback((left: string, right = left, placeholderText = "texto") => {
    if (mode === "codemirror" && cmView) {
      const sel = cmView.state.selection.main;
      const selected = cmView.state.sliceDoc(sel.from, sel.to);
      const content = selected || placeholderText;
      cmView.dispatch({
        changes: { from: sel.from, to: sel.to, insert: `${left}${content}${right}` },
        selection: { anchor: sel.from + left.length + content.length + right.length },
      });
      cmView.focus();
      return;
    }
    if (editor) {
      const { from, to } = editor.state.selection;
      const selected = editor.state.doc.textBetween(from, to, "\n", "\n");
      editor.chain().focus().insertContent(`${left}${selected || placeholderText}${right}`).run();
    }
  }, [mode, cmView, editor]);

  const insertToken = useCallback((token: string) => {
    if (mode === "codemirror" && cmView) {
      const sel = cmView.state.selection.main;
      cmView.dispatch({
        changes: { from: sel.from, to: sel.to, insert: token },
        selection: { anchor: sel.from + token.length },
      });
      cmView.focus();
      return;
    }
    editor?.chain().focus().insertContent(token).run();
  }, [mode, cmView, editor]);

  const getSelectedText = useCallback((): string => {
    if (mode === "codemirror" && cmView) {
      const sel = cmView.state.selection.main;
      return cmView.state.sliceDoc(sel.from, sel.to);
    }
    if (editor) {
      const { from, to } = editor.state.selection;
      return editor.state.doc.textBetween(from, to, "\n", "\n");
    }
    return "";
  }, [mode, cmView, editor]);

  const replaceSelection = useCallback(
    (text: string) => {
      if (mode === "codemirror" && cmView) {
        const sel = cmView.state.selection.main;
        cmView.dispatch({
          changes: { from: sel.from, to: sel.to, insert: text },
          selection: { anchor: sel.from + text.length },
        });
        cmView.focus();
        return;
      }
      editor?.chain().focus().insertContent(text).run();
    },
    [mode, cmView, editor],
  );

  const handleUndo = useCallback(() => {
    if (mode === "codemirror" && cmView) return void undo(cmView);
    editor?.chain().focus().undo().run();
  }, [mode, cmView, editor]);

  const handleRedo = useCallback(() => {
    if (mode === "codemirror" && cmView) return void redo(cmView);
    editor?.chain().focus().redo().run();
  }, [mode, cmView, editor]);

  useEffect(() => {
    onModeChange?.(mode);
  }, [mode, onModeChange]);

  useImperativeHandle(
    ref,
    () => ({
      mode,
      setMode: (nextMode: EditorMode) => setMode(nextMode),
      applyBold: () => applyWrap("**", "**", "texto"),
      applyItalic: () => applyWrap("*", "*", "texto"),
      insertHeading: (level: 1 | 2 | 3) => insertToken(`\n${"#".repeat(level)} `),
      insertList: () => insertToken("\n- "),
      insertFormulaBlock: () => insertToken("\n$$\n\n$$\n"),
      insertInlineMath: () => applyWrap("$", "$", "x^2"),
      insertIntegral: () => insertToken("$\\int_{a}^{b} f(x)\\,dx$"),
      insertSummation: () => insertToken("$\\sum_{i=1}^{n} a_i$"),
      insertFraction: () => insertToken("$\\frac{a}{b}$"),
      insertSymbol: (latex: string) => insertToken(`$${latex}$`),
      getSelectedText,
      replaceSelection,
      insertAtCursor: (text: string) => insertToken(text),
      undo: handleUndo,
      redo: handleRedo,
    }),
    [mode, applyWrap, insertToken, getSelectedText, replaceSelection, handleUndo, handleRedo],
  );

  const toolbar = (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-t-lg border border-white/10 border-b-0 bg-[#203324] px-3 py-2">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          className={
            mode === "codemirror"
              ? "h-7 border-[#40C9A9]/50 bg-[#40C9A9]/15 text-[#40C9A9] hover:bg-[#40C9A9]/20"
              : "h-7 border-white/10 bg-[#1C2D20] text-white/80 hover:bg-white/10"
          }
          onClick={() => setMode("codemirror")}
        >
          Code Editor
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className={
            mode === "tiptap"
              ? "h-7 border-[#40C9A9]/50 bg-[#40C9A9]/15 text-[#40C9A9] hover:bg-[#40C9A9]/20"
              : "h-7 border-white/10 bg-[#1C2D20] text-white/80 hover:bg-white/10"
          }
          onClick={() => setMode("tiptap")}
        >
          Visual Editor
        </Button>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <select
          className="h-7 rounded-md border border-white/10 bg-[#1C2D20] px-2 text-xs text-white/80"
          defaultValue="normal"
          onChange={(e) => {
            const v = e.target.value;
            if (v === "h1") insertToken("\n# ");
            if (v === "h2") insertToken("\n## ");
            if (v === "h3") insertToken("\n### ");
            e.currentTarget.value = "normal";
          }}
        >
          <option value="normal">Normal text</option>
          <option value="h1">Heading 1</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
        </select>

        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-7 border-white/10 bg-[#1C2D20] text-white/90 hover:bg-white/10 px-2"
          onClick={() => applyWrap("**", "**", "texto")}
        >
          <strong>B</strong>
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-7 border-white/10 bg-[#1C2D20] text-white/90 hover:bg-white/10 px-2 italic"
          onClick={() => applyWrap("*", "*", "texto")}
        >
          I
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-7 border-white/10 bg-[#1C2D20] text-white/90 hover:bg-white/10 px-2"
          onClick={() => insertToken("\n- ")}
        >
          • List
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-7 border-white/10 bg-[#1C2D20] text-white/90 hover:bg-white/10 px-2"
          onClick={() => insertToken("\n$$\n\n$$\n")}
        >
          f(x)
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-7 border-white/10 bg-[#1C2D20] text-white/80 hover:bg-white/10 px-2"
          onClick={handleUndo}
        >
          ↶
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-7 border-white/10 bg-[#1C2D20] text-white/80 hover:bg-white/10 px-2"
          onClick={handleRedo}
        >
          ↷
        </Button>
      </div>
    </div>
  );

  return (
    <div className={className}>
      {showToolbar ? toolbar : null}

      {mode === "tiptap" ? (
        <div onClick={() => editor?.commands.focus()} role="presentation">
          <EditorContent editor={editor} />
        </div>
      ) : (
        <div className="rounded-b-lg border border-white/10 bg-[#1C2D20] overflow-hidden overleaf-cm-shell">
          <CodeMirror
            value={value}
            height={codeMirrorHeight}
            extensions={codemirrorExtensions}
            onChange={(next) => onChange(next)}
            theme="dark"
            onCreateEditor={(view) => setCmView(view)}
            basicSetup={{
              lineNumbers: true,
              foldGutter: false,
            }}
          />
        </div>
      )}
    </div>
  );
  },
);

DualMarkdownEditor.displayName = "DualMarkdownEditor";

