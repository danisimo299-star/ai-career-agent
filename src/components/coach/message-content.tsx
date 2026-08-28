import { Fragment } from "react";

/**
 * Minimal, safe rendering for AI Coach replies — no `dangerouslySetInnerHTML`,
 * no markdown library (the brief explicitly says avoid unnecessary heavy
 * dependencies for a small need). Supports just what Coach replies actually
 * use: **bold**, "- " bullet lines, and bare URLs turned into real links.
 */

const BOLD_PATTERN = /\*\*(.+?)\*\*/g;
const URL_PATTERN = /(https?:\/\/[^\s)]+)/g;

function renderInline(text: string, keyPrefix: string) {
  const segments: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let segmentIndex = 0;

  const combined = new RegExp(`${BOLD_PATTERN.source}|${URL_PATTERN.source}`, "g");
  while ((match = combined.exec(text)) !== null) {
    if (match.index > lastIndex) segments.push(<Fragment key={`${keyPrefix}-t-${segmentIndex++}`}>{text.slice(lastIndex, match.index)}</Fragment>);
    if (match[1]) {
      segments.push(
        <strong key={`${keyPrefix}-b-${segmentIndex++}`} className="font-semibold">
          {match[1]}
        </strong>
      );
    } else if (match[2]) {
      segments.push(
        <a key={`${keyPrefix}-u-${segmentIndex++}`} href={match[2]} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
          {match[2]}
        </a>
      );
    }
    lastIndex = combined.lastIndex;
  }
  if (lastIndex < text.length) segments.push(<Fragment key={`${keyPrefix}-t-${segmentIndex++}`}>{text.slice(lastIndex)}</Fragment>);
  return segments;
}

export function MessageContent({ content }: { content: string }) {
  const lines = content.split("\n");
  const blocks: React.ReactNode[] = [];
  let bulletBuffer: string[] = [];

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

  lines.forEach((line, i) => {
    const bulletMatch = line.match(/^\s*[-•]\s+(.*)$/);
    if (bulletMatch) {
      bulletBuffer.push(bulletMatch[1]);
      return;
    }
    flushBullets(`bullets-${i}`);
    if (line.trim().length > 0) blocks.push(<p key={`line-${i}`}>{renderInline(line, `line-${i}`)}</p>);
  });
  flushBullets("bullets-end");

  return <div className="space-y-1 wrap-anywhere whitespace-pre-wrap">{blocks}</div>;
}
