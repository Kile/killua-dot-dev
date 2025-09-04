import React, { useState, useEffect } from 'react';
import { X, Download, ExternalLink } from 'lucide-react';
import type { FileViewerToken } from '../services/fileService';
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

interface FileViewerProps {
  file: {
    path: string;
    name: string;
    isImage: boolean;
    isText: boolean;
  };
  fileViewerToken: FileViewerToken;
  onClose: () => void;
}

const FileViewer: React.FC<FileViewerProps> = ({ file, fileViewerToken, onClose }) => {
  const fileUrl = `${fileViewerToken.baseUrl}/${encodeURIComponent(file.path)}?token=${fileViewerToken.token}&expiry=${fileViewerToken.expiry}`;
  const [imageUrl, setImageUrl] = useState<string>('');
  const [imageError, setImageError] = useState<boolean>(false);
  const [textContent, setTextContent] = useState<string>('');
  const [textError, setTextError] = useState<boolean>(false);
  const [textLoading, setTextLoading] = useState<boolean>(false);

  // Get file language for display and Prism.js highlighting
  const getFileLanguage = (filename: string): { display: string; prism: string } => {
    const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'));
    const languageMap: { [key: string]: { display: string; prism: string } } = {
      '.js': { display: 'JavaScript', prism: 'javascript' },
      '.ts': { display: 'TypeScript', prism: 'typescript' },
      '.jsx': { display: 'React JSX', prism: 'jsx' },
      '.tsx': { display: 'React TSX', prism: 'tsx' },
      '.py': { display: 'Python', prism: 'python' },
      '.java': { display: 'Java', prism: 'java' },
      '.c': { display: 'C', prism: 'c' },
      '.cpp': { display: 'C++', prism: 'cpp' },
      '.h': { display: 'C Header', prism: 'c' },
      '.hpp': { display: 'C++ Header', prism: 'cpp' },
      '.cs': { display: 'C#', prism: 'csharp' },
      '.php': { display: 'PHP', prism: 'php' },
      '.rb': { display: 'Ruby', prism: 'ruby' },
      '.go': { display: 'Go', prism: 'go' },
      '.rs': { display: 'Rust', prism: 'rust' },
      '.swift': { display: 'Swift', prism: 'swift' },
      '.kt': { display: 'Kotlin', prism: 'kotlin' },
      '.scala': { display: 'Scala', prism: 'scala' },
      '.sql': { display: 'SQL', prism: 'sql' },
      '.html': { display: 'HTML', prism: 'markup' },
      '.css': { display: 'CSS', prism: 'css' },
      '.json': { display: 'JSON', prism: 'json' },
      '.xml': { display: 'XML', prism: 'markup' },
      '.yaml': { display: 'YAML', prism: 'yaml' },
      '.yml': { display: 'YAML', prism: 'yaml' },
      '.toml': { display: 'TOML', prism: 'toml' },
      '.md': { display: 'Markdown', prism: 'markup' },
      '.txt': { display: 'Plain Text', prism: 'text' },
      '.log': { display: 'Log File', prism: 'text' },
      '.ini': { display: 'INI', prism: 'ini' },
      '.cfg': { display: 'Config', prism: 'ini' },
      '.conf': { display: 'Config', prism: 'ini' },
      '.sh': { display: 'Bash', prism: 'bash' },
      '.bash': { display: 'Bash', prism: 'bash' },
      '.zsh': { display: 'Shell', prism: 'bash' }
    };
    return languageMap[extension] || { display: 'Text', prism: 'text' };
  };

    useEffect(() => {
    if (file.isImage) {
      fetch(fileUrl)
        .then(response => {
          if (!response.ok) throw new Error('Failed to load image');
          return response.blob();
        })
        .then(blob => {
          const url = URL.createObjectURL(blob);
          setImageUrl(url);
        })
        .catch(() => {
          setImageError(true);
        });
    } else if (file.isText) {
      setTextLoading(true);
      setTextError(false);
      fetch(fileUrl)
        .then(response => {
          if (!response.ok) throw new Error('Failed to load text file');
          return response.text();
        })
        .then(text => {
          setTextContent(text);
          setTextLoading(false);
        })
        .catch(() => {
          setTextError(true);
          setTextLoading(false);
        });
    }

    // Cleanup function to revoke object URL
    return () => {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [file.path, file.isImage, file.isText, fileUrl]);

  // Apply syntax highlighting when text content changes
  useEffect(() => {
    if (textContent && file.isText) {
      // Use setTimeout to ensure the DOM is updated before highlighting
      setTimeout(() => {
        try {
          Prism.highlightAll();
        } catch (error) {
          console.warn('Syntax highlighting failed:', error);
          // Fallback to plain text if highlighting fails
        }
      }, 0);
    }
  }, [textContent, file.isText]);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenInNewTab = () => {
    window.open(fileUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-discord-dark rounded-lg shadow-2xl max-w-4xl max-h-[90vh] w-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-600">
          <h3 className="text-lg font-semibold text-white truncate">{file.name}</h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownload}
              className="p-2 text-gray-400 hover:text-white hover:bg-discord-darker rounded transition-colors"
              title="Download"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={handleOpenInNewTab}
              className="p-2 text-gray-400 hover:text-white hover:bg-discord-darker rounded transition-colors"
              title="Open in new tab"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-discord-darker rounded transition-colors"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 overflow-auto max-h-[calc(90vh-80px)]">
          {file.isImage ? (
            <div className="flex justify-center">
              {imageError ? (
                <div className="text-red-400 text-center p-8">
                  Failed to load image
                </div>
              ) : imageUrl ? (
                <img
                  src={imageUrl}
                  alt={file.name}
                  className="max-w-full max-h-full object-contain rounded"
                />
              ) : (
                <div className="text-gray-400 text-center p-8">
                  Loading image...
                </div>
              )}
            </div>
          ) : file.isText ? (
            <div className="bg-discord-darker rounded-lg p-4">
              {textLoading ? (
                <div className="text-gray-400 text-center p-8">
                  <div className="w-6 h-6 border-2 border-gray-600 border-t-discord-blurple rounded-full animate-spin mx-auto mb-2" />
                  Loading text file...
                </div>
              ) : textError ? (
                <div className="text-red-400 text-center p-8">
                  Failed to load text file
                </div>
              ) : (
                                  <div className="bg-discord-dark rounded-lg p-4 max-h-[calc(90vh-200px)] overflow-auto">
                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-600">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-400">Text Content</span>
                        <span className="px-2 py-1 bg-discord-blurple/20 text-discord-blurple text-xs rounded">
                          {getFileLanguage(file.name).display}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">{textContent.length} characters</span>
                    </div>
                    <pre className="text-sm font-mono whitespace-pre-wrap break-words leading-relaxed">
                      <code className={`language-${getFileLanguage(file.name).prism}`}>
                        {textContent}
                      </code>
                    </pre>
                  </div>
              )}
            </div>
          ) : (
            <div className="text-center text-gray-400 p-8">
              <p>Preview not available for this file type.</p>
              <button
                onClick={handleDownload}
                className="mt-4 bg-discord-blurple hover:bg-discord-blurple/80 text-white px-4 py-2 rounded transition-colors"
              >
                Download File
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileViewer;
