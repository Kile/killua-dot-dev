import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Eye, EyeOff } from 'lucide-react';
import type { NewsResponse, EditNewsRequest } from '../types/news';
import { fetchAllNews, editNews, deleteNews } from '../services/newsService';
import Loading from './Loading';
import MarkdownRenderer from './MarkdownRenderer';
import UpdateProgression from './UpdateProgression';
import { getThumbnailClasses } from '../utils/imageUtils';

const NewsAdminPanel: React.FC = () => {
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const [news, setNews] = useState<NewsResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchNewsData();
  }, []);

  const fetchNewsData = async () => {
    try {
      setLoading(true);
      const token = getToken();
      const data = await fetchAllNews(token || undefined);
      setNews(data.news.sort((a: NewsResponse, b: NewsResponse) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ));
    } catch (err) {
      setError('Failed to load news');
      console.error('Error fetching news:', err);
    } finally {
      setLoading(false);
    }
  };


  const handleTogglePublish = async (newsId: string, published: boolean) => {
    const token = getToken();
    if (!token) return;

    try {
      const editRequest: EditNewsRequest = {
        published: published
      };
      await editNews(token, newsId, editRequest);
      await fetchNewsData();
    } catch (err) {
      console.error('Error toggling publish status:', err);
      setError(`Failed to ${published ? 'publish' : 'unpublish'} news`);
    }
  };

  const handleDelete = async (newsId: string) => {
    const token = getToken();
    if (!token || !confirm('Are you sure you want to delete this news item?')) return;

    try {
      await deleteNews(token, newsId);
      await fetchNewsData();
    } catch (err) {
      setError('Failed to delete news');
      console.error('Error deleting news:', err);
    }
  };


  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const truncateMarkdownContent = (content: string, maxLength: number = 150) => {
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

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">News Management</h2>
        <button
          onClick={() => navigate('/news/create')}
          className="flex items-center gap-2 bg-discord-blurple text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create News
        </button>
      </div>

      {error && (
        <div className="bg-red-900 border border-red-700 rounded-lg p-4">
          <p className="text-red-200">{error}</p>
        </div>
      )}

      {/* News List */}
      <div className="space-y-4">
        {news.map((newsItem) => (
          <div key={newsItem._id} className="bg-discord-dark border border-gray-600 rounded-lg p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    newsItem.published ? 'bg-green-600 text-green-100' : 'bg-orange-600 text-orange-100'
                  }`}>
                    {newsItem.published ? 'Published' : 'Draft'}
                  </span>
                  <span className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded-full">
                    {newsItem.type}
                  </span>
                  {newsItem.version && (
                    <span className="px-2 py-1 bg-blue-600 text-blue-100 text-xs rounded-full">
                      v{newsItem.version}
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-semibold text-white mb-1">{newsItem.title}</h3>
                
                {/* Update Progression */}
                {newsItem.type === 'update' && (
                  <div className="mb-2">
                    {getLastUpdate(newsItem) ? (
                      <UpdateProgression
                        lastUpdate={getLastUpdate(newsItem)!}
                        currentUpdate={{
                          title: newsItem.title,
                          version: newsItem.version,
                          timestamp: newsItem.timestamp,
                          published: newsItem.published
                        }}
                        variant="minimal"
                        isLatest={isLatestUpdate(newsItem)}
                      />
                    ) : (
                      <div className="flex items-center gap-2 text-xs text-blue-300">
                        <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                        <span>Initial Update</span>
                      </div>
                    )}
                  </div>
                )}
                
                <p className="text-sm text-gray-400 mb-2">
                  By {newsItem.author.display_name} • {formatDate(newsItem.timestamp)}
                </p>
                
                <div className="text-gray-300 mb-2">
                  <MarkdownRenderer 
                    content={truncateMarkdownContent(newsItem.content)} 
                    className="text-sm"
                  />
                </div>
                <p className="text-sm text-gray-400">
                  {newsItem.likes} likes
                </p>
              </div>
              
              {/* Image Preview - Top Right */}
              {newsItem.images && newsItem.images.length > 0 && (
                <div className={`ml-4 flex-shrink-0 ${getThumbnailClasses(newsItem.images[0])}`}>
                  <img 
                    src={newsItem.images[0]} 
                    alt={newsItem.title}
                    className="w-full h-full object-cover rounded-lg"
                  />
                </div>
              )}
            </div>
            
            {/* Edit Buttons - Bottom Right */}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => handleTogglePublish(newsItem._id, !newsItem.published)}
                className={`p-2 rounded-lg transition-colors ${
                  newsItem.published 
                    ? 'text-orange-400 hover:bg-orange-900' 
                    : 'text-green-400 hover:bg-green-900'
                }`}
                title={newsItem.published ? 'Unpublish' : 'Publish'}
              >
                {newsItem.published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              <button
                onClick={() => navigate(`/news/${newsItem._id}/edit`)}
                className="p-2 text-blue-400 hover:bg-blue-900 rounded-lg transition-colors"
                title="Edit"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(newsItem._id)}
                className="p-2 text-red-400 hover:bg-red-900 rounded-lg transition-colors"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NewsAdminPanel;
