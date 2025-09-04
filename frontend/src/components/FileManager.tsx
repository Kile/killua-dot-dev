import React, { useState, useEffect } from 'react';
import { 
  Folder, 
  File, 
  Image as ImageIcon, 
  FileText, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Eye,
  Home,
  Link as LinkIcon
} from 'lucide-react';
import { 
  listFiles, 
  deleteFile, 
  editFilePath, 
  uploadFile,
  isImageFile, 
  isTextFile,
  getFileViewerToken
} from '../services/fileService';
import type { FileViewerToken } from '../services/fileService';
import FileViewer from './FileViewer';
import UploadModal from './UploadModal';
import GenerateLinkModal from './GenerateLinkModal';

interface FileManagerProps {
  token: string;
}

interface FileItem {
  path: string;
  name: string;
  isDirectory: boolean;
  isImage: boolean;
  isText: boolean;
}

const FileManager: React.FC<FileManagerProps> = ({ token }) => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [currentPath, setCurrentPath] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [showFileViewer, setShowFileViewer] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editingFile, setEditingFile] = useState<FileItem | null>(null);
  const [newFileName, setNewFileName] = useState('');
  const [fileViewerToken, setFileViewerToken] = useState<FileViewerToken | null>(null);
  const [showDropdown, setShowDropdown] = useState<string | null>(null);
  const [allFiles, setAllFiles] = useState<FileItem[]>([]);
  const [showGenerateLinkModal, setShowGenerateLinkModal] = useState(false);
  const [selectedFileForLink, setSelectedFileForLink] = useState<FileItem | null>(null);

  // Handle clicking outside dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      
      // Check if the click target is not a dropdown button or dropdown content
      if (!target.closest('.dropdown-button') && !target.closest('.file-dropdown')) {
        setShowDropdown(null);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  // Close dropdown when navigating to a different path
  useEffect(() => {
    setShowDropdown(null);
  }, [currentPath]);

  const loadFiles = async () => {
    try {
      setLoading(true);
      setError(null);
      const filePaths = await listFiles(token);
      
      // Create file items and detect directories
      const allFileItems: FileItem[] = [];
      const directoryPaths = new Set<string>();
      
      // First pass: create file items and collect directory paths
      filePaths.forEach(path => {
        const parts = path.split('/');
        const fileName = parts[parts.length - 1];
        const isImage = isImageFile(fileName);
        const isText = isTextFile(fileName);
        
        const fileItem: FileItem = {
          path,
          name: fileName,
          isDirectory: false,
          isImage,
          isText
        };
        
        allFileItems.push(fileItem);
        
        // Add all parent directories to the set
        for (let i = 1; i < parts.length; i++) {
          const dirPath = parts.slice(0, i).join('/');
          directoryPaths.add(dirPath);
        }
      });
      
      // Second pass: create directory items
      directoryPaths.forEach(dirPath => {
        const dirName = dirPath.split('/').pop()!;
        const dirItem: FileItem = {
          path: dirPath,
          name: dirName,
          isDirectory: true,
          isImage: false,
          isText: false
        };
        allFileItems.push(dirItem);
      });
      
      // Sort files and directories
      const sortItems = (items: FileItem[]) => {
        return items.sort((a, b) => {
          if (a.isDirectory !== b.isDirectory) {
            return a.isDirectory ? -1 : 1;
          }
          return a.name.localeCompare(b.name);
        });
      };
      
      // Store all files for navigation
      setAllFiles(sortItems(allFileItems));
      
      // Filter files based on current path
      const filteredFiles = currentPath 
        ? allFileItems.filter(f => {
            // Show files directly in current path (not directories)
            if (f.isDirectory) return false;
            
            const isDirectChild = f.path.startsWith(currentPath + '/') && 
              f.path.split('/').length === currentPath.split('/').length + 1;
            
            return isDirectChild;
          })
        : allFileItems.filter(f => f.path.split('/').length === 1); // Only root level items
      
      setFiles(sortItems(filteredFiles));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load files');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFiles();
  }, [token]);

  const getFileViewerTokenData = async () => {
    try {
      const tokenData = await getFileViewerToken(token);
      setFileViewerToken(tokenData);
    } catch (err) {
      console.error('Failed to get file viewer token:', err);
    }
  };

  useEffect(() => {
    getFileViewerTokenData();
  }, [token]);

  const handleFileClick = (file: FileItem) => {
    if (file.isDirectory) {
      setCurrentPath(file.path);
      // Filter allFiles to show contents of this directory
      const dirFiles = allFiles.filter(f => {
        // Show files directly in this directory (not directories)
        if (f.isDirectory) return false;
        
        const isDirectChild = f.path.startsWith(file.path + '/') && 
          f.path.split('/').length === file.path.split('/').length + 1;
        
        return isDirectChild;
      });
      
      // Sort the directory contents
      const sortItems = (items: FileItem[]) => {
        return items.sort((a, b) => {
          if (a.isDirectory !== b.isDirectory) {
            return a.isDirectory ? -1 : 1;
          }
          return a.name.localeCompare(b.name);
        });
      };
      
      setFiles(sortItems(dirFiles));
    } else {
      setSelectedFile(file);
      setShowFileViewer(true);
    }
  };

  const handleDelete = async (file: FileItem) => {
    if (!confirm(`Are you sure you want to delete "${file.name}"?`)) return;
    
    try {
      await deleteFile(file.path, token);
      await loadFiles();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete file');
    }
  };

  const handleRename = async (file: FileItem, newName: string) => {
    try {
      const newPath = file.path.replace(file.name, newName);
      await editFilePath(file.path, newPath, token);
      setEditingFile(null);
      setNewFileName('');
      await loadFiles();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to rename file');
    }
  };

  const handleUpload = async (file: File, path: string) => {
    try {
      await uploadFile(file, path, token);
      await loadFiles();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload file');
    }
  };

  const navigateToPath = (path: string) => {
    setCurrentPath(path);
    
    // Filter allFiles to show contents of this path
    const pathFiles = allFiles.filter(f => {
      if (path === '') {
        // Root view: show both files and directories at root level
        return f.path.split('/').length === 1;
      } else {
        // Folder view: show only files directly in this path (not directories)
        if (f.isDirectory) return false;
        
        const isDirectChild = f.path.startsWith(path + '/') && 
          f.path.split('/').length === path.split('/').length + 1;
        
        return isDirectChild;
      }
    });
    
    // Sort the path contents
    const sortItems = (items: FileItem[]) => {
      return items.sort((a, b) => {
        if (a.isDirectory !== b.isDirectory) {
          return a.isDirectory ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      });
    };
    
    setFiles(sortItems(pathFiles));
  };

  const getFileIcon = (file: FileItem) => {
    if (file.isDirectory) return <Folder className="w-5 h-5 text-blue-400" />;
    if (file.isImage) return <ImageIcon className="w-5 h-5 text-green-400" />;
    if (file.isText) return <FileText className="w-5 h-5 text-yellow-400" />;
    return <File className="w-5 h-5 text-gray-400" />;
  };

  return (
    <div className="bg-discord-darker rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-semibold text-white">File Manager</h2>
          <button
            onClick={() => setShowUploadModal(true)}
            className="bg-discord-blurple hover:bg-discord-blurple/80 text-white px-4 py-2 rounded transition-colors flex items-center space-x-2"
          >
            <File className="w-4 h-4" />
            <span>Upload File</span>
          </button>
        </div>
        
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-sm">
          <button
            onClick={() => navigateToPath('')}
            className="flex items-center space-x-1 text-gray-400 hover:text-white transition-colors"
          >
            <Home className="w-4 h-4" />
            <span>Home</span>
          </button>
          {currentPath && currentPath.split('/').map((part, index) => {
            if (!part) return null;
            const pathToHere = currentPath.split('/').slice(0, index + 1).join('/');
            return (
              <React.Fragment key={pathToHere}>
                <span className="text-gray-600">/</span>
                <button
                  onClick={() => navigateToPath(pathToHere)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  {part}
                </button>
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 bg-red-900/20 border border-red-500 rounded text-red-400">
          {error}
        </div>
      )}

      {/* File List */}
      <div className="bg-discord-dark rounded-lg border border-gray-600">
        {loading ? (
          <div className="p-8 text-center text-gray-400">
            <div className="w-6 h-6 border-2 border-gray-600 border-t-discord-blurple rounded-full animate-spin mx-auto mb-2" />
            Loading files...
          </div>
        ) : files.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <Folder className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No files found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-600">
            {files.map((file) => (
              <div
                key={file.path}
                className="flex items-center justify-between p-4 hover:bg-discord-darker transition-colors"
              >
                <div 
                  className="flex items-center space-x-3 flex-1 cursor-pointer"
                  onClick={() => handleFileClick(file)}
                >
                  {getFileIcon(file)}
                  <span className="text-white">{file.name}</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  {!file.isDirectory && (
                    <button
                      onClick={() => {
                        setSelectedFile(file);
                        setShowFileViewer(true);
                      }}
                      className="p-2 text-gray-400 hover:text-white hover:bg-discord-darker rounded transition-colors"
                      title="View"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  )}
                  
                  <div className="relative">
                    <button
                      onClick={() => setShowDropdown(showDropdown === file.path ? null : file.path)}
                      className="dropdown-button p-2 text-gray-400 hover:text-white hover:bg-discord-darker rounded transition-colors"
                      title="More options"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                    
                    {showDropdown === file.path && (
                      <div className="file-dropdown absolute right-0 mt-2 w-48 bg-discord-dark border border-gray-600 rounded-lg shadow-xl z-10">
                        <div className="py-1">
                          <button
                            onClick={() => {
                              setEditingFile(file);
                              setShowDropdown(null);
                            }}
                            className="w-full flex items-center space-x-2 px-4 py-2 text-gray-300 hover:text-white hover:bg-discord-darker transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                            <span>Rename</span>
                          </button>
                          {!file.isDirectory && (
                            <button
                              onClick={() => {
                                setSelectedFileForLink(file);
                                setShowGenerateLinkModal(true);
                                setShowDropdown(null);
                              }}
                              className="w-full flex items-center space-x-2 px-4 py-2 text-gray-300 hover:text-white hover:bg-discord-darker transition-colors"
                            >
                              <LinkIcon className="w-4 h-4" />
                              <span>Generate Link</span>
                            </button>
                          )}
                          <button
                            onClick={() => {
                              handleDelete(file);
                              setShowDropdown(null);
                            }}
                            className="w-full flex items-center space-x-2 px-4 py-2 text-red-400 hover:text-red-300 hover:bg-discord-darker transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Rename Modal */}
      {editingFile && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-discord-dark rounded-lg shadow-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Rename File</h3>
            <input
              type="text"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              placeholder={editingFile.name}
              className="w-full bg-discord-darker border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-discord-blurple mb-4"
            />
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setEditingFile(null);
                  setNewFileName('');
                }}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRename(editingFile, newFileName)}
                disabled={!newFileName.trim()}
                className="bg-discord-blurple hover:bg-discord-blurple/80 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded transition-colors"
              >
                Rename
              </button>
            </div>
          </div>
        </div>
      )}

      {/* File Viewer */}
      {showFileViewer && selectedFile && fileViewerToken && (
        <FileViewer
          file={selectedFile}
          fileViewerToken={fileViewerToken}
          onClose={() => {
            setShowFileViewer(false);
            setSelectedFile(null);
          }}
        />
      )}

      {/* Upload Modal */}
      <UploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUpload={handleUpload}
        currentPath={currentPath}
      />

      {/* Generate Link Modal */}
      {showGenerateLinkModal && selectedFileForLink && (
        <GenerateLinkModal
          isOpen={showGenerateLinkModal}
          onClose={() => {
            setShowGenerateLinkModal(false);
            setSelectedFileForLink(null);
          }}
          filePath={selectedFileForLink.path}
          fileName={selectedFileForLink.name}
          token={token}
        />
      )}
    </div>
  );
};

export default FileManager;
