import React, { useState, useEffect } from 'react';
import { X, Search, Image, File } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { listFiles, isImageFile } from '../services/fileService';

interface CdnFile {
  name: string;
  path: string;
  type: string;
  url: string;
}

interface CdnFileSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (fileUrl: string) => void;
  acceptedTypes?: string[];
}

const CdnFileSelector: React.FC<CdnFileSelectorProps> = ({
  isOpen,
  onClose,
  onSelect,
  acceptedTypes = ['image/*']
}) => {
  const { getToken } = useAuth();
  const [files, setFiles] = useState<CdnFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchCdnFiles();
    }
  }, [isOpen]);

  const fetchCdnFiles = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = getToken();
      
      if (!token) {
        throw new Error('No authentication token');
      }

      // Use the file service to get CDN files
      const filePaths = await listFiles(token);
      
      // Filter files based on accepted types and only show files from /news/ directory
      const filteredFiles = filePaths
        .filter((path: string) => {
          // Only show files from the /news/ directory
          if (!path.startsWith('news/')) {
            return false;
          }
          // Filter by image type if specified
          if (acceptedTypes.includes('image/*')) {
            return isImageFile(path);
          }
          return true;
        })
        .map((path: string) => {
          const fileName = path.split('/').pop() || path;
          const externalApiBaseUrl = import.meta.env.VITE_EXTERNAL_API_BASE_URL || 'https://api.killua.dev';
          return {
            name: fileName,
            path: path,
            type: isImageFile(path) ? 'image/*' : 'application/octet-stream',
            url: `${externalApiBaseUrl}/image/cdn/${path}`
          };
        });

      setFiles(filteredFiles);
    } catch (err) {
      setError('Failed to load CDN files');
      console.error('Error fetching CDN files:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredFiles = files.filter(file =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );


  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) {
      return <Image className="w-8 h-8 text-blue-400" />;
    }
    return <File className="w-8 h-8 text-gray-400" />;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-discord-dark rounded-lg border border-gray-600 w-full max-w-4xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-600">
          <h2 className="text-xl font-bold text-white">Select from CDN</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Search */}
        <div className="p-6 border-b border-gray-600">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-10 pr-4 py-2 text-white focus:ring-2 focus:ring-discord-blurple focus:border-discord-blurple"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-400">Loading CDN files...</div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-red-400">{error}</div>
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-400">
                {searchQuery ? 'No files found matching your search' : 'No files available'}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredFiles.map((file, index) => (
                <div
                  key={index}
                  className="bg-gray-700 rounded-lg p-4 hover:bg-gray-600 transition-colors cursor-pointer group"
                  onClick={() => onSelect(file.url)}
                >
                  <div className="flex flex-col items-center text-center">
                    {file.type.startsWith('image/') ? (
                      <img
                        src={file.url}
                        alt={file.name}
                        className="w-16 h-16 object-cover rounded-lg mb-2"
                      />
                    ) : (
                      <div className="w-16 h-16 flex items-center justify-center mb-2">
                        {getFileIcon(file.type)}
                      </div>
                    )}
                    <div className="text-sm text-white font-medium truncate w-full">
                      {file.name}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-600">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CdnFileSelector;
