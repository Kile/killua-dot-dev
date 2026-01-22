import React from 'react';
import { Link } from 'react-router-dom';
import { X, ChevronRight } from 'lucide-react';
import { botCategories } from '../utils/exploreCategories';

interface WizardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const WizardModal: React.FC<WizardModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-discord-dark border border-gray-600 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-600">
          <h3 className="text-xl font-bold text-white">What can Killua help you with?</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(85vh-80px)]">
          <p className="text-gray-400 mb-6 text-center">I'm looking for a bot that...</p>
          <div className="space-y-3">
            {botCategories.map((category) => (
              <Link
                key={category.id}
                to={`/explore/${category.id}`}
                onClick={onClose}
                className="w-full flex items-center gap-4 p-4 bg-discord-darker hover:bg-discord-darker/80 border border-gray-700 hover:border-discord-blurple/50 rounded-xl transition-all duration-200 group"
              >
                <div className="w-12 h-12 rounded-xl bg-discord-blurple/20 flex items-center justify-center text-discord-blurple group-hover:bg-discord-blurple group-hover:text-white transition-colors">
                  {category.icon}
                </div>
                <span className="text-left text-gray-200 group-hover:text-white transition-colors flex-1 font-medium">
                  {category.title}
                </span>
                <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-discord-blurple transition-colors" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WizardModal;

