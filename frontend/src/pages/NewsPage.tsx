import React, { useState, useEffect, useMemo } from 'react';
import { Heart, Calendar, ChevronRight, Edit, Search, Filter, SortAsc } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { NewsResponse } from '../types/news';
import { fetchAllNews, likeNews } from '../services/newsService';
import { checkAdminStatus } from '../services/adminService';
import { useAuth } from '../contexts/AuthContext';
import Loading from '../components/Loading';
import NewsTypeBadge from '../components/NewsTypeBadge';
import LinkIcon from '../components/LinkIcon';
import MarkdownRenderer from '../components/MarkdownRenderer';
import UpdateProgression from '../components/UpdateProgression';
import StyledSelect from '../components/StyledSelect';
import { getThumbnailClasses } from '../utils/imageUtils';

const NewsPage: React.FC = () => {
  const [news, setNews] = useState<NewsResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [likingNews, setLikingNews] = useState<Set<string>>(new Set());
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'title' | 'type'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterType, setFilterType] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const { user, getToken } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    fetchNews();
  }, [location.pathname]);

  // Check admin status when user changes
  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) {
        setIsAdmin(false);
        return;
      }
      
      try {
        const token = getToken();
        if (!token) {
          setIsAdmin(false);
          return;
        }
        
        const adminCheck = await checkAdminStatus(token);
        setIsAdmin(adminCheck.isAdmin);
      } catch (err) {
        console.error('Error checking admin status:', err);
        setIsAdmin(false);
      }
    };
    
    checkAdmin();
  }, [user, getToken]);

  // Also refresh when the page becomes visible (for cases where pathname doesn't change)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && location.pathname === '/news') {
        fetchNews();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [location.pathname]);

  const fetchNews = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = getToken();
      const data = await fetchAllNews(token || undefined);
      // Sort by timestamp (newest first)
      const sortedNews = data.news.sort((a: NewsResponse, b: NewsResponse) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      setNews(sortedNews);
    } catch (err) {
      setError('Failed to load news');
      console.error('Error fetching news:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (newsId: string) => {
    const token = getToken();
    if (!token) {
      // User needs to be logged in to like
      return;
    }

    try {
      setLikingNews(prev => new Set(prev).add(newsId));
      await likeNews(token, newsId);
      
      // Update the local state to reflect the like/unlike
      setNews(prevNews => 
        prevNews.map(item => {
          if (item._id === newsId) {
            const wasLiked = item.liked;
            return {
              ...item,
              liked: !wasLiked,
              likes: wasLiked ? item.likes - 1 : item.likes + 1,
            };
          }
          return item;
        })
      );
    } catch (err) {
      console.error('Error liking news:', err);
    } finally {
      setLikingNews(prev => {
        const newSet = new Set(prev);
        newSet.delete(newsId);
        return newSet;
      });
    }
  };


  const truncateContent = (content: string, maxLength: number = 200) => {
    if (content.length <= maxLength) return content;
    
    // Find a good truncation point (end of sentence or word)
    let truncateAt = maxLength;
    const lastSentence = content.lastIndexOf('.', maxLength);
    const lastSpace = content.lastIndexOf(' ', maxLength);
    
    if (lastSentence > maxLength * 0.7) {
      truncateAt = lastSentence + 1;
    } else if (lastSpace > maxLength * 0.8) {
      truncateAt = lastSpace;
    }
    
    return content.substring(0, truncateAt) + '...';
  };

  const getLastUpdate = (currentUpdate: NewsResponse) => {
    if (currentUpdate.type !== 'update') return null;
    
    // Find the most recent update before this one
    const updatePosts = news.filter(item => 
      item.type === 'update' && 
      item.published && 
      item._id !== currentUpdate._id &&
      new Date(item.timestamp) < new Date(currentUpdate.timestamp)
    );
    
    if (updatePosts.length === 0) return null;
    
    // Sort by timestamp and get the most recent
    const sortedUpdates = updatePosts.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    
    return sortedUpdates[0];
  };

  const isLatestUpdate = (currentUpdate: NewsResponse) => {
    if (currentUpdate.type !== 'update') return true;
    
    // Check if there are any newer updates
    const newerUpdates = news.filter(item => 
      item.type === 'update' && 
      item.published && 
      item._id !== currentUpdate._id &&
      new Date(item.timestamp) > new Date(currentUpdate.timestamp)
    );
    
    return newerUpdates.length === 0;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Filter and sort news
  const filteredAndSortedNews = useMemo(() => {
    let filtered = news.filter(article => {
      // Search filter
      const matchesSearch = searchQuery === '' || 
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.content.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Type filter
      const matchesType = filterType === 'all' || article.type === filterType;
      
      return matchesSearch && matchesType;
    });

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
          break;
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'type':
          comparison = a.type.localeCompare(b.type);
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [news, searchQuery, sortBy, sortOrder, filterType]);


  if (loading) {
    return (
      <div className="min-h-screen bg-discord-darker flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-discord-darker text-white py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-400 mb-4">Error Loading News</h1>
            <p className="text-gray-400 mb-4">{error}</p>
            <button
              onClick={fetchNews}
              className="bg-discord-blurple hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-discord-darker text-white py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">Latest News</h1>
              <p className="text-gray-400">Stay updated with the latest announcements and updates</p>
            </div>
            {isAdmin && (
              <button
                onClick={() => navigate('/admin?page=news')}
                className="flex items-center gap-2 bg-discord-blurple text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors self-start"
              >
                <Edit className="w-4 h-4" />
                Manage News
              </button>
            )}
          </div>

          {/* Search and Filter Controls */}
          <div className="mt-6 space-y-4">
            {/* Search Bar with Filter Toggle */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search news articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-10 pr-12 py-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-discord-blurple focus:border-discord-blurple"
              />
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded transition-colors ${
                  showFilters 
                    ? 'text-discord-blurple bg-discord-blurple/20' 
                    : 'text-gray-400 hover:text-gray-300'
                }`}
                title="Toggle filters and sorting"
              >
                <Filter className="w-4 h-4" />
              </button>
            </div>

            {/* Sort and Filter Controls - Collapsible */}
            {showFilters && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Sort By */}
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      <SortAsc className="w-4 h-4 inline mr-1" />
                      Sort by
                    </label>
                    <StyledSelect
                      value={sortBy}
                      onChange={(value) => setSortBy(value as 'date' | 'title' | 'type')}
                      options={[
                        { value: 'date', label: 'Date' },
                        { value: 'title', label: 'Title' },
                        { value: 'type', label: 'Type' }
                      ]}
                    />
                  </div>

                  {/* Sort Order */}
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-300 mb-2">Order</label>
                    <StyledSelect
                      value={sortOrder}
                      onChange={(value) => setSortOrder(value as 'asc' | 'desc')}
                      options={[
                        { value: 'desc', label: 'Descending' },
                        { value: 'asc', label: 'Ascending' }
                      ]}
                    />
                  </div>

                  {/* Filter by Type */}
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      <Filter className="w-4 h-4 inline mr-1" />
                      Filter by type
                    </label>
                    <StyledSelect
                      value={filterType}
                      onChange={setFilterType}
                      options={[
                        { value: 'all', label: 'All Types' },
                        { value: 'announcement', label: 'Announcement' },
                        { value: 'update', label: 'Update' },
                        { value: 'post', label: 'Post' }
                      ]}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Results Count */}
            <div className="text-sm text-gray-400">
              Showing {filteredAndSortedNews.length} of {news.length} articles
            </div>
          </div>
        </div>

        {news.length === 0 ? (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold mb-4">No News Available</h2>
            <p className="text-gray-400 text-lg">No news articles available at the moment.</p>
          </div>
        ) : filteredAndSortedNews.length === 0 ? (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold mb-4">No Results Found</h2>
            <p className="text-gray-400 text-lg">Try adjusting your search or filter criteria.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredAndSortedNews.map((article) => {
              const isLiked = article.liked;
              const isLiking = likingNews.has(article._id);
              
              return (
                <article 
                  key={article._id}
                  className="bg-discord-dark border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <NewsTypeBadge type={article.type} size="sm" />
                        {article.version && (
                          <span className="px-2 py-1 bg-gray-600 text-gray-200 rounded-full text-xs font-medium">
                            v{article.version}
                          </span>
                        )}
                        {!article.published && (
                          <span className="px-2 py-1 bg-yellow-600 text-yellow-100 rounded-full text-xs font-medium">
                            Draft
                          </span>
                        )}
                      </div>
                      <h2 className="text-2xl font-semibold mb-1">{article.title}</h2>
                      
                      {/* Update Progression */}
                      {article.type === 'update' && (
                        <div className="mb-2">
                          {getLastUpdate(article) ? (
                            <UpdateProgression
                              lastUpdate={getLastUpdate(article) || undefined}
                              currentUpdate={{
                                title: article.title,
                                version: article.version,
                                timestamp: article.timestamp,
                                published: article.published
                              }}
                              variant="minimal"
                              isLatest={isLatestUpdate(article)}
                            />
                          ) : (
                            <div className="flex items-center gap-2 text-xs text-blue-300">
                              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                              <span>Initial Update</span>
                            </div>
                          )}
                        </div>
                      )}
                      
                      <div className="prose prose-sm max-w-none mb-3">
                        <MarkdownRenderer 
                          content={truncateContent(article.content)} 
                          className="text-gray-300 leading-relaxed"
                        />
                      </div>
                    </div>
                    {article.images && article.images.length > 0 && (
                      <div className={`ml-4 flex-shrink-0 ${getThumbnailClasses(article.images[0])}`}>
                        <img 
                          src={article.images[0]} 
                          alt={article.title}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <div className="flex items-center gap-1">
                        <img 
                          src={article.author.avatar_url} 
                          alt={article.author.display_name}
                          className="w-4 h-4 rounded-full"
                        />
                        <span>{article.author.display_name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(article.timestamp)}</span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleLike(article._id)}
                            disabled={isLiking || !getToken()}
                            className={`flex items-center gap-1 px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                              isLiked 
                                ? 'bg-red-600 text-white hover:bg-red-700' 
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            } ${!getToken() ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                            <span>{article.likes}</span>
                          </button>

                          {/* Links next to like button */}
                          {article.links && Object.keys(article.links).length > 0 && (
                            <div className="flex items-center gap-2">
                              {Object.entries(article.links).map(([key, url]) => (
                                <a
                                  key={key}
                                  href={String(url)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 px-2 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white rounded-lg text-sm transition-colors"
                                  title={`${key} - ${url}`}
                                >
                                  <LinkIcon linkName={key} className="w-3 h-3" />
                                  <span className="hidden sm:inline">{key}</span>
                                </a>
                              ))}
                            </div>
                          )}
                        </div>

                        <a
                          href={`/news/${article._id}`}
                          className="flex items-center gap-1 text-discord-blurple hover:text-blue-400 text-sm font-medium"
                        >
                          Read More
                          <ChevronRight className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default NewsPage;