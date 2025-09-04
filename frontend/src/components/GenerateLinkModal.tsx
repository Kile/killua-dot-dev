import React, { useState, useEffect } from 'react';
import { X, Copy, Link as LinkIcon, Calendar, Clock } from 'lucide-react';
import { generateFileLink } from '../services/fileService';
import type { FileLink } from '../services/fileService';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import './DatePicker.css';

interface GenerateLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  filePath: string;
  fileName: string;
  token: string;
}

const GenerateLinkModal: React.FC<GenerateLinkModalProps> = ({ 
  isOpen, 
  onClose, 
  filePath, 
  fileName, 
  token 
}) => {
  const [expiryDate, setExpiryDate] = useState<Date | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedLink, setGeneratedLink] = useState<FileLink | null>(null);

  // Set default expiry to 1 hour from now when modal opens
  useEffect(() => {
    if (isOpen && !expiryDate) {
      const defaultExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
      setExpiryDate(defaultExpiry);
    }
  }, [isOpen, expiryDate]);

  const setPresetExpiry = (minutes: number) => {
    const expiry = new Date(Date.now() + minutes * 60 * 1000);
    setExpiryDate(expiry);
    setGeneratedLink(null); // Clear any existing link when setting new expiry
  };

  const handleGenerate = async () => {
    if (!expiryDate) {
      setError('Please select an expiration date');
      return;
    }

    try {
      setIsGenerating(true);
      setError(null);
      
      const expiryTimestamp = Math.floor(expiryDate.getTime() / 1000);
      const link = await generateFileLink(filePath, expiryTimestamp, token);
      
      setGeneratedLink(link);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate link');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (!generatedLink) return;
    
    try {
      await navigator.clipboard.writeText(generatedLink.url);
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const handleClose = () => {
    setExpiryDate(null);
    setError(null);
    setGeneratedLink(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-discord-dark rounded-lg shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-600">
          <h3 className="text-lg font-semibold text-white">Generate File Link</h3>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-discord-darker rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* File Info */}
          <div className="bg-discord-darker rounded-lg p-4">
            <p className="text-white text-sm font-medium">{fileName}</p>
            <p className="text-gray-400 text-xs mt-1">{filePath}</p>
          </div>

          {/* Expiry Date Selection */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-300">Expiration Settings</h4>
            
            {/* Preset Buttons */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">
                Quick Presets
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setPresetExpiry(15)}
                  className="px-3 py-2 bg-discord-darker hover:bg-discord-dark border border-gray-600 rounded-lg text-sm text-gray-300 hover:text-white transition-colors"
                >
                  15 minutes
                </button>
                <button
                  onClick={() => setPresetExpiry(60)}
                  className="px-3 py-2 bg-discord-darker hover:bg-discord-dark border border-gray-600 rounded-lg text-sm text-gray-300 hover:text-white transition-colors"
                >
                  1 hour
                </button>
                <button
                  onClick={() => setPresetExpiry(60 * 24)}
                  className="px-3 py-2 bg-discord-darker hover:bg-discord-dark border border-gray-600 rounded-lg text-sm text-gray-300 hover:text-white transition-colors"
                >
                  1 day
                </button>
                <button
                  onClick={() => setPresetExpiry(60 * 24 * 7)}
                  className="px-3 py-2 bg-discord-darker hover:bg-discord-dark border border-gray-600 rounded-lg text-sm text-gray-300 hover:text-white transition-colors"
                >
                  1 week
                </button>
              </div>
            </div>
            
            {/* Custom Date Picker */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">
                Custom Expiration
              </label>
              <div className="relative">
                <DatePicker
                  selected={expiryDate}
                  onChange={(date: Date | null) => {
                    setExpiryDate(date);
                    setGeneratedLink(null); // Clear any existing link when changing expiry
                  }}
                  showTimeSelect
                  timeFormat="HH:mm"
                  timeIntervals={5}
                  dateFormat="MMMM d, yyyy h:mm aa"
                  minDate={new Date()}
                  placeholderText="Select date and time"
                  popperClassName="!z-[60]"
                  popperPlacement="bottom-start"
                  showTimeSelectOnly={false}
                  timeCaption="Time"
                  todayButton="Today"
                  isClearable={true}
                  clearButtonTitle="Clear"
                />
              </div>
              <p className="text-xs text-gray-400">
                Select a custom expiration date and time for your link
              </p>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="p-4 bg-red-900/20 border border-red-500 rounded-lg text-red-400 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* Generated Link */}
          {generatedLink && (
            <div className="bg-discord-darker rounded-lg p-4 space-y-3">
              <div className="flex items-center space-x-2">
                <LinkIcon className="w-4 h-4 text-green-400" />
                <span className="text-green-400 text-sm font-medium">Link Generated Successfully</span>
              </div>
              <div className="bg-discord-dark rounded-lg p-3">
                <p className="text-white text-xs break-all font-mono">{generatedLink.url}</p>
              </div>
              <button
                onClick={handleCopy}
                className="w-full flex items-center justify-center space-x-2 bg-discord-blurple hover:bg-discord-blurple/80 text-white px-4 py-2 rounded-lg text-sm transition-colors"
              >
                <Copy className="w-4 h-4" />
                <span>Copy Link</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-600">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            disabled={!expiryDate || isGenerating}
            className="bg-discord-blurple hover:bg-discord-blurple/80 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg transition-colors flex items-center space-x-2"
          >
            {isGenerating ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <LinkIcon className="w-4 h-4" />
                <span>Generate Link</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GenerateLinkModal;
