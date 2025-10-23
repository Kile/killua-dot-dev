import React, { useEffect } from 'react';
import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import 'prismjs/components/prism-csharp';
import 'prismjs/components/prism-php';
import 'prismjs/components/prism-ruby';
import 'prismjs/components/prism-go';
import 'prismjs/components/prism-rust';
import 'prismjs/components/prism-swift';
import 'prismjs/components/prism-kotlin';
import 'prismjs/components/prism-scala';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-toml';
import 'prismjs/components/prism-ini';
import 'prismjs/components/prism-markup-templating';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-shell-session';
import './PrismTheme.css';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = "" }) => {
  useEffect(() => {
    // Re-highlight code blocks after content changes
    Prism.highlightAll();
  }, [content]);

  const renderMarkdown = (text: string) => {
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    let inCodeBlock = false;
    let codeBlockContent: string[] = [];
    let codeBlockLanguage = '';
    let listItems: string[] = [];

    const flushList = () => {
      if (listItems.length > 0) {
        elements.push(
          <ul key={`list-${elements.length}`} className="list-disc list-inside mb-4 space-y-1">
            {listItems.map((item, index) => (
              <li key={index} className="text-gray-300">{renderInlineMarkdown(item)}</li>
            ))}
          </ul>
        );
        listItems = [];
      }
    };

    const flushCodeBlock = () => {
      if (codeBlockContent.length > 0) {
        const code = codeBlockContent.join('\n');
        const language = codeBlockLanguage || 'text';
        
        elements.push(
          <pre key={`code-${elements.length}`} className="bg-gray-800 rounded-lg p-4 mb-4 overflow-x-auto">
            <code className={`language-${language}`}>{code}</code>
          </pre>
        );
        codeBlockContent = [];
        codeBlockLanguage = '';
        inCodeBlock = false;
      }
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();

      // Handle code blocks
      if (trimmedLine.startsWith('```')) {
        if (inCodeBlock) {
          // End of code block
          flushCodeBlock();
        } else {
          // Start of code block
          flushList();
          codeBlockLanguage = trimmedLine.substring(3).trim();
          inCodeBlock = true;
        }
        continue;
      }

      if (inCodeBlock) {
        codeBlockContent.push(line);
        continue;
      }

      // Handle headings
      if (trimmedLine.startsWith('# ')) {
        flushList();
        flushCodeBlock();
        elements.push(
          <h1 key={`h1-${elements.length}`} className="text-2xl font-bold text-white mt-6 mb-4">
            {trimmedLine.substring(2)}
          </h1>
        );
        continue;
      }

      if (trimmedLine.startsWith('## ')) {
        flushList();
        flushCodeBlock();
        elements.push(
          <h2 key={`h2-${elements.length}`} className="text-xl font-semibold text-white mt-5 mb-3">
            {trimmedLine.substring(3)}
          </h2>
        );
        continue;
      }

      if (trimmedLine.startsWith('### ')) {
        flushList();
        flushCodeBlock();
        elements.push(
          <h3 key={`h3-${elements.length}`} className="text-lg font-medium text-white mt-4 mb-2">
            {trimmedLine.substring(4)}
          </h3>
        );
        continue;
      }

      // Handle list items (both - and +)
      if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('+ ')) {
        flushCodeBlock();
        const listItem = trimmedLine.substring(2);
        listItems.push(listItem);
        continue;
      }

      // Handle empty lines
      if (trimmedLine === '') {
        flushList();
        flushCodeBlock();
        if (elements.length > 0 && elements[elements.length - 1] !== <br key={`br-${elements.length}`} />) {
          elements.push(<br key={`br-${elements.length}`} />);
        }
        continue;
      }

      // Handle regular paragraphs
      flushList();
      flushCodeBlock();
      elements.push(
        <p key={`p-${elements.length}`} className="mb-4 leading-relaxed text-gray-300">
          {renderInlineMarkdown(line)}
        </p>
      );
    }

    // Flush any remaining content
    flushList();
    flushCodeBlock();

    return elements;
  };

  const renderInlineMarkdown = (text: string): React.ReactNode => {
    // Handle links [text](url) - simple and direct approach
    const linkRegex = /\[([^\]]*)\]\(([^)]*)\)/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;
    
    while ((match = linkRegex.exec(text)) !== null) {
      // Add text before the link
      if (match.index > lastIndex) {
        const beforeText = text.slice(lastIndex, match.index);
        parts.push(renderBoldItalicUnderline(beforeText));
      }
      
      // Add the link
      parts.push(
        <a
          key={`link-${match.index}`}
          href={match[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-discord-blurple hover:text-blue-400 underline"
        >
          {renderBoldItalicUnderline(match[1])}
        </a>
      );
      
      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      const remainingText = text.slice(lastIndex);
      parts.push(renderBoldItalicUnderline(remainingText));
    }

    return parts.length > 0 ? parts : renderBoldItalicUnderline(text);
  };

  const renderBoldItalicUnderline = (text: string): React.ReactNode => {
    // Process from outermost to innermost - underline first, then bold, then italic, then code
    return processFormatting(text, [
      // Process underline first (outermost)
      { 
        pattern: /__([^_]+)__/g, 
        render: (content: string) => (
          <span key={`underline-${Math.random()}`} className="underline text-gray-300">
            {processFormatting(content, [
              { pattern: /\*\*([^*]+)\*\*/g, render: (c: string) => <strong key={`bold-${Math.random()}`} className="font-bold text-white">{c}</strong> },
              { pattern: /\*([^*]+)\*/g, render: (c: string) => <em key={`italic-${Math.random()}`} className="italic text-gray-200">{c}</em> },
              { pattern: /`([^`]+)`/g, render: (c: string) => <code key={`code-${Math.random()}`} className="bg-gray-700 px-1 py-0.5 rounded text-sm font-mono text-green-400">{c}</code> }
            ])}
          </span>
        )
      },
      // Process bold second
      { 
        pattern: /\*\*([^*]+)\*\*/g, 
        render: (content: string) => (
          <strong key={`bold-${Math.random()}`} className="font-bold text-white">
            {processFormatting(content, [
              { pattern: /\*([^*]+)\*/g, render: (c: string) => <em key={`italic-${Math.random()}`} className="italic text-gray-200">{c}</em> },
              { pattern: /`([^`]+)`/g, render: (c: string) => <code key={`code-${Math.random()}`} className="bg-gray-700 px-1 py-0.5 rounded text-sm font-mono text-green-400">{c}</code> }
            ])}
          </strong>
        )
      },
      // Process italic third
      { 
        pattern: /\*([^*]+)\*/g, 
        render: (content: string) => (
          <em key={`italic-${Math.random()}`} className="italic text-gray-200">
            {processFormatting(content, [
              { pattern: /`([^`]+)`/g, render: (c: string) => <code key={`code-${Math.random()}`} className="bg-gray-700 px-1 py-0.5 rounded text-sm font-mono text-green-400">{c}</code> }
            ])}
          </em>
        )
      },
      // Process inline code last (innermost)
      { 
        pattern: /`([^`]+)`/g, 
        render: (content: string) => (
          <code key={`code-${Math.random()}`} className="bg-gray-700 px-1 py-0.5 rounded text-sm font-mono text-green-400">
            {content}
          </code>
        )
      }
    ]);
  };

  const processFormatting = (text: string, patterns: Array<{pattern: RegExp, render: (content: string) => React.ReactNode}>): React.ReactNode => {
    for (const { pattern, render } of patterns) {
      const match = pattern.exec(text);
      if (match) {
        const before = text.slice(0, match.index);
        const after = text.slice(match.index + match[0].length);
        
        return (
          <>
            {before && processFormatting(before, patterns)}
            {render(match[1])}
            {after && processFormatting(after, patterns)}
          </>
        );
      }
    }
    return text;
  };

  return (
    <div className={`prose prose-lg max-w-none ${className}`}>
      {renderMarkdown(content)}
    </div>
  );
};

export default MarkdownRenderer;
