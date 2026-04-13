import { BundledLanguage, codeToHast, createHighlighter } from "shiki";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";
import { toJsxRuntime } from "hast-util-to-jsx-runtime";
import { Fragment } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { cn } from "../lib/utils";
import React from "react";

interface Props {
  children: string;
  lang: BundledLanguage | "text";
  className?: string;
}

// Singleton to avoid re-creating the highlighter on every render
let highlighterPromise: ReturnType<typeof createHighlighter> | null = null;

function getHighlighter() {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      langs: ["typescript", "python", "go", "bash"],
      themes: ["catppuccin-mocha", "catppuccin-latte"],
      engine: createJavaScriptRegexEngine(),
    });
  }
  return highlighterPromise;
}

export async function CodeBlock(props: Props) {
  const highlighter = await getHighlighter();

  const out = highlighter.codeToHast(props.children, {
    lang: props.lang === "text" ? "text" : props.lang,
    themes: {
      dark: "catppuccin-mocha",
      light: "catppuccin-latte",
    },
  });

  return toJsxRuntime(out, {
    Fragment,
    jsx,
    jsxs,
    components: {
      pre: (nodeProps) => (
        <pre
          {...nodeProps}
          className={cn(nodeProps.className, props.className)}
        />
      ),
    },
  }) as React.JSX.Element;
}