import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Heart, Calendar, ArrowLeft, Clock, Edit } from 'lucide-react';
import type { NewsResponse } from '../types/news';
import { fetchNewsById, likeNews, fetchAllNews } from '../services/newsService';
import { checkAdminStatus } from '../services/adminService';
import { useAuth } from '../contexts/AuthContext';
import Loading from '../components/Loading';
import NewsTypeBadge from '../components/NewsTypeBadge';
import LinkIcon from '../components/LinkIcon';
import MarkdownRenderer from '../components/MarkdownRenderer';
import UpdateProgression from '../components/UpdateProgression';
import SmartImageLayout from '../components/SmartImageLayout';

const NewsDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [news, setNews] = useState<NewsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<NewsResponse | null>(null);
  const [allNews, setAllNews] = useState<NewsResponse[]>([]);
  const [liking, setLiking] = useState(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const { getToken, user } = useAuth();

  useEffect(() => {
    if (id) {
      fetchNewsItem(id);
    }
  }, [id]);

  useEffect(() => {
    const fetchAllNewsData = async () => {
      try {
        const token = getToken();
        const data = await fetchAllNews(token || undefined);
        setAllNews(data.news);
      } catch (err) {
        console.error('Error fetching all news:', err);
      }
    };
    fetchAllNewsData();
  }, []);

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

  useEffect(() => {
    if (news && news.type === 'update' && allNews.length > 0) {
      // Find the most recent update before this one
      const updatePosts = allNews.filter(item => 
        item.type === 'update' && 
        item.published && 
        item._id !== news._id &&
        new Date(item.timestamp) < new Date(news.timestamp)
      );
      
      if (updatePosts.length > 0) {
        // Sort by timestamp and get the most recent
        const sortedUpdates = updatePosts.sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        setLastUpdate(sortedUpdates[0]);
      } else {
        setLastUpdate(null);
      }
    } else {
      setLastUpdate(null);
    }
  }, [news, allNews]);

  const isLatestUpdate = (currentUpdate: NewsResponse) => {
    if (currentUpdate.type !== 'update') return true;
    
    // Check if there are any newer updates
    const newerUpdates = allNews.filter(item => 
      item.type === 'update' && 
      item.published && 
      item._id !== currentUpdate._id &&
      new Date(item.timestamp) > new Date(currentUpdate.timestamp)
    );
    
    return newerUpdates.length === 0;
  };

  const fetchNewsItem = async (newsId: string) => {
    try {
      setLoading(true);
      setError(null);
      const token = getToken();
      const data = await fetchNewsById(newsId, token || undefined);
      setNews(data);
    } catch (err) {
      setError('Failed to load news article');
      console.error('Error fetching news item:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    const token = getToken();
    if (!token || !news) return;

    try {
      setLiking(true);
      await likeNews(token, news._id);
      
      // Update the local state to reflect the like/unlike
      const wasLiked = news.liked;
      setNews((prev: NewsResponse | null) => prev ? {
        ...prev,
        liked: !wasLiked,
        likes: wasLiked ? prev.likes - 1 : prev.likes + 1,
      } : null);
    } catch (err) {
      console.error('Error liking news:', err);
    } finally {
      setLiking(false);
    }
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Determine back destination based on referrer or location state
  const getBackDestination = () => {
    // Check if we came from admin panel via location state
    if (location.state?.fromAdmin) {
      return { path: '/admin', label: 'Back to Admin Panel' };
    }
    
    // Default to news page
    return { path: '/news', label: 'Back to News' };
  };

  const handleBackClick = () => {
    const destination = getBackDestination();
    navigate(destination.path);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-discord-darker flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  if (error || !news) {
    return (
      <div className="min-h-screen bg-discord-darker text-white py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white mb-4">News Article</h1>
            <div className="bg-red-900 border border-red-700 rounded-lg p-6">
              <p className="text-red-200">{error || 'Article not found'}</p>
              <button 
                onClick={() => navigate('/news')}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Back to News
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isLiked = news.liked;

  return (
    <div className="min-h-screen bg-discord-darker text-white py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-6">
          <div className="flex justify-between items-start">
            <button
              onClick={handleBackClick}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              {getBackDestination().label}
            </button>
            {isAdmin && (
              <button
                onClick={() => navigate('/admin?page=news')}
                className="flex items-center gap-2 bg-discord-blurple text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
              >
                <Edit className="w-4 h-4" />
                Manage News
              </button>
            )}
          </div>
        </div>

        <article className="bg-discord-dark rounded-lg border border-gray-600 p-8">
          <header className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <NewsTypeBadge type={news.type} size="md" />
              {news.version && (
                <span className="px-3 py-1 bg-gray-700 text-gray-300 text-sm rounded-full">
                  v{news.version}
                </span>
              )}
              {!news.published && (
                <span className="px-3 py-1 bg-green-600 text-green-100 text-sm rounded-full">
                  Draft
                </span>
              )}
            </div>

            <h1 className="text-3xl font-bold text-white mb-4">
              {news.title}
            </h1>

            <div className="flex items-center gap-6 text-sm text-gray-400 mb-2">
              <div className="flex items-center gap-2">
                <img 
                  src={news.author.avatar_url} 
                  alt={news.author.display_name}
                  className="w-6 h-6 rounded-full"
                />
                <span>{news.author.display_name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(news.timestamp)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>{Math.ceil(news.content.split(' ').length / 200)} min read</span>
              </div>
            </div>

          </header>

          {/* Update Progression */}
          {news.type === 'update' && lastUpdate && (
            <div className="mb-6">
              <UpdateProgression
                lastUpdate={lastUpdate}
                currentUpdate={{
                  title: news.title,
                  version: news.version,
                  timestamp: news.timestamp,
                  published: news.published
                }}
                variant="full"
                isLatest={isLatestUpdate(news)}
              />
            </div>
          )}

          <MarkdownRenderer content={news.content} />

          {/* Images */}
          {news.images && news.images.length > 0 && (
            <div className="mt-4">
              <SmartImageLayout images={news.images} />
            </div>
          )}

          {/* Like Button and Links */}
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Links next to like button */}
              {news.links && Object.keys(news.links).length > 0 && (
                <div className="flex items-center gap-2">
                  {Object.entries(news.links).map(([key, url]) => (
                    <a
                      key={key}
                      href={String(url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white rounded-lg transition-colors"
                      title={`${key} - ${url}`}
                    >
                      <LinkIcon linkName={key} className="w-4 h-4" />
                      <span>{key}</span>
                    </a>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={handleLike}
              disabled={!getToken() || liking}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                isLiked 
                  ? 'bg-red-600 text-white hover:bg-red-700' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              } ${!getToken() ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
              <span>{news.likes} {news.likes === 1 ? 'like' : 'likes'}</span>
            </button>
          </div>
        </article>
      </div>
    </div>
  );
};

export default NewsDetailPage;
