import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Hash, ChevronRight, ChevronLeft, UserPlus, Menu, X, Lightbulb } from 'lucide-react';
import LinkButton from '../components/LinkButton';
import MarkdownRenderer from '../components/MarkdownRenderer';
import { useAuth } from '../contexts/AuthContext';
import { botCategories } from '../utils/exploreCategories';

// Discord avatar colors for randomization (matching reviews section)
const AVATAR_COLORS = [
  'bg-discord-blurple',
  'bg-discord-green', 
  'bg-yellow-500',
  'bg-discord-fuchsia',
  'bg-discord-red'
];

// Types for the scenario system
interface DiscordButton {
  label: string;
  style: 'primary' | 'secondary' | 'success' | 'danger';
  emoji?: string;
}

interface DiscordEmbedField {
  name: string;
  value: string;
}

interface DiscordEmbed {
  title?: string | ((state: SharedState) => string);
  description?: string | ((state: SharedState) => string);
  color?: string;
  image?: string;
  thumbnail?: string;
  footer?: string | {
    text: string;
    icon?: string | ((state: SharedState) => string | {
      colorKey?: string;
      src?: string;
    }) | {
      colorKey?: string;
      src?: string | ((state: SharedState) => string);
    };
  };
  fields?: DiscordEmbedField[];
  buttons?: DiscordButton[];
}

interface DiscordSelectOption {
  label: string;
  value: string;
  emoji?: string; // Emoji for the option
}

// Shared state that lambda functions can access and modify
interface SharedState {
  [key: string]: any; // Allow any type of value
}

// Helper functions available to lambda callbacks
interface LambdaHelpers {
  editMessage: (messageId: string, updates: Partial<DiscordMessage>) => void;
  addMessage: (message: ScenarioMessage) => void;
  setSharedState: (key: string, value: any) => void;
  getSharedState: (key: string) => any;
  resume: () => void; // Resume execution after callback completes (only needed if requiresInput is true)
}

// Button with callback support
interface DiscordButton {
  label: string;
  style: 'primary' | 'secondary' | 'success' | 'danger';
  emoji?: string;
  disabled?: boolean; // Whether button is disabled
  callback?: (helpers: LambdaHelpers) => void; // Callback when clicked (defaults to notification)
  requiresInput?: boolean; // Whether user input is required
  featured?: boolean; // If multiple requiresInput items exist, only featured ones are interactive
}

// Select with callback support
interface DiscordSelect {
  id: string; // Unique identifier for this select
  placeholder?: string;
  options: DiscordSelectOption[] | ((state: SharedState) => DiscordSelectOption[]);
  disabled?: boolean; // Whether select is disabled
  callback: (value: string, helpers: LambdaHelpers) => void; // Required callback when value is selected
  requiresInput?: boolean; // Whether user input is required
  featured?: boolean; // If multiple requiresInput items exist, only featured ones are interactive
}

// System message for tips
interface SystemMessage {
  type: 'system';
  content: string | ((state: SharedState) => string); // Can be string or lambda
  delay: number;
}

// Slash command with its response
interface SlashCommand {
  type: 'slash';
  id?: string; // Unique identifier for deletion
  command: string | ((state: SharedState) => string);
  commandUser?: {
    name: string;
    avatar?: string;
    avatarKey?: string;
    nameColor?: string;
  };
  response: DiscordMessage; // Single response message
}

// Divider for channel switches
interface Divider {
  type: 'divider';
  content?: string; // Simple text divider like "Some time later..."
  channel?: { type: 'channel' | 'dm'; name: string }; // Channel switch
  delay: number;
}

// Edit message instruction
interface EditMessage {
  type: 'edit';
  messageId: string;
  updates: Partial<DiscordMessage>;
  delay: number;
}

interface DeleteMessage {
  type: 'delete';
  messageId: string | string[]; // Can delete single or multiple messages
  delay: number;
}

// Regular Discord message (simplified)
interface DiscordMessage {
  type: 'message';
  id?: string; // Unique message ID for editing
  author?: {
    name: string;
    avatarKey?: string;
    avatar?: string;
    isBot?: boolean;
    isUser?: boolean;
    nameColor?: string;
  };
  content?: string | ((state: SharedState) => string); // Can be string or lambda
  image?: string;
  embed?: DiscordEmbed;
  buttons?: DiscordButton[];
  select?: DiscordSelect;
  edited?: boolean;
  typing?: boolean;
  typingDuration?: number;
  before?: (state: SharedState, helpers: LambdaHelpers) => void | Promise<void>; // Lambda called before text evaluation
  delay: number;
}

// Union type for all scenario message types
type ScenarioMessage = SystemMessage | SlashCommand | Divider | EditMessage | DeleteMessage | DiscordMessage;

interface Scenario {
  id: string;
  title: string;
  description: string;
  channelName: string;
  messages: ScenarioMessage[]; // Flat array - SlashCommand marks commands with their response
}

interface Category {
  id: string;
  title: string;
  description: string;
  scenarios: Scenario[];
}

// Get deterministic color from key
const getAvatarColor = (key: string): string => {
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = ((hash << 5) - hash) + key.charCodeAt(i);
    hash |= 0;
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};


// Avatar component
const UserAvatar: React.FC<{ colorKey?: string; src?: string; size?: 'sm' | 'md' }> = ({ colorKey, src, size = 'md' }) => {
  const bgColor = colorKey ? getAvatarColor(colorKey) : 'bg-discord-green';
  const sizeClasses = size === 'sm' ? 'w-5 h-5' : 'w-10 h-10';
  const logoSize = size === 'sm' ? 'w-3 h-3' : 'w-6 h-6';
  
  // Use transparent background if there's a profile picture to preserve transparency
  const backgroundClass = src ? 'bg-transparent' : bgColor;
  
  return (
    <div className={`${sizeClasses} rounded-full ${backgroundClass} flex items-center justify-center flex-shrink-0 overflow-hidden`}>
      {src ? (
        <img src={src} alt="" className="w-full h-full object-cover" />
      ) : (
        <img src="/brand/discord-logo.png" alt="" className={`${logoSize} brightness-0 invert`} />
      )}
    </div>
  );
};

// Typing indicator component (pushes content up)
const TypingIndicator: React.FC<{ name: string }> = ({ name }) => (
  <div className="bg-discord-darker border-t border-gray-700/50 px-4 pointer-events-none flex-shrink-0 h-8 flex items-center">
    <div className="flex items-center gap-2 text-gray-400" style={{ fontSize: '0.875rem', lineHeight: '2rem' }}>
      <div className="flex gap-1 items-center">
        <span className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
      <span style={{ lineHeight: '2rem' }}><strong className="text-white">{name}</strong> is typing...</span>
    </div>
  </div>
);

// Discord button component
const DiscordButtonComponent: React.FC<{ button: DiscordButton; onClick?: () => void; disabled?: boolean; requiresInput?: boolean; isFeatured?: boolean }> = ({ button, onClick, disabled, requiresInput, isFeatured }) => {
  const styleClasses = {
    primary: 'bg-discord-blurple hover:bg-discord-blurple/80 text-white',
    secondary: 'bg-gray-600 hover:bg-gray-500 text-white',
    success: 'bg-discord-green hover:bg-discord-green/80 text-white',
    danger: 'bg-red-500 hover:bg-red-400 text-white'
  };

  const disabledClasses = 'opacity-50 cursor-not-allowed';
  const shouldGlow = requiresInput && isFeatured && !disabled;

  // Check if emoji is a file path (starts with / or http)
  const isImagePath = button.emoji && (button.emoji.startsWith('/') || button.emoji.startsWith('http'));
  const hasLabel = button.label && button.label.trim().length > 0;
  const isIconOnly = !hasLabel;

  return (
    <div 
      className={`relative ${shouldGlow ? 'ring-2 ring-blue-400 ring-opacity-75 rounded' : ''}`}
      style={shouldGlow ? { animation: 'glow 2s ease-in-out infinite' } : {}}
    >
    <button 
        className={`${isIconOnly ? 'px-2 py-2 min-w-[2.5rem]' : 'px-4 py-2'} rounded text-sm font-medium transition-colors ${styleClasses[button.style]} ${disabled ? disabledClasses : 'cursor-pointer'} flex items-center ${isIconOnly ? 'justify-center' : ''}`}
        onClick={disabled ? undefined : onClick}
        disabled={disabled}
    >
      {button.emoji && (
        <span className={hasLabel ? 'mr-1' : ''}>
          {isImagePath ? (
            <img src={button.emoji} alt="" className="w-4 h-4 object-contain" />
          ) : (
            <MarkdownRenderer content={button.emoji} enableEmoji className="inline" />
          )}
        </span>
      )}
      {hasLabel && button.label}
    </button>
    </div>
  );
};

// Parse and render command text with styled args (Discord desktop style)
const parseCommandWithArgs = (command: string): React.ReactNode[] => {
  if (!command) return [];
  
  const parts = command.split(' ');
  const result: React.ReactNode[] = [];
  
  // Add the command name (first part)
  if (parts.length > 0) {
    result.push(<span key="cmd">{parts[0]}</span>);
  }
  
  // Parse args in format "args:<value>" - handle values with spaces
  for (let i = 1; i < parts.length; i++) {
    const part = parts[i];
    const colonIndex = part.indexOf(':');
    
    if (colonIndex > 0) {
      const argName = part.substring(0, colonIndex);
      let argValue = part.substring(colonIndex + 1);
      
      // Collect remaining parts until we hit another arg or end
      while (i + 1 < parts.length && !parts[i + 1].includes(':')) {
        argValue += ' ' + parts[i + 1];
        i++;
      }
      
      result.push(
        <span key={`arg-${i}`} className="inline-flex items-center rounded overflow-hidden border border-gray-500/50">
          <span className="bg-gray-600/60 text-gray-200 text-xs font-medium px-1.5 py-0.5">
            {argName}:
          </span>
          {argValue && (
            <span className="bg-gray-800/80 text-white text-xs px-1.5 py-0.5">
              {argValue}
            </span>
          )}
        </span>
      );
    } else {
      // Regular text part (no colon) - add space before it
      result.push(<span key={`text-${i}`} className="text-white"> {part}</span>);
    }
  }
  
  return result;
};

// Slash command header with curved line (Discord style)
const SlashCommandWithReply: React.FC<{
  command: string;
  userName: string;
  userAvatar?: string;
  userAvatarKey?: string;
}> = ({ command, userName, userAvatar, userAvatarKey }) => {
  // Parse command: /command args -> get command name
  const parts = command.split(' ');
  const cmdName = parts[0].replace('/', '');

  return (
    <div className="flex items-center px-4 py-0.5">
      {/* Curved line connector - aligned with avatar column */}
      <div className="w-10 flex items-center relative">
        <div className="absolute left-1/2 -translate-x-[1px] w-6 h-3 border-l-2 border-t-2 border-gray-600 rounded-tl-md" />
      </div>
      
      {/* Header content - vertically centered with line */}
      <div className="flex items-center gap-1.5 text-xs -mt-1.5">
        <div className="ml-3">
          <UserAvatar colorKey={userAvatarKey || 'user'} src={userAvatar} size="sm" />
        </div>
        <span className="text-gray-300 hover:underline cursor-pointer">{userName}</span>
        <span className="text-gray-500">used</span>
        <span className="bg-discord-blurple/20 text-discord-blurple px-1.5 py-0.5 rounded font-medium flex items-center gap-1">
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
            <path d="M5 3a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H5Zm8.707 4.707a1 1 0 0 0-1.414-1.414L7.707 10.88a1 1 0 1 0 1.414 1.414l4.586-4.586Zm-2.293 8.586a1 1 0 1 0 0 2h5a1 1 0 1 0 0-2h-5Z"/>
          </svg>
          {cmdName}
        </span>
      </div>
    </div>
  );
};

// Discord select dropdown component
const DiscordSelectComponent: React.FC<{
  select: { id: string; placeholder?: string; options: DiscordSelectOption[]; requiresInput?: boolean; featured?: boolean };
  selectedValue?: string;
  onSelect: (value: string) => void;
  needsSelection: boolean; // Whether user needs to make a selection (for glow effect)
  disabled?: boolean;
}> = ({ select, selectedValue, onSelect, needsSelection, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  // Only use selectedValue if it's actually set and matches an option
  const validSelectedValue = selectedValue && select.options.some(opt => opt.value === selectedValue) ? selectedValue : undefined;
  const selectedOption = validSelectedValue ? select.options.find(opt => opt.value === validSelectedValue) : undefined;
  const selectRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  if (disabled && validSelectedValue) {
    return (
      <div className="mt-3 mb-2 max-w-xs">
        <div className="w-full bg-discord-dark border border-gray-600 text-gray-400 text-sm rounded px-3 py-2 flex items-center gap-2 opacity-70">
          {selectedOption?.emoji && (() => {
            const emoji = selectedOption.emoji;
            // Check if it's a file path (starts with / or http)
            const isImagePath = emoji.startsWith('/') || emoji.startsWith('http');
            // Check if it's custom emoji format :<text>:
            const isCustomEmoji = emoji.match(/^:[\w-]+:$/);
            
            if (isImagePath) {
              return (
                <img 
                  src={emoji} 
                  alt=""
                  className="max-w-4 max-h-4 w-auto h-auto object-contain opacity-70"
                  onError={(e) => {
                    // Fallback: if image doesn't exist, show as text
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const fallback = document.createTextNode(emoji);
                    target.parentNode?.insertBefore(fallback, target);
                  }}
                />
              );
            } else if (isCustomEmoji) {
              return (
                <img 
                  src={`/simulations/emoji/${emoji.slice(1, -1)}.png`} 
                  alt={emoji}
                  className="max-w-4 max-h-4 w-auto h-auto object-contain opacity-70"
                  onError={(e) => {
                    // Fallback: if image doesn't exist, show as text
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const fallback = document.createTextNode(emoji);
                    target.parentNode?.insertBefore(fallback, target);
                  }}
                />
              );
            } else {
              return <span className="text-base opacity-70">{emoji}</span>;
            }
          })()}
          <span>{selectedOption?.label || validSelectedValue}</span>
        </div>
      </div>
    );
  }

  // Glow when input is required, featured, and selection hasn't been completed (resume not called)
  const shouldGlow = needsSelection && select.featured && !disabled;
  
  return (
    <div className="mt-3 mb-2 relative max-w-xs" ref={selectRef}>
      <div 
        className={`relative ${shouldGlow ? 'ring-2 ring-blue-400 ring-opacity-75 rounded' : ''}`}
        style={shouldGlow ? { animation: 'glow 2s ease-in-out infinite' } : {}}
      >
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className="w-full bg-discord-dark border border-gray-600 text-white text-sm rounded px-3 py-2.5 flex items-center justify-between hover:bg-discord-darker focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="flex items-center gap-2">
            {selectedOption ? (
              <>
                {selectedOption.emoji && (() => {
                  const emoji = selectedOption.emoji;
                  // Check if it's a file path (starts with / or http)
                  const isImagePath = emoji.startsWith('/') || emoji.startsWith('http');
                  // Check if it's custom emoji format :<text>:
                  const isCustomEmoji = emoji.match(/^:[\w-]+:$/);
                  
                  if (isImagePath) {
                    return (
                      <img 
                        src={emoji} 
                        alt=""
                        className="max-w-4 max-h-4 w-auto h-auto object-contain"
                        onError={(e) => {
                          // Fallback: if image doesn't exist, show as text
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const fallback = document.createTextNode(emoji);
                          target.parentNode?.insertBefore(fallback, target);
                        }}
                      />
                    );
                  } else if (isCustomEmoji) {
                    return (
                      <img 
                        src={`/simulations/emoji/${emoji.slice(1, -1)}.png`} 
                        alt={emoji}
                        className="max-w-4 max-h-4 w-auto h-auto object-contain"
                        onError={(e) => {
                          // Fallback: if image doesn't exist, show as text
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const fallback = document.createTextNode(emoji);
                          target.parentNode?.insertBefore(fallback, target);
                        }}
                      />
                    );
                  } else {
                    return <span className="text-base">{emoji}</span>;
                  }
                })()}
                <span>{selectedOption.label}</span>
              </>
            ) : (
              <span className="text-gray-400">{select.placeholder || 'Select your choice...'}</span>
            )}
          </div>
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {isOpen && !disabled && (
          <div className="absolute z-50 w-full bottom-full mb-1 bg-discord-dark border border-gray-600 rounded shadow-lg overflow-hidden">
            {select.options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onSelect(option.value);
                  setIsOpen(false);
                }}
                className="w-full px-3 py-2.5 text-left text-sm text-white hover:bg-discord-blurple flex items-center gap-2 transition-colors"
              >
                {option.emoji && (() => {
                  const emoji = option.emoji;
                  // Check if it's a file path (starts with / or http)
                  const isImagePath = emoji.startsWith('/') || emoji.startsWith('http');
                  // Check if it's custom emoji format :<text>:
                  const isCustomEmoji = emoji.match(/^:[\w-]+:$/);
                  
                  if (isImagePath) {
                    return (
                      <img 
                        src={emoji} 
                        alt=""
                        className="max-w-4 max-h-4 w-auto h-auto object-contain"
                        onError={(e) => {
                          // Fallback: if image doesn't exist, show as text
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const fallback = document.createTextNode(emoji);
                          target.parentNode?.insertBefore(fallback, target);
                        }}
                      />
                    );
                  } else if (isCustomEmoji) {
                    return (
                      <img 
                        src={`/simulations/emoji/${emoji.slice(1, -1)}.png`} 
                        alt={emoji}
                        className="max-w-4 max-h-4 w-auto h-auto object-contain"
                        onError={(e) => {
                          // Fallback: if image doesn't exist, show as text
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const fallback = document.createTextNode(emoji);
                          target.parentNode?.insertBefore(fallback, target);
                        }}
                      />
                    );
                  } else {
                    return <span className="text-base">{emoji}</span>;
                  }
                })()}
                <span>{option.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      {needsSelection && !disabled && (
        <p className="text-xs text-blue-400 mt-1 flex items-center gap-1">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          Please select an option
        </p>
      )}
    </div>
  );
};

// Discord message component
const MessageComponent: React.FC<{ 
  message: ScenarioMessage; 
  userName?: string; 
  userAvatar?: string;
  sharedState?: SharedState;
  slashCommand?: string;
  commandUser?: { name: string; avatar?: string; avatarKey?: string };
  onButtonClick?: (messageId: string | undefined, buttonLabel: string) => void;
  onSelectChange?: (selectId: string, value: string) => void;
  selectChoices?: Map<string, string>;
  selectResumed?: Set<string>;
}> = ({ message, userName, userAvatar, sharedState = {}, slashCommand, commandUser, onButtonClick, onSelectChange, selectChoices, selectResumed = new Set() }) => {
  // Handle divider
  if (message.type === 'divider') {
    if (message.content) {
      // Simple text divider
    return (
        <div className="px-4 py-4 flex items-center gap-4">
          <div className="flex-1 h-px bg-gray-600"></div>
          <span className="text-xs text-gray-400 font-medium">{message.content}</span>
          <div className="flex-1 h-px bg-gray-600"></div>
        </div>
      );
    } else if (message.channel) {
      // Channel switch divider
      const isDM = message.channel.type === 'dm';
      const prefix = isDM ? 'Now in dms with' : 'Now in';
      const displayName = isDM ? `@${message.channel.name}` : `#${message.channel.name}`;
      
      return (
        <div className="px-4 py-4 flex items-center gap-4">
          <div className="flex-1 h-px bg-gray-600"></div>
          <span className="text-xs text-gray-400 font-medium">
            {prefix} <span className="text-blue-400">{displayName}</span>
        </span>
          <div className="flex-1 h-px bg-gray-600"></div>
      </div>
    );
    }
    return null;
  }

  // Helper to evaluate content and replace {user} with state.user
  const evaluateContent = (content: string | ((state: SharedState) => string) | undefined): string | undefined => {
    if (!content) return undefined;
    let text = typeof content === 'string' ? content : content(sharedState);
    // Replace {user} with state.user
    if (sharedState.user) {
      text = text.replace(/{user}/g, sharedState.user);
    }
    return text;
  };

  // Handle system message
  if (message.type === 'system') {
    const content = evaluateContent(message.content);
    return (
      <div className="px-4 pt-1 pb-6 flex justify-center">
        <span className="text-xs text-gray-300 bg-blue-500/10 px-4 py-2 rounded-full border border-blue-400 flex items-center gap-1.5 text-center">
          <Lightbulb className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
          {content}
        </span>
      </div>
    );
  }

  // Only DiscordMessage has author
  if (message.type !== 'message') {
    return null;
  }

  // Author is required
  if (!message.author) {
    return null;
  }

  // Evaluate content (string or lambda)
  const content = evaluateContent(message.content);
  
  // Check if message mentions the user (either @Username, @[Username], @[user], or @{user})
  const mentionsUser = content && userName 
    ? (new RegExp(`@${userName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(content) 
        || new RegExp(`@\\[${userName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\]`, 'i').test(content)
        || content.includes('@{user}') 
        || content.includes('@[user]'))
    : false;
  
  // Parse custom emojis :<text>: and replace with img tags, also parse \n as <br />
  const parseCustomEmojis = (text: string): React.ReactNode[] => {
    if (!text) return [];
    const parts: React.ReactNode[] = [];
    // Match :<text>: format (custom emoji)
    const emojiRegex = /:([\w-]+):/g;
    let lastIndex = 0;
    let match;
    let keyCounter = 0;
    
    while ((match = emojiRegex.exec(text)) !== null) {
      // Add text before emoji (may contain \n)
      if (match.index > lastIndex) {
        const textBefore = text.substring(lastIndex, match.index);
        // Split by \n and add <br /> elements
        const lines = textBefore.split('\n');
        lines.forEach((line, lineIdx) => {
          if (lineIdx > 0) {
            parts.push(<br key={`br-${keyCounter++}`} />);
          }
          if (line) {
            parts.push(line);
          }
        });
      }
      
      // Create img element for custom emoji
      const emojiName = match[1];
      parts.push(
        <img 
          key={`emoji-${keyCounter++}`} 
          src={`/simulations/emoji/${emojiName}.png`} 
          alt={`:${emojiName}:`}
          className="inline max-w-4 max-h-4 w-auto h-auto align-middle object-contain"
          style={{ display: 'inline', verticalAlign: 'middle' }}
          onError={(e) => {
            // Fallback: if image doesn't exist, show as text
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            const fallback = document.createTextNode(`:${emojiName}:`);
            target.parentNode?.insertBefore(fallback, target);
          }}
        />
      );
      lastIndex = match.index + match[0].length;
    }
    // Add remaining text (may contain \n)
    if (lastIndex < text.length) {
      const textAfter = text.substring(lastIndex);
      // Split by \n and add <br /> elements
      const lines = textAfter.split('\n');
      lines.forEach((line, lineIdx) => {
        if (lineIdx > 0) {
          parts.push(<br key={`br-${keyCounter++}`} />);
        }
        if (line) {
          parts.push(line);
        }
      });
    }
    
    return parts.length > 0 ? parts : [text];
  };

  // Parse mentions and render them in blue, also handling custom emojis
  const parseMentions = (text: string): React.ReactNode[] => {
    if (!text) return [];
    // First parse custom emojis, then parse mentions in the resulting parts
    const emojiParts = parseCustomEmojis(text);
    const parts: React.ReactNode[] = [];
    let keyCounter = 0;
    
    // Process each part - if it's a string, parse mentions; if it's already a React node, keep it
    emojiParts.forEach((part) => {
      if (typeof part === 'string') {
        // Match @mentions:
        // - @[text] format (brackets removed, text highlighted)
        // - @word-with-dashes format (allows dashes)
        // - @{user} pattern
        const mentionRegex = /@(\[([^\]]+)\]|[\w-]+|{user})/g;
        let lastIndex = 0;
        let match;
        
        while ((match = mentionRegex.exec(part)) !== null) {
          // Add text before mention
          if (match.index > lastIndex) {
            parts.push(part.substring(lastIndex, match.index));
          }
          // Handle different mention formats
          let mentionText: string;
          if (match[1].startsWith('[') && match[1].endsWith(']')) {
            // @[text] format - remove brackets, keep text
            mentionText = `@${match[2]}`;
          } else if (match[0] === '@{user}') {
            mentionText = '@{user}';
          } else {
            // Regular mention
            mentionText = match[0];
          }
          
          parts.push(
            <span key={`mention-${keyCounter++}`} className="text-blue-400 font-medium">
              {mentionText}
            </span>
          );
          lastIndex = match.index + match[0].length;
        }
        // Add remaining text
        if (lastIndex < part.length) {
          parts.push(part.substring(lastIndex));
        }
      } else {
        // Already a React node (custom emoji), keep it
        parts.push(part);
      }
    });
    
    return parts.length > 0 ? parts : [text];
  };

  // Determine author display
  const displayName = message.author.isUser && userName ? userName : message.author.name;
  const avatarSrc = message.author.isUser && userAvatar 
    ? userAvatar 
    : message.author.avatar
    ? message.author.avatar
    : message.author.isBot 
      ? '/brand/logo.png' 
      : undefined;

  const nameColor = message.author.nameColor 
    ? message.author.nameColor
    : message.author.isBot 
      ? 'text-discord-blurple' 
      : message.author.isUser 
        ? 'text-discord-green'
        : getAvatarColor(message.author.avatarKey || message.author.name).replace('bg-', 'text-');

  return (
    <>
      {/* Slash command header - shows above the bot message with curved line */}
      {slashCommand && (
        <SlashCommandWithReply 
          command={slashCommand} 
          userName={commandUser?.name || userName || 'You'} 
          userAvatar={commandUser?.avatar || userAvatar}
          userAvatarKey={commandUser?.avatarKey || "user"}
        />
      )}
      
      <div className={`flex gap-3 px-4 py-2 mb-2 group ${mentionsUser ? 'bg-yellow-500/10 hover:bg-yellow-500/15' : 'hover:bg-discord-darker/30'}`}>
        <div className="flex-shrink-0 pt-0.5">
          <UserAvatar 
            colorKey={message.author.avatarKey || message.author.name}
            src={avatarSrc}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`font-medium text-sm ${nameColor}`}>
              {displayName}
            </span>
            {message.author.isBot && (
              <span className="px-1.5 py-0.5 bg-discord-blurple text-white text-xs rounded font-semibold flex items-center gap-1">
                <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor">
                  <path fillRule="evenodd" d="M12.86 4.14a.5.5 0 0 1 0 .708l-5.5 5.5a.5.5 0 0 1-.708 0l-2.5-2.5a.5.5 0 1 1 .708-.708L7.1 9.382l5.146-5.146a.5.5 0 0 1 .708 0z"/>
                </svg>
                APP
              </span>
            )}
            <span className="text-gray-500 text-xs">Today at 4:20 PM</span>
            {message.edited && (
              <span className="text-gray-500 text-xs">(edited)</span>
            )}
          </div>
          
          {/* Message content with markdown, emoji, and mentions */}
          {content && (
            <div className="text-gray-200 text-sm mt-0.5">
              {parseMentions(content).map((part, index) => 
                typeof part === 'string' && part.trim() ? (
                  <MarkdownRenderer 
                    key={index} 
                    content={part} 
                    enableEmoji 
                    className="!prose-sm !text-gray-200 !inline !p-0 !m-0 [&>p]:inline [&>p]:m-0 [&>p]:p-0" 
                  />
                ) : typeof part === 'string' ? (
                  <span key={index}>{part}</span>
                ) : (
                  <span key={index} className="inline">{part}</span>
                )
              )}
            </div>
          )}
          
          {/* Image outside of embed */}
          {message.image && !message.embed && (
            <div className="mt-2 mb-2">
              <img src={message.image} alt="" className="rounded max-w-full max-h-96 object-contain" />
            </div>
          )}
          
          {/* Embed */}
          {message.embed && (() => {
            const embedTitle = evaluateContent(message.embed.title);
            const embedDescription = evaluateContent(message.embed.description);
            return (
            <div 
                className="mt-2 mb-3 rounded overflow-hidden max-w-xs border-l-4 flex"
              style={{ borderColor: message.embed.color || '#5865F2', backgroundColor: 'rgba(47, 49, 54, 0.6)' }}
            >
                <div className={`flex-1 ${embedTitle ? 'pt-3' : 'pt-3'} px-3 ${message.embed.footer ? 'pb-0' : 'pb-3'}`}>
                  {embedTitle && (
                    <h4 className="font-semibold text-white text-base mb-1">
                      <MarkdownRenderer content={embedTitle} enableEmoji className="!prose-base inline" />
                  </h4>
                )}
                  {embedDescription && (
                    <div className="text-gray-300 text-sm leading-tight">
                      {parseCustomEmojis(embedDescription).map((part, idx) => 
                        typeof part === 'string' && part.trim() ? (
                          <MarkdownRenderer 
                            key={idx} 
                            content={part} 
                            enableEmoji 
                            className="!prose-sm !text-gray-300 !inline !p-0 !m-0 [&>p]:inline [&>p]:m-0 [&>p]:p-0 [&>p]:leading-tight" 
                          />
                        ) : typeof part === 'string' ? (
                          <span key={idx}>{part}</span>
                        ) : (
                          <span key={idx} className="inline">{part}</span>
                        )
                      )}
                    </div>
                  )}
                {/* Fields - displayed after description, before image */}
                {message.embed.fields && message.embed.fields.length > 0 && (
                  <div className="mt-2 grid grid-cols-3 gap-1">
                    {message.embed.fields.map((field, fieldIndex) => (
                      <div key={fieldIndex} className="flex flex-col">
                        <div className="font-bold text-white text-xs leading-none">
                          <MarkdownRenderer content={field.name.replace(/{user}/g, sharedState.user || 'You')} enableEmoji className="!prose-xs inline" />
                        </div>
                        <div className="text-gray-300 text-xs leading-tight -mt-0.5">
                          <MarkdownRenderer content={field.value.replace(/{user}/g, sharedState.user || 'You')} enableEmoji className="!prose-xs !text-gray-300" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {/* Image below content */}
                {message.embed.image && (
                  <img src={message.embed.image} alt="" className="mt-3 rounded max-w-full max-h-48 object-cover" />
                )}
                {/* Buttons inside embed */}
                {message.embed?.buttons && message.embed.buttons.length > 0 && (
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {message.embed.buttons.map((btn, idx) => {
                      // Check if this button should be featured (if multiple requiresInput items exist)
                      // Consider both embed buttons and message-level select/buttons
                      const embedRequiresInputButtons = message.embed?.buttons?.filter(b => b.requiresInput) || [];
                      const messageRequiresInputButtons = message.buttons?.filter(b => b.requiresInput) || [];
                      const hasSelectWithInput = message.select?.requiresInput === true;
                      const totalRequiresInput = embedRequiresInputButtons.length + messageRequiresInputButtons.length + (hasSelectWithInput ? 1 : 0);
                      const hasFeaturedItems = embedRequiresInputButtons.some(b => b.featured) || messageRequiresInputButtons.some(b => b.featured) || (hasSelectWithInput && message.select?.featured);
                      const isFeatured = totalRequiresInput <= 1 || (hasFeaturedItems ? btn.featured : true);
                      
                      return (
                        <DiscordButtonComponent 
                          key={idx} 
                          button={btn} 
                          onClick={() => onButtonClick?.(message.id, btn.label || '')}
                          disabled={btn.disabled}
                          requiresInput={btn.requiresInput}
                          isFeatured={isFeatured}
                        />
                      );
                    })}
                  </div>
                )}
                {message.embed.footer && (() => {
                  const footerText = typeof message.embed.footer === 'string' 
                    ? message.embed.footer.replace(/{user}/g, sharedState.user || 'You')
                    : message.embed.footer.text.replace(/{user}/g, sharedState.user || 'You');
                  
                  let footerIconElement: React.ReactNode = null;
                  if (typeof message.embed.footer === 'object' && message.embed.footer.icon) {
                    if (typeof message.embed.footer.icon === 'string') {
                      // Simple string URL
                      footerIconElement = (
                        <img 
                          src={message.embed.footer.icon} 
                          alt="" 
                          className="w-4 h-4 rounded-full object-cover flex-shrink-0 self-start" 
                        />
                      );
                    } else if (typeof message.embed.footer.icon === 'object') {
                      // Object with colorKey and/or src (already evaluated, so src is string or undefined)
                      const iconSrc = typeof message.embed.footer.icon.src === 'string' 
                        ? message.embed.footer.icon.src 
                        : undefined;
                      const colorKey = message.embed.footer.icon.colorKey || 'user';
                      const bgColor = getAvatarColor(colorKey);
                      const backgroundClass = iconSrc ? 'bg-transparent' : bgColor;
                      
                      footerIconElement = (
                        <div className={`w-4 h-4 rounded-full ${backgroundClass} flex items-center justify-center flex-shrink-0 overflow-hidden self-start`}>
                          {iconSrc ? (
                            <img src={iconSrc} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <img src="/brand/discord-logo.png" alt="" className="w-3 h-3 brightness-0 invert" />
                          )}
                        </div>
                      );
                    }
                  }
                  
                  return (
                    <div className="flex items-start gap-1.5 mt-0.5 pb-0.5">
                      {footerIconElement}
                      <p className="text-gray-500 text-xs leading-none">
                        <MarkdownRenderer content={footerText} enableEmoji className="!prose-xs inline" />
                      </p>
                    </div>
                  );
                })()}
              </div>
              {/* Thumbnail in top right */}
              {message.embed.thumbnail && (
                <div className="p-3 flex-shrink-0">
                  <img src={message.embed.thumbnail} alt="" className="w-20 h-20 rounded object-cover" />
                </div>
              )}
            </div>
            );
          })()}

          {/* Select Dropdown */}
          {message.select && (() => {
            const options = typeof message.select.options === 'function' 
              ? message.select.options(sharedState)
              : message.select.options;
            return (
              <DiscordSelectComponent
                select={{ ...message.select, options }}
                selectedValue={selectResumed.has(message.select.id) ? selectChoices?.get(message.select.id) : undefined}
                onSelect={(value) => onSelectChange?.(message.select!.id, value)}
                needsSelection={!selectResumed.has(message.select.id)}
                disabled={message.select.disabled}
              />
            );
          })()}

          {/* Buttons */}
          {message.buttons && message.buttons.length > 0 && (
            <div className="flex gap-2 mt-2 mb-3 flex-wrap">
              {message.buttons.map((btn, idx) => {
                // Check if this button should be featured (if multiple requiresInput items exist)
                // Consider both message buttons and embed buttons
                const messageRequiresInputButtons = message.buttons?.filter(b => b.requiresInput) || [];
                const embedRequiresInputButtons = message.embed?.buttons?.filter(b => b.requiresInput) || [];
                const hasSelectWithInput = message.select?.requiresInput === true;
                const totalRequiresInput = messageRequiresInputButtons.length + embedRequiresInputButtons.length + (hasSelectWithInput ? 1 : 0);
                const hasFeaturedItems = messageRequiresInputButtons.some(b => b.featured) || embedRequiresInputButtons.some(b => b.featured) || (hasSelectWithInput && message.select?.featured);
                const isFeatured = totalRequiresInput <= 1 || (hasFeaturedItems ? btn.featured : true);
                
                return (
                  <DiscordButtonComponent 
                    key={idx} 
                    button={btn} 
                    onClick={() => onButtonClick?.(message.id, btn.label || '')}
                    disabled={btn.disabled}
                    requiresInput={btn.requiresInput}
                    isFeatured={isFeatured}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

// Main simulator component
const DiscordSimulatorPage: React.FC = () => {
  const { categoryId } = useParams<{ categoryId: string }>();
  const { user } = useAuth();
  
  const [currentScenarioIndex, setCurrentScenarioIndex] = useState(0);
  const [currentInteractionIndex, setCurrentInteractionIndex] = useState(0);
  const [phase, setPhase] = useState<'intro' | 'pre' | 'typing' | 'waiting' | 'post' | 'complete'>('intro');
  const [visibleMessages, setVisibleMessages] = useState<ScenarioMessage[]>([]);
  const [sharedState, setSharedState] = useState<SharedState>({}); // Shared state for lambda functions
  const sharedStateRef = useRef<SharedState>({});
  const [sentCommands, setSentCommands] = useState<string[]>([]); // Track sent commands for slash headers
  const [commandUsers, setCommandUsers] = useState<Map<string, { name: string; avatar?: string; avatarKey?: string }>>(new Map()); // Track which user used each command
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const [commandText, setCommandText] = useState('');
  const [showEnterHint, setShowEnterHint] = useState(false);
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const [showDesktopCategoryMenu, setShowDesktopCategoryMenu] = useState(false);
  const [showButtonNotification, setShowButtonNotification] = useState(false);
  const [buttonNotificationMessage, setButtonNotificationMessage] = useState('Buttons are non-functional in simulations');
  const [selectChoices, setSelectChoices] = useState<Map<string, string>>(new Map()); // Map of selectId -> selectedValue
  const selectChoicesRef = useRef<Map<string, string>>(new Map());
  const selectResumedRef = useRef<Set<string>>(new Set()); // Track which selects have had resume() called
  const [selectResumed, setSelectResumed] = useState<Set<string>>(new Set()); // State version for reactivity
  const executionPausedRef = useRef<boolean>(false); // Track if execution is paused waiting for callback
  const resumeExecutionRef = useRef<(() => void) | null>(null); // Callback to resume execution
  const currentMessageIndexRef = useRef<number>(0); // Track current message index being processed
  const [processedMessageCount, setProcessedMessageCount] = useState(0); // Track how many messages processed (for completion check)
  
  // Keep refs in sync with state
  useEffect(() => {
    selectChoicesRef.current = selectChoices;
  }, [selectChoices]);
  
  useEffect(() => {
    sharedStateRef.current = sharedState;
  }, [sharedState]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLDivElement>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);

  // Helper to evaluate text content (string or lambda)
  const evaluateText = useCallback((content: string | ((state: SharedState) => string) | undefined): string | undefined => {
    if (!content) return undefined;
    if (typeof content === 'string') return content;
    return content(sharedStateRef.current);
  }, []);

  // Helper to create LambdaHelpers
  const createLambdaHelpers = useCallback((): LambdaHelpers => {
    return {
      editMessage: (messageId: string, updates: Partial<DiscordMessage>) => {
        setVisibleMessages(msgs => msgs.map(m => {
          if (m.type === 'message' && m.id === messageId) {
            // Merge updates into DiscordMessage
            return { ...m, ...updates } as DiscordMessage;
          }
          return m;
        }));
      },
      addMessage: (message: ScenarioMessage) => {
        // If it's an EditMessage, process it immediately
        if (message.type === 'edit') {
          setVisibleMessages(msgs => msgs.map(m => {
            if (m.type === 'message' && m.id === message.messageId) {
              return { ...m, ...message.updates } as DiscordMessage;
            }
            return m;
          }));
          return;
        }
        
        // If it's a DeleteMessage, process it immediately
        if (message.type === 'delete') {
          const messageIdsToDelete = Array.isArray(message.messageId) ? message.messageId : [message.messageId];
          setVisibleMessages(msgs => {
            // Find indices to delete
            const indicesToDelete = new Set<number>();
            
            msgs.forEach((m, index) => {
              // Delete messages with matching IDs
              if (m.type === 'message' && m.id && messageIdsToDelete.includes(m.id)) {
                indicesToDelete.add(index);
              }
              
              // Delete slash commands by their ID, and also delete their response message
              if (m.type === 'slash' && m.id && messageIdsToDelete.includes(m.id)) {
                indicesToDelete.add(index);
                // Also delete the response message (immediately after the slash command)
                if (index + 1 < msgs.length) {
                  const nextMsg = msgs[index + 1];
                  if (nextMsg.type === 'message') {
                    indicesToDelete.add(index + 1);
                  }
                }
              }
            });
            
            // Filter out deleted messages
            return msgs.filter((_, index) => !indicesToDelete.has(index));
          });
          return;
        }
        
        setVisibleMessages(msgs => {
          // Prevent duplicates by ID
          if (message.type === 'message' && message.id && msgs.some(m => m.type === 'message' && m.id === message.id)) {
            return msgs;
          }
          return [...msgs, message] as ScenarioMessage[];
        });
      },
      setSharedState: (key: string, value: any) => {
        setSharedState(prev => ({ ...prev, [key]: value }));
      },
      getSharedState: (key: string) => {
        return sharedStateRef.current[key];
      },
      resume: () => {
        if (executionPausedRef.current && resumeExecutionRef.current) {
          executionPausedRef.current = false;
          const resume = resumeExecutionRef.current;
          resumeExecutionRef.current = null;
          resume();
        }
      }
    };
  }, []);

  // Fetch display name from API (same as navbar)
  useEffect(() => {
    const fetchDisplayName = async () => {
      try {
        if (!user) {
          setDisplayName(null);
          return;
        }
        const jwtToken = localStorage.getItem('discord_token');
        if (!jwtToken) return;
        const res = await fetch('/api/auth/user/info', {
          headers: { Authorization: `Bearer ${jwtToken}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        setDisplayName(data.display_name ?? null);
      } catch {
        // ignore
      }
    };
    fetchDisplayName();
  }, [user]);

  // Play Discord notification sound
  const playNotificationSound = useCallback(() => {
    try {
      // Create a new audio instance for each play to avoid conflicts
      const audio = new Audio('/simulations/discord-notification.mp3');
      audio.volume = 0.5; // Set volume to 50%
      
      // Ensure audio is ready before playing
      const playAudio = () => {
        audio.play().catch((error) => {
          // Silently fail if audio play is blocked (e.g., autoplay policy)
          console.debug('Audio play failed:', error);
        });
      };
      
      // If audio is already loaded, play immediately
      if (audio.readyState >= 2) {
        playAudio();
      } else {
        // Otherwise wait for it to load
        audio.addEventListener('canplay', playAudio, { once: true });
        audio.load();
      }
    } catch (error) {
      // Silently fail if audio is not available
      console.debug('Audio not available:', error);
    }
  }, []);

  // Function to edit a message by ID (unused, kept for compatibility)
  const editMessage = useCallback((messageId: string, updates: Partial<DiscordMessage>) => {
    setVisibleMessages(prev => prev.map(msg => {
      if (msg.type === 'message' && msg.id === messageId) {
        return { ...msg, ...updates } as DiscordMessage;
      }
      return msg;
    }));
  }, []);

  // User display info
  const userName = displayName || user?.username || 'You';
  const userAvatar = user?.avatar && user?.discordId 
    ? `https://cdn.discordapp.com/avatars/${user.discordId}/${user.avatar}.png`
    : undefined;

  // Scenario data
  const categories: Category[] = [
    {
      id: 'expression',
      title: 'Express Yourself',
      description: 'Help in conversations with action commands',
      scenarios: [
        {
          id: 'hug-friend',
          title: 'Comfort a Friend',
          description: 'Use action commands to express emotions',
          channelName: 'general',
          messages: [
            {
              type: 'message',
              author: { name: 'Alex', avatarKey: 'alex-1' },
              content: "hey idk if I'm down for Fortnite today... feeling kinda down 😔",
              delay: 3000
            },
            {
              type: 'slash',
              command: '/hug users:@Alex',
              response: {
                type: 'message',
                  author: { name: 'Killua', isBot: true },
                  embed: {
                    title: '**{user}** finds a lamp with a Jinn and gets a wish. So they wish to hug **Alex**',
                    description: '-# Art by [Joedi](https://x.com/joedi___)',
                    color: '#FFB6C1',
                    image: '/simulations/hug.jpg',
                    footer: 'ⓘ This artwork has been created specifically for this bot'
                  },
                buttons: [
                  { label: 'Hug back', style: 'primary' },
                ],
                  delay: 800
              }
                },
                {
              type: 'message',
                  author: { name: 'Alex', avatarKey: 'alex-1' },
                  content: 'Aww thank you so much 🥹 that actually made me smile',
                  delay: 3000
                },
                {
              type: 'slash',
              command: '/smile',
              response: {
                type: 'message',
                  author: { name: 'Killua', isBot: true },
                embed: {
                  description: '-# GIF from anime `The Idolmaster`',
                  image: 'https://nekos.best/api/v2/smile/f8de410a-a6a3-46b3-9284-d6661c5c8c51.gif',
                  color: '#F7EADF',
                },
                delay: 800
              }
            },
            {
              type: 'system',
              content: 'Action commands work in DMs too if you install Killua to your profile!',
                  delay: 2000
            }
          ]
        },
        {
          id: 'book-rec',
          title: 'Book Recommendation',
          description: 'Use Killua to immediately pull up relevant references!',
          channelName: 'random',
          messages: [
            {
              type: 'message',
              author: { name: 'Jordan', avatarKey: 'jordan-2' },
              content: 'I am so bored... Have you read any good books lately?',
              delay: 2500
            },
            {
              type: 'message',
              author: { name: 'You', isUser: true },
              content: 'I just finished reading the newest Percy Jackson! It was amazing!',
              delay: 2500
            },
            {
              type: 'message',
              author: { name: 'Jordan', avatarKey: 'jordan-2' },
              content: 'Did a new one come out?',
              delay: 2500
            },
            {
              type: 'message',
              author: { name: 'You', isUser: true },
              content: 'Yes! Let me show you!',
              delay: 2500
            },
            {
              type: 'slash',
              command: '/novel book:Wrath of the Triple Goddess',
              response: {
                type: 'message',
              author: { name: 'Killua', isBot: true },
              embed: {
                  title: '[Wrath of the Triple Goddess](https://openlibrary.org/works/OL37833676W)',
                  description: `Percy Jackson, now a high school senior, needs three recommendation letters from the Greek gods in order to get into New Rome University. He earned his first one by retrieving Ganymede's chalice. Now the goddess Hecate has offered Percy another "opportunity"—all he has to do is pet sit her mastiff, Hecuba, and her polecat, Gale, over Halloween week while she is away. Piece of cake, right?\n\nPercy, Annabeth, and Grover settle into Hecate's seemingly endless mansion and start getting acquainted with the fussy, terrifying animals. The trio has been warned not to touch anything, but while Percy and Annabeth are out at school, Grover can't resist drinking a strawberry-flavored potion in the laboratory. It turns him into a giant frenzied goat, and after he rampages through the house, damaging everything in sight, and passes out, Hecuba and Gale escape. Now the friends have to find Hecate's pets and somehow restore the house, all before Hecate gets back on Saturday. It's going to take luck, demigod wiles, and some old and new friends to hunt down the animals and set things right again.\n\nPercy Jackson and the Olympians: The Senior Year Adventures #2`,
                  color: '#3E4A78',
                  fields: [
                    { name: 'Author', value: 'Rick Riordan' },
                    { name: 'Published', value: '2024' },
                    { name: 'Language', value: 'spa' },
                    { name: 'Editions', value: '7' },
                  ],
                  image: 'https://covers.openlibrary.org/b/id/14817460-M.jpg',
                  footer: 'Page 1/3',
                },
                buttons: [
                  { label: '', style: 'primary', emoji: '/simulations/double_arrow_left.png' },
                  { label: '', style: 'primary', emoji: '/simulations/arrow_left.png' },
                  { label: '', style: 'danger', emoji: '/simulations/bin.png' },
                  { label: '', style: 'primary', emoji: '/simulations/arrow_right.png' },
                  { label: '', style: 'primary', emoji: '/simulations/double_arrow_right.png' },
                ],
                delay: 2000
              }
            },
            {
              type: 'message',
              author: { name: 'Jordan', avatarKey: 'jordan-2' },
              content: 'Oh cool! Didn\'t they recently make a show too?',
              delay: 4000
            },
            {
              type: 'message',
              author: { name: 'You', isUser: true },
              content: 'Yes! The actor for Percy Jackson looks just like him!',
              delay: 2500
            },
            {
              type: 'slash',
              command: '/img query:Percy Jackson actor',
              response: {
                type: 'message',
              author: { name: 'Killua', isBot: true },
                embed: {
                  title: 'Results for query: Percy Jackson actor',
                  image: '/simulations/img-response.jpg',
                  color: '#3E4A78',
                  footer: 'Page 1/35 • Today at 16:20',
                },
                buttons: [
                  { label: '', style: 'primary', emoji: '/simulations/double_arrow_left.png' },
                  { label: '', style: 'primary', emoji: '/simulations/arrow_left.png' },
                  { label: '', style: 'danger', emoji: '/simulations/bin.png' },
                  { label: '', style: 'primary', emoji: '/simulations/arrow_right.png' },
                  { label: '', style: 'primary', emoji: '/simulations/double_arrow_right.png' },
                ],
                delay: 1000
              }
            },
            {
              type: 'message',
              author: { name: 'Jordan', avatarKey: 'jordan-2' },
              content: 'Wow that\'s exactly what I thought Percy Jackson looked like!',
              delay: 2500
            },
            {
              type: 'system',
              content: 'The image command is one of Killua\'s most popular commands!',
              delay: 2000
            }
          ]
        }
      ]
    },
    {
      id: 'hxh',
      title: 'Hunter x Hunter Theme',
      description: 'A Hunter x Hunter themed bot',
      scenarios: [
        {
          id: 'hunt-cards',
          title: 'Hunt for Cards',
          description: 'Collect Greed Island cards like in the anime',
          channelName: 'greed-island',
          messages: [
            {
              type: 'message',
              author: { name: 'Gon', avatarKey: 'gon-hxh', avatar: '/simulations/Gon.webp', nameColor: 'text-discord-green' },
              content: "I finally found an SS-rank card! Here check it out!",
              delay: 2500
            },
            {
              type: 'slash',
              command: '/give card',
              commandUser: {
                name: 'Gon',
                avatar: '/simulations/Gon.webp',
                avatarKey: 'gon-hxh',
                nameColor: 'text-discord-green'
              },
              response: {
                type: 'message',
              author: { name: 'Killua', isBot: true },
              content: '✉️ gave `{user}` card No. 1!',
              delay: 1000
              }
            },
            {
              type: 'message',
              author: { name: 'You', isUser: true },
              content: 'Wow, let me check it out!',
              delay: 2000
            },
            {
              type: 'slash',
              command: '/book',
              response: {
                type: 'message',
                  author: { name: 'Killua', isBot: true },
                  embed: {
                    title: '**{user}**\'s book',
                    color: '#2F3136',
                    image: '/simulations/book.png'
                  },
                  buttons: [
                    { label: '', style: 'primary', emoji: '/simulations/double_arrow_left.png' },
                    { label: '', style: 'primary', emoji: '/simulations/arrow_left.png' },
                    { label: '', style: 'danger', emoji: '/simulations/bin.png' },
                    { label: '', style: 'primary', emoji: '/simulations/arrow_right.png' },
                    { label: '', style: 'primary', emoji: '/simulations/double_arrow_right.png' },
                  ],
                  delay: 1000
              }
                },
                {
              type: 'message',
                  author: { name: 'Bisky', avatarKey: 'bisky-hxh', avatar: '/simulations/Bisky.webp', nameColor: 'text-discord-red' },
                  content: 'Ohhh that\'s "Patch of Forest"!',
                  typing: true,
                  typingDuration: 1500,
                  delay: 2000
                },
                {
              type: 'message',
                  author: { name: 'Genthru', avatarKey: 'genthru-hxh', avatar: '/simulations/Genthru.webp', nameColor: 'text-blue-400'  },
                  content: 'Look what we have here!',
                  typing: true,
                  typingDuration: 1500,
                  delay: 2500
            },
            {
              type: 'slash',
              command: '/use card:Thief',
              commandUser: {
                name: 'Genthru',
                avatar: '/simulations/Genthru.webp',
                avatarKey: 'genthru-hxh',
                nameColor: 'text-blue-400'
              },
              response: {
                type: 'message',
                  author: { name: 'Killua', isBot: true },
                  content: 'Successfully stole card `Patch of Forest` from `{user}`!',
                  delay: 1000
              }
                },
                {
              type: 'message',
                  author: { name: 'Gon', avatarKey: 'gon-hxh', avatar: '/simulations/Gon.webp', nameColor: 'text-discord-green' },
                  content: 'Wait, what? That\'s my card! We need to go after him!',
                  typing: true,
                  typingDuration: 1500,
                  delay: 2500
            },
            {
              type: 'system',
              content: 'Collect over 100 cards and spells from the anime on the journey to fill your restricted slots!',
              delay: 2000
            }
          ]
        },
        {
          id: 'hunt-cards-2',
          title: 'Hunt for Cards: Part 2',
          description: 'Use spells to your advantage',
          channelName: 'greed-island',
          messages: [
            {
              type: 'message',
              author: { name: 'Gon', avatarKey: 'gon-hxh', avatar: '/simulations/Gon.webp', nameColor: 'text-discord-green' },
              content: (state) => {
                return `@${state.user} you've been hunting for a while, go collect your rewards!`;
              },
              delay: 2500
            },
            {
              type: 'slash',
              command: '/hunt option:end',
              response: {
                type: 'message',
                author: { name: 'Killua', isBot: true },
                embed: {
                  title: 'Hunt returned!',
                  color: '#3E4A78',
                  description: 'You started hunting `7 days ago`. You brought back the following items:\n\n5x **Hyper Puffball** :card_number_673:\n2x **Melanin Lizard** :card_number_697:\n1x **Mug** :card_number_1021:',
                },
                delay: 1000
              }
            },
            {
              type: 'message',
              author: { name: 'Bisky', avatarKey: 'bisky-hxh', avatar: '/simulations/Bisky.webp', nameColor: 'text-discord-red' },
              content: 'No way! You got Mug! We\'re finally ready to get back Gon\'s card!',
              delay: 2000
            },
            {
              type: 'message',
              author: { name: 'Gon', avatarKey: 'gon-hxh', avatar: '/simulations/Gon.webp', nameColor: 'text-discord-green' },
              content: 'Nice! Maybe buy a protection card first though...',
              delay: 2000
            },
            {
              type: 'slash',
              command: '/sell sell_opt:monsters',
              response: {
                type: 'message',
                id: 'sell-monsters',
                author: { name: 'Killua', isBot: true },
                embed: {
                  description: 'You will receive 410 Jenny for selling all monster cards, do you want to proceed?',
                  buttons: [
                    { label: 'confirm', style: 'success', requiresInput: true, featured: true, callback: (helpers) => { helpers.resume() } },
                    { label: 'cancel', style: 'danger', requiresInput: true },
                  ],
                },
                delay: 1000
              }
            },
            {
              type: 'edit',
              messageId: 'sell-monsters',
              updates: { embed: { 
                description: 'You will receive 410 Jenny for selling all monster cards, do you want to proceed?',
                buttons: [
                  { label: 'confirm', style: 'success', disabled: true },
                  { label: 'cancel', style: 'danger', disabled: true },
                ],
              } },
              delay: 0
            },
            {
              type: 'message',
              author: { name: 'Killua', isBot: true },
              content: 'You sold all your monsters for 410 Jenny!',
              delay: 1000
            },
            {
              type: 'message',
              author: { name: 'Gon', avatarKey: 'gon-hxh', avatar: '/simulations/Gon.webp', nameColor: 'text-discord-green' },
              content: 'Lets check if you have enough Jenny to buy a protection card...',
              delay: 2000
            },
            {
              type: 'slash',
              command: '/jenny',
              commandUser: {
                name: 'Gon',
                avatar: '/simulations/Gon.webp',
                avatarKey: 'gon-hxh',
                nameColor: 'text-discord-green'
              },
              response: {
                type: 'message',
                author: { name: 'Killua', isBot: true },
                content: (state) => {
                  return `${state.user}'s balance is 2641 Jenny`;
                },
                delay: 1000
              }
            },
            {
              type: 'message',
              author: { name: 'Bisky', avatarKey: 'bisky-hxh', avatar: '/simulations/Bisky.webp', nameColor: 'text-discord-red' },
              content: 'That should be enough! Buy card No. 1003, I think it\'s in the shop right now.',
              delay: 1000
            },
            {
              type: 'slash',
              command: '/buy card:1003',
              response: {
                type: 'message',
                author: { name: 'Killua', isBot: true },
                content: 'Successfully bought card number `1003` :card_number_1003: for 2500 Jenny. Check it out in your inventory with `k!book`!',
                delay: 1000
              }
            },
            {
              type: 'message',
              author: { name: 'Gon', avatarKey: 'gon-hxh', avatar: '/simulations/Gon.webp', nameColor: 'text-discord-green' },
              content: 'Lets go get our card back!',
              typing: true,
              typingDuration: 1500,
              delay: 2500
            },
            {
              type: 'divider',
              content: 'In a mutual server with Genthru...',
              delay: 2000
            },
            {
              type: 'message',
              author: { name: 'Bisky', avatarKey: 'bisky-hxh', avatar: '/simulations/Bisky.webp', nameColor: 'text-discord-red' },
              content: 'Hey @Genthru, are you enjoying that card?',
              delay: 2000
            },
            {
              type: 'message',
              author: { name: 'Genthru', avatarKey: 'genthru-hxh', avatar: '/simulations/Genthru.webp', nameColor: 'text-blue-400'  },
              content: 'Yeah very much 😏. Are you still salty about that?',
              delay: 2500
            },
            {
              type: 'message',
              author: { name: 'Gon', avatarKey: 'gon-hxh', avatar: '/simulations/Gon.webp', nameColor: 'text-discord-green' },
              content: (state) => {
                return `Now @${state.user}!`;
              },
              delay: 2000
            },
            {
              type: 'slash',
              command: '/use card:Mug target:@Genthru args:1',
              response: {
                type: 'message',
                author: { name: 'Killua', isBot: true },
                content: 'Stole card number 1 successfully!',
                delay: 1000
              }
            },
            {
              type: 'message',
              author: { name: 'Genthru', avatarKey: 'genthru-hxh', avatar: '/simulations/Genthru.webp', nameColor: 'text-blue-400'  },
              content: 'Hey!',
              delay: 1000
            },
            {
              type: 'message',
              author: { name: 'Gon', avatarKey: 'gon-hxh', avatar: '/simulations/Gon.webp', nameColor: 'text-discord-green' },
              content: 'We got him!',
              delay: 1000
            },
            {
              type: 'message',
              author: { name: 'Genthru', avatarKey: 'genthru-hxh', avatar: '/simulations/Genthru.webp', nameColor: 'text-blue-400'  },
              content: 'Not so fast!',
              delay: 1000
            },
            {
              type: 'slash',
              command: '/use card:Mug',
              commandUser: {
                name: 'Genthru',
                avatar: '/simulations/Genthru.webp',
                avatarKey: 'genthru-hxh',
                nameColor: 'text-blue-400'
              },
              response: {
                type: 'message',
                id: 'defend-spell',
                author: { name: 'Killua', isBot: true },
                content: (state) => {
                  return `@${state.user} Genthru has used the spell \`1021\` on you! You have 1 spell to defend yourself. You can either choose one of them to defend yourself with or let the attack go through`;
                },
                select: {
                  id: 'defend-spell',
                  options: [
                    { label: 'Defensive Wall', value: '1003', emoji: '/simulations/emoji/card_number_1003.png' },
                  ],
                  callback: (_, helpers) => {
                    helpers.resume();
                  },
                  requiresInput: true,
                  featured: true
                },
                buttons: [
                  { label: "Ignore", style: 'danger', requiresInput: true },
                ],
                delay: 1000
              }
            },
            {
              type: 'edit',
              messageId: 'defend-spell',
              updates: { buttons: [
                { label: 'Ignore', style: 'danger', disabled: true },
              ],
              select: {
                id: 'defend-spell',
                options: [
                  { label: 'Defensive Wall', value: '1003', emoji: '/simulations/emoji/card_number_1003.png' },
                ], disabled: true,
                callback: () => {}
              } },
              delay: 0
            },
            {
              type: 'message',
              author: { name: 'Killua', isBot: true },
              content: (state) => {
                return `@${state.user} successfully defended against your attack`;
              },
              delay: 1000
            },
            {
              type: 'message',
              author: { name: 'Genthru', avatarKey: 'genthru-hxh', avatar: '/simulations/Genthru.webp', nameColor: 'text-blue-400'  },
              content: 'What??!!',
              delay: 1000
            },
            {
              type: 'message',
              author: { name: 'Gon', avatarKey: 'gon-hxh', avatar: '/simulations/Gon.webp', nameColor: 'text-discord-green' },
              content: 'Nice!',
              delay: 1000
            },
            {
              type: 'message',
              author: { name: 'Bisky', avatarKey: 'bisky-hxh', avatar: '/simulations/Bisky.webp', nameColor: 'text-discord-red' },
              content: 'Better luck next time Genthru!',
              delay: 2500
            },
            {
              type: 'divider',
              content: 'Back in the private server...',
              delay: 2500
            },
            {
              type: 'message',
              author: { name: 'Gon', avatarKey: 'gon-hxh', avatar: '/simulations/Gon.webp', nameColor: 'text-discord-green' },
              content: (args) => {
                return `That was awesome @${args.user}! Can I have my card back?`;
              },
              delay: 2500
            },
            {
              type: 'slash',
              command: '/give card:1 target:@Gon',
              response: {
                type: 'message',
                author: { name: 'Killua', isBot: true },
                content: '✉️ gave `Gon` card No. 1!',
                delay: 1000
              }
            },
            {
              type: 'message',
              author: { name: 'Gon', avatarKey: 'gon-hxh', avatar: '/simulations/Gon.webp', nameColor: 'text-discord-green' },
              content: 'Thank you!',
              delay: 1500
            },
            {
              type: 'system',
              content: 'Get started with the Greed Island game by using k!use booklet',
              delay: 2000
            }
          ]
        }
      ]
    },
    {
      id: 'activity',
      title: 'Boost Server Activity',
      description: 'Engage your community',
      scenarios: [
        {
          id: 'conversation-starter',
          title: 'Conversation Starter',
          description: 'Use Killua to revive chat with conversation starters!',
          channelName: 'general',
          messages: [
            {
              type: 'message',
              author: { name: 'July', avatarKey: 'july' },
              content: 'Dead chat 💀',
              delay: 2500
            },
            {
              type: 'message',
              author: { name: 'You', isUser: true },
              content: 'I know just the thing :)',
              delay: 2000
            },
            {
              type: 'slash',
              command: '/topic',
              response: {
                type: 'message',
              author: { name: 'Killua', isBot: true },
                before: (_, helpers) => {
                  const topics = [
                    "What's the strangest dream you've had recently?",
                    "What's the best thing you've ever bought off Amazon?",
                    "What song do you wish you could put on right now?",
                    "What do you think is the best show on Netflix right now?",
                  ]
                  const responses = [
                    [
                      "Insane timing I just woke up! I dreamed I was a cat!",
                      "lmao I sometimes dream I am a bird, it's like a recurring dream!",
                      "Your dreams at least make sense, I recently dreamt I was Dwayne the Rock Johnson and got married to a Dolphin 😭",
                      "💀💀💀",
                      "Is Josh ok??"
                    ],
                    [
                      "I finally caved an bought a Labubu 😔. Sorry you had to find out this way 🥀",
                      "🥀🥀🥀",
                      "I bought the new MX Master mouse and it is sooooo comfortable",
                      "Oh sick I have been thinking about getting that one for a while now",
                      "Should Leo buy one?"
                    ],
                    [
                      "\"Some Nights\" by Fun. would go CRAZY right now",
                      "omg I forgot about that song! Let me add that to my playlist",
                      "Honestly anything from Coldplay would hit the spot rn",
                      "Hmmmm maybe I'll listen to some Coldplay",
                      "Should Leo listen to some Coldplay?"
                    ],
                    [
                      "It's GOTTA be \"Adolescence\" that show was phenomenal",
                      "I just watched the finale and I cried my eyes out oml",
                      "I could honestly watch it again right now",
                      "I heard so many good things about it, I need to watch it",
                      "Should we watch it together?"
                    ]
                  ]
                  const index = Math.floor(Math.random() * topics.length);
                  const randomTopic = topics[index];
                  const specificResponses = responses[index];
                  helpers.setSharedState('topic', randomTopic);
                  helpers.setSharedState('responses', specificResponses);
                  helpers.resume();
                },
                content: (state) => {
                  return `${state.topic}`;
                },
                delay: 1000
              }
            },
            {
              type: 'message',
              author: { name: 'You', isUser: true },
              content: '@[chat revive] what do you think?',
              delay: 2000
            },
            {
              type: 'message',
              author: { name: 'Bri', avatarKey: 'bri' },
              content: (state) => {
                return `${state.responses[0]}`;
              },
              delay: 2000
            },
            {
              type: 'message',
              author: { name: 'Freddy', avatarKey: 'freddy' },
              content: (state) => {
                return `${state.responses[1]}`;
              },
              delay: 3000
            },
            {
              type: 'message',
              author: { name: 'Josh', avatarKey: 'josh' },
              content: (state) => {
                return `${state.responses[2]}`;
              },
              delay: 3000
            },
            {
              type: 'message',
              author: { name: 'Leo', avatarKey: 'leo' },
              content: (state) => {
                return `${state.responses[3]}`;
              },
              delay: 3000
            },
            {
              type: 'message',
              author: { name: 'You', isUser: true },
              content: 'Let\'s ask Killua about this',
              delay: 3000
            },
            {
              type: 'slash',
              command: (state) => {
                return `/8ball question:${state.responses[4]}`;
              },
              response: {
                type: 'message',
              author: { name: 'Killua', isBot: true },
              embed: {
                  title: '8ball has spoken 🎱 ',
                  color: '#3E4A78',
                  description: (state) => {
                    const ballResponses = [
                      "What would jesus do?",
                      "My sources say no but my heart says yes",
                      "⚠ 8ball.exe has stopped responding",
                      "You are kidding, right?",
                      "Did you ask your mom?",
                    ]
                    const randomResponse = ballResponses[Math.floor(Math.random() * ballResponses.length)];
                    return `You asked:\n\`\`\`\n${state.responses[4]}\n\`\`\`\nMy answer is:\n\`\`\`\n${randomResponse}\n\`\`\`\n`;
                  },
                  footer: {
                    text: 'Asked by {user}',
                    icon: (state) => ({
                      colorKey: 'user',
                      src: state.userAvatar
                    })
                  },
                },
                delay: 1000
              }
            },
            {
              type: 'message',
              author: { name: 'Bri', avatarKey: 'bri' },
              content: '💀💀💀',
              delay: 3000
            },
            {
              type: 'message',
              author: { name: 'Leo', avatarKey: 'leo' },
              content: 'What does that even mean 😭',
              delay: 3000
            },
            {
              type: 'system',
              content: 'The topic command contains over 100 hand-selected conversation starters!',
              delay: 2000
            }
          ]
        }
      ]
    },
    { 
      id: 'shitpost',
      title: 'Perfect Shitposting',
      description: 'Image manipulation & memes',
      scenarios: [
        {
          id: 'image-chain',
          title: 'Image Chain',
          description: 'Play with images, chaining effects',
          channelName: 'memes',
          messages: [
            {
              type: 'message',
              author: { name: 'Rick Astley', avatar: '/simulations/RickAstley.png' },
              content: "Hey guys check out this link: [https://www.youtube.com/watch?v=dQw4w9WgXcQ](https://www.youtube.com/watch?v=dQw4w9WgXcQ)",
              delay: 2500
            },
            {
              type: 'slash',
              command: '/jpeg user:@Rick Astley',
              response: {
                type: 'message',
              author: { name: 'Killua', isBot: true },
              image: '/simulations/jpeg.png', // ironic filename lol
              delay: 1200
              }
            },
            {
              type: 'message',
              author: { name: 'Rick Astley', avatar: '/simulations/RickAstley.png' },
              content: "Oh no...",
              delay: 2000
            },
            {
              type: 'slash',
              command: '/lego',
              response: {
                type: 'message',
                  author: { name: 'Killua', isBot: true },
                  image: '/simulations/lego.png',
                  delay: 1200
                }
            },
            {
              type: 'slash',
              command: '/flag type:gay',
              response: {
                type: 'message',
                  author: { name: 'Killua', isBot: true },
                  image: '/simulations/flag.png',
                  delay: 1200
                }
            },
            {
              type: 'slash',
              command: '/nokia',
              response: {
                type: 'message',
                  author: { name: 'Killua', isBot: true },
                  image: '/simulations/nokia.png',
                  delay: 1200
                }
            },
            {
              type: 'slash',
              command: '/spin',
              response: {
                type: 'message',
                  author: { name: 'Killua', isBot: true },
                  image: '/simulations/spin.gif',
                  delay: 1200
              }
                },
                {
              type: 'message',
                  author: { name: 'Rick Astley', avatar: '/simulations/RickAstley.png' },
                  content: "Now you've done it... I will definitely give you up now...",
                  delay: 2000
                },
                {
              type: 'system',
                  content: 'Image manipulation commands can easily be chained and use the last image in chat by default!',
                  delay: 2000
            }
          ]
        },
        {
          id: 'text-manipulation',
          title: 'Text Manipulation',
          description: 'Turn text into all kinds of fun things',
          channelName: 'gaming',
          messages: [
            {
              type: 'message',
              author: { name: 'Rebecca', avatarKey: 'rebecca' },
              content: 'Hey, did anyone see the new GTA IV leaks?',
              delay: 2000
            },
            {
              type: 'slash',
              command: '/uwufy text:Hey, did anyone see the new GTA IV leaks?',
              response: {
                type: 'message',
                author: { name: 'Killua', isBot: true },
                content: 'H-Hey ✧w✧, did a-anyone see the new G-GTA weaks? ʕ º ᴥ ºʔ',
                delay: 1000
              }
            },
            {
              type: 'message',
              author: { name: 'Rebecca', avatarKey: 'rebecca' },
              content: 'Oh come on 😭',
              delay: 2000
            },
            {
              type: 'slash',
              command: '/thonkify text:Oh come on',
              response: {
                type: 'message',
                author: { name: 'Killua', isBot: true },
                image: '/simulations/thonkify.png',
                delay: 1000
              }
            },
            {
              type: 'message',
              author: { name: 'Rebecca', avatarKey: 'rebecca' },
              content: 'Why are you doing this to meeeee???',
              delay: 2000
            },
            {
              type: 'slash',
              command: '/sonic text:Why are you doing this to meeeee???',
              response: {
                type: 'message',
                author: { name: 'Killua', isBot: true },
                image: '/simulations/sonic.png',
                delay: 1000
              }
            },
            {
              type: 'message',
              author: { name: 'Rebecca', avatarKey: 'rebecca' },
              content: '💀💀 let me respond in your language',
              delay: 2000
            },
            {
              type: 'slash',
              command: '/wtf',
              commandUser: {
                name: 'Rebecca',
                avatarKey: 'rebecca'
              },
              response: {
                type: 'message',
                author: { name: 'Killua', isBot: true },
                image: '/simulations/wtf.png',
                delay: 1000
              }
            },
            {
              type: 'slash',
              command: '/sonic text:Now we\'re talking...',
              response: {
                type: 'message',
                author: { name: 'Killua', isBot: true },
                image: '/simulations/sonic2.png',
                delay: 1000
              }
            },
            {
              type: 'system',
              content: 'Why should you say something if Sonic can say it for you?',
              delay: 2000
            }
          ]
        }
      ]
    },
    {
      id: 'games',
      title: 'Games with Friends',
      description: 'Single and multiplayer games',
      scenarios: [
        {
          id: 'rps',
          title: 'Rock Paper Scissors',
          description: 'Challenge friends to quick games',
          channelName: 'games',
          messages: [
            {
              type: 'message',
              id: 'rps-person-claim',
              author: { name: 'Alex', avatarKey: 'person-rps' },
              content: 'My mind games at Rock Paper Scissors are unbeatable',
              delay: 2500
            },
            {
              type: 'message',
              id: 'rps-user-prove',
              author: { name: 'You', isUser: true },
              content: 'Prove it',
              delay: 2000
            },
            {
              type: 'slash',
              command: '/rps opponent:@Alex',
              response: {
                type: 'message',
                id: 'rps-challenge',
                author: { name: 'Killua', isBot: true },
                content: '**{user}** challenges **Alex** to Rock Paper Scissors. Do you accept?',
                buttons: [
                  { 
                    label: 'Accept', 
                    style: 'success'
                  },
                  { 
                    label: 'Deny', 
                    style: 'danger' 
                  }
                ],
                delay: 1000
              }
            },
            {
              type: 'message',
              id: 'rps-person-response',
              author: { name: 'Alex', avatarKey: 'person-rps' },
              content: "Lets see what you got! I bet you will choose Rock!",
              delay: 2000
            },
            {
              type: 'edit',
              messageId: 'rps-challenge',
              updates: {
                edited: true,
                buttons: [
                  { label: 'Accept', style: 'success', disabled: true },
                  { label: 'Deny', style: 'danger', disabled: true }
                ]
              },
              delay: 1000
            },
            {
              type: 'message',
              id: 'rps-accepted',
              author: { name: 'Killua', isBot: true },
              embed: {
                title: (state) => {
                  const user = state.user || 'You';
                  return `**${user}** against **Alex**: Rock.. Paper... Scissors...!`;
                },
                image: '/simulations/rps.gif',
                color: '#5865F2'
              },
              delay: 1000
            },
            {
              type: 'divider',
              channel: { type: 'dm', name: 'Killua' },
              delay: 2000
            },
            {
              type: 'message',
              id: 'rps-select',
              author: { name: 'Killua', isBot: true },
              content: 'You chose to play Rock Paper Scissors, what\'s your choice hunter?',
              select: {
                id: 'rps-choice',
                placeholder: 'Select your choice...',
                options: [
                  { label: 'Rock', value: 'rock', emoji: '🗿' },
                  { label: 'Paper', value: 'paper', emoji: '📄' },
                  { label: 'Scissors', value: 'scissors', emoji: '✂️' }
                ],
                callback: (value, helpers) => {
                  // Store choice in shared state
                  helpers.setSharedState('userChoice', value);
                  
                  // Calculate opponent choice and store
                  const choices = ['rock', 'paper', 'scissors'];
                  const opponentChoice = choices[Math.floor(Math.random() * choices.length)];
                  helpers.setSharedState('opponentChoice', opponentChoice);
                  
                  // Determine winner
                  let winner: 'user' | 'opponent' | 'tie';
                  if (value === opponentChoice) {
                    winner = 'tie';
                  } else if (
                    (value === 'rock' && opponentChoice === 'scissors') ||
                    (value === 'paper' && opponentChoice === 'rock') ||
                    (value === 'scissors' && opponentChoice === 'paper')
                  ) {
                    winner = 'user';
                  } else {
                    winner = 'opponent';
                  }
                  helpers.setSharedState('winner', winner);
                  
                  // Resume execution to continue with result messages
                  helpers.resume();
                },
                requiresInput: true
              },
              delay: 1200
            },
            {
              type: 'edit',
              messageId: 'rps-select',
              updates: {
                edited: true,
                select: {
                  id: 'rps-choice',
                  placeholder: 'Choose your move...',
                  options: [
                    { label: 'Rock', value: 'rock', emoji: '🗿' },
                    { label: 'Paper', value: 'paper', emoji: '📄' },
                    { label: 'Scissors', value: 'scissors', emoji: '✂️' }
                  ],
                  disabled: true,
                  callback: () => {}
                }
              },
              delay: 0
            },
            {
              type: 'divider',
              channel: { type: 'channel', name: 'games' },
              delay: 500
            },
            {
              type: 'message',
              id: 'rps-result',
              author: { name: 'Killua', isBot: true },
              content: (state) => {
                const userChoice = state.userChoice || 'rock';
                const opponentChoice = state.opponentChoice || 'rock';
                const winner = state.winner || 'tie';
                
                // Emoji mapping
                const emojiMap: { [key: string]: string } = {
                  'rock': '🗿',
                  'paper': '📄',
                  'scissors': '✂️'
                };
                
                const userEmoji = emojiMap[userChoice] || '🗿';
                const opponentEmoji = emojiMap[opponentChoice] || '🗿';
                
                if (winner === 'tie') {
                  return `${userEmoji} = ${opponentEmoji}: It's a tie! @{user} @Alex`;
                } else if (winner === 'user') {
                  return `${userEmoji} > ${opponentEmoji}: @{user} won against @Alex!`;
                } else {
                  return `${userEmoji} < ${opponentEmoji}: @Alex won against @{user}!`;
                }
              },
              buttons: [
                { label: 'Play Again', style: 'secondary' },
              ],
              delay: 1000
            },
            {
              type: 'message',
              id: 'rps-person-final',
              author: { name: 'Alex', avatarKey: 'person-rps' },
              content: (state) => {
                const winner = state.winner || 'tie';
                if (winner === 'opponent') {
                  return "Hah told you! Better luck next time!";
                } else if (winner === 'user') {
                  return "No way... Guess I have to train some more 🫡";
                } else {
                  return "A tie? Well, that's unexpected. Rematch?";
                }
              },
              delay: 2500
            },
            {
              type: 'system',
              content: 'You can also play Rock Paper Scissors against Killua if no one is available to play with you!',
              delay: 2000
            }
              ]
        },
        {
          id: 'trivia',
          title: 'Trivia Challenge',
          description: 'Test your knowledge with random trivia questions',
          channelName: 'games',
          messages: [
            {
              type: 'message',
              id: 'trivia-intro',
              author: { name: 'You', isUser: true },
              content: 'I am SO bored 😩😩😩',
              delay: 2000
            },
            {
              type: 'message',
              author: { name: 'Josh', avatarKey: 'josh' },
              content: 'Didn\'t you get last place last time we played trivia in vc?',
              delay: 3000
            },
            {
              type: 'message',
              author: { name: 'You', isUser: true },
              content: 'Yeah... 😳',
              delay: 3000
            },
            {
              type: 'message',
              author: { name: 'Josh', avatarKey: 'josh' },
              content: 'Well, you could practice your trivial skills then!',
              delay: 3000
            },
            {
              type: 'slash',
              command: '/trivia',
              response: {
                type: 'message',
                id: 'trivia-question',
                author: { name: 'Killua', isBot: true },
                before: async (_, helpers) => {
                  // Trivia categories
                  const categories = {
                    "Random": 0,
                    "General Knowledge": 9,
                    "Books": 10,
                    "Film": 11,
                    "Music": 12,
                    "Musicals & Theatres": 13,
                    "Television": 14,
                    "Video Games": 15,
                    "Board Games": 16,
                    "Science & Nature": 17,
                    "Computers": 18,
                    "Mathematics": 19,
                    "Mythology": 20,
                    "Sports": 21,
                    "Geography": 22,
                    "History": 23,
                    "Politics": 24,
                    "Art": 25,
                    "Celebrities": 26,
                    "Animals": 27,
                    "Vehicles": 28,
                    "Comics": 29,
                    "Gadgets": 30,
                    "Japanese Anime & Manga": 31,
                    "Cartoon & Animations": 32,
                  };
                  
                  const difficulties = ["easy", "medium", "hard"];
                  
                  // Pick random category and difficulty
                  const categoryKeys = Object.keys(categories);
                  const randomCategory = categoryKeys[Math.floor(Math.random() * categoryKeys.length)];
                  const categoryId = categories[randomCategory as keyof typeof categories];
                  const randomDifficulty = difficulties[Math.floor(Math.random() * difficulties.length)];
                  
                  // Fetch question from API
                  const categoryParam = categoryId === 0 ? '' : `&category=${categoryId}`;
                  const apiUrl = `https://opentdb.com/api.php?amount=1&difficulty=${randomDifficulty}&type=multiple${categoryParam}`;
                  
                  try {
                    const response = await fetch(apiUrl);
                    const data = await response.json();
                    
                    if (data.results && data.results.length > 0) {
                      const question = data.results[0];
                      
                      // Decode HTML entities
                      const decodeHtml = (html: string) => {
                        const txt = document.createElement("textarea");
                        txt.innerHTML = html;
                        return txt.value;
                      };
                      
                      const questionText = decodeHtml(question.question);
                      const correctAnswer = decodeHtml(question.correct_answer);
                      const incorrectAnswers = question.incorrect_answers.map((ans: string) => decodeHtml(ans));
                      
                      // Shuffle answers
                      const allAnswers = [correctAnswer, ...incorrectAnswers];
                      const shuffled = allAnswers.sort(() => Math.random() - 0.5);
                      
                      // Store in state
                      helpers.setSharedState('triviaQuestion', questionText);
                      helpers.setSharedState('triviaCategory', randomCategory);
                      helpers.setSharedState('triviaDifficulty', randomDifficulty);
                      helpers.setSharedState('triviaCorrectAnswer', correctAnswer);
                      helpers.setSharedState('triviaAnswers', shuffled);
                    }
                  } catch (error) {
                    console.error('Failed to fetch trivia question:', error);
                    // Fallback values
                    helpers.setSharedState('triviaQuestion', 'What is the capital of France?');
                    helpers.setSharedState('triviaCategory', 'Geography');
                    helpers.setSharedState('triviaDifficulty', 'easy');
                    helpers.setSharedState('triviaCorrectAnswer', 'Paris');
                    helpers.setSharedState('triviaAnswers', ['Paris', 'London', 'Berlin', 'Madrid']);
                  }
                },
                embed: {
                  title: (state) => {
                    const category = state.triviaCategory || 'Random';
                    return `Trivia of category: ${category}`;
                  },
                  description: (state) => {
                    const question = state.triviaQuestion || 'Loading question...';
                    const difficulty = state.triviaDifficulty || 'easy';
                    return `**Difficulty:** ${difficulty}\n\n**Question:**\n${question}`;
                  },
                  color: '#5865F2',
                },
                select: {
                  id: 'trivia-answer',
                  placeholder: 'Select your answer...',
                  options: (state) => {
                    const answers = state.triviaAnswers || [];
                    return answers.map((answer: string) => ({
                      label: answer,
                      value: answer,
                    }));
                  },
                  callback: (value, helpers) => {
                    const correctAnswer = helpers.getSharedState('triviaCorrectAnswer');
                    const isCorrect = value === correctAnswer;
                    
                    helpers.setSharedState('triviaUserAnswer', value);
                    helpers.setSharedState('triviaIsCorrect', isCorrect);
                    helpers.resume();
                  },
                  requiresInput: true
                },
                delay: 1000
              }
            },
            {
              type: 'edit',
              messageId: 'trivia-question',
              updates: {
                edited: true,
                select: {
                  id: 'trivia-answer',
                  placeholder: 'Select your answer...',
                  options: (state) => {
                    const answers = state.triviaAnswers || [];
                    return answers.map((answer: string) => ({
                      label: answer,
                      value: answer,
                    }));
                  },
                  disabled: true,
                  callback: () => {}
                }
              },
              delay: 0
            },
            {
              type: 'message',
              id: 'trivia-result',
              author: { name: 'Killua', isBot: true },
              content: (state) => {
                const isCorrect = state.triviaIsCorrect;
                const correctAnswer = state.triviaCorrectAnswer;
                const answerIndex = state.triviaAnswers.indexOf(correctAnswer);
                const randomRewardNumber = Math.floor(Math.random() * 5) + 6;
                return isCorrect 
                  ? `Correct! Here are ${randomRewardNumber} Jenny as a reward!`
                  : `Sadly not the right answer! The answer was ${answerIndex + 1}) **${correctAnswer}**`;
              },
              buttons: [
                { label: 'Play Again', style: 'secondary' },
              ],
              delay: 500
            },
            {
              type: 'message',
              author: { name: 'Josh', avatarKey: 'josh' },
              content: (state) => {
                const isCorrect = state.triviaIsCorrect;
                return isCorrect 
                  ? 'Well done! You\'re getting better at this!' 
                  : 'Guess you gotta keep practicing!';
              },
              delay: 3000
            },
            {
              type: 'system',
              content: 'You can also play Trivia against other users, just like Rock Paper Scissors!',
              delay: 2000
            }
          ]
        }
      ]
    },
    {
      id: 'organize',
      title: 'Organization & Tasks',
      description: 'Manage tasks on Discord',
      scenarios: [
        {
          id: 'todo-lists',
          title: 'Todo Lists',
          description: 'Create and manage todo lists',
          channelName: 'general',
          messages: [
            {
              type: 'message',
              author: { name: 'Nico', avatarKey: 'nico' },
              content: (state) => {
                return `Hey @${state.user} when are you finally gonna configure a level bot?`;
              },
              delay: 2500
            },
            {
              'type': 'message',
              author: { name: 'You', isUser: true },
              content: 'My bad, I forgot again! Let me finally add it to my todo list!',
              delay: 2500
            },
            {
              'type': 'slash',
              command: '/todo edit list_id:cool-server-todos',
              response: {
                type: 'message',
                author: { name: 'Killua', isBot: true },
                content: 'You are now in editor mode for todo list \'ToDos for Cool Server\'!',
                delay: 1000
              }
            },
            {
              'type': 'slash',
              command: '/todo add text:Configure level bot',
              response: {
                type: 'message',
                author: { name: 'Killua', isBot: true },
                content: 'Great! Added "Configure level bot" to your todo list!',
                delay: 1000
              }
            },
            {
              'type': 'message',
              author: { name: 'Nico', avatarKey: 'nico' },
              content: 'Awesome thanks! Is this list public?',
              delay: 2500
            },
            {
              'type': 'message',
              author: { name: 'You', isUser: true },
              content: 'It\'s private but if you want I can invite you as a viewer',
              delay: 2500
            },
            {
              'type': 'message',
              author: { name: 'Nico', avatarKey: 'nico' },
              content: 'That would be great!',
              delay: 2500
            },
            {
              'type': 'slash',
              command: '/todo invite user:@Nico role:viewer',
              response: {
                type: 'message',
                author: { name: 'Killua', isBot: true },
                content: 'Successfully send the invitation to the specified user! They have 24 hours to accept or deny',
                delay: 1000
              }
            },
            {
              'type': 'message',
              author: { name: 'Nico', avatarKey: 'nico' },
              content: 'Thanks! I just got a dm!',
              delay: 2500
            },
            {
              'type': 'divider',
              channel: { type: 'dm', name: 'Killua' },
              delay: 2500
            },
            {
              'type': 'message',
              author: { name: 'Killua', isBot: true },
              content: 'Nico accepted your invitation to your todo list `ToDos for Cool Server`!',
              delay: 2500
            },
            {
              'type': 'divider',
              channel: { type: 'channel', name: 'general' },
              delay: 2500
            },
            {
              'type': 'message',
              author: { name: 'Nico', avatarKey: 'nico' },
              content: 'I accepted! Let me try to see the list!',
              delay: 2500
            },
            {
              'type': 'slash',
              command: '/todo view list_id:cool-server-todos',
              commandUser: { name: 'Nico', avatarKey: 'nico' },
              response: {
                type: 'message',
                author: { name: 'Killua', isBot: true },
                embed: {
                  title: 'To-do list "ToDos for Cool Server" (ID: 852031)',
                  description: '1) Plan to overthrow the owner\n`Marked as high priority`\n2) Kick annoying users\n3) Configue level bot',
                  color: '#5865F2',
                },
                delay: 1000
              }
            },
            {
              'type': 'message',
              author: { name: 'Nico', avatarKey: 'nico' },
              content: 'Cool! What\'s that number 1 on your todo list...?',
              delay: 2500
            },
            {
              'type': 'slash',
              command: '/todo remove todo_id:1',
              response: {
                type: 'message',
                author: { name: 'Killua', isBot: true },
                content: 'You removed todo number 1 successfully',
                delay: 1000
              }
            },
            {
              'type': 'message',
              author: { name: 'You', isUser: true },
              content: 'You saw nothing 👀',
              delay: 2500
            },
            {
              'type': 'system',
              content: 'ToDo lists are one of Killua\'s most powerful features! You can even customize embed color and images!',
              delay: 2500
            }
          ]
        },
      {
        id: 'tags',
        title: 'Tags',
        description: 'Create and manage tags to store information',
        channelName: 'jeremy',
        messages: [
          {
            type: 'message',
            author: { name: 'Will', avatarKey: 'will' },
            content: 'Hey I am new here! Why is this channel called jeremy?',
            delay: 2500
          },
          {
            type: 'message',
            author: { name: 'Jeremy', avatarKey: 'jeremy' },
            content: 'I ain\'t typing the entire Jeremy lore out again!',
            delay: 2500
          },
          {
            type: 'message',
            author: { name: 'You', isUser: true },
            content: 'I have an idea! Let\'s create a tag for the Jeremy lore!',
            delay: 2500
          },
          {
            type: 'slash',
            id: 'create-jeremy-lore-tag-command',
            command: '/tag create name:Jeremy lore',
            response: {
              type: 'message',
              author: { name: 'Killua', isBot: true },
              content: 'What should the description of the tag be?',
              delay: 1000
            }
          },
          {
            type: 'message',
            id: 'jeremy-lore-description',
            author: { name: 'You', isUser: true },
            content: 'Jeremy would not shut up about wanting his own channel so after sending a message about it EVERY. SINGLE. DAY. he finally got his wish on the one year anniversary!',
            delay: 2500
          },
          {
            type: 'delete',
            messageId: ['create-jeremy-lore-tag-command', 'jeremy-lore-description'],
            delay: 2000
          },
          {
            type: 'message',
            author: { name: 'Killua', isBot: true },
            content: 'Successfully created tag `Jeremy lore`',
            delay: 1000
          },
          {
            type: 'slash',
            command: '/tag get name:Jeremy lore',
            response: {
              type: 'message',
              author: { name: 'Killua', isBot: true },
              content: 'Jeremy would not shut up about wanting his own channel so after sending a message about it EVERY. SINGLE. DAY. he finally got his wish on the one year anniversary!',
              delay: 1000
            }
          },
          {
            type: 'message',
            author: { name: 'Will', avatarKey: 'will' },
            content: 'I see 😅. Seems like Jeremy has earned this tag...',
            delay: 2500
          },
          {
            type: 'divider',
            content: 'A couple days later...',
            delay: 2500
          },
          {
            type: 'message',
            author: { name: 'Percy', avatarKey: 'percy' },
            content: 'Hi I just joined! Why is this channel called jeremy?? 😭',
            delay: 2500
          },
          {
            type: 'slash',
            command: '/tag get name:Jeremy lore',
            response: {
              type: 'message',
              author: { name: 'Killua', isBot: true },
              content: 'Jeremy would not shut up about wanting his own channel so after sending a message about it EVERY. SINGLE. DAY. he finally got his wish on the one year anniversary!',
              delay: 1000
            }
          },
          {
            type: 'message',
            author: { name: 'Percy', avatarKey: 'percy' },
            content: 'Oh lmao thanks I see 💀',
            delay: 2500
          },
        ]
      }
      ]
    }
  ];

  const category = categories.find(c => c.id === categoryId);
  const currentScenario = category?.scenarios[currentScenarioIndex];
  const isLastScenario = category && currentScenarioIndex >= category.scenarios.length - 1;



  // Button Handler - handles featured logic and requiresInput
  const handleButtonClick = useCallback((messageId: string | undefined, buttonLabel: string) => {
    // Find the message with this button
    // First try by ID if provided, otherwise find by button label
    let messageWithButton = messageId 
      ? visibleMessages.find(msg => 
          msg.type === 'message' && msg.id === messageId
        ) as DiscordMessage | undefined
      : undefined;
    
    // If not found by ID, try finding by button label (for messages without IDs)
    if (!messageWithButton) {
      messageWithButton = visibleMessages.find(msg => 
        msg.type === 'message' && 
        msg.buttons?.some(btn => btn.label === buttonLabel)
      ) as DiscordMessage | undefined;
    }
    
    if (!messageWithButton) return;
    
    // Find the clicked button (check both message buttons and embed buttons)
    let clickedButton = messageWithButton.buttons?.find(btn => btn.label === buttonLabel);
    if (!clickedButton) {
      clickedButton = messageWithButton.embed?.buttons?.find(btn => btn.label === buttonLabel);
    }
    if (!clickedButton) return;
    
    // Don't process if button is disabled
    if (clickedButton.disabled) return;
    
    // Check if there are multiple requiresInput items in this message
    // Consider both message-level buttons and embed buttons
    const messageRequiresInputButtons = messageWithButton.buttons?.filter(btn => btn.requiresInput) || [];
    const embedRequiresInputButtons = messageWithButton.embed?.buttons?.filter(btn => btn.requiresInput) || [];
    const hasSelectWithInput = messageWithButton.select?.requiresInput === true;
    const totalRequiresInput = messageRequiresInputButtons.length + embedRequiresInputButtons.length + (hasSelectWithInput ? 1 : 0);
    
    // If multiple requiresInput items exist, check if this button is featured
    if (totalRequiresInput > 1) {
      const hasFeaturedItems = messageRequiresInputButtons.some(btn => btn.featured) || embedRequiresInputButtons.some(btn => btn.featured) || (hasSelectWithInput && messageWithButton.select?.featured);
      
      if (hasFeaturedItems) {
        // Only featured items are interactive
        if (!clickedButton.featured) {
          // Show notification for non-featured items
          setButtonNotificationMessage('Maybe you should choose a different option...');
          setShowButtonNotification(true);
          setTimeout(() => {
            setShowButtonNotification(false);
            setButtonNotificationMessage('This button is non-functional in this simulation');
          }, 3000);
          return;
        }
      }
    }
    
    // If button has a callback, use it
    if (clickedButton.callback) {
      const helpers = createLambdaHelpers();
      
      // If requiresInput, pause execution and set up resume
      if (clickedButton.requiresInput) {
        executionPausedRef.current = true;
        
        // Override resume to track when this button interaction is complete
        const originalResumeHelper = helpers.resume;
        helpers.resume = () => {
          executionPausedRef.current = false;
          // Call the original resume which will call resumeExecutionRef.current if it exists
          originalResumeHelper();
          // Also directly call resumeExecutionRef if it exists (in case originalResumeHelper doesn't handle it)
          if (resumeExecutionRef.current) {
            const resume = resumeExecutionRef.current;
            resumeExecutionRef.current = null;
            resume();
          }
        };
      }
      
      clickedButton.callback(helpers);
      
      // If requiresInput is true, execution is paused and callback should call helpers.resume() when done
    } else if (clickedButton.requiresInput) {
      // Button with requiresInput but no callback - pause execution and auto-resume
      executionPausedRef.current = true;
      
      // Auto-resume after a short delay
      setTimeout(() => {
        executionPausedRef.current = false;
        // Call resumeExecutionRef if it exists
        if (resumeExecutionRef.current) {
          const resume = resumeExecutionRef.current;
          resumeExecutionRef.current = null;
          resume();
        }
      }, 100);
    } else {
      // Default behavior for non-requiresInput buttons without callback
      setButtonNotificationMessage('Buttons are non-functional in simulations');
      setShowButtonNotification(true);
      setTimeout(() => {
        setShowButtonNotification(false);
        setButtonNotificationMessage('Buttons are non-functional in simulations');
      }, 3000);
    }
  }, [visibleMessages, createLambdaHelpers]);

  // Generic Select Handler - calls callback if present
  const handleSelectChange = useCallback((selectId: string, value: string) => {
    // Find the message with this select
    const messageWithSelect = visibleMessages.find(msg => 
      msg.type === 'message' && msg.select?.id === selectId
    ) as DiscordMessage | undefined;
    
    if (!messageWithSelect) return;
    
    // Check if there are multiple requiresInput items in this message
    // Consider both message-level buttons and embed buttons
    const messageRequiresInputButtons = messageWithSelect.buttons?.filter(btn => btn.requiresInput) || [];
    const embedRequiresInputButtons = messageWithSelect.embed?.buttons?.filter(btn => btn.requiresInput) || [];
    const hasSelectWithInput = messageWithSelect.select?.requiresInput === true;
    const totalRequiresInput = messageRequiresInputButtons.length + embedRequiresInputButtons.length + (hasSelectWithInput ? 1 : 0);
    
    // If multiple requiresInput items exist, check if this select is featured
    if (totalRequiresInput > 1 && hasSelectWithInput) {
      const hasFeaturedItems = messageRequiresInputButtons.some(btn => btn.featured) || embedRequiresInputButtons.some(btn => btn.featured) || messageWithSelect.select?.featured;
      
      if (hasFeaturedItems) {
        // Only featured items are interactive
        if (!messageWithSelect.select?.featured) {
          // Show notification for non-featured items
          setButtonNotificationMessage('Maybe you should choose a different option...');
          setShowButtonNotification(true);
          setTimeout(() => {
            setShowButtonNotification(false);
            setButtonNotificationMessage('Buttons are non-functional in simulations');
          }, 3000);
          return;
        }
      }
    }
    
    // Update select choice
    setSelectChoices(prev => {
      const newMap = new Map(prev);
      newMap.set(selectId, value);
      return newMap;
    });

    // If message has callback, use it
    if (messageWithSelect.select?.callback) {
      // Disable the select immediately
      if (messageWithSelect.id) {
        setVisibleMessages(msgs => msgs.map(m => {
          if (m.type === 'message' && m.id === messageWithSelect.id) {
            return {
              ...m,
              edited: true,
              select: m.select ? { ...m.select, disabled: true } : undefined
            } as DiscordMessage;
          }
          return m;
        }));
      }
      
      // Create helpers with resume tracking for this select
      const helpers = createLambdaHelpers();
      
      // Override resume to track when this select is resumed
      const originalResumeHelper = helpers.resume;
      helpers.resume = () => {
        selectResumedRef.current.add(selectId);
        setSelectResumed(prev => new Set(prev).add(selectId));
        originalResumeHelper();
      };
      
      messageWithSelect.select.callback(value, helpers);
      
      // If requiresInput is true, execution is already paused by playMessages
      // The callback should call helpers.resume() when done
    }
  }, [visibleMessages, createLambdaHelpers]);

  // Check if scenario should be marked complete (all messages processed AND no pending inputs)
  useEffect(() => {
    if ((phase === 'post' || phase === 'typing' || phase === 'waiting') && currentScenario) {
      // Check if we've processed all messages in the scenario
      const allMessagesProcessed = processedMessageCount >= currentScenario.messages.length;
      
      // Check if there are any pending selects or buttons that require input
      const hasPendingInput = visibleMessages.some(msg => {
        if (msg.type !== 'message') return false;
        
        // Check for pending select
        const hasPendingSelect = msg.select && 
          !msg.select.disabled && 
          msg.select.requiresInput && 
          !selectChoicesRef.current.has(msg.select.id);
        
        // Check for pending button
        // If multiple requiresInput items exist, only check featured buttons
        // Consider both message-level buttons and embed buttons
        const messageRequiresInputButtons = msg.buttons?.filter(btn => btn.requiresInput) || [];
        const embedRequiresInputButtons = msg.embed?.buttons?.filter(btn => btn.requiresInput) || [];
        const hasSelectWithInput = msg.select?.requiresInput === true;
        const totalRequiresInput = messageRequiresInputButtons.length + embedRequiresInputButtons.length + (hasSelectWithInput ? 1 : 0);
        const hasFeaturedItems = messageRequiresInputButtons.some(btn => btn.featured) || embedRequiresInputButtons.some(btn => btn.featured) || (hasSelectWithInput && msg.select?.featured);
        
        let hasPendingButton = false;
        if (totalRequiresInput > 1 && hasFeaturedItems) {
          // Only featured buttons are interactive
          hasPendingButton = (messageRequiresInputButtons.some(btn => 
            btn.featured && 
            !executionPausedRef.current
          ) || embedRequiresInputButtons.some(btn => 
            btn.featured && 
            !executionPausedRef.current
          )) || false;
        } else if (totalRequiresInput > 0) {
          // All requiresInput buttons are interactive
          hasPendingButton = (messageRequiresInputButtons.length > 0 || embedRequiresInputButtons.length > 0) && !executionPausedRef.current;
        }
        
        return hasPendingSelect || hasPendingButton;
      });
      
      // Only mark complete if all messages processed, no pending inputs, and execution is not paused
      if (allMessagesProcessed && !hasPendingInput && !executionPausedRef.current) {
        setPhase('complete');
      }
    }
  }, [phase, currentScenario, visibleMessages, selectChoices, processedMessageCount]);

  // Scroll to bottom when messages update - always scroll unless user has manually scrolled up
  useEffect(() => {
    if (messagesContainerRef.current && visibleMessages.length > 0) {
      const container = messagesContainerRef.current;
      // Check if user is near bottom (within 200px) - if so, always auto-scroll
      const scrollBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
      const isNearBottom = scrollBottom < 200;
      
      // Always scroll if near bottom, if this is the first few messages, or during active phases
      const isActivePhase = phase === 'pre' || phase === 'typing' || phase === 'waiting' || phase === 'post';
      if (isNearBottom || visibleMessages.length <= 3 || isActivePhase) {
        // Check if last message has an embed and add extra delay
        const lastMessage = visibleMessages[visibleMessages.length - 1];
        const hasEmbed = lastMessage?.type === 'message' && lastMessage.embed !== undefined;
        const delay = hasEmbed ? 400 : 0;
        
        const scrollToBottom = () => {
          if (container) {
            // Scroll to absolute bottom
            container.scrollTop = container.scrollHeight;
          }
        };
        
        // Immediate scroll - use multiple attempts to ensure we reach bottom
        if (delay > 0) {
        setTimeout(() => {
            scrollToBottom();
          }, delay);
        } else {
          // Use requestAnimationFrame for immediate scroll to ensure DOM is updated
          requestAnimationFrame(() => {
            scrollToBottom();
            // Double-check after a brief moment
            requestAnimationFrame(() => {
              scrollToBottom();
              setTimeout(() => {
                scrollToBottom();
              }, 50);
            });
          });
        }
        
        // Additional scrolls for embeds or to ensure we're at bottom
            if (hasEmbed) {
              setTimeout(() => {
            scrollToBottom();
          }, delay + 300);
          setTimeout(() => {
            scrollToBottom();
          }, delay + 600);
        } else {
          // Follow-up scroll to ensure we're at bottom
          setTimeout(() => {
            scrollToBottom();
          }, delay + 150);
        }
      }
    }
  }, [visibleMessages, phase]);

  // Adjust messages container height when input grows on mobile
  useEffect(() => {
    if (inputRef.current && messagesContainerRef.current) {
      const updateHeight = () => {
        if (inputRef.current && messagesContainerRef.current) {
          const inputHeight = inputRef.current.offsetHeight;
          const baseInputHeight = 2.5 * 16; // 2.5rem in pixels (min-height)
          const extraHeight = Math.max(0, inputHeight - baseInputHeight);
          
          // Reduce messages container height by the extra input height
          // This keeps the bottom fixed while the input grows upward
          const rem = 16; // 1rem = 16px
          if (window.innerWidth < 640) { // sm breakpoint (mobile)
            // Base height is calc(100vh - 11rem), subtract extra input height
            const baseMessagesHeight = window.innerHeight - 11 * rem;
            messagesContainerRef.current.style.height = `${baseMessagesHeight - extraHeight}px`;
          } else {
            // Desktop: Base height is calc(100vh - 18rem), subtract extra input height
            const baseMessagesHeight = window.innerHeight - 18 * rem;
            messagesContainerRef.current.style.height = `${baseMessagesHeight - extraHeight}px`;
          }
        }
      };
      
      const resizeObserver = new ResizeObserver(updateHeight);
      resizeObserver.observe(inputRef.current);
      
      // Initial update
      setTimeout(updateHeight, 0);
      
      // Also listen to window resize to handle orientation changes
      window.addEventListener('resize', updateHeight);
      
      return () => {
        resizeObserver.disconnect();
        window.removeEventListener('resize', updateHeight);
      };
    }
  }, [commandText]);

  // Scroll to top on initial load
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  // Reset when category changes
  useEffect(() => {
    setCurrentScenarioIndex(0);
    setPhase('intro');
    setCurrentInteractionIndex(0);
    setVisibleMessages([]);
    setSentCommands([]);
    setCommandUsers(new Map());
    setTypingUser(null);
    setCommandText('');
    setShowEnterHint(false);
    setShowDesktopCategoryMenu(false);
    // Scroll to top when category changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [categoryId]);

  // Reset when scenario index changes
  useEffect(() => {
    setPhase('intro');
    setCurrentInteractionIndex(0);
    setVisibleMessages([]);
    setSentCommands([]);
    setCommandUsers(new Map());
    setTypingUser(null);
    setCommandText('');
    setShowEnterHint(false);
    setShowDesktopCategoryMenu(false);
  }, [currentScenarioIndex]);

  // Type out user message character by character
  const typeMessage = useCallback((message: string, onComplete: () => void) => {
    let i = 0;
    const interval = setInterval(() => {
      if (i < message.length) {
        setCommandText(message.substring(0, i + 1));
        i++;
      } else {
        clearInterval(interval);
        // Small delay before auto-sending
        setTimeout(() => {
          setCommandText('');
          onComplete();
        }, 300);
      }
    }, 30); // Slightly faster than commands
  }, []);

  // Play messages with delays and typing indicators - processes in batches, pausing at blocking selects
  const playMessages = useCallback((messages: ScenarioMessage[], onComplete: () => void) => {
    let currentDelay = 0;
    let messageIndex = 0;
    
    const scheduleMessage = (msg: ScenarioMessage, index: number, baseDelay: number): number => {
      const delay = 'delay' in msg ? msg.delay : 0;
      const messageAppearTime = baseDelay + delay;
      
      // Handle different message types
      if (msg.type === 'slash') {
        setTimeout(() => {
          setVisibleMessages(prev => [...prev, msg]);
          playNotificationSound();
        }, messageAppearTime);
        return messageAppearTime;
      }
      
      if (msg.type === 'edit') {
        setTimeout(() => {
          setVisibleMessages(msgs => msgs.map(m => {
            if (m.type === 'message' && m.id === msg.messageId) {
              return { ...m, ...msg.updates } as DiscordMessage;
            }
            return m;
          }));
        }, messageAppearTime);
        return messageAppearTime;
      }
      
      if (msg.type === 'delete') {
        setTimeout(() => {
          const messageIdsToDelete = Array.isArray(msg.messageId) ? msg.messageId : [msg.messageId];
          setVisibleMessages(msgs => {
            // Find indices to delete
            const indicesToDelete = new Set<number>();
            
            msgs.forEach((m, index) => {
              // Delete messages with matching IDs
              if (m.type === 'message' && m.id && messageIdsToDelete.includes(m.id)) {
                indicesToDelete.add(index);
              }
              
              // Delete slash commands by their ID, and also delete their response message
              if (m.type === 'slash' && m.id && messageIdsToDelete.includes(m.id)) {
                indicesToDelete.add(index);
                // Also delete the response message (immediately after the slash command)
                if (index + 1 < msgs.length) {
                  const nextMsg = msgs[index + 1];
                  if (nextMsg.type === 'message') {
                    indicesToDelete.add(index + 1);
                  }
                }
              }
            });
            
            // Filter out deleted messages
            return msgs.filter((_, index) => !indicesToDelete.has(index));
          });
        }, messageAppearTime);
        return messageAppearTime;
      }
      
      // Handle DiscordMessage
      if (msg.type === 'message') {
        const isOtherUser = msg.author && msg.author.isBot !== true && msg.author.isUser !== true;
        const hasEmbed = msg.embed !== undefined;
        
        // Calculate typing duration
      const getTypingDuration = (message: DiscordMessage): number => {
        if (message.typing && message.typingDuration) {
            return message.typingDuration;
          }
          const content = typeof message.content === 'string' ? message.content : message.content?.(sharedStateRef.current) || '';
          const contentLength = content.length;
          const baseTypingTime = 800;
          const charsPerSecond = 8;
        const calculatedTime = Math.max(baseTypingTime, (contentLength / charsPerSecond) * 1000);
          return Math.min(calculatedTime, 3000);
        };
        
        const showMessage = async () => {
          // Execute before lambda if present (await if async)
          if (msg.before) {
            const result = msg.before(sharedStateRef.current, createLambdaHelpers());
            if (result instanceof Promise) {
              await result;
            }
          }
          
          // Evaluate and freeze embed content if present
          let messageToAdd = msg;
          if (msg.embed) {
            const evaluatedTitle = typeof msg.embed.title === 'function' 
              ? msg.embed.title(sharedStateRef.current)
              : msg.embed.title;
            const evaluatedDescription = typeof msg.embed.description === 'function'
              ? msg.embed.description(sharedStateRef.current)
              : msg.embed.description;
            
            // Evaluate footer if it's an object with icon
            let evaluatedFooter = msg.embed.footer;
            if (typeof msg.embed.footer === 'object' && msg.embed.footer.icon) {
              let evaluatedIcon: string | { colorKey?: string; src?: string } | undefined = undefined;
              if (typeof msg.embed.footer.icon === 'function') {
                const result = msg.embed.footer.icon(sharedStateRef.current);
                if (typeof result === 'object' && result !== null && 'colorKey' in result) {
                  // Function returned an object - ensure src is evaluated if it's a function
                  const resultObj = result as { colorKey?: string; src?: string | ((state: SharedState) => string) };
                  const evaluatedSrc = typeof resultObj.src === 'function'
                    ? resultObj.src(sharedStateRef.current)
                    : resultObj.src;
                  evaluatedIcon = {
                    colorKey: resultObj.colorKey,
                    src: evaluatedSrc
                  };
                } else if (typeof result === 'string') {
                  // Function returned a string
                  evaluatedIcon = result;
                }
              } else if (typeof msg.embed.footer.icon === 'string') {
                evaluatedIcon = msg.embed.footer.icon;
              } else if (typeof msg.embed.footer.icon === 'object') {
                // Icon is an object with colorKey and/or src
                const evaluatedSrc = typeof msg.embed.footer.icon.src === 'function'
                  ? msg.embed.footer.icon.src(sharedStateRef.current)
                  : msg.embed.footer.icon.src;
                evaluatedIcon = {
                  colorKey: msg.embed.footer.icon.colorKey,
                  src: evaluatedSrc
                };
              }
              evaluatedFooter = {
                ...msg.embed.footer,
                icon: evaluatedIcon
              };
            }
            
            messageToAdd = {
              ...msg,
              embed: {
                ...msg.embed,
                title: evaluatedTitle,
                description: evaluatedDescription,
                footer: evaluatedFooter
              }
            };
          }
          
          setVisibleMessages(prev => [...prev, messageToAdd]);
          playNotificationSound();
      };
      
      if (isOtherUser && (msg.content || msg.embed)) {
          // Show typing indicator for other users
          const typingDuration = getTypingDuration(msg as DiscordMessage);
        const embedRenderDelay = hasEmbed ? 200 : 0;
          const minStartTime = index === 0 ? 0 : baseDelay + 100;
        const minTypingDuration = 800;
        const actualTypingDuration = Math.max(typingDuration, minTypingDuration);
        const requiredStartTime = messageAppearTime - actualTypingDuration;
        const typingStartTime = Math.max(minStartTime, requiredStartTime);
        
        setTimeout(() => {
            if (msg.author) {
          setTypingUser(msg.author.name);
            }
        }, typingStartTime);
        
        setTimeout(() => {
          setTypingUser(null);
            showMessage();
        }, messageAppearTime + embedRenderDelay);
      } else {
          // Check if this is a user message that should be typed out
          const isUserMessage = msg.author?.isUser === true;
          if (isUserMessage && msg.content) {
            // Evaluate content to get the actual text
            const messageContent = typeof msg.content === 'string' 
              ? msg.content 
              : msg.content(sharedStateRef.current);
            
            // Calculate typing duration (30ms per character + 300ms delay)
            const typingDuration = messageContent.length * 30 + 300;
            
            // Start typing at the scheduled message time
            setTimeout(() => {
              setPhase('typing');
              typeMessage(messageContent, () => {
                setPhase('post');
                showMessage();
              });
            }, messageAppearTime);
            
            // Return the total time including typing
            return messageAppearTime + typingDuration;
          } else {
            // No typing indicator - just show the message
            setTimeout(() => {
              showMessage();
            }, messageAppearTime);
          }
        }
        return messageAppearTime;
      } else if (msg.type === 'system') {
        // System messages - just add them
        setTimeout(() => {
          setVisibleMessages(prev => [...prev, msg]);
          playNotificationSound();
        }, messageAppearTime);
        return messageAppearTime;
      } else if (msg.type === 'divider') {
        // Dividers - just add them (no notification sound)
        setTimeout(() => {
          setVisibleMessages(prev => [...prev, msg]);
        }, messageAppearTime);
        return messageAppearTime;
      }
      
      return messageAppearTime;
    };
    
    // Schedule messages until we hit a blocking select or button
    let lastScheduledTime = 0;
    while (messageIndex < messages.length) {
      const msg = messages[messageIndex];
      const hasSelectWithInput = msg.type === 'message' && msg.select?.requiresInput === true;
      const hasButtonWithInput = msg.type === 'message' && (
        msg.buttons?.some(btn => btn.requiresInput) === true ||
        msg.embed?.buttons?.some(btn => btn.requiresInput) === true
      );
      const hasBlockingInput = hasSelectWithInput || hasButtonWithInput;
      
      // Schedule this message
      lastScheduledTime = scheduleMessage(msg, messageIndex, currentDelay);
      currentDelay = lastScheduledTime;
      messageIndex++;
      
      // If this message has a blocking select or button, pause here and set up resume callback
      if (hasBlockingInput) {
        executionPausedRef.current = true;
        const remainingMessages = messages.slice(messageIndex);
        
        resumeExecutionRef.current = () => {
          executionPausedRef.current = false;
          resumeExecutionRef.current = null;
          // Continue scheduling remaining messages - start from minimal delay for immediate continuation
          if (remainingMessages.length > 0) {
            let nextDelay = 0; // Start immediately after resume
            remainingMessages.forEach((remainingMsg, remainingIndex) => {
              nextDelay = scheduleMessage(remainingMsg, messageIndex + remainingIndex, nextDelay);
            });
            // Call onComplete after remaining messages are scheduled
            setTimeout(() => {
              onComplete();
            }, nextDelay + 500);
          } else {
            onComplete();
          }
        };
        // Don't schedule remaining messages yet - wait for resume
        return;
      }
    }
    
    // All messages scheduled, call onComplete
    setTimeout(() => {
      onComplete();
    }, lastScheduledTime + 500);
  }, [createLambdaHelpers, playNotificationSound, typeMessage]);

  // Type out command character by character
  const typeCommand = useCallback((command: string) => {
    let i = 0;
    const interval = setInterval(() => {
      if (i < command.length) {
        setCommandText(command.substring(0, i + 1));
        i++;
      } else {
        clearInterval(interval);
        setShowEnterHint(true);
        setPhase('waiting');
        inputRef.current?.focus();
      }
    }, 60);
  }, []);

  // Process messages sequentially until next SlashCommand or end
  const processMessages = useCallback((startIndex: number = 0) => {
    if (!currentScenario) return;
    
    const messages = currentScenario.messages;
    let messagesToProcess: ScenarioMessage[] = [];
    let nextSlashIndex = -1;
    
    // Collect messages until we hit a SlashCommand
    for (let i = startIndex; i < messages.length; i++) {
      if (messages[i].type === 'slash') {
        nextSlashIndex = i;
        break;
      }
      messagesToProcess.push(messages[i]);
    }
    
    // Process collected messages
    if (messagesToProcess.length > 0) {
      playMessages(messagesToProcess, () => {
        // After messages are processed, handle next SlashCommand if exists
        if (nextSlashIndex >= 0) {
          const slashCmd = messages[nextSlashIndex] as SlashCommand;
          currentMessageIndexRef.current = nextSlashIndex;
          setProcessedMessageCount(nextSlashIndex);
          
          // Evaluate command if it's a function
          const evaluatedCommand = typeof slashCmd.command === 'function' 
            ? slashCmd.command(sharedStateRef.current)
            : slashCmd.command;
          
          // If commandUser is specified, auto-send the command
          if (slashCmd.commandUser) {
      setCommandUsers(prev => {
        const newMap = new Map(prev);
              newMap.set(evaluatedCommand, {
                name: slashCmd.commandUser!.name,
                avatar: slashCmd.commandUser!.avatar,
                avatarKey: slashCmd.commandUser!.avatarKey,
              });
        return newMap;
      });
            setSentCommands(prev => [...prev, evaluatedCommand]);
            
            // Process the response and continue
            setTimeout(() => {
              // Add the slash command to visible messages (with evaluated command)
              setVisibleMessages(prev => [...prev, { ...slashCmd, command: evaluatedCommand }]);
              
              // Process the response message
              playMessages([slashCmd.response], () => {
                // Continue processing from next index
                processMessages(nextSlashIndex + 1);
              });
            }, 500);
    } else {
            // Wait for user to type the command
            setPhase('typing');
            typeCommand(evaluatedCommand);
          }
        } else {
          // No more messages - mark as processed, useEffect will check for completion
          if (currentScenario) {
            currentMessageIndexRef.current = currentScenario.messages.length;
            setProcessedMessageCount(currentScenario.messages.length);
          }
        }
      });
    } else if (nextSlashIndex >= 0) {
      // No messages before slash command, just handle the command
      const slashCmd = messages[nextSlashIndex] as SlashCommand;
      currentMessageIndexRef.current = nextSlashIndex;
      setProcessedMessageCount(nextSlashIndex);
      
      // Evaluate command if it's a function
      const evaluatedCommand = typeof slashCmd.command === 'function' 
        ? slashCmd.command(sharedStateRef.current)
        : slashCmd.command;
      
      if (slashCmd.commandUser) {
      setCommandUsers(prev => {
        const newMap = new Map(prev);
          newMap.set(evaluatedCommand, {
            name: slashCmd.commandUser!.name,
            avatar: slashCmd.commandUser!.avatar,
            avatarKey: slashCmd.commandUser!.avatarKey,
          });
          return newMap;
        });
        setSentCommands(prev => [...prev, evaluatedCommand]);
        setTimeout(() => {
          // Add the slash command to visible messages (with evaluated command)
          setVisibleMessages(prev => [...prev, { ...slashCmd, command: evaluatedCommand }]);
          
          // Process the response message
          playMessages([slashCmd.response], () => {
            // Continue processing from next index
            processMessages(nextSlashIndex + 1);
          });
        }, 500);
      } else {
        setPhase('typing');
        typeCommand(evaluatedCommand);
      }
    } else {
      // No more messages - mark as processed, useEffect will check for completion
      if (currentScenario) {
        currentMessageIndexRef.current = currentScenario.messages.length;
        setProcessedMessageCount(currentScenario.messages.length);
      }
    }
  }, [currentScenario, playMessages, typeCommand]);

  // Send command and show responses
  const sendCommand = useCallback((command?: string) => {
    if (!currentScenario) return;
    
    const cmd = command || commandText;
    if (!cmd) return;
    
    // Find the SlashCommand at the current message index
    const currentIndex = currentMessageIndexRef.current;
    const messages = currentScenario.messages;
    
    if (currentIndex >= messages.length || messages[currentIndex].type !== 'slash') {
      return; // No slash command at current index
    }
    
    const slashCmd = messages[currentIndex] as SlashCommand;
    
    // Evaluate command if it's a function
    const evaluatedCommand = typeof slashCmd.command === 'function' 
      ? slashCmd.command(sharedStateRef.current)
      : slashCmd.command;
    
    // Verify command matches
    if (evaluatedCommand !== cmd) {
      return; // Command doesn't match
    }
    
    // Add command to sent commands list
    setSentCommands(prev => [...prev, cmd]);
    
    // Store which user used this command (default to logged-in user)
    setCommandUsers(prev => {
      const newMap = new Map(prev);
      newMap.set(cmd, {
        name: userName || 'You',
          avatar: userAvatar,
          avatarKey: 'user'
        });
        return newMap;
      });
    
    setShowEnterHint(false);
    setCommandText('');
    setPhase('post');
    
    // Add the slash command to visible messages (with evaluated command)
    setVisibleMessages(prev => [...prev, { ...slashCmd, command: evaluatedCommand }]);
    
    // Process the response message
    playMessages([slashCmd.response], () => {
      // Continue processing from next index
      processMessages(currentIndex + 1);
    });
  }, [currentScenario, commandText, userName, userAvatar, playMessages, processMessages]);

  // Start scenario
  const startScenario = useCallback(() => {
    if (!currentScenario) return;
    // Clear all messages and reset state
    setVisibleMessages([]);
    // Initialize shared state with username and avatar
    setSharedState({ user: userName || 'You', userAvatar: userAvatar });
    setSentCommands([]);
    setCommandUsers(new Map());
    setSelectChoices(new Map());
    setSelectResumed(new Set());
    selectResumedRef.current = new Set();
    setTypingUser(null);
    setCommandText('');
    setShowEnterHint(false);
    setShowDesktopCategoryMenu(false);
    executionPausedRef.current = false;
    resumeExecutionRef.current = null;
    currentMessageIndexRef.current = 0;
    setProcessedMessageCount(0);
    setCurrentInteractionIndex(0);
    setPhase('pre');
    // Start processing messages
    processMessages(0);
  }, [currentScenario, processMessages, userName]);

  // Handle Enter key press
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && phase === 'waiting') {
      e.preventDefault();
      sendCommand();
    }
  }, [phase, sendCommand]);

  // Next scenario
  const nextScenario = () => {
    if (category && currentScenarioIndex < category.scenarios.length - 1) {
      setCurrentScenarioIndex(prev => prev + 1);
    }
  };

  const prevScenario = () => {
    if (currentScenarioIndex > 0) {
      setCurrentScenarioIndex(prev => prev - 1);
    }
  };

  if (!category) {
    return (
      <div className="min-h-screen bg-discord-darker flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Category not found</h1>
          <Link to="/" className="text-discord-blurple hover:underline">Return home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-discord-darker text-white">
      <style>{`
        @keyframes shrink {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
        @keyframes glow {
          0%, 100% {
            box-shadow: 0 0 5px rgba(59, 130, 246, 0.5), 0 0 10px rgba(59, 130, 246, 0.3);
          }
          50% {
            box-shadow: 0 0 15px rgba(59, 130, 246, 0.8), 0 0 25px rgba(59, 130, 246, 0.5);
          }
        }
      `}</style>
      {/* Header */}
      <div className="sticky top-0 z-20 bg-discord-dark border-b border-gray-700 px-3 sm:px-6 py-5 sm:py-4">
        <div className="max-w-6xl mx-auto flex items-center gap-2 relative">
          <Link to="/" className="flex items-center gap-1 sm:gap-2 text-gray-400 hover:text-white transition-colors text-xs sm:text-sm flex-shrink-0 z-10">
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Back to Home</span>
            <span className="sm:hidden">Back</span>
          </Link>
          <div className="text-center flex-1 min-w-0 px-2 absolute left-1/2 -translate-x-1/2 w-full">
            <h1 className="text-sm sm:text-lg font-semibold truncate py-1 sm:py-0">{category.title}</h1>
            <p className="text-xs text-gray-400 truncate py-1 sm:py-0">{currentScenario?.title}</p>
          </div>
          <div className="text-xs sm:text-sm text-gray-400 whitespace-nowrap flex-shrink-0 ml-auto z-10">
            {currentScenarioIndex + 1}/{category.scenarios.length}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-2 sm:px-4 py-4 sm:py-8">
        {/* Discord Window */}
        <div className="bg-discord-dark rounded-xl overflow-hidden border border-gray-700 shadow-2xl relative">
          {/* Channel Header */}
          <div className="bg-discord-dark border-b border-gray-700 px-2 sm:px-4 py-2 sm:py-3 flex items-center justify-between gap-2 relative">
            <div className="flex items-center gap-2">
              <Hash className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
              <span className="font-medium text-sm sm:text-base">{currentScenario?.channelName || 'general'}</span>
            </div>
            <div className="flex items-center gap-2">
            {phase === 'complete' && (
                <>
              <button
                onClick={startScenario}
                className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs sm:text-sm rounded transition-colors"
                title="Play Again"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Play Again</span>
              </button>
                  {/* Desktop menu button */}
                  <button
                    onClick={() => setShowDesktopCategoryMenu(!showDesktopCategoryMenu)}
                    className="hidden sm:flex items-center justify-center w-8 h-8 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors"
                    title="Explore Categories"
                  >
                    <Menu className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Button notification - positioned below channel header */}
          {showButtonNotification && (
            <div className="absolute top-[3.5rem] sm:top-[4rem] left-1/2 -translate-x-1/2 z-50 max-w-xs">
              <div className="relative bg-discord-dark rounded-lg px-6 py-3 border border-blue-400 flex items-center justify-center gap-1.5 overflow-hidden">
                <div className="absolute inset-0 bg-blue-500/10 rounded-lg" />
                <Lightbulb className="w-3.5 h-3.5 text-blue-400 flex-shrink-0 relative z-10" />
                <p className="text-gray-300 text-xs font-medium whitespace-nowrap relative z-10">{buttonNotificationMessage}</p>
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-300/60 rounded-b-lg">
                  <div 
                    className="h-full bg-blue-200 rounded-b-lg"
                    style={{
                      animation: 'shrink 3s linear forwards'
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Messages Area */}
          <div ref={messagesContainerRef} className="h-[calc(100vh-11rem)] sm:h-[calc(100vh-18rem)] overflow-y-auto bg-discord-darker relative [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {phase === 'intro' ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8">
                <h3 className="text-xl font-semibold mb-2">{currentScenario?.title}</h3>
                <p className="text-gray-400 mb-6">{currentScenario?.description}</p>
                <button
                  onClick={startScenario}
                  className="hidden sm:flex bg-discord-blurple hover:bg-discord-blurple/80 text-white font-medium px-6 py-3 rounded-lg transition-colors items-center gap-2"
                >
                  Start Scenario
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <>
                <div className="pt-0.5 flex flex-col h-full">
                  {/* Spacer to push content to bottom - flex-1 plus extra height */}
                  <div className="flex-1 mb-24" />
                  {visibleMessages.map((msg, msgIndex) => {
                    // Find which slash command this message belongs to by looking backwards
                    // Only show slash header on the response message (immediately after the slash command)
                    let slashCommandForMessage: string | undefined = undefined;
                    let commandUserForMessage: { name: string; avatar?: string; avatarKey?: string } | undefined = undefined;
                    
                    // Look backwards to find the most recent SlashCommand
                    // Only apply if this is the message immediately after the slash command
                    if (msgIndex > 0 && msg.type === 'message') {
                      const prevMsg = visibleMessages[msgIndex - 1];
                      if (prevMsg.type === 'slash') {
                        // Evaluate command if it's a function
                        const evaluatedCmd = typeof prevMsg.command === 'function' 
                          ? prevMsg.command(sharedState)
                          : prevMsg.command;
                        if (sentCommands.includes(evaluatedCmd)) {
                          slashCommandForMessage = evaluatedCmd;
                          commandUserForMessage = commandUsers.get(evaluatedCmd) || prevMsg.commandUser;
                        }
                      }
                    }
                    
                    // Use index as key (messages are added in order)
                    const messageKey = `msg-${msgIndex}`;
                    
                    return (
                      <MessageComponent 
                        key={messageKey} 
                        message={msg}
                        userName={userName}
                        userAvatar={userAvatar}
                        sharedState={sharedState}
                        slashCommand={slashCommandForMessage}
                        commandUser={commandUserForMessage}
                        onButtonClick={handleButtonClick}
                        onSelectChange={handleSelectChange}
                        selectChoices={selectChoices}
                        selectResumed={selectResumed}
                      />
                    );
                  })}
                  {/* Typing indicator - pushes content up */}
                  {typingUser && <TypingIndicator name={typingUser} />}
                  <div ref={messagesEndRef} />
                </div>
              </>
            )}
          </div>

          {/* Input Area */}
          <div className="bg-discord-dark p-2 sm:p-4 border-t border-gray-700">
            {phase === 'intro' ? (
              <>
                {/* Mobile: Start button */}
              <div className="flex flex-row items-center gap-2 sm:hidden relative">
                <button
                  onClick={startScenario}
                  className="flex items-center gap-1.5 px-4 py-2 bg-discord-blurple hover:bg-discord-blurple/80 text-white text-xs font-medium rounded-lg transition-colors absolute left-1/2 -translate-x-1/2"
                >
                  <span>Start Scenario</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
                {/* Menu button - right aligned */}
                <button
                  onClick={() => setShowCategoryMenu(true)}
                  className="flex items-center justify-center w-10 h-10 bg-discord-dark text-gray-300 rounded-lg hover:bg-discord-dark/80 transition-colors flex-shrink-0 ml-auto"
                >
                  <Menu className="w-4 h-4" />
                </button>
              </div>
                {/* Desktop: Input placeholder */}
                <div className="hidden sm:block relative">
                  <input
                    type="text"
                    readOnly
                    placeholder="Start the scenario to begin..."
                    className="w-full bg-discord-darker text-white px-4 py-3 rounded-lg border border-gray-600 cursor-not-allowed opacity-50"
                  />
                </div>
              </>
            ) : phase === 'complete' ? (
              <>
                {/* Mobile: Previous, Next/Add Killua, Menu */}
              <div className="flex flex-row items-center gap-2 sm:hidden relative">
                  {isLastScenario ? (
                    <>
                      {/* Prev button - left aligned for last scenario */}
                <button
                  onClick={prevScenario}
                  disabled={currentScenarioIndex === 0}
                        className="flex items-center gap-1 px-2 py-1.5 bg-discord-dark border border-gray-600 text-gray-300 text-xs rounded-lg hover:bg-discord-dark/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                >
                  <ChevronLeft className="w-3 h-3" />
                  <span>Prev</span>
                </button>
                
                      {/* Middle content - centered with more space */}
                      <div className="flex items-center gap-2 px-3 py-1.5 border border-gray-600 rounded-lg absolute left-1/2 -translate-x-1/2 whitespace-nowrap">
                        <p className="text-white text-[10px] sm:text-xs">
                      Convinced?
                    </p>
                    <LinkButton
                      href="https://discord.com/oauth2/authorize?client_id=756206646396452975&scope=bot&permissions=1342531648"
                          className="relative flex items-center justify-center gap-1 px-2 py-1 bg-discord-blurple hover:bg-discord-blurple/90 text-white text-[10px] font-semibold rounded transition-all duration-300 shadow-lg shadow-discord-blurple/40 hover:shadow-xl hover:shadow-discord-blurple/60 hover:scale-105 group overflow-hidden whitespace-nowrap"
                    >
                      {/* Animated background gradient */}
                      <div className="absolute inset-0 bg-gradient-to-r from-discord-blurple via-discord-fuchsia/50 to-discord-blurple bg-[length:200%_100%] animate-shimmer opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      
                      {/* Content */}
                          <span className="relative z-10 flex items-center gap-1">
                            <UserPlus className="w-2.5 h-2.5 group-hover:rotate-12 transition-transform duration-300" />
                        <span>Add Killua</span>
                      </span>
                    </LinkButton>
                  </div>
                      
                      {/* Menu button - right aligned */}
                      <button
                        onClick={() => setShowCategoryMenu(true)}
                        className="flex items-center justify-center w-10 h-10 bg-discord-dark text-gray-300 rounded-lg hover:bg-discord-dark/80 transition-colors flex-shrink-0 ml-auto"
                      >
                        <Menu className="w-4 h-4" />
                      </button>
                    </>
                ) : (
                  <>
                      {/* Prev button - centered for non-last scenario */}
                      <button
                        onClick={prevScenario}
                        disabled={currentScenarioIndex === 0}
                        className="flex items-center gap-1 px-2 py-1.5 bg-discord-dark border border-gray-600 text-gray-300 text-xs rounded-lg hover:bg-discord-dark/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors absolute left-1/2 -translate-x-1/2"
                        style={{ transform: 'translateX(calc(-50% - 2rem))' }}
                      >
                        <ChevronLeft className="w-3 h-3" />
                        <span>Prev</span>
                      </button>
                      
                      {/* Next button */}
                    <button
                      onClick={nextScenario}
                      className="flex items-center gap-1 px-3 py-1.5 bg-discord-blurple text-white text-xs rounded-lg hover:bg-discord-blurple/80 transition-colors absolute left-1/2 -translate-x-1/2"
                      style={{ transform: 'translateX(calc(-50% + 2rem))' }}
                    >
                      <span>Next</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                
                {/* Menu button - right aligned */}
                <button
                  onClick={() => setShowCategoryMenu(true)}
                  className="flex items-center justify-center w-10 h-10 bg-discord-dark text-gray-300 rounded-lg hover:bg-discord-dark/80 transition-colors flex-shrink-0 ml-auto"
                >
                  <Menu className="w-4 h-4" />
                </button>
                    </>
                  )}
              </div>

                {/* Desktop: Previous, Next/Add Killua */}
                <div className="hidden sm:flex items-center justify-between gap-2 flex-wrap">
                  <button
                    onClick={prevScenario}
                    disabled={currentScenarioIndex === 0}
                    className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 bg-discord-dark text-gray-300 text-xs sm:text-sm rounded-lg hover:bg-discord-dark/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Previous</span>
                    <span className="sm:hidden">Prev</span>
                  </button>

                  {!isLastScenario ? (
                    <button
                      onClick={nextScenario}
                      className="flex items-center gap-1 sm:gap-2 px-3 sm:px-6 py-1.5 sm:py-2 bg-discord-blurple text-white text-xs sm:text-sm rounded-lg hover:bg-discord-blurple/80 transition-colors"
                    >
                      <span className="hidden sm:inline">Next Scenario</span>
                      <span className="sm:hidden">Next</span>
                      <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 px-3 py-1.5 border border-gray-600 rounded-lg">
                      <p className="text-white text-xs sm:text-sm">
                        Convinced?
                      </p>
                      <LinkButton
                        href="https://discord.com/oauth2/authorize?client_id=756206646396452975&scope=bot&permissions=1342531648"
                        className="relative flex items-center justify-center gap-1.5 px-3 py-1.5 bg-discord-blurple hover:bg-discord-blurple/90 text-white text-xs sm:text-sm font-semibold rounded transition-all duration-300 shadow-lg shadow-discord-blurple/40 hover:shadow-xl hover:shadow-discord-blurple/60 hover:scale-105 group overflow-hidden"
                      >
                        {/* Animated background gradient */}
                        <div className="absolute inset-0 bg-gradient-to-r from-discord-blurple via-discord-fuchsia/50 to-discord-blurple bg-[length:200%_100%] animate-shimmer opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        
                        {/* Content */}
                        <span className="relative z-10 flex items-center gap-1.5">
                          <UserPlus className="w-3 h-3 sm:w-4 sm:h-4 group-hover:rotate-12 transition-transform duration-300" />
                          <span>Add Killua</span>
                        </span>
                      </LinkButton>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="relative">
                <div className="flex items-end gap-2 w-full">
                  <div className="relative flex-1 flex flex-col">
                    <div className="flex-1"></div>
                    <div className="relative">
                      <div
                        ref={inputRef as React.RefObject<HTMLDivElement>}
                    onKeyDown={handleKeyDown}
                        className="w-full bg-discord-darker text-white px-4 py-2 sm:py-3 sm:pr-24 rounded-lg border border-gray-600 focus:outline-none focus:border-discord-blurple transition-colors min-h-[2.5rem] sm:min-h-[3rem] flex items-end flex-wrap gap-1"
                        style={{ 
                          wordWrap: 'break-word', 
                          overflowWrap: 'break-word',
                        }}
                        tabIndex={0}
                      >
                        {commandText ? (
                          <>
                            {parseCommandWithArgs(commandText)}
                            <span className="inline-block w-0.5 h-4 bg-white ml-0.5 animate-pulse" />
                          </>
                        ) : (
                          <span className="text-gray-500">{`Message #${currentScenario?.channelName || 'general'}`}</span>
                        )}
                      </div>
                      {/* Desktop: Enter button inside input */}
                  {showEnterHint && (
                    <button
                      onClick={() => sendCommand()}
                          className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 items-center gap-2 px-2 py-1 bg-discord-blurple hover:bg-discord-blurple/80 text-white text-xs rounded border border-discord-blurple/50 font-semibold transition-colors cursor-pointer flex-shrink-0"
                    >
                      <span className="text-gray-300">Press</span>
                      <span>Enter ↵</span>
                    </button>
                  )}
                </div>
              </div>
                  {/* Mobile: Circular send button outside input */}
              {showEnterHint && (
                <button
                  onClick={() => sendCommand()}
                      className="flex sm:hidden items-center justify-center w-10 h-10 bg-discord-blurple hover:bg-discord-blurple/80 text-white rounded-full transition-colors cursor-pointer flex-shrink-0 mb-0.5"
                      title="Send"
                >
                      <svg className="w-5 h-5 rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                </button>
              )}
            </div>
              </div>
            )}
          </div>
          
          {/* Category Menu Modal (Mobile only) */}
          {showCategoryMenu && (
            <div className="fixed inset-0 bg-black/50 z-50 sm:hidden" onClick={() => setShowCategoryMenu(false)}>
              <div className="absolute bottom-0 left-0 right-0 bg-discord-dark border-t border-gray-700 rounded-t-2xl p-4 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-white">Explore Categories</h3>
                  <button
                    onClick={() => setShowCategoryMenu(false)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {botCategories.map(cat => {
                    const isSelected = cat.id === categoryId;
                    return (
                      <Link
                        key={cat.id}
                        to={`/explore/${cat.id}`}
                        onClick={() => setShowCategoryMenu(false)}
                        className={`p-3 rounded-lg transition-colors flex items-center gap-3 ${
                          isSelected
                            ? 'bg-discord-blurple/20 border-2 border-discord-blurple'
                            : 'bg-discord-darker border border-gray-700 hover:border-discord-blurple/50'
                        }`}
                      >
                        <div className={`${isSelected ? 'text-discord-blurple' : 'text-gray-400'}`}>
                          {cat.icon}
                        </div>
                        <span className={`text-sm flex-1 ${isSelected ? 'text-white font-medium' : 'text-gray-300 hover:text-white'}`}>
                          {cat.title}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
          
          {/* Desktop Category Menu Modal */}
          {showDesktopCategoryMenu && phase === 'complete' && (
            <div className="hidden sm:block fixed inset-0 z-50" onClick={() => setShowDesktopCategoryMenu(false)}>
              <div 
                className="absolute top-20 right-4 bg-discord-dark border border-gray-700 rounded-lg shadow-2xl p-4 min-w-[280px] max-w-[400px]"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-white">Explore Categories</h3>
              <button
                    onClick={() => setShowDesktopCategoryMenu(false)}
                    className="text-gray-400 hover:text-white transition-colors"
              >
                    <X className="w-5 h-5" />
              </button>
              </div>
                <div className="grid grid-cols-1 gap-2">
            {categories.map(cat => {
              const isSelected = cat.id === categoryId;
              return (
                <Link
                  key={cat.id}
                  to={`/explore/${cat.id}`}
                        onClick={() => setShowDesktopCategoryMenu(false)}
                  className={`p-3 rounded-lg transition-colors ${
                    isSelected
                      ? 'bg-discord-blurple/20 border-2 border-discord-blurple'
                            : 'bg-discord-darker border border-gray-700 hover:border-discord-blurple/50'
                  }`}
                >
                  <span className={`text-sm ${isSelected ? 'text-white font-medium' : 'text-gray-300 hover:text-white'}`}>
                    {cat.title}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default DiscordSimulatorPage;
