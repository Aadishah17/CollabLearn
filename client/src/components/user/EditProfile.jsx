import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Upload,
  User,
  FileText,
  Camera,
  Save,
  AlertCircle,
  CheckCircle,
  Sparkles,
} from 'lucide-react';
import Avatar from './Avatar';
import { validateAvatarFile } from '../../utils/avatarUtils';
import { API_URL } from '../../config';

export default function EditProfile({ isOpen, onClose, profileData, onSave }) {
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    avatar: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [imagePreview, setImagePreview] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const fileInputRef = useRef(null);

  // Initialize form data when modal opens or profile data changes
  useEffect(() => {
    if (isOpen && profileData) {
      const initialData = {
        name: profileData.name || '',
        bio: profileData.bio || '',
        avatar: profileData.avatar || '',
      };
      setFormData(initialData);
      setImagePreview(profileData.avatar || '');
      setErrors({});
      setSuccessMessage('');
      setHasChanges(false);
    }
  }, [isOpen, profileData]);

  // Check for changes
  useEffect(() => {
    if (profileData) {
      const hasNameChange = formData.name !== (profileData.name || '');
      const hasBioChange = formData.bio !== (profileData.bio || '');
      const hasAvatarChange = formData.avatar !== (profileData.avatar || '');
      setHasChanges(hasNameChange || hasBioChange || hasAvatarChange);
    }
  }, [formData, profileData]);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  // Handle file upload
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file
    const validation = validateAvatarFile(file);
    if (!validation.isValid) {
      setErrors((prev) => ({
        ...prev,
        avatar: validation.errors[0],
      }));
      return;
    }

    setUploadingImage(true);
    setErrors((prev) => ({ ...prev, avatar: '' }));

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Please login again to upload avatar.');
      }

      const uploadData = new FormData();
      uploadData.append('avatar', file);

      const response = await fetch(`${API_URL}/api/auth/avatar`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: uploadData,
      });

      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.message || 'Failed to upload avatar');
      }

      const avatarUrl = payload.user?.avatar || '';
      setImagePreview(avatarUrl);
      setFormData((prev) => ({
        ...prev,
        avatar: avatarUrl,
      }));

      if (avatarUrl) {
        localStorage.setItem('userAvatar', avatarUrl);
      } else {
        localStorage.removeItem('userAvatar');
      }

      window.dispatchEvent(
        new CustomEvent('profileUpdated', {
          detail: {
            avatar: avatarUrl,
          },
        })
      );
    } catch (error) {
      console.error('Error processing image:', error);
      setErrors((prev) => ({
        ...prev,
        avatar: error.message || 'Failed to upload image. Please try again.',
      }));
    } finally {
      setUploadingImage(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveImage = () => {
    setImagePreview('');
    setFormData((prev) => ({
      ...prev,
      avatar: '',
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    } else if (formData.name.trim().length > 50) {
      newErrors.name = 'Name cannot exceed 50 characters';
    }

    if (formData.bio.length > 500) {
      newErrors.bio = 'Bio cannot exceed 500 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (!hasChanges) {
      setSuccessMessage('No changes to save');
      setTimeout(() => setSuccessMessage(''), 2000);
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      await onSave(formData);
      setSuccessMessage('Profile updated successfully!');
      setTimeout(() => {
        setSuccessMessage('');
        onClose();
      }, 1200);
    } catch (error) {
      console.error('Error updating profile:', error);
      setErrors({
        submit: error.message || 'Failed to update profile. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: profileData?.name || '',
      bio: profileData?.bio || '',
      avatar: profileData?.avatar || '',
    });
    setImagePreview(profileData?.avatar || '');
    setErrors({});
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="surface-card card-spotlight border border-white/10 rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.8)] w-full max-w-lg max-h-[90vh] mx-auto overflow-hidden flex flex-col relative animate-fade-in">
        {/* Header with Glowing Accent */}
        <div className="relative bg-gradient-to-r from-red-600/30 via-orange-600/20 to-transparent border-b border-white/10 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
              <User size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Edit Profile</h2>
              <p className="text-xs text-gray-400">Update your public credentials and bio</p>
            </div>
          </div>
          <button
            onClick={handleCancel}
            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            disabled={loading}
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1 p-6 space-y-6">
          {successMessage && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center gap-3">
              <CheckCircle size={18} className="text-emerald-400 flex-shrink-0" />
              <p className="text-emerald-300 text-sm font-medium">{successMessage}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Avatar Upload Hub */}
            <div className="flex flex-col items-center space-y-4">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-red-500 via-orange-500 to-amber-500 rounded-full blur-md opacity-75 group-hover:opacity-100 transition duration-300"></div>
                <div className="relative rounded-full ring-4 ring-black">
                  <Avatar
                    src={imagePreview}
                    name={formData.name}
                    size="2xl"
                    onClick={handleAvatarClick}
                    showUploadIcon={!uploadingImage}
                    className="cursor-pointer hover:scale-105 transition-transform duration-300 shadow-xl"
                  />
                  {uploadingImage && (
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm rounded-full flex items-center justify-center">
                      <div className="w-7 h-7 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={handleAvatarClick}
                  disabled={uploadingImage}
                  className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-xs font-semibold transition-all hover:border-red-500/40 cursor-pointer disabled:opacity-50"
                >
                  <Camera size={14} className="text-red-400" />
                  <span>
                    {imagePreview && imagePreview !== 'default' ? 'Change Photo' : 'Upload Photo'}
                  </span>
                </button>

                {imagePreview && imagePreview !== 'default' && (
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    disabled={uploadingImage}
                    className="flex items-center gap-1.5 px-3 py-2 bg-white/5 hover:bg-red-500/20 border border-white/10 text-gray-400 hover:text-red-400 rounded-xl text-xs font-medium transition-all cursor-pointer disabled:opacity-50"
                  >
                    <X size={14} />
                    <span>Remove</span>
                  </button>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />

              {errors.avatar && (
                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs">
                  <AlertCircle size={14} className="flex-shrink-0" />
                  <p>{errors.avatar}</p>
                </div>
              )}
            </div>

            {/* Name Field */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                  <User size={13} className="text-red-400" />
                  Full Name *
                </label>
                <span className="text-[11px] font-mono text-gray-500">
                  {formData.name.length}/50
                </span>
              </div>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 bg-black/60 border rounded-xl text-white text-sm focus:outline-none transition-all placeholder:text-gray-600 ${
                  errors.name
                    ? 'border-red-500/60 focus:border-red-500'
                    : 'border-white/10 focus:border-red-500/60'
                }`}
                placeholder="Enter your full name"
                disabled={loading}
                required
              />
              {errors.name && (
                <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
                  <AlertCircle size={12} /> {errors.name}
                </p>
              )}
            </div>

            {/* Bio Field */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                  <FileText size={13} className="text-red-400" />
                  Bio / Overview
                </label>
                <span className="text-[11px] font-mono text-gray-500">
                  {formData.bio.length}/500
                </span>
              </div>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                rows="4"
                className={`w-full px-4 py-3 bg-black/60 border rounded-xl text-white text-sm focus:outline-none transition-all resize-none placeholder:text-gray-600 ${
                  errors.bio
                    ? 'border-red-500/60 focus:border-red-500'
                    : 'border-white/10 focus:border-red-500/60'
                }`}
                placeholder="Describe your background, areas of expertise, and mentorship focus..."
                disabled={loading}
              />
              {errors.bio && (
                <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
                  <AlertCircle size={12} /> {errors.bio}
                </p>
              )}
            </div>

            {errors.submit && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-2 text-red-400 text-xs">
                <AlertCircle size={14} className="flex-shrink-0" />
                <p>{errors.submit}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 px-4 py-3 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 transition-all text-sm font-semibold cursor-pointer"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !hasChanges}
                className={`flex-1 px-4 py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-lg ${
                  hasChanges && !loading
                    ? 'glass-cta text-white cursor-pointer'
                    : 'bg-white/5 text-gray-500 border border-white/5 cursor-not-allowed'
                }`}
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
