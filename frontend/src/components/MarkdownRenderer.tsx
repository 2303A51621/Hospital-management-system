import React from 'react';
import { AlertTriangle, Lightbulb, ShieldAlert } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export default function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  if (!content) return null;

  // Split content by lines for block parsing
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];

  let inCodeBlock = false;
  let codeBuffer: string[] = [];
  let codeLanguage = '';

  let inTable = false;
  let tableHeader: string[] = [];
  let tableRows: string[][] = [];

  let inList = false;
  let listItems: React.ReactNode[] = [];
  let listIsOrdered = false;

  const flushList = () => {
    if (inList && listItems.length > 0) {
      if (listIsOrdered) {
        elements.push(
          <ol key={`ol-${elements.length}`} className="my-2 ml-5 list-decimal space-y-1 text-xs sm:text-sm text-slate-700 leading-relaxed">
            {listItems}
          </ol>
        );
      } else {
        elements.push(
          <ul key={`ul-${elements.length}`} className="my-2 ml-5 list-disc space-y-1 text-xs sm:text-sm text-slate-700 leading-relaxed">
            {listItems}
          </ul>
        );
      }
      inList = false;
      listItems = [];
    }
  };

  const flushTable = () => {
    if (inTable && tableHeader.length > 0) {
      elements.push(
        <div key={`table-wrapper-${elements.length}`} className="my-3 overflow-x-auto rounded-xl border border-slate-200 shadow-sm bg-white">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                {tableHeader.map((th, idx) => (
                  <th key={idx} className="py-2.5 px-3 whitespace-nowrap">
                    {parseInline(th)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tableRows.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-teal-50/30 transition-colors">
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="py-2 px-3 text-slate-700 align-top">
                      {parseInline(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      inTable = false;
      tableHeader = [];
      tableRows = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    // Code blocks
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        elements.push(
          <div key={`code-${elements.length}`} className="my-2 rounded-xl bg-slate-900 text-slate-100 p-3 text-xs font-mono overflow-x-auto border border-slate-800">
            {codeLanguage && <div className="text-[10px] text-teal-400 uppercase font-bold mb-1">{codeLanguage}</div>}
            <pre className="whitespace-pre">{codeBuffer.join('\n')}</pre>
          </div>
        );
        inCodeBlock = false;
        codeBuffer = [];
        codeLanguage = '';
      } else {
        flushList();
        flushTable();
        inCodeBlock = true;
        codeLanguage = line.slice(3).trim();
      }
      continue;
    }

    if (inCodeBlock) {
      codeBuffer.push(rawLine);
      continue;
    }

    // Tables
    if (line.startsWith('|') && line.endsWith('|')) {
      flushList();
      const cells = line
        .slice(1, -1)
        .split('|')
        .map((c) => c.trim());

      // Check if separator line e.g. | :--- | :--- |
      if (cells.every((c) => /^:?-+:?$/.test(c))) {
        continue;
      }

      if (!inTable) {
        inTable = true;
        tableHeader = cells;
      } else {
        tableRows.push(cells);
      }
      continue;
    } else {
      flushTable();
    }

    // Callout / Blockquotes: > [!WARNING], > [!NOTE], etc.
    if (line.startsWith('>')) {
      flushList();
      const quoteText = line.replace(/^>\s?/, '').trim();
      if (quoteText.startsWith('[!WARNING]') || quoteText.startsWith('[!CAUTION]')) {
        elements.push(
          <div key={`callout-${elements.length}`} className="my-2.5 p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2 shadow-xs">
            <AlertTriangle size={16} className="text-amber-600 mt-0.5 shrink-0" />
            <div>
              <span className="font-bold uppercase tracking-wider text-[10px] block mb-0.5">Clinical Precaution</span>
              <div>{parseInline(quoteText.replace(/\[!(?:WARNING|CAUTION)\]\s?/, ''))}</div>
            </div>
          </div>
        );
      } else if (quoteText.startsWith('[!IMPORTANT]')) {
        elements.push(
          <div key={`callout-${elements.length}`} className="my-2.5 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start gap-2 shadow-xs">
            <ShieldAlert size={16} className="text-rose-600 mt-0.5 shrink-0" />
            <div>
              <span className="font-bold uppercase tracking-wider text-[10px] block mb-0.5">Important Safety Advisory</span>
              <div>{parseInline(quoteText.replace(/\[!IMPORTANT\]\s?/, ''))}</div>
            </div>
          </div>
        );
      } else if (quoteText.startsWith('[!TIP]')) {
        elements.push(
          <div key={`callout-${elements.length}`} className="my-2.5 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-start gap-2 shadow-xs">
            <Lightbulb size={16} className="text-emerald-600 mt-0.5 shrink-0" />
            <div>
              <span className="font-bold uppercase tracking-wider text-[10px] block mb-0.5">Health Tip</span>
              <div>{parseInline(quoteText.replace(/\[!TIP\]\s?/, ''))}</div>
            </div>
          </div>
        );
      } else {
        elements.push(
          <div key={`quote-${elements.length}`} className="my-2 pl-3 py-1 border-l-3 border-teal-600 bg-teal-50/40 rounded-r-xl text-slate-700 text-xs italic">
            {parseInline(quoteText.replace(/\[!NOTE\]\s?/, ''))}
          </div>
        );
      }
      continue;
    }

    // Headings
    if (line.startsWith('# ')) {
      flushList();
      elements.push(
        <h1 key={`h1-${elements.length}`} className="mt-4 mb-2 text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          {parseInline(line.slice(2))}
        </h1>
      );
      continue;
    }
    if (line.startsWith('## ')) {
      flushList();
      elements.push(
        <h2 key={`h2-${elements.length}`} className="mt-3.5 mb-1.5 text-base sm:text-lg font-bold text-slate-800 tracking-tight">
          {parseInline(line.slice(3))}
        </h2>
      );
      continue;
    }
    if (line.startsWith('### ')) {
      flushList();
      elements.push(
        <h3 key={`h3-${elements.length}`} className="mt-3 mb-1 text-sm sm:text-base font-bold text-teal-950">
          {parseInline(line.slice(4))}
        </h3>
      );
      continue;
    }
    if (line.startsWith('#### ')) {
      flushList();
      elements.push(
        <h4 key={`h4-${elements.length}`} className="mt-2.5 mb-1 text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wide">
          {parseInline(line.slice(5))}
        </h4>
      );
      continue;
    }

    // Horizontal Rule
    if (line === '---' || line === '***' || line === '___') {
      flushList();
      elements.push(<hr key={`hr-${elements.length}`} className="my-3 border-slate-200" />);
      continue;
    }

    // Unordered List (- or *)
    const bulletMatch = line.match(/^[-*]\s+(.+)/);
    if (bulletMatch) {
      if (!inList || listIsOrdered) {
        flushList();
        inList = true;
        listIsOrdered = false;
      }
      listItems.push(
        <li key={`li-${listItems.length}`}>
          {parseInline(bulletMatch[1])}
        </li>
      );
      continue;
    }

    // Ordered List (1. or 2.)
    const numberMatch = line.match(/^([0-9]+)\.\s+(.+)/);
    if (numberMatch) {
      if (!inList || !listIsOrdered) {
        flushList();
        inList = true;
        listIsOrdered = true;
      }
      listItems.push(
        <li key={`li-${listItems.length}`}>
          {parseInline(numberMatch[2])}
        </li>
      );
      continue;
    }

    // Empty lines
    if (line.length === 0) {
      flushList();
      continue;
    }

    // Paragraph
    flushList();
    elements.push(
      <p key={`p-${elements.length}`} className="my-1.5 text-xs sm:text-sm text-slate-700 leading-relaxed">
        {parseInline(rawLine)}
      </p>
    );
  }

  flushList();
  flushTable();

  return <div className={`space-y-1 ${className}`}>{elements}</div>;
}

/**
 * Parses bold, italic, code, links, and badges inside inline text
 */
function parseInline(text: string): React.ReactNode {
  if (!text) return null;

  // Tokenize regex for **bold**, *italic*, `code`, [text](url)
  const regex = /(\*\*.*?\*\*|\*.*?\*|`.*?`|\[.*?\]\(.*?\))/g;
  const parts = text.split(regex);

  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={idx} className="font-extrabold text-slate-900">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('*') && part.endsWith('*') && !part.startsWith('**')) {
      return (
        <em key={idx} className="italic text-slate-800">
          {part.slice(1, -1)}
        </em>
      );
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={idx} className="px-1.5 py-0.5 rounded-md bg-slate-100 text-teal-800 font-mono text-[11px] border border-slate-200">
          {part.slice(1, -1)}
        </code>
      );
    }
    const linkMatch = part.match(/^\[(.*?)\]\((.*?)\)$/);
    if (linkMatch) {
      return (
        <a
          key={idx}
          href={linkMatch[2]}
          className="text-teal-700 hover:text-teal-900 font-semibold underline underline-offset-2"
        >
          {linkMatch[1]}
        </a>
      );
    }
    return part;
  });
}
