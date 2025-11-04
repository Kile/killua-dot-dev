import React from 'react';
import { ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface UpdateProgressionProps {
  lastUpdate?: {
    _id: string;
    title: string;
    version?: string;
    timestamp: string;
  };
  currentUpdate?: {
    title: string;
    version?: string;
    timestamp?: string;
    published?: boolean;
  };
  variant?: 'full' | 'compact' | 'minimal';
  className?: string;
  isLatest?: boolean; // Whether this is the latest update or if newer ones exist
}

const UpdateProgression: React.FC<UpdateProgressionProps> = ({
  lastUpdate,
  currentUpdate,
  variant = 'full',
  className = '',
  isLatest = true
}) => {
  const navigate = useNavigate();
  
  if (!lastUpdate) return null;

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const getCurrentUpdateDate = () => {
    if (currentUpdate?.timestamp) {
      return formatDate(currentUpdate.timestamp);
    }
    return new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const handleLastUpdateClick = () => {
    navigate(`/news/${lastUpdate._id}`);
  };

  if (variant === 'minimal') {
    return (
      <div className={`flex items-center gap-2 text-xs text-blue-300 ${className}`}>
        <button
          onClick={handleLastUpdateClick}
          className="hover:text-blue-200 cursor-pointer"
        >
          {lastUpdate.version || 'N/A'}
        </button>
        <ChevronRight className="w-3 h-3" />
        <span>{currentUpdate?.version || 'TBD'}</span>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`bg-blue-900/10 border border-blue-600/20 rounded p-2 ${className}`}>
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={handleLastUpdateClick}
            className="text-blue-300 hover:text-blue-200 cursor-pointer"
          >
            {lastUpdate.title}
          </button>
          <ChevronRight className="w-3 h-3 text-blue-400" />
          <span className="text-blue-200">{currentUpdate?.title || 'New Update'}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
          <span>{lastUpdate.version || 'N/A'}</span>
          <ChevronRight className="w-3 h-3" />
          <span>{currentUpdate?.version || 'TBD'}</span>
        </div>
      </div>
    );
  }

  // Full variant (default)
  return (
    <div className={`bg-blue-900/20 border border-blue-600/30 rounded-lg p-4 ${className}`}>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
        <h3 className="text-sm font-medium text-blue-300">Update Progression</h3>
      </div>
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <button
            onClick={handleLastUpdateClick}
            className="flex-1 bg-gray-700 rounded-lg p-3 hover:bg-gray-600 transition-colors cursor-pointer text-left"
          >
            <div className="text-xs text-gray-400 mb-1">Last Update</div>
            <div className="text-sm font-medium text-gray-200">{lastUpdate.title}</div>
            <div className="text-xs text-gray-500">{lastUpdate.version || 'N/A'} • {formatDate(lastUpdate.timestamp)}</div>
          </button>
          <div className="flex flex-col items-center">
            <ChevronRight className="w-4 h-4 text-blue-400" />
          </div>
          <div className="flex-1 bg-blue-600/20 border border-blue-500/30 rounded-lg p-3">
            <div className="text-xs text-blue-300 mb-1">
              {isLatest ? 'Current Update' : 'This Update'}
            </div>
            <div className="text-sm font-medium text-blue-100">{currentUpdate?.title || 'New Update'}</div>
            <div className="text-xs text-blue-400">{currentUpdate?.version || 'TBD'} • {getCurrentUpdateDate()}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpdateProgression;
