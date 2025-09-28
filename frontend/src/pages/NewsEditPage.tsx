import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Upload, X } from 'lucide-react';
import type { CreateNewsRequest, EditNewsRequest, NewsType } from '../types/news';
import { fetchNewsById, saveNews, editNews, fetchAllNews } from '../services/newsService';
import { uploadImage } from '../services/imageService';
import { useAuth } from '../contexts/AuthContext';
import Loading from '../components/Loading';
import NewsTypeSelect from '../components/NewsTypeSelect';
import StyledSelect from '../components/StyledSelect';
import ToggleSwitch from '../components/ToggleSwitch';
import LinkTypeSelect from '../components/LinkTypeSelect';
import UpdateProgression from '../components/UpdateProgression';
import { getDefaultPlaceholderUrl, getDefaultPlaceholderAlt } from '../utils/imageUtils';

const NewsEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getToken, user } = useAuth();
  const isEdit = !!id;

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<CreateNewsRequest & { published?: boolean }>({
    title: '',
    content: '',
    type: 'news',
    version: '',
    links: {},
    images: [],
    published: false,
    notify_users: {
      type: 'group',
      data: 'all'
    }
  });

  const [linkInputs, setLinkInputs] = useState<{ key: string; value: string }[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<any>(null);
  const [showDefaultImage, setShowDefaultImage] = useState(true);

  // Check if user is logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-discord-darker flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Not Logged In</h1>
          <p className="text-gray-400 mb-4">Please log in to {isEdit ? 'edit' : 'create'} news articles.</p>
          <button
            onClick={() => navigate('/')}
            className="bg-discord-blurple hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  useEffect(() => {
    if (isEdit && id) {
      fetchNewsItem(id);
    }
  }, [id, isEdit]);

  const fetchLastUpdate = async () => {
    try {
      const token = getToken();
      const data = await fetchAllNews(token || undefined);
      const updatePosts = data.news.filter((item: any) => item.type === 'update' && item.published);
      if (updatePosts.length > 0) {
        // Sort by timestamp and get the most recent
        const sortedUpdates = updatePosts.sort((a: any, b: any) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        setLastUpdate(sortedUpdates[0]);
      } else {
        setLastUpdate(null);
      }
    } catch (err) {
      console.error('Error fetching last update:', err);
      setLastUpdate(null);
    }
  };

  useEffect(() => {
    if (formData.type === 'update') {
      fetchLastUpdate();
    } else {
      setLastUpdate(null);
    }
  }, [formData.type]);

  const fetchNewsItem = async (newsId: string) => {
    try {
      setLoading(true);
      setError(null);
      const token = getToken();
      const data = await fetchNewsById(newsId, token || undefined);
      
      setFormData({
        title: data.title,
        content: data.content,
        type: data.type,
        version: data.version || '',
        links: data.links || {},
        images: data.images || [],
        published: data.published,
        notify_users: data.notify_users
      });
      
      // Set default image visibility based on whether the news item has custom images
      setShowDefaultImage(!data.images || data.images.length === 0);
      
      // Convert links object to input array
      const linksArray = Object.entries(data.links || {}).map(([key, value]) => ({ key, value: String(value) }));
      setLinkInputs(linksArray);
    } catch (err) {
      setError('Failed to load news article');
      console.error('Error fetching news item:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBackClick = () => {
    navigate('/admin?page=news');
  };

  const handleSave = async () => {
    const token = getToken();
    if (!token) {
      setError('You must be logged in to save news');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      // Process links
      const links: Record<string, string> = {};
      linkInputs.forEach(({ key, value }) => {
        if (key.trim() && value.trim()) {
          links[key.trim()] = value.trim();
        }
      });

      // Process images - include default image if no custom images and default is enabled
      let processedImages = formData.images || [];
      
      // If no custom images but default image is enabled, add the default image
      if (processedImages.length === 0 && showDefaultImage) {
        processedImages = [getDefaultPlaceholderUrl(formData.type)];
      }

      if (isEdit && id) {
        // Edit existing news
        const editRequest: EditNewsRequest = {
          title: formData.title,
          content: formData.content,
          type: formData.type,
          version: formData.version,
          links: Object.keys(links).length > 0 ? links : undefined,
          images: processedImages.length > 0 ? processedImages : undefined,
          published: formData.published,
          notify_users: formData.notify_users
        };
        
        await editNews(token, id, editRequest);
        navigate(`/news/${id}`);
      } else {
        // Create new news
        const createRequest: CreateNewsRequest = {
          title: formData.title,
          content: formData.content,
          type: formData.type,
          version: formData.version,
          links: Object.keys(links).length > 0 ? links : undefined,
          images: processedImages.length > 0 ? processedImages : undefined,
          published: formData.published,
          notify_users: formData.notify_users
        };
        
        const result = await saveNews(token, createRequest);
        navigate(`/news/${result.news_id}`);
      }
    } catch (err) {
      setError('Failed to save news');
      console.error('Error saving news:', err);
    } finally {
      setSaving(false);
    }
  };

  const addLinkInput = () => {
    setLinkInputs([...linkInputs, { key: '', value: '' }]);
  };

  const removeLinkInput = (index: number) => {
    setLinkInputs(linkInputs.filter((_, i) => i !== index));
  };

  const updateLinkInput = (index: number, field: 'key' | 'value', value: string) => {
    const newInputs = [...linkInputs];
    newInputs[index][field] = value;
    setLinkInputs(newInputs);
  };

  const handleImageUpload = async (file: File) => {
    const token = getToken();
    if (!token) return;

    try {
      setUploadingImage(true);
      const timestamp = Date.now();
      const fileName = `news-${timestamp}-${file.name}`;
      const path = `news/${fileName}`;
      const uploadResult = await uploadImage(token, file, path);
      
        const externalApiBaseUrl = import.meta.env.VITE_EXTERNAL_API_BASE_URL || 'https://api.killua.dev';
      const imageUrl = `${externalApiBaseUrl}/image/${uploadResult.path}`;
      
      setFormData(prev => ({
        ...prev,
        images: [...(prev.images || []), imageUrl]
      }));
    } catch (err) {
      console.error('Error uploading image:', err);
    } finally {
      setUploadingImage(false);
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images?.filter((_, i) => i !== index) || []
    }));
  };

  if (loading) {
    return <Loading />;
  }

  if (error && isEdit) {
    return (
      <div className="min-h-screen bg-discord-darker text-white py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-400 mb-4">Error Loading News</h1>
            <p className="text-gray-400 mb-4">{error}</p>
            <button
              onClick={() => navigate('/news')}
              className="bg-discord-blurple hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Back to News
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-discord-darker text-white py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-6">
          <button
            onClick={handleBackClick}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Admin Panel
          </button>
          <h1 className="text-3xl font-bold">
            {isEdit ? 'Edit News Article' : 'Create News Article'}
          </h1>
        </div>

        <div className="bg-discord-dark rounded-lg border border-gray-600 p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-900 border border-red-700 rounded-lg">
              <p className="text-red-200">{error}</p>
            </div>
          )}

          <div className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-discord-blurple focus:border-discord-blurple"
                placeholder="Enter news title"
              />
            </div>

            {/* Content */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Content</label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                rows={10}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-discord-blurple focus:border-discord-blurple"
                placeholder="Enter news content (supports markdown)"
              />
            </div>

            {/* News Type and Version */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Type</label>
                <NewsTypeSelect
                  value={formData.type}
                  onChange={(value) => setFormData(prev => ({ ...prev, type: value as NewsType }))}
                />
              </div>
              {formData.type === 'update' && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Version <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.version}
                    onChange={(e) => setFormData(prev => ({ ...prev, version: e.target.value }))}
                    className={`w-full bg-gray-700 border rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-discord-blurple focus:border-discord-blurple ${
                      formData.type === 'update' && !formData.version?.trim() 
                        ? 'border-red-500' 
                        : 'border-gray-600'
                    }`}
                    placeholder="e.g., 1.0.0"
                    required
                  />
                  {formData.type === 'update' && !formData.version?.trim() && (
                    <p className="text-red-400 text-sm mt-1">Version is required for update posts</p>
                  )}
                </div>
              )}
            </div>

            {/* Update Progression Visual */}
            {formData.type === 'update' && (
              <UpdateProgression
                lastUpdate={lastUpdate}
                currentUpdate={{
                  title: formData.title,
                  version: formData.version,
                  timestamp: new Date().toISOString(),
                  published: formData.published
                }}
                variant="full"
              />
            )}

            {/* Links */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-300">Links</label>
                <button
                  type="button"
                  onClick={addLinkInput}
                  className="text-discord-blurple hover:text-blue-400 text-sm"
                >
                  Add Link
                </button>
              </div>
              <div className="space-y-2">
                {linkInputs.map((link, index) => (
                  <div key={index} className="flex gap-2">
                    <div className="flex-1">
                      <LinkTypeSelect
                        value={link.key}
                        onChange={(value) => updateLinkInput(index, 'key', value)}
                        placeholder="Select link type"
                      />
                    </div>
                    <input
                      type="url"
                      value={link.value}
                      onChange={(e) => updateLinkInput(index, 'value', e.target.value)}
                      className="flex-2 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-discord-blurple focus:border-discord-blurple"
                      placeholder="https://..."
                    />
                    <button
                      type="button"
                      onClick={() => removeLinkInput(index)}
                      className="p-2 text-red-400 hover:bg-red-900 rounded-lg"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Images */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-300">Images</label>
                {(!formData.images || formData.images.length === 0) && !showDefaultImage && (
                  <button
                    onClick={() => setShowDefaultImage(true)}
                    className="text-discord-blurple hover:text-blue-400 text-sm"
                  >
                    Restore Default Image
                  </button>
                )}
              </div>
              <div className="space-y-4">
                {/* Image Upload */}
                <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(file);
                    }}
                    className="hidden"
                    id="image-upload"
                    disabled={uploadingImage}
                  />
                  <label htmlFor="image-upload" className="cursor-pointer">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-400">
                      {uploadingImage ? 'Uploading...' : 'Click to upload image'}
                    </p>
                  </label>
                </div>

                {/* Selected Images */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {/* Show default placeholder if no images uploaded and default image is enabled */}
                  {(!formData.images || formData.images.length === 0) && showDefaultImage && (
                    <div className="relative group">
                      <img
                        src={getDefaultPlaceholderUrl(formData.type)}
                        alt={getDefaultPlaceholderAlt(formData.type)}
                        className="w-full h-32 object-cover rounded-lg opacity-50"
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-black/50 text-white text-xs px-2 py-1 rounded">
                          Default {formData.type}
                        </div>
                      </div>
                      <button
                        onClick={() => setShowDefaultImage(false)}
                        className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  
                  {/* Show uploaded images */}
                  {formData.images && formData.images.map((imageUrl, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={imageUrl}
                        alt={`Upload ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Publish Settings */}
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-300">Publish immediately</label>
              <ToggleSwitch
                checked={formData.published || false}
                onChange={(checked) => setFormData(prev => ({ ...prev, published: checked }))}
                size="md"
                color="blue"
              />
            </div>

            {/* Notification Settings */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Notification Settings</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Type</label>
                  <StyledSelect
                    value={formData.notify_users.type}
                    onChange={(value) => setFormData(prev => ({ 
                      ...prev, 
                      notify_users: { ...prev.notify_users, type: value as 'group' | 'specific' }
                    }))}
                    options={[
                      { value: 'group', label: 'Group' },
                      { value: 'specific', label: 'Specific Users' }
                    ]}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Target</label>
                  <input
                    type="text"
                    value={typeof formData.notify_users.data === 'string' ? formData.notify_users.data : Array.isArray(formData.notify_users.data) ? formData.notify_users.data.join(', ') : ''}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      notify_users: { ...prev.notify_users, data: e.target.value }
                    }))}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-discord-blurple focus:border-discord-blurple"
                    placeholder="all, premium, or user IDs"
                  />
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end gap-4">
              <button
                onClick={handleBackClick}
                className="px-6 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !formData.title.trim() || !formData.content.trim() || (formData.type === 'update' && !formData.version?.trim())}
                className="flex items-center gap-2 px-6 py-2 bg-discord-blurple text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : (isEdit ? 'Update' : 'Create')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewsEditPage;
