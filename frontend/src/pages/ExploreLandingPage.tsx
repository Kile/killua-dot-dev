import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Send } from 'lucide-react';
import { botCategories } from '../utils/exploreCategories';

const ExploreLandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [typedText, setTypedText] = useState<string>('');
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);
  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(true);
  const [highlightedCategory, setHighlightedCategory] = useState<string | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isTyping) return; // Don't continue typing if stopped

    if (currentCategoryIndex >= botCategories.length) {
      // All categories typed, restart from beginning
      setCurrentCategoryIndex(0);
      setCurrentCharIndex(0);
      setTypedText('');
      return;
    }

    const currentCategory = botCategories[currentCategoryIndex];
    // Remove "..." from the beginning of the title
    const fullText = currentCategory.title.replace(/^\.\.\.\s*/, '');

    if (currentCharIndex < fullText.length) {
      // Still typing current category
      typingTimeoutRef.current = setTimeout(() => {
        setTypedText(fullText.substring(0, currentCharIndex + 1));
        setCurrentCharIndex(prev => prev + 1);
      }, 60); // Slower typing speed: 60ms per character

      return () => {
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      };
    } else {
      // Finished typing current category, wait a bit then move to next
      typingTimeoutRef.current = setTimeout(() => {
        setCurrentCategoryIndex(prev => prev + 1);
        setCurrentCharIndex(0);
        setTypedText('');
      }, 1500); // Longer pause between categories

      return () => {
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      };
    }
  }, [currentCategoryIndex, currentCharIndex, isTyping]);

  const handleSend = () => {
    if (currentCategoryIndex >= botCategories.length) return;
    
    const category = botCategories[currentCategoryIndex];
    
    // Stop typing
    setIsTyping(false);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Highlight the corresponding menu item
    setHighlightedCategory(category.id);
    
    // Navigate after animation
    setTimeout(() => {
      navigate(`/explore/${category.id}`);
    }, 600); // Wait for highlight animation
  };

  return (
    <div className="min-h-screen bg-discord-darker text-white">
      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-12 sm:py-16">
        {/* Hero Question - Large and Centered */}
        <div className="text-center mb-12 sm:mb-16">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 px-4">
            What can Killua help you with?
          </h1>
          <p className="text-xl sm:text-2xl text-gray-400 max-w-2xl mx-auto px-4 mb-8">
            I'm looking for a bot that...
          </p>
          
          {/* Discord-style Input Box with Typing Animation */}
          <div className="max-w-2xl mx-auto mb-8">
            <div className="w-full bg-discord-darker text-white px-4 py-3 rounded-lg border border-gray-600 flex items-center min-h-[3rem]">
              {/* Text content - wraps naturally, left-aligned */}
              <div className="flex-1 min-w-0 text-left">
                <span className="text-gray-400 text-sm">I'm looking for a bot that </span>
                <span className="text-gray-200 font-medium">
                  {typedText}
                  {isTyping && <span className="animate-pulse ml-1">|</span>}
                </span>
              </div>
              
              {/* Send Button - Inside on the right with blue border */}
              <button
                onClick={handleSend}
                disabled={currentCategoryIndex >= botCategories.length}
                className="flex items-center justify-center w-8 h-8 bg-discord-blurple hover:bg-discord-blurple/80 text-white rounded border border-discord-blurple/50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0 ml-2"
                title="Send"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Answer Box - Categories fade in and stay visible */}
        <div className={`space-y-3 mb-12 animate-fade-in`}>
            {botCategories.map((category, index) => {
              const isHighlighted = highlightedCategory === category.id;
              return (
                <Link
                  key={category.id}
                  to={`/explore/${category.id}`}
                  className={`block bg-discord-dark border rounded-lg p-4 sm:p-5 transition-all duration-300 hover:bg-discord-dark/80 hover:shadow-lg hover:shadow-discord-blurple/10 opacity-0 animate-fade-in-up ${
                    isHighlighted 
                      ? 'border-discord-blurple bg-discord-blurple/20 shadow-lg shadow-discord-blurple/30 scale-105' 
                      : 'border-gray-700 hover:border-discord-blurple/50'
                  }`}
                  style={{
                    animationDelay: `${index * 50}ms`,
                    animationFillMode: 'forwards',
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-base sm:text-lg transition-colors ${
                      isHighlighted ? 'text-white font-semibold' : 'text-gray-200 hover:text-white'
                    }`}>
                      {category.title}
                    </span>
                    <div className={`flex-shrink-0 ml-4 transition-colors ${
                      isHighlighted ? 'text-discord-blurple' : 'text-gray-500 hover:text-discord-blurple'
                    }`}>
                      →
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

        {/* CTA Section */}
        <div className="text-center animate-fade-in">
          <p className="text-gray-400 mb-6">
            Or{' '}
            <a
              href="https://discord.com/oauth2/authorize?client_id=756206646396452975&scope=bot&permissions=1342531648"
              className="text-discord-blurple hover:text-discord-blurple/80 underline transition-colors"
            >
              invite Killua to your server
            </a>
            {' '}right now
          </p>
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.5s ease-in;
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.4s ease-out;
        }
      `}</style>
    </div>
  );
};

export default ExploreLandingPage;
