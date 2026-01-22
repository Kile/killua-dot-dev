import React, { useState, useEffect } from 'react';
import { Play } from 'lucide-react';
import WizardModal from './WizardModal';

interface FloatingWizardButtonProps {
  alwaysVisible?: boolean;
}

const FloatingWizardButton: React.FC<FloatingWizardButtonProps> = ({ alwaysVisible = false }) => {
  const [isVisible, setIsVisible] = useState(alwaysVisible);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (alwaysVisible) {
      setIsVisible(true);
      return;
    }

    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);
    // Initial check
    toggleVisibility();
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, [alwaysVisible]);

  return (
    <>
      <div 
        className={`fixed bottom-8 right-8 z-[90] transition-all duration-300 transform ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-16 opacity-0 pointer-events-none'
        }`}
      >
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 bg-discord-blurple hover:bg-discord-blurple/90 text-white px-6 py-3 rounded-full shadow-lg shadow-discord-blurple/20 transition-all duration-200 hover:scale-105 active:scale-95 group"
        >
          <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
            <Play className="w-3 h-3 fill-white" />
          </div>
          <span className="font-bold whitespace-nowrap">Try the demo</span>
        </button>
      </div>

      <WizardModal 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)} 
      />
    </>
  );
};

export default FloatingWizardButton;

