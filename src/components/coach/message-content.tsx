import { Fragment } from "react";
import { cn } from "@/lib/utils";

/**
 * Minimal, safe rendering for AI Coach replies — no `dangerouslySetInnerHTML`,
 * no markdown library (kept deliberately small, not because the shape isn't
 * needed: replies can genuinely include headings, numbered steps, inline
 * code, and code blocks, and all of those are handled below — just done
 * with plain regex/line parsing instead of pulling in a parser). Supports:
 * **bold**, `inline code`, [markdown links](url) and bare URLs, "- "/"1. "
 * lists, `#`-`######` headings, and ``` fenced code blocks.
 *
 * Written to stay safe against a message that's still streaming in
 * mid-token: an unclosed `**`/`` ` `` just renders as literal characters
 * (regex won't match, nothing throws), and an unclosed ``` fence is
 * detected and still rendered as an in-progress code block rather than
 * leaking raw backticks — see `splitCodeFences`.
 */

const MD_LINK_PATTERN = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
const BOLD_PATTERN = /\*\*(.+?)\*\*/g;
const INLINE_CODE_PATTERN = /`([^`\n]+)`/g;
const BARE_URL_PATTERN = /(https?:\/\/[^\s)]+)/g;

function renderInline(text: string, keyPrefix: string) {
  const segments: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let segmentIndex = 0;

  // Markdown links tried first so a URL inside `[text](url)` is consumed
  // whole and never separately re-matched by the bare-URL pattern below.
  const combined = new RegExp(
    `${MD_LINK_PATTERN.source}|${BOLD_PATTERN.source}|${INLINE_CODE_PATTERN.source}|${BARE_URL_PATTERN.source}`,
    "g"
  );
  while ((match = combined.exec(text)) !== null) {
    if (match.index > lastIndex) segments.push(<Fragment key={`${keyPrefix}-t-${segmentIndex++}`}>{text.slice(lastIndex, match.index)}</Fragment>);
    if (match[1] !== undefined) {
      segments.push(
        <a key={`${keyPrefix}-l-${segmentIndex++}`} href={match[2]} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
          {match[1]}
        </a>
      );
    } else if (match[3] !== undefined) {
      segments.push(
        <strong key={`${keyPrefix}-b-${segmentIndex++}`} className="font-semibold">
          {match[3]}
        </strong>
      );
    } else if (match[4] !== undefined) {
      segments.push(
        <code key={`${keyPrefix}-c-${segmentIndex++}`} className="bg-muted rounded px-1 py-0.5 text-[0.9em]">
          {match[4]}
        </code>
      );
    } else if (match[5] !== undefined) {
      segments.push(
        <a key={`${keyPrefix}-u-${segmentIndex++}`} href={match[5]} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
          {match[5]}
        </a>
      );
    }
    lastIndex = combined.lastIndex;
  }
  if (lastIndex < text.length) segments.push(<Fragment key={`${keyPrefix}-t-${segmentIndex++}`}>{text.slice(lastIndex)}</Fragment>);
  return segments;
}

function renderProse(text: string, keyPrefix: string): React.ReactNode[] {
  const lines = text.split("\n");
  const blocks: React.ReactNode[] = [];
  let bulletBuffer: string[] = [];
  let numberedBuffer: string[] = [];

  const flushBullets = (key: string) => {
    if (bulletBuffer.length === 0) return;
    blocks.push(
      <ul key={key} className="list-disc space-y-0.5 pl-4">
        {bulletBuffer.map((item, i) => (
          <li key={i}>{renderInline(item, `${key}-${i}`)}</li>
        ))}
      </ul>
    );
    bulletBuffer = [];
  };
  const flushNumbered = (key: string) => {
    if (numberedBuffer.length === 0) return;
    blocks.push(
      <ol key={key} className="list-decimal space-y-0.5 pl-4">
        {numberedBuffer.map((item, i) => (
          <li key={i}>{renderInline(item, `${key}-${i}`)}</li>
        ))}
      </ol>
    );
    numberedBuffer = [];
  };

  lines.forEach((line, i) => {
    const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      flushBullets(`${keyPrefix}-bullets-${i}`);
      flushNumbered(`${keyPrefix}-numbered-${i}`);
      const level = headingMatch[1].length;
      // Demoted below the chat bubble's own body size — a real `<h1>` would
      // read as a page title inside a message bubble, not a reply heading.
      const HeadingTag = level <= 2 ? "h4" : "h5";
      blocks.push(
        <HeadingTag key={`${keyPrefix}-h-${i}`} className={cn("mt-1 font-semibold", level <= 2 ? "text-base" : "text-sm")}>
          {renderInline(headingMatch[2], `${keyPrefix}-h-${i}`)}
        </HeadingTag>
      );
      return;
    }

    const numberedMatch = line.match(/^\s*\d+[.)]\s+(.*)$/);
    if (numberedMatch) {
      flushBullets(`${keyPrefix}-bullets-${i}`);
      numberedBuffer.push(numberedMatch[1]);
      return;
    }

    const bulletMatch = line.match(/^\s*[-•]\s+(.*)$/);
    if (bulletMatch) {
      flushNumbered(`${keyPrefix}-numbered-${i}`);
      bulletBuffer.push(bulletMatch[1]);
      return;
    }

    flushBullets(`${keyPrefix}-bullets-${i}`);
    flushNumbered(`${keyPrefix}-numbered-${i}`);
    if (line.trim().length > 0) blocks.push(<p key={`${keyPrefix}-line-${i}`}>{renderInline(line, `${keyPrefix}-line-${i}`)}</p>);
  });
  flushBullets(`${keyPrefix}-bullets-end`);
  flushNumbered(`${keyPrefix}-numbered-end`);
  return blocks;
}

interface CodeSegment {
  type: "code";
  lang?: string;
  text: string;
}
interface ProseSegment {
  type: "prose";
  text: string;
}

/**
 * Splits on ``` fences into alternating prose/code segments. An odd total
 * fence count (content still streaming, closing ``` not received yet)
 * leaves a trailing code segment — rendered as an in-progress code block
 * rather than as literal backticks, so a reply never flashes raw markdown
 * while its code fence is mid-stream.
 */
function splitCodeFences(content: string): (CodeSegment | ProseSegment)[] {
  const parts = content.split("```");
  const segments: (CodeSegment | ProseSegment)[] = [];
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (i % 2 === 0) {
      if (part) segments.push({ type: "prose", text: part });
      continue;
    }
    const firstLineBreak = part.indexOf("\n");
    const lang = firstLineBreak === -1 ? part.trim() : part.slice(0, firstLineBreak).trim();
    const code = firstLineBreak === -1 ? "" : part.slice(firstLineBreak + 1);
    segments.push({ type: "code", lang: lang || undefined, text: code });
  }
  return segments;
}

export function MessageContent({ content }: { content: string }) {
  const segments = splitCodeFences(content);

  return (
    <div className="space-y-2 wrap-anywhere whitespace-pre-wrap">
      {segments.map((segment, i) =>
        segment.type === "code" ? (
          // Code blocks may scroll horizontally on their own — the page/bubble itself never does.
          <div key={`code-${i}`} className="bg-muted/70 my-1 overflow-x-auto rounded-lg p-3 text-xs">
            {segment.lang && <div className="text-muted-foreground mb-1 text-[0.7rem] font-medium tracking-wide uppercase">{segment.lang}</div>}
            <pre className="whitespace-pre">
              <code>{segment.text}</code>
            </pre>
          </div>
        ) : (
          <div key={`prose-${i}`} className="space-y-1">
            {renderProse(segment.text, `prose-${i}`)}
          </div>
        )
      )}
    </div>
  );
}
