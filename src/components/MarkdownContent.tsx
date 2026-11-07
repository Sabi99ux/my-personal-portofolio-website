import type { ReactNode } from 'react';

function isBlockStart(line: string): boolean {
  return /^(#{1,6}\s|```|>\s?|[-*_]{3,}\s*$|[-*+]\s+|\d+[.)]\s+)/.test(line);
}

function renderInline(text: string): ReactNode[] {
  const token = /(\[([^\]]+)\]\(([^)\s]+)\)|`([^`]+)`|\*\*([^*]+)\*\*|__([^_]+)__|\*([^*]+)\*|_([^_]+)_)/g;
  const nodes: ReactNode[] = [];
  let cursor = 0;
  let match: RegExpExecArray | null;

  while ((match = token.exec(text))) {
    if (match.index > cursor) nodes.push(text.slice(cursor, match.index));

    if (match[2] && match[3]) {
      const href = match[3];
      if (/^(https?:\/\/|mailto:|#)/i.test(href) || (/^\/(?![\\/])/.test(href) && !href.includes('\\'))) {
        nodes.push(
          <a
            key={match.index}
            href={href}
            className="text-[var(--accent)] underline underline-offset-4"
            {...(/^https?:\/\//i.test(href) ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
          >
            {match[2]}
          </a>,
        );
      } else {
        nodes.push(match[2]);
      }
    } else if (match[4]) {
      nodes.push(<code key={match.index} className="rounded bg-white/10 px-1.5 py-0.5 text-[0.9em]">{match[4]}</code>);
    } else if (match[5] || match[6]) {
      nodes.push(<strong key={match.index}>{match[5] || match[6]}</strong>);
    } else {
      nodes.push(<em key={match.index}>{match[7] || match[8]}</em>);
    }

    cursor = token.lastIndex;
  }

  if (cursor < text.length) nodes.push(text.slice(cursor));
  return nodes;
}

export function MarkdownContent({ markdown }: { markdown: string }) {
  const lines = markdown.replace(/\r\n?/g, '\n').split('\n');
  const blocks: ReactNode[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    if (!line.trim()) {
      index += 1;
      continue;
    }

    const fence = line.match(/^```(\w*)\s*$/);
    if (fence) {
      const code: string[] = [];
      index += 1;
      while (index < lines.length && !/^```\s*$/.test(lines[index])) {
        code.push(lines[index]);
        index += 1;
      }
      if (index < lines.length) index += 1;
      blocks.push(
        <pre key={blocks.length} className="overflow-x-auto rounded-xl border border-[var(--line)] bg-black/20 p-5 text-sm">
          <code className={fence[1] ? `language-${fence[1]}` : undefined}>{code.join('\n')}</code>
        </pre>,
      );
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.+?)\s*#*\s*$/);
    if (heading) {
      const level = heading[1].length;
      const className = level <= 2 ? 'mt-10 text-2xl font-medium text-[var(--fg)]' : 'mt-7 text-xl font-medium text-[var(--fg)]';
      blocks.push(
        level === 1
          ? null
          : level === 2
            ? <h2 key={blocks.length} className={className}>{renderInline(heading[2])}</h2>
            : <h3 key={blocks.length} className={className}>{renderInline(heading[2])}</h3>,
      );
      index += 1;
      continue;
    }

    if (/^([-*_])\1{2,}\s*$/.test(line)) {
      blocks.push(<hr key={blocks.length} className="border-[var(--line)]" />);
      index += 1;
      continue;
    }

    const listItem = line.match(/^([-*+]|\d+[.)])\s+(.+)$/);
    if (listItem) {
      const ordered = /^\d/.test(listItem[1]);
      const items: ReactNode[] = [];
      while (index < lines.length) {
        const item = lines[index].match(ordered ? /^\d+[.)]\s+(.+)$/ : /^[-*+]\s+(.+)$/);
        if (!item) break;
        items.push(<li key={items.length}>{renderInline(item[1])}</li>);
        index += 1;
      }
      const className = 'list-inside list-disc space-y-2 pl-4 text-[var(--muted)] marker:text-[var(--accent)]';
      blocks.push(
        ordered
          ? <ol key={blocks.length} className={`${className} list-decimal`}>{items}</ol>
          : <ul key={blocks.length} className={className}>{items}</ul>,
      );
      continue;
    }

    if (/^>\s?/.test(line)) {
      const quote: string[] = [];
      while (index < lines.length && /^>\s?/.test(lines[index])) {
        quote.push(lines[index].replace(/^>\s?/, ''));
        index += 1;
      }
      blocks.push(
        <blockquote key={blocks.length} className="border-l-2 border-[var(--accent)] pl-5 text-[var(--muted)]">
          {renderInline(quote.join(' '))}
        </blockquote>,
      );
      continue;
    }

    const paragraph = [line];
    index += 1;
    while (index < lines.length && lines[index].trim() && !isBlockStart(lines[index])) {
      paragraph.push(lines[index]);
      index += 1;
    }
    blocks.push(
      <p key={blocks.length} className="leading-8 text-[var(--muted)]">
        {renderInline(paragraph.join(' '))}
      </p>,
    );
  }

  return <div className="space-y-5">{blocks}</div>;
}
