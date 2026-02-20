'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';

interface MarkdownViewerProps {
  content: string;
}

// Note: @tailwindcss/typography is NOT installed, so we use manual prose styles below.
// Custom components for react-markdown — no rehype-highlight, just gray <pre> backgrounds.
const mdComponents: Components = {
  // Headings
  h1: ({ children }) => (
    <h1 className="text-2xl font-bold text-gray-900 mt-6 mb-3 pb-2 border-b border-gray-200 first:mt-0">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-xl font-semibold text-gray-900 mt-5 mb-2.5 first:mt-0">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-2 first:mt-0">
      {children}
    </h3>
  ),
  h4: ({ children }) => (
    <h4 className="text-base font-semibold text-gray-800 mt-3 mb-1.5 first:mt-0">
      {children}
    </h4>
  ),
  h5: ({ children }) => (
    <h5 className="text-sm font-semibold text-gray-700 mt-3 mb-1 first:mt-0">
      {children}
    </h5>
  ),
  h6: ({ children }) => (
    <h6 className="text-sm font-medium text-gray-600 mt-2 mb-1 first:mt-0">
      {children}
    </h6>
  ),

  // Paragraphs
  p: ({ children }) => (
    <p className="text-gray-700 leading-7 mb-4 last:mb-0">
      {children}
    </p>
  ),

  // Lists
  ul: ({ children }) => (
    <ul className="list-disc list-outside pl-6 mb-4 space-y-1.5 text-gray-700">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal list-outside pl-6 mb-4 space-y-1.5 text-gray-700">
      {children}
    </ol>
  ),
  li: ({ children }) => (
    <li className="leading-7">
      {children}
    </li>
  ),

  // Blockquote
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-orange-400 pl-4 py-1 my-4 bg-orange-50 rounded-r-lg text-gray-700 italic">
      {children}
    </blockquote>
  ),

  // Code — inline
  code: ({ children, className }) => {
    // Block code has a className like "language-xxx"; inline does not
    const isBlock = Boolean(className);
    if (isBlock) {
      return (
        <code className="block font-mono text-sm text-gray-800">
          {children}
        </code>
      );
    }
    return (
      <code className="bg-gray-100 text-orange-600 font-mono text-sm px-1.5 py-0.5 rounded">
        {children}
      </code>
    );
  },

  // Pre — wraps fenced code blocks
  pre: ({ children }) => (
    <pre className="bg-gray-900 text-gray-100 rounded-xl p-4 my-4 overflow-x-auto text-sm font-mono leading-relaxed">
      {children}
    </pre>
  ),

  // Horizontal rule
  hr: () => <hr className="my-6 border-t border-gray-200" />,

  // Links
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-orange-500 hover:text-orange-600 underline underline-offset-2 transition-colors"
    >
      {children}
    </a>
  ),

  // Strong / Em
  strong: ({ children }) => (
    <strong className="font-semibold text-gray-900">{children}</strong>
  ),
  em: ({ children }) => (
    <em className="italic text-gray-700">{children}</em>
  ),

  // Strikethrough (GFM)
  del: ({ children }) => (
    <del className="line-through text-gray-500">{children}</del>
  ),

  // GFM Tables
  table: ({ children }) => (
    <div className="my-4 overflow-x-auto rounded-xl border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-gray-50">
      {children}
    </thead>
  ),
  tbody: ({ children }) => (
    <tbody className="bg-white divide-y divide-gray-100">
      {children}
    </tbody>
  ),
  tr: ({ children }) => (
    <tr className="hover:bg-gray-50 transition-colors">
      {children}
    </tr>
  ),
  th: ({ children }) => (
    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="px-4 py-3 text-gray-700 whitespace-pre-line">
      {children}
    </td>
  ),

  // GFM task list item checkbox
  input: ({ type, checked, disabled }) => {
    if (type === 'checkbox') {
      return (
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          readOnly
          className="mr-2 accent-orange-500 cursor-default"
        />
      );
    }
    return <input type={type} />;
  },
};

export function MarkdownViewer({ content }: MarkdownViewerProps) {
  return (
    <div className="max-w-none text-base">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
