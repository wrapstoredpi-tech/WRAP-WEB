import React, { useState, useRef } from 'react';
import {
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  RotateCcw,
  Check,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Video,
  Sliders,
  ExternalLink,
  Upload,
  FolderOpen,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  Play,
  Film,
  Sparkles,
  Pencil,
} from 'lucide-react';
import { getHeroSlides, saveHeroSlides, resetHeroSlides, fetchHeroSlides } from '../../lib/heroSlides';

// Pre-packaged store showroom photos readily available in public assets
const PRESET_STORE_PHOTOS = [
  {
    image: '/hero/slide-1.webp',
    alt: 'WrapStore physical storefront showroom in Dharmapuri',
    label: 'Main Storefront Counter',
  },
  {
    image: '/hero/slide-2.webp',
    alt: 'WrapStore wall display with phone cases for iPhone and Samsung',
    label: 'Case Wall Collection',
  },
  {
    image: '/hero/slide-3.webp',
    alt: 'WrapStore accessories showroom display counters',
    label: 'Accessories Showcase',
  },
  {
    image: 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=1800&q=80',
    alt: 'Curated premium leather and silicone phone case collection',
    label: 'Leather & Case Lifestyle',
  },
  {
    image: 'https://images.unsplash.com/photo-1580910051074-3eb694886505?auto=format&fit=crop&w=1800&q=80',
    alt: 'Minimalist smartphone cases and everyday carry accessories',
    label: 'Minimalist EDC Cases',
  },
];

// Available sample showroom videos in public folder
const PRESET_STORE_VIDEOS = [
  {
    video: '/video_demo1.mp4',
    poster: '/hero/slide-2.webp',
    tag: 'Unlimited Prints',
    tagSubtitle: 'Find your perfect case',
    label: 'Unlimited Prints Video',
  },
  {
    video: '/demo2.mp4',
    poster: '/hero/slide-1.webp',
    tag: 'Signature Cases',
    tagSubtitle: 'Explore Apple & Samsung',
    label: 'Signature Cases Video',
  },
];

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function processMediaFile(file, isVideoType) {
  if (!file) {
    return Promise.reject(new Error('Please select a valid media file.'));
  }

  const isVideo = file.type.startsWith('video/');
  const isImage = file.type.startsWith('image/');

  if (isVideoType && !isVideo) {
    return Promise.reject(new Error('Please select a valid video file (MP4, WebM, OGG).'));
  }

  if (!isVideoType && !isImage) {
    return Promise.reject(new Error('Please select a valid image file (JPG, PNG, WEBP, AVIF).'));
  }

  // Max 50MB
  if (file.size > 50 * 1024 * 1024) {
    return Promise.reject(new Error('File exceeds 50MB limit. Please select a smaller file.'));
  }

  if (isVideo) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Failed to read video file from disk.'));
      reader.onload = (e) => {
        resolve({
          type: 'video',
          dataUrl: e.target.result,
          originalSize: file.size,
          fileName: file.name,
        });
      };
      reader.readAsDataURL(file);
    });
  }

  // Image Processing & Auto-compression for fast load times
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file from disk.'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to decode image. Please try another file.'));
      img.onload = () => {
        try {
          const MAX_WIDTH = 1920;
          const MAX_HEIGHT = 1080;
          let width = img.width;
          let height = img.height;

          if (width > MAX_WIDTH || height > MAX_HEIGHT) {
            const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          let dataUrl = canvas.toDataURL('image/webp', 0.88);
          if (!dataUrl.startsWith('data:image/webp')) {
            dataUrl = canvas.toDataURL('image/jpeg', 0.88);
          }

          const approxBytes = Math.round((dataUrl.length * 3) / 4);

          resolve({
            type: 'image',
            dataUrl,
            width,
            height,
            originalSize: file.size,
            optimizedSize: approxBytes,
            fileName: file.name,
          });
        } catch (err) {
          reject(err);
        }
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

export function AdminHeroTab() {
  const [slides, setSlides] = useState(() => getHeroSlides());
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(true);

  // Sync slides from DB on mount
  React.useEffect(() => {
    let isMounted = true;
    fetchHeroSlides().then((dbSlides) => {
      if (isMounted && Array.isArray(dbSlides)) {
        setSlides(dbSlides);
        setIsSyncing(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Modal Form State
  const [editingSlideIndex, setEditingSlideIndex] = useState(null);
  const [slideType, setSlideType] = useState('image'); // 'image' | 'video'
  const [activeSourceTab, setActiveSourceTab] = useState('upload'); // 'upload' | 'url'
  const [newMediaUrl, setNewMediaUrl] = useState('');
  const [newPosterUrl, setNewPosterUrl] = useState('');
  const [newTag, setNewTag] = useState('');
  const [newSubtitle, setNewSubtitle] = useState('');
  const [newLink, setNewLink] = useState('/?category=Mobile%20Cases');
  const [newAlt, setNewAlt] = useState('');

  // Upload progress state
  const fileInputRef = useRef(null);
  const [uploadState, setUploadState] = useState('idle'); // 'idle' | 'uploading' | 'success' | 'error'
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFileInfo, setUploadedFileInfo] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleOpenAddModal = (defaultType = 'image') => {
    setEditingSlideIndex(null);
    setSlideType(defaultType);
    setActiveSourceTab('upload');
    setNewMediaUrl('');
    setNewPosterUrl('');
    setNewTag(defaultType === 'video' ? 'Signature Cases' : 'Unlimited Prints');
    setNewSubtitle(defaultType === 'video' ? 'Explore Apple & Samsung' : 'Find your perfect case');
    setNewLink('/?category=Mobile%20Cases');
    setNewAlt('');
    setUploadState('idle');
    setUploadProgress(0);
    setUploadedFileInfo(null);
    setUploadError(null);
    setIsDragging(false);
    setShowAddModal(true);
  };

  const handleOpenEditModal = (index) => {
    const slide = slides[index];
    if (!slide) return;
    setEditingSlideIndex(index);
    const isVideo = slide.type === 'video' || Boolean(slide.video);
    setSlideType(isVideo ? 'video' : 'image');
    setActiveSourceTab('url');
    setNewMediaUrl(isVideo ? (slide.video || slide.image || '') : (slide.image || ''));
    setNewPosterUrl(slide.image || '');
    setNewTag(slide.tag || '');
    setNewSubtitle(slide.tagSubtitle || '');
    setNewLink(slide.link || '/?category=Mobile%20Cases');
    setNewAlt(slide.alt || '');
    setUploadState('idle');
    setUploadProgress(0);
    setUploadedFileInfo(null);
    setUploadError(null);
    setIsDragging(false);
    setShowAddModal(true);
  };

  const handleCloseAddModal = () => {
    setShowAddModal(false);
    setEditingSlideIndex(null);
    setUploadState('idle');
    setUploadProgress(0);
    setUploadedFileInfo(null);
    setUploadError(null);
    setIsDragging(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) handleProcessUpload(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleProcessUpload(file);
  };

  const handleProcessUpload = async (file) => {
    if (!file) return;
    setUploadError(null);
    setUploadState('uploading');
    setUploadProgress(25);

    const timer = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 85) {
          clearInterval(timer);
          return 85;
        }
        return prev + 15;
      });
    }, 60);

    try {
      const isVideoType = slideType === 'video';
      const result = await processMediaFile(file, isVideoType);
      clearInterval(timer);
      setUploadProgress(100);

      setTimeout(() => {
        setNewMediaUrl(result.dataUrl);
        setUploadedFileInfo(result);
        setUploadState('success');

        if (!newAlt.trim()) {
          const cleanName = file.name
            .replace(/\.[^/.]+$/, '')
            .replace(/[-_]+/g, ' ')
            .trim();
          const titleCase = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
          setNewAlt(titleCase || 'WrapStore Hero Showcase');
        }
      }, 200);
    } catch (err) {
      clearInterval(timer);
      setUploadState('error');
      setUploadError(err.message || 'Error uploading file.');
    }
  };

  const handleSaveAll = async (updatedSlides) => {
    setSlides(updatedSlides);
    setIsSaving(true);
    await saveHeroSlides(updatedSlides);
    setIsSaving(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleMoveUp = (index) => {
    if (index === 0) return;
    const copy = [...slides];
    const temp = copy[index - 1];
    copy[index - 1] = copy[index];
    copy[index] = temp;
    handleSaveAll(copy);
    setActiveSlideIndex(index - 1);
  };

  const handleMoveDown = (index) => {
    if (index === slides.length - 1) return;
    const copy = [...slides];
    const temp = copy[index + 1];
    copy[index + 1] = copy[index];
    copy[index] = temp;
    handleSaveAll(copy);
    setActiveSlideIndex(index + 1);
  };

  const handleDeleteSlide = (index) => {
    const copy = slides.filter((_, i) => i !== index);
    handleSaveAll(copy);
    if (copy.length === 0) {
      setActiveSlideIndex(0);
    } else if (activeSlideIndex >= copy.length) {
      setActiveSlideIndex(copy.length - 1);
    }
  };

  const handleClearAllSlides = () => {
    if (window.confirm('Delete all hero slides? The Hero Slider section will be completely hidden on the storefront.')) {
      handleSaveAll([]);
      setActiveSlideIndex(0);
    }
  };

  const handleResetDefaults = async () => {
    if (window.confirm('Reset hero slides back to default storefront slides (0 slides)? This will clear the slides in the database.')) {
      setIsSaving(true);
      const defaults = await resetHeroSlides();
      setSlides(defaults);
      setIsSaving(false);
      setActiveSlideIndex(0);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    }
  };

  const handleAddSlideSubmit = (e) => {
    e.preventDefault();
    if (!newMediaUrl.trim()) {
      alert(`Please choose or upload a ${slideType === 'video' ? 'video' : 'photo'}.`);
      return;
    }

    const isVideo = slideType === 'video';

    if (editingSlideIndex !== null && slides[editingSlideIndex]) {
      const existing = slides[editingSlideIndex];
      const updatedSlide = {
        ...existing,
        type: isVideo ? 'video' : 'image',
        ...(isVideo
          ? {
              video: newMediaUrl.trim(),
              image: newPosterUrl.trim() || existing.image || '/hero/slide-1.webp',
            }
          : {
              image: newMediaUrl.trim(),
              video: undefined,
            }),
        tag: newTag.trim(),
        tagSubtitle: newSubtitle.trim(),
        link: newLink.trim() || '/?category=Mobile%20Cases',
        alt: newAlt.trim() || newTag.trim() || 'WrapStore Hero Banner',
      };

      const copy = [...slides];
      copy[editingSlideIndex] = updatedSlide;
      handleSaveAll(copy);
      setActiveSlideIndex(editingSlideIndex);
      handleCloseAddModal();
      return;
    }

    const newSlide = {
      id: `hero-${Date.now()}`,
      type: isVideo ? 'video' : 'image',
      ...(isVideo
        ? {
            video: newMediaUrl.trim(),
            image: newPosterUrl.trim() || '/hero/slide-1.webp',
          }
        : {
            image: newMediaUrl.trim(),
          }),
      tag: newTag.trim(),
      tagSubtitle: newSubtitle.trim(),
      link: newLink.trim() || '/?category=Mobile%20Cases',
      alt: newAlt.trim() || newTag.trim() || 'WrapStore Hero Banner',
    };

    const updated = [...slides, newSlide];
    handleSaveAll(updated);
    handleCloseAddModal();
    setActiveSlideIndex(updated.length - 1);
  };

  const currentPreviewSlide = slides[activeSlideIndex] || slides[0];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header & Save Confirmation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-[24px] font-semibold text-[#141414] tracking-tight">
              Hero Slider Management
            </h1>
            {slides.length > 0 ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Live on Storefront ({slides.length} {slides.length === 1 ? 'slide' : 'slides'})</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-semibold">
                <EyeOff className="w-3 h-3 text-amber-600" />
                <span>Hidden on Storefront (0 slides)</span>
              </span>
            )}
          </div>
          <p className="text-[13px] text-[#6B6B6B] mt-1">
            {slides.length > 0
              ? 'Update, reorder, and add high-resolution photos or videos for the full-width homepage hero slider.'
              : 'Hero slider is currently hidden. Add at least one slide to display the full-screen hero banner on the website.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {isSaving && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-800 rounded-[6px] text-[12px] font-semibold animate-pulse">
              <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin" />
              <span>Saving to database...</span>
            </div>
          )}

          {savedSuccess && !isSaving && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-[6px] text-[12px] font-semibold animate-fade-in">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>Saved to database & storefront!</span>
            </div>
          )}

          {slides.length > 0 && (
            <button
              type="button"
              onClick={handleClearAllSlides}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[6px] border border-red-200 bg-red-50/50 hover:bg-red-50 text-[12px] font-semibold text-red-700 transition-colors cursor-pointer"
              title="Delete all slides and hide the hero slider section"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-600" />
              <span>Delete All Slides</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleResetDefaults}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[6px] border border-[#E5E5E3] bg-white hover:border-[#141414] text-[12px] font-semibold text-[#141414] transition-colors cursor-pointer"
            title="Reset hero slides to empty default"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#6B6B6B]" />
            <span>Reset Defaults</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenAddModal('image')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[6px] bg-[#141414] hover:bg-[#2A2A2A] text-white text-[12px] font-semibold transition-colors cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4 text-[#B0521F]" />
            <span>Add Slide</span>
          </button>
        </div>
      </div>

      {/* 2-Column Layout: Slides List on Left, Live Full-Width Preview on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Manage Slides List */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[14px] font-semibold text-[#141414]">
              Active Slides ({slides.length})
            </h2>
            {slides.length > 0 && (
              <span className="text-[12px] text-[#6B6B6B]">
                Autoplay: 6 seconds per slide
              </span>
            )}
          </div>

          {slides.length === 0 ? (
            <div className="p-8 rounded-[8px] border-2 border-dashed border-[#E5E5E3] bg-white text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-[#F5F2EB] flex items-center justify-center mx-auto text-[#B0521F]">
                <Sliders className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-[15px] font-semibold text-[#141414]">
                  No Slides in Hero Slider
                </h3>
                <p className="text-[12px] text-[#6B6B6B] mt-1 max-w-sm mx-auto leading-relaxed">
                  The hero section is currently hidden from the live storefront. Add an image or video slide below to display the full-width banner.
                </p>
              </div>

              <div className="flex items-center justify-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => handleOpenAddModal('image')}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-[6px] bg-[#141414] hover:bg-[#2A2A2A] text-white text-[12px] font-semibold transition-colors cursor-pointer"
                >
                  <ImageIcon className="w-3.5 h-3.5 text-[#B0521F]" />
                  <span>Add Photo Slide</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenAddModal('video')}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-[6px] border border-[#E5E5E3] bg-white hover:border-[#141414] text-[#141414] text-[12px] font-semibold transition-colors cursor-pointer"
                >
                  <Video className="w-3.5 h-3.5 text-[#B0521F]" />
                  <span>Add Video Slide</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {slides.map((slide, index) => {
                const isSelected = activeSlideIndex === index;
                const isVideo = slide.type === 'video' || Boolean(slide.video);
                return (
                  <div
                    key={slide.id || index}
                    onClick={() => setActiveSlideIndex(index)}
                    className={`p-3.5 rounded-[8px] border transition-all cursor-pointer bg-white flex items-center gap-4 ${
                      isSelected
                        ? 'border-[#141414] ring-1 ring-[#141414] shadow-sm'
                        : 'border-[#E5E5E3] hover:border-[#D4D4D2]'
                    }`}
                  >
                    {/* Media Thumbnail */}
                    <div className="w-24 h-14 bg-[#141414] rounded-[6px] border border-[#E5E5E3] overflow-hidden shrink-0 relative flex items-center justify-center">
                      {isVideo ? (
                        <>
                          <video
                            src={slide.video}
                            poster={slide.image}
                            muted
                            playsInline
                            className="w-full h-full object-cover opacity-80"
                          />
                          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                            <Film className="w-4 h-4 text-white drop-shadow" />
                          </div>
                        </>
                      ) : (
                        <img
                          src={slide.image}
                          alt={slide.alt || 'Hero slide'}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-[#FAFAF9] text-[#6B6B6B] border border-[#E5E5E3]">
                          #{index + 1}
                        </span>
                        <span
                          className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${
                            isVideo
                              ? 'bg-purple-50 text-purple-700 border border-purple-200'
                              : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}
                        >
                          {isVideo ? 'Video' : 'Image'}
                        </span>
                        <span className="text-[13px] font-semibold text-[#141414] truncate">
                          {slide.tag || slide.alt || 'Hero Slide'}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#6B6B6B] truncate mt-0.5 font-medium">
                        {slide.tagSubtitle ? `${slide.tagSubtitle} • ` : ''}
                        <span className="font-mono text-[10px] text-[#9CA3AF]">
                          {slide.link || '/?category=Mobile%20Cases'}
                        </span>
                      </div>
                    </div>

                    {/* Controls */}
                    <div
                      className="flex items-center gap-1.5 shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(index)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-[5px] border border-[#E5E5E3] hover:border-[#141414] bg-white text-[12px] font-semibold text-[#141414] transition-colors cursor-pointer hover:bg-[#FAF8F5]"
                        title="Edit slide"
                      >
                        <Pencil className="w-3.5 h-3.5 text-[#B0521F]" />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => handleMoveUp(index)}
                        className="p-1.5 rounded-[4px] hover:bg-[#FAFAF9] text-[#6B6B6B] hover:text-[#141414] disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                        title="Move up"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        disabled={index === slides.length - 1}
                        onClick={() => handleMoveDown(index)}
                        className="p-1.5 rounded-[4px] hover:bg-[#FAFAF9] text-[#6B6B6B] hover:text-[#141414] disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                        title="Move down"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteSlide(index)}
                        className="p-1.5 rounded-[4px] hover:bg-red-50 text-[#6B6B6B] hover:text-red-600 transition-colors cursor-pointer ml-0.5"
                        title="Delete slide"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Live Full-Screen Preview */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[14px] font-semibold text-[#141414]">
              Live Storefront Preview
            </h2>
            {slides.length > 0 && (
              <div className="flex items-center gap-2.5">
                <span className="text-[12px] text-[#6B6B6B]">
                  Slide #{activeSlideIndex + 1} of {slides.length}
                </span>
                <button
                  type="button"
                  onClick={() => handleOpenEditModal(activeSlideIndex)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[5px] border border-[#E5E5E3] hover:border-[#141414] bg-white text-[11px] font-semibold text-[#141414] transition-colors cursor-pointer hover:bg-[#FAF8F5]"
                  title="Edit current preview slide"
                >
                  <Pencil className="w-3 h-3 text-[#B0521F]" />
                  <span>Edit Slide</span>
                </button>
              </div>
            )}
          </div>

          <div className="bg-white border border-[#E5E5E3] rounded-[10px] p-4 space-y-3 shadow-sm">
            {slides.length === 0 ? (
              <div className="aspect-[21/9] min-h-[220px] w-full rounded-[8px] border-2 border-dashed border-[#E5E5E3] bg-[#FAFAF9] flex flex-col items-center justify-center p-6 text-center space-y-2">
                <EyeOff className="w-8 h-8 text-[#9CA3AF]" />
                <span className="text-[13px] font-semibold text-[#141414]">
                  Section Hidden on Storefront
                </span>
                <span className="text-[11px] text-[#6B6B6B] max-w-xs">
                  Because there are no active slides, visitors see the Category Row directly at the top of the homepage.
                </span>
              </div>
            ) : (
              <div className="relative aspect-[21/9] min-h-[220px] w-full rounded-[8px] overflow-hidden bg-[#141414] shadow-inner">
                {currentPreviewSlide ? (
                  <>
                    {currentPreviewSlide.type === 'video' || currentPreviewSlide.video ? (
                      <video
                        key={currentPreviewSlide.video || currentPreviewSlide.id}
                        src={currentPreviewSlide.video}
                        poster={currentPreviewSlide.image}
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <img
                        src={currentPreviewSlide.image}
                        alt={currentPreviewSlide.alt || 'Slide photo'}
                        className="w-full h-full object-cover"
                      />
                    )}

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />

                    {/* Live Badge Pill Preview */}
                    {(currentPreviewSlide.tag || currentPreviewSlide.tagSubtitle) && (
                      <div className="absolute left-1/2 -translate-x-1/2 bottom-5 sm:bottom-6 z-20 pointer-events-none max-w-[90%] text-center">
                        {currentPreviewSlide.tag && (
                          <div className="bg-white text-[#141414] px-4 py-1 sm:px-5 sm:py-1.5 rounded-full shadow-lg inline-flex items-center justify-center">
                            <span className="font-extrabold text-[13px] sm:text-[16px] tracking-tight leading-none text-[#141414]">
                              {currentPreviewSlide.tag}
                            </span>
                          </div>
                        )}
                        {currentPreviewSlide.tagSubtitle && (
                          <div className="bg-white/95 text-[#141414] px-3 py-0.5 rounded-full text-[11px] font-semibold tracking-normal shadow-md flex items-center justify-center gap-1 mt-1 border border-black/5 whitespace-nowrap mx-auto">
                            <span>{currentPreviewSlide.tagSubtitle}</span>
                            <span>→</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Slide Dots Indicator */}
                    {slides.length > 1 && (
                      <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-sm z-20">
                        {slides.map((_, i) => (
                          <div
                            key={i}
                            className={`h-1 rounded-full transition-all ${
                              i === activeSlideIndex ? 'w-4 bg-white' : 'w-1 bg-white/50'
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </>
                ) : null}
              </div>
            )}

            <div className="pt-2 text-[12px] text-[#6B6B6B] flex items-center justify-between gap-3 border-t border-[#F5F2EB]">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="shrink-0 text-[#6B6B6B]">Link:</span>
                <a
                  href={currentPreviewSlide?.link || '/?category=Mobile%20Cases'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#141414] font-mono text-[11px] hover:text-[#B0521F] underline truncate"
                  title="Click to test destination link"
                >
                  {currentPreviewSlide?.link || '/?category=Mobile%20Cases'}
                </a>
              </div>
              <a
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[#B0521F] font-semibold hover:underline shrink-0"
              >
                <span>View Live Store</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Add / Edit Slide Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-[12px] max-w-xl w-full p-6 border border-[#E5E5E3] shadow-2xl space-y-5 my-8">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-[18px] font-semibold text-[#141414]">
                  {editingSlideIndex !== null ? 'Edit Hero Slide' : 'Add Hero Slide'}
                </h3>
                <p className="text-[13px] text-[#6B6B6B] mt-0.5">
                  {editingSlideIndex !== null
                    ? 'Update media, destination link, and banner badge texts.'
                    : 'Choose media type, upload high-resolution media, and customize badge text.'}
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseAddModal}
                className="p-1.5 rounded-md text-[#6B6B6B] hover:text-[#141414] hover:bg-[#F5F2EB] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Media Type Toggle: Image vs Video */}
            <div className="grid grid-cols-2 gap-2 bg-[#FAFAF9] p-1.5 rounded-[8px] border border-[#E5E5E3]">
              <button
                type="button"
                onClick={() => {
                  setSlideType('image');
                  setNewMediaUrl('');
                  setUploadedFileInfo(null);
                  setUploadState('idle');
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                className={`py-2 px-3 rounded-[6px] text-[13px] font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  slideType === 'image'
                    ? 'bg-white text-[#141414] shadow-sm border border-[#E5E5E3]'
                    : 'text-[#6B6B6B] hover:text-[#141414]'
                }`}
              >
                <ImageIcon className="w-4 h-4 text-[#B0521F]" />
                <span>Photo Slide</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSlideType('video');
                  setNewMediaUrl('');
                  setUploadedFileInfo(null);
                  setUploadState('idle');
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                className={`py-2 px-3 rounded-[6px] text-[13px] font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  slideType === 'video'
                    ? 'bg-white text-[#141414] shadow-sm border border-[#E5E5E3]'
                    : 'text-[#6B6B6B] hover:text-[#141414]'
                }`}
              >
                <Video className="w-4 h-4 text-[#B0521F]" />
                <span>Video Slide</span>
              </button>
            </div>

            {/* Source Mode Tabs */}
            <div className="flex border-b border-[#E5E5E3]">
              <button
                type="button"
                onClick={() => setActiveSourceTab('upload')}
                className={`pb-2.5 px-3 text-[13px] font-semibold border-b-2 flex items-center gap-2 cursor-pointer transition-colors ${
                  activeSourceTab === 'upload'
                    ? 'border-[#141414] text-[#141414]'
                    : 'border-transparent text-[#6B6B6B] hover:text-[#141414]'
                }`}
              >
                <FolderOpen className="w-4 h-4 text-[#B0521F]" />
                <span>Upload from Folder</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveSourceTab('url')}
                className={`pb-2.5 px-3 text-[13px] font-semibold border-b-2 flex items-center gap-2 cursor-pointer transition-colors ${
                  activeSourceTab === 'url'
                    ? 'border-[#141414] text-[#141414]'
                    : 'border-transparent text-[#6B6B6B] hover:text-[#141414]'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>Presets & URL</span>
              </button>
            </div>

            {/* SOURCE TAB 1: FILE UPLOAD */}
            {activeSourceTab === 'upload' && (
              <div className="space-y-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={slideType === 'video' ? 'video/mp4,video/webm,video/ogg' : 'image/png,image/jpeg,image/webp,image/avif'}
                  onChange={handleFileChange}
                  className="hidden"
                />

                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-[8px] p-6 text-center transition-all ${
                    isDragging
                      ? 'border-[#B0521F] bg-[#FAF6F2]'
                      : uploadState === 'success'
                      ? 'border-emerald-300 bg-emerald-50/40'
                      : 'border-[#D4D4D2] hover:border-[#141414] bg-[#FAFAF9]'
                  }`}
                >
                  {uploadState === 'uploading' ? (
                    <div className="py-3 flex flex-col items-center justify-center space-y-3 animate-fade-in">
                      <Loader2 className="w-8 h-8 text-[#B0521F] animate-spin" />
                      <div className="w-full max-w-xs space-y-1.5">
                        <div className="flex justify-between text-[12px] font-medium text-[#141414]">
                          <span>Preparing {slideType === 'video' ? 'video' : 'photo'}...</span>
                          <span className="font-mono">{uploadProgress}%</span>
                        </div>
                        <div className="w-full bg-[#E5E5E3] rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-[#141414] h-2 rounded-full transition-all duration-150"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ) : uploadState === 'success' && uploadedFileInfo ? (
                    <div className="flex items-center justify-between gap-3 text-left animate-fade-in">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-14 h-12 rounded-[6px] overflow-hidden border border-emerald-300 bg-black shrink-0 relative flex items-center justify-center">
                          {slideType === 'video' ? (
                            <Film className="w-5 h-5 text-emerald-400" />
                          ) : (
                            <img
                              src={newMediaUrl}
                              alt="Uploaded preview"
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 text-emerald-800 font-semibold text-[13px]">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span className="truncate">{uploadedFileInfo.fileName}</span>
                          </div>
                          <p className="text-[11px] text-[#6B6B6B] mt-0.5 font-mono">
                            {formatBytes(uploadedFileInfo.originalSize)} • Ready for hero frame
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1.5 rounded-[5px] border border-[#E5E5E3] bg-white hover:border-[#141414] text-[12px] font-semibold text-[#141414] transition-colors shrink-0 cursor-pointer"
                      >
                        Change File
                      </button>
                    </div>
                  ) : (
                    <div className="py-2 space-y-3">
                      <div className="w-12 h-12 rounded-full bg-[#F5F2EB] flex items-center justify-center mx-auto text-[#B0521F]">
                        {slideType === 'video' ? <Video className="w-6 h-6" /> : <FolderOpen className="w-6 h-6" />}
                      </div>
                      <div>
                        <p className="text-[14px] font-semibold text-[#141414]">
                          Choose a {slideType === 'video' ? 'video file' : 'photo'} from your folder
                        </p>
                        <p className="text-[12px] text-[#6B6B6B] mt-0.5">
                          Drag & drop here, or browse files on your device
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[6px] bg-[#141414] hover:bg-[#2A2A2A] text-white text-[13px] font-semibold transition-all shadow-sm cursor-pointer"
                      >
                        <Upload className="w-4 h-4 text-[#B0521F]" />
                        <span>Choose {slideType === 'video' ? 'Video File' : 'Image File'}</span>
                      </button>

                      <p className="text-[11px] text-[#9CA3AF]">
                        {slideType === 'video'
                          ? 'Supports MP4, WebM up to 50MB'
                          : 'Supports JPG, PNG, WEBP, AVIF up to 25MB'}
                      </p>
                    </div>
                  )}
                </div>

                {uploadError && (
                  <div className="flex items-center gap-2 p-2.5 rounded-[6px] bg-red-50 border border-red-200 text-red-700 text-[12px]">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                    <span>{uploadError}</span>
                  </div>
                )}
              </div>
            )}

            {/* SOURCE TAB 2: PRESETS & MANUAL URL */}
            {activeSourceTab === 'url' && (
              <div className="space-y-4">
                {slideType === 'video' ? (
                  <div className="space-y-2">
                    <label className="text-[12px] font-semibold text-[#141414]">
                      Store Video Presets:
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {PRESET_STORE_VIDEOS.map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setNewMediaUrl(preset.video);
                            setNewPosterUrl(preset.poster);
                            setNewTag(preset.tag);
                            setNewSubtitle(preset.tagSubtitle);
                            setUploadedFileInfo(null);
                            setUploadState('idle');
                          }}
                          className={`p-2.5 rounded-[6px] border text-left flex items-center gap-2.5 cursor-pointer transition-colors ${
                            newMediaUrl === preset.video
                              ? 'border-[#141414] bg-[#FAFAF9]'
                              : 'border-[#E5E5E3] hover:border-[#141414]'
                          }`}
                        >
                          <div className="w-10 h-8 rounded bg-[#141414] flex items-center justify-center text-white shrink-0">
                            <Film className="w-4 h-4 text-[#B0521F]" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-[11px] font-semibold text-[#141414] truncate">
                              {preset.label}
                            </div>
                            <div className="text-[10px] text-[#6B6B6B] truncate font-mono">
                              {preset.video}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="text-[12px] font-semibold text-[#141414]">
                      Quick Store Photo Presets:
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {PRESET_STORE_PHOTOS.map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setNewMediaUrl(preset.image);
                            setNewAlt(preset.alt);
                            setUploadedFileInfo(null);
                            setUploadState('idle');
                          }}
                          className={`p-2 rounded-[6px] border text-left flex items-center gap-2 cursor-pointer transition-colors ${
                            newMediaUrl === preset.image
                              ? 'border-[#141414] bg-[#FAFAF9]'
                              : 'border-[#E5E5E3] hover:border-[#141414]'
                          }`}
                        >
                          <img
                            src={preset.image}
                            alt={preset.alt}
                            className="w-10 h-7 object-cover rounded-[3px] border border-[#E5E5E3]"
                          />
                          <span className="text-[11px] font-medium text-[#141414] truncate">
                            {preset.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-[13px] font-medium text-[#141414] mb-1">
                    {slideType === 'video' ? 'Video Path / Public URL' : 'Image Path / Public URL'}{' '}
                    <span className="text-[#B0521F]">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder={slideType === 'video' ? '/video_demo1.mp4 or https://...' : '/hero/slide-1.webp or https://...'}
                    value={newMediaUrl}
                    onChange={(e) => {
                      setNewMediaUrl(e.target.value);
                      setUploadedFileInfo(null);
                      setUploadState('idle');
                    }}
                    className="w-full px-3 py-2 text-[13px] bg-white border border-[#E5E5E3] rounded-[6px] text-[#141414] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#141414]"
                  />
                </div>
              </div>
            )}

            {/* Custom Content Fields (Tag, Subtitle, Link) */}
            <form onSubmit={handleAddSlideSubmit} className="space-y-4 pt-2 border-t border-[#E5E5E3]">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-semibold text-[#141414] mb-1">
                    Badge Title (Top White Pill)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Signature Cases"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    className="w-full px-3 py-2 text-[13px] bg-white border border-[#E5E5E3] rounded-[6px] text-[#141414] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#141414]"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-semibold text-[#141414] mb-1">
                    Subtitle / CTA Text
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Explore Apple & Samsung"
                    value={newSubtitle}
                    onChange={(e) => setNewSubtitle(e.target.value)}
                    className="w-full px-3 py-2 text-[13px] bg-white border border-[#E5E5E3] rounded-[6px] text-[#141414] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#141414]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-[#141414] mb-1">
                  Destination Link
                </label>
                <input
                  type="text"
                  placeholder="/?category=Mobile%20Cases"
                  value={newLink}
                  onChange={(e) => setNewLink(e.target.value)}
                  className="w-full px-3 py-2 text-[13px] bg-white border border-[#E5E5E3] rounded-[6px] text-[#141414] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#141414]"
                />
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-[#141414] mb-1">
                  Accessibility Alt Description
                </label>
                <input
                  type="text"
                  placeholder="WrapStore premium phone cases showcase"
                  value={newAlt}
                  onChange={(e) => setNewAlt(e.target.value)}
                  className="w-full px-3 py-2 text-[13px] bg-white border border-[#E5E5E3] rounded-[6px] text-[#141414] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#141414]"
                />
              </div>

              {/* Live Mini Preview inside modal */}
              {newMediaUrl && (
                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-[#6B6B6B]">Preview:</span>
                  <div className="aspect-[21/9] w-full max-h-40 rounded-[6px] overflow-hidden border border-[#E5E5E3] bg-[#141414] relative">
                    {slideType === 'video' ? (
                      <video
                        src={newMediaUrl}
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <img
                        src={newMediaUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    )}

                    {(newTag || newSubtitle) && (
                      <div className="absolute left-1/2 -translate-x-1/2 bottom-3 text-center pointer-events-none">
                        {newTag && (
                          <div className="bg-white text-[#141414] px-3 py-0.5 rounded-full text-[12px] font-extrabold shadow inline-block">
                            {newTag}
                          </div>
                        )}
                        {newSubtitle && (
                          <div className="bg-white/95 text-[#141414] px-2.5 py-0.5 rounded-full text-[10px] font-semibold mt-0.5 shadow flex items-center justify-center gap-1 mx-auto">
                            <span>{newSubtitle}</span>
                            <span>→</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E5E5E3]">
                <button
                  type="button"
                  onClick={handleCloseAddModal}
                  className="px-4 py-2 rounded-[6px] border border-[#E5E5E3] text-[13px] font-semibold text-[#6B6B6B] hover:text-[#141414] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploadState === 'uploading' || !newMediaUrl.trim()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[6px] bg-[#141414] hover:bg-[#2A2A2A] text-white text-[13px] font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {editingSlideIndex !== null ? (
                    <>
                      <Check className="w-4 h-4 text-[#B0521F]" />
                      <span>Save Changes</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 text-[#B0521F]" />
                      <span>Save & Add to Hero</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminHeroTab;
