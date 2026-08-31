import type { ReactNode } from "react";

type MarkdownContentProps = {
  children: string;
  className?: string;
};

function renderInlineMarkdown(text: string): ReactNode[] {
  const tokens = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\[[^\]]+\]\([^\s)]+\))/g);

  return tokens.filter(Boolean).map((token, index) => {
    if (token.startsWith("**") && token.endsWith("**")) {
      return <strong key={index}>{token.slice(2, -2)}</strong>;
    }

    if (token.startsWith("`") && token.endsWith("`")) {
      return (
        <code key={index} className="rounded bg-background/60 px-1 py-0.5 text-[0.9em]">
          {token.slice(1, -1)}
        </code>
      );
    }

    const link = token.match(/^\[([^\]]+)\]\(([^\s)]+)\)$/);
    if (link) {
      return (
        <a
          key={index}
          href={link[2]}
          className="text-blue-300 underline decoration-blue-300/50 underline-offset-2 hover:text-blue-200"
          target={link[2].startsWith("http") ? "_blank" : undefined}
          rel={link[2].startsWith("http") ? "noreferrer" : undefined}
        >
          {link[1]}
        </a>
      );
    }

    return <span key={index}>{token}</span>;
  });
}

export function MarkdownContent({ children, className }: MarkdownContentProps) {
  const lines = children.split(/\r?\n/);
  const blocks: ReactNode[] = [];
  let paragraph: string[] = [];
  let list: string[] = [];

  const flushParagraph = () => {
    if (paragraph.length === 0) return;
    blocks.push(
      <p key={`paragraph-${blocks.length}`}>
        {renderInlineMarkdown(paragraph.join(" "))}
      </p>,
    );
    paragraph = [];
  };

  const flushList = () => {
    if (list.length === 0) return;
    blocks.push(
      <ul key={`list-${blocks.length}`} className="list-disc space-y-1 pl-5">
        {list.map((item, index) => {
          const checkbox = item.match(/^\[([ xX])\]\s+(.*)$/);
          return (
            <li key={index} className={checkbox?.[1].toLowerCase() === "x" ? "line-through" : undefined}>
              {checkbox ? (
                <span className="mr-2 inline-flex size-3.5 items-center justify-center rounded border border-border/70 align-[-0.1em] text-[0.65rem]">
                  {checkbox[1].toLowerCase() === "x" ? "✓" : ""}
                </span>
              ) : null}
              {renderInlineMarkdown(checkbox?.[2] ?? item)}
            </li>
          );
        })}
      </ul>,
    );
    list = [];
  };

  for (const line of lines) {
    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    const listItem = line.match(/^\s*[-*]\s+(.+)$/);

    if (heading) {
      flushParagraph();
      flushList();
      const Heading = `h${heading[1].length}` as "h1" | "h2" | "h3";
      blocks.push(
        <Heading key={`heading-${blocks.length}`} className="font-medium text-foreground">
          {renderInlineMarkdown(heading[2])}
        </Heading>,
      );
    } else if (listItem) {
      flushParagraph();
      list.push(listItem[1]);
    } else if (line.trim() === "") {
      flushParagraph();
      flushList();
    } else {
      flushList();
      paragraph.push(line.trim());
    }
  }

  flushParagraph();
  flushList();

  return <div className={`space-y-3 ${className ?? ""}`}>{blocks}</div>;
}
