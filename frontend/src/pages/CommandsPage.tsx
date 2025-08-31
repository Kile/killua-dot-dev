import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ChevronDown, ChevronRight, Search } from 'lucide-react';
import commandEmojiMap from '../utils/commandEmojiMap';
import Loading from '../components/Loading';

interface Command {
  name: string;
  description: string;
  message_usage: string;
  aliases: string[];
  cooldown: number;
  premium_guild: boolean;
  premium_user: boolean;
  slash_usage: string;
}

interface CommandCategory {
  name: string;
  commands: Command[];
  description: string;
  emoji?: {
    normal?: string;
    unicode?: string;
  };
}

const CommandsPage: React.FC = () => {
  const [commands, setCommands] = useState<Record<string, CommandCategory>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCommands();
  }, []);

  const fetchCommands = async () => {
    try {
      const response = await fetch('/api/commands');
      const data = await response.json();
      setCommands(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching commands:', error);
      setLoading(false);
    }
  };

  const toggleCategory = (categoryName: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryName)) newExpanded.delete(categoryName);
    else newExpanded.add(categoryName);
    setExpandedCategories(newExpanded);
  };

  const term = searchTerm.trim().toLowerCase();
  const prevTermRef = useRef<string>('');

  // Build a filtered structure once per render
  const filteredStructure = useMemo(() => {
    const result: Array<{
      categoryName: string;
      category: CommandCategory;
      visibleCommands: Command[];
    }> = [];

    for (const [categoryName, category] of Object.entries(commands)) {
      const visibleCommands = term
        ? category.commands.filter((c) =>
            c.name.toLowerCase().includes(term) ||
            c.description.toLowerCase().includes(term)
          )
        : category.commands;

      if (!term || visibleCommands.length > 0) {
        result.push({ categoryName, category, visibleCommands });
      }
    }

    return result;
  }, [commands, term]);

  // Auto-expand categories that have matches when searching
  useEffect(() => {
    if (!term) return;
    const toExpand = filteredStructure
      .filter(({ visibleCommands }) => visibleCommands.length > 0)
      .map(({ categoryName }) => categoryName);
    if (toExpand.length === 0) return;
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      toExpand.forEach((name) => next.add(name));
      return next;
    });
  }, [term, filteredStructure]);

  // Collapse all when clearing the search term (transition from non-empty -> empty)
  useEffect(() => {
    const prev = prevTermRef.current;
    if (prev && !term) {
      setExpandedCategories(new Set());
    }
    prevTermRef.current = term;
  }, [term]);

  const renderCategoryIcon = (category: CommandCategory) => {
    const key = category.emoji?.normal || '';
    const mapped = key && commandEmojiMap[key];
    if (mapped) {
      return <img src={`/badges/${mapped}`} alt={category.name} className="w-6 h-6 object-contain" loading="lazy" />;
    }
    if (category.emoji?.unicode) return <span className="text-2xl">{category.emoji.unicode}</span>;
    return <span className="text-2xl">📦</span>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-discord-darker text-white p-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <Loading size="lg" className="mx-auto" />
            <p className="mt-4 text-xl">Loading commands...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-discord-darker text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center">Commands</h1>
        
        {/* Search Bar */}
        <div className="relative mb-8">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search commands..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-discord-dark border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-discord-blurple focus:border-transparent"
          />
        </div>

        {/* Commands List */}
        <div className="space-y-6">
          {filteredStructure.map(({ categoryName, category, visibleCommands }) => (
            <div key={categoryName} className="bg-discord-dark border border-gray-600 rounded-lg overflow-hidden">
              <button
                onClick={() => toggleCategory(categoryName)}
                className="w-full px-6 py-4 text-left hover:bg-discord-darker transition-colors duration-200 flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  {renderCategoryIcon(category)}
                  <div>
                    <h2 className="text-xl font-semibold">{category.name}</h2>
                    <p className="text-gray-400 text-sm">{category.description}</p>
                  </div>
                </div>
                {expandedCategories.has(categoryName) ? (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                )}
              </button>
              
              {expandedCategories.has(categoryName) && (
                <div className="border-t border-gray-600">
                  <div className="grid gap-4 p-6">
                    {visibleCommands.map((command) => (
                      <div key={`${categoryName}-${command.name}`} className="bg-discord-darker p-4 rounded-lg border border-gray-700">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="text-lg font-semibold text-discord-blurple">{command.name}</h3>
                          <div className="flex space-x-2">
                            {command.premium_user && (
                              <span className="px-2 py-1 bg-yellow-600 text-black text-xs rounded-full font-semibold">
                                Premium User
                              </span>
                            )}
                            {command.premium_guild && (
                              <span className="px-2 py-1 bg-green-600 text-black text-xs rounded-full font-semibold">
                                Premium Guild
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <p className="text-gray-300 mb-3">{command.description}</p>
                        
                        <div className="grid md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <h4 className="font-semibold text-gray-400 mb-1">Message Usage:</h4>
                            <code className="bg-black px-2 py-1 rounded text-discord-green">
                              {command.message_usage}
                            </code>
                          </div>
                          
                          <div>
                            <h4 className="font-semibold text-gray-400 mb-1">Slash Usage:</h4>
                            <code className="bg-black px-2 py-1 rounded text-discord-green">
                              {command.slash_usage}
                            </code>
                          </div>
                        </div>
                        
                        {command.aliases.length > 0 && (
                          <div className="mt-3">
                            <h4 className="font-semibold text-gray-400 mb-1">Aliases:</h4>
                            <div className="flex flex-wrap gap-2">
                              {command.aliases.map((alias) => (
                                <span key={alias} className="bg-gray-700 px-2 py-1 rounded text-sm">
                                  {alias}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {command.cooldown > 0 && (
                          <div className="mt-3">
                            <h4 className="font-semibold text-gray-400 mb-1">Cooldown:</h4>
                            <span className="bg-gray-700 px-2 py-1 rounded text-sm">
                              {command.cooldown} seconds
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CommandsPage;
