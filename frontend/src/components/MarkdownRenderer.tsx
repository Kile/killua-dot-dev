import React, { useEffect, useRef } from 'react';
import Prism from 'prismjs';
import twemoji from 'twemoji';
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
  enableEmoji?: boolean; // Enable Twemoji parsing
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = "", enableEmoji = false }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Re-highlight code blocks after content changes
    Prism.highlightAll();
    
    // Parse emojis with Twemoji if enabled
    if (enableEmoji && containerRef.current) {
      twemoji.parse(containerRef.current, {
        folder: 'svg',
        ext: '.svg',
        base: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/'
      });
    }
  }, [content, enableEmoji]);

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

      // Handle footer-style subheadings (-#)
      if (trimmedLine.startsWith('-# ')) {
        flushList();
        flushCodeBlock();
        elements.push(
          <p key={`footer-${elements.length}`} className="text-gray-500 text-xs mt-3">
            {renderInlineMarkdown(trimmedLine.substring(3))}
          </p>
        );
        continue;
      }

      // Handle list items (-, +, and *)
      if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('+ ') || trimmedLine.startsWith('* ')) {
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
    // The key is that bold must be processed before italic, and we need to process ALL bold matches
    // before moving to italic. We do this by processing bold patterns in a separate pass first.
    
    // First pass: replace all bold patterns
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    const boldRegex = /\*\*([^*]+)\*\*/g;
    let match;
    
    // Reset regex lastIndex
    boldRegex.lastIndex = 0;
    
    while ((match = boldRegex.exec(text)) !== null) {
      // Add text before the bold match
      if (match.index > lastIndex) {
        const beforeText = text.slice(lastIndex, match.index);
        parts.push(processFormatting(beforeText, [
          { pattern: /__([^_]+)__/g, render: (c: string) => <span key={`underline-${Math.random()}`} className="underline text-gray-300">{c}</span> },
          { pattern: /\*([^*]+)\*/g, render: (c: string) => <em key={`italic-${Math.random()}`} className="italic text-gray-200">{c}</em> },
          { pattern: /`([^`]+)`/g, render: (c: string) => <code key={`code-${Math.random()}`} className="bg-gray-700 px-1 py-0.5 rounded text-sm font-mono text-green-400">{c}</code> }
        ]));
      }
      
      // Add the bold element
      parts.push(
        <strong key={`bold-${Math.random()}`} className="font-bold text-white">
          {processFormatting(match[1], [
            { pattern: /\*([^*]+)\*/g, render: (c: string) => <em key={`italic-${Math.random()}`} className="italic text-gray-200">{c}</em> },
            { pattern: /`([^`]+)`/g, render: (c: string) => <code key={`code-${Math.random()}`} className="bg-gray-700 px-1 py-0.5 rounded text-sm font-mono text-green-400">{c}</code> }
          ])}
        </strong>
      );
      
      lastIndex = match.index + match[0].length;
    }
    
    // Add remaining text after last bold match
    if (lastIndex < text.length) {
      const afterText = text.slice(lastIndex);
      parts.push(processFormatting(afterText, [
        { pattern: /__([^_]+)__/g, render: (c: string) => <span key={`underline-${Math.random()}`} className="underline text-gray-300">{c}</span> },
        { pattern: /\*([^*]+)\*/g, render: (c: string) => <em key={`italic-${Math.random()}`} className="italic text-gray-200">{c}</em> },
        { pattern: /`([^`]+)`/g, render: (c: string) => <code key={`code-${Math.random()}`} className="bg-gray-700 px-1 py-0.5 rounded text-sm font-mono text-green-400">{c}</code> }
      ]));
    }
    
    // If no bold patterns were found, process normally
    if (parts.length === 0) {
      return processFormatting(text, [
        { pattern: /__([^_]+)__/g, render: (c: string) => <span key={`underline-${Math.random()}`} className="underline text-gray-300">{c}</span> },
        { pattern: /\*([^*]+)\*/g, render: (c: string) => <em key={`italic-${Math.random()}`} className="italic text-gray-200">{c}</em> },
        { pattern: /`([^`]+)`/g, render: (c: string) => <code key={`code-${Math.random()}`} className="bg-gray-700 px-1 py-0.5 rounded text-sm font-mono text-green-400">{c}</code> }
      ]);
    }
    
    return <>{parts}</>;
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
    <div ref={containerRef} className={`prose prose-lg max-w-none twemoji-container ${className}`}>
      {renderMarkdown(content)}
    </div>
  );
};

export default MarkdownRenderer;
