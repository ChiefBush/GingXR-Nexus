// Tiny safe-by-construction article renderer. Supports a curated subset
// of Markdown: headings, bullet/ordered lists, code blocks, inline code,
// bold, italic, links, and paragraphs. No raw HTML — every block is a
// React element built from a parsed token tree.

type Block =
  | { type: "h1" | "h2" | "h3"; text: string }
  | { type: "p"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "code"; lang: string | null; text: string }
  | { type: "quote"; text: string }
  | { type: "hr" };

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function inline(text: string): React.ReactNode[] {
  // Token order matters: code first to avoid mangling its contents.
  const out: React.ReactNode[] = [];
  const re =
    /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const tok = m[0];
    if (tok.startsWith("`")) {
      out.push(
        <code
          key={key++}
          className="rounded bg-muted px-1 py-0.5 font-mono text-[0.85em]"
        >
          {tok.slice(1, -1)}
        </code>,
      );
    } else if (tok.startsWith("**")) {
      out.push(<strong key={key++}>{tok.slice(2, -2)}</strong>);
    } else if (tok.startsWith("*")) {
      out.push(<em key={key++}>{tok.slice(1, -1)}</em>);
    } else if (tok.startsWith("[")) {
      const link = /\[([^\]]+)\]\(([^)]+)\)/.exec(tok);
      if (link) {
        out.push(
          <a
            key={key++}
            href={link[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline-offset-2 hover:underline"
          >
            {link[1]}
          </a>,
        );
      } else {
        out.push(tok);
      }
    }
    last = m.index + tok.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

function parse(input: string): Block[] {
  const lines = input.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    if (line.trim() === "") {
      i++;
      continue;
    }

    // Fenced code block
    if (/^```/.test(line)) {
      const lang = line.slice(3).trim() || null;
      const buf: string[] = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i])) {
        buf.push(lines[i]);
        i++;
      }
      i++; // skip closing fence
      blocks.push({ type: "code", lang, text: buf.join("\n") });
      continue;
    }

    // Headings
    const h = /^(#{1,3})\s+(.*)$/.exec(line);
    if (h) {
      const level = h[1].length as 1 | 2 | 3;
      const text = h[2].trim();
      blocks.push({ type: level === 1 ? "h1" : level === 2 ? "h2" : "h3", text });
      i++;
      continue;
    }

    // Horizontal rule
    if (/^---+\s*$/.test(line)) {
      blocks.push({ type: "hr" });
      i++;
      continue;
    }

    // Blockquote
    if (/^>\s?/.test(line)) {
      const buf: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        buf.push(lines[i].replace(/^>\s?/, ""));
        i++;
      }
      blocks.push({ type: "quote", text: buf.join(" ") });
      continue;
    }

    // Unordered list
    if (/^[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^[-*]\s+/, ""));
        i++;
      }
      blocks.push({ type: "ul", items });
      continue;
    }

    // Ordered list
    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s+/, ""));
        i++;
      }
      blocks.push({ type: "ol", items });
      continue;
    }

    // Paragraph — collect until blank line / block boundary.
    const buf: string[] = [line];
    i++;
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !/^(#{1,3}\s|```|---+\s*$|>\s?|[-*]\s+|\d+\.\s+)/.test(lines[i])
    ) {
      buf.push(lines[i]);
      i++;
    }
    blocks.push({ type: "p", text: buf.join(" ") });
  }
  return blocks;
}

export function ArticleRenderer({ content }: { content: string }) {
  const blocks = parse(content);
  return (
    <div className="prose-sm max-w-none space-y-4 text-foreground">
      {blocks.map((b, idx) => {
        switch (b.type) {
          case "h1":
            return (
              <h1 key={idx} className="text-2xl font-semibold tracking-tight">
                {inline(b.text)}
              </h1>
            );
          case "h2":
            return (
              <h2 key={idx} className="text-xl font-semibold tracking-tight">
                {inline(b.text)}
              </h2>
            );
          case "h3":
            return (
              <h3 key={idx} className="text-lg font-semibold">
                {inline(b.text)}
              </h3>
            );
          case "p":
            return (
              <p key={idx} className="leading-relaxed text-foreground/90">
                {inline(b.text)}
              </p>
            );
          case "ul":
            return (
              <ul key={idx} className="list-disc space-y-1 pl-6">
                {b.items.map((it, j) => (
                  <li key={j}>{inline(it)}</li>
                ))}
              </ul>
            );
          case "ol":
            return (
              <ol key={idx} className="list-decimal space-y-1 pl-6">
                {b.items.map((it, j) => (
                  <li key={j}>{inline(it)}</li>
                ))}
              </ol>
            );
          case "code":
            return (
              <pre
                key={idx}
                className="overflow-auto rounded-md border border-border bg-muted/50 p-3 text-xs"
              >
                <code>{b.text}</code>
              </pre>
            );
          case "quote":
            return (
              <blockquote
                key={idx}
                className="border-l-2 border-primary/40 pl-3 text-foreground/80 italic"
              >
                {inline(b.text)}
              </blockquote>
            );
          case "hr":
            return <hr key={idx} className="border-border" />;
        }
      })}
    </div>
  );
}

// Exported for testing only.
export const _internal = { parse, inline, escapeHtml };
