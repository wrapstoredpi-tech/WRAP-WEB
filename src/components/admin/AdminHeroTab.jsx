import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  RotateCcw,
  Check,
  Eye,
  Image as ImageIcon,
  Sliders,
  ExternalLink,
} from 'lucide-react';
import { getHeroSlides, saveHeroSlides, resetHeroSlides } from '../../lib/heroSlides';

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

export function AdminHeroTab() {
  const [slides, setSlides] = useState(() => getHeroSlides());
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newImage, setNewImage] = useState('');
  const [newAlt, setNewAlt] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveAll = (updatedSlides) => {
    setSlides(updatedSlides);
    saveHeroSlides(updatedSlides);
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
  };

  const handleMoveDown = (index) => {
    if (index === slides.length - 1) return;
    const copy = [...slides];
    const temp = copy[index + 1];
    copy[index + 1] = copy[index];
    copy[index] = temp;
    handleSaveAll(copy);
  };

  const handleDeleteSlide = (index) => {
    if (slides.length <= 1) {
      alert('You must keep at least 1 hero slide for the homepage.');
      return;
    }
    const copy = slides.filter((_, i) => i !== index);
    handleSaveAll(copy);
    if (activeSlideIndex >= copy.length) {
      setActiveSlideIndex(Math.max(0, copy.length - 1));
    }
  };

  const handleResetDefaults = () => {
    if (window.confirm('Reset all hero slides back to the default storefront photos?')) {
      const defaults = resetHeroSlides();
      setSlides(defaults);
      setActiveSlideIndex(0);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    }
  };

  const handleAddSlideSubmit = (e) => {
    e.preventDefault();
    if (!newImage.trim()) return;

    const newSlide = {
      id: `hero-${Date.now()}`,
      image: newImage.trim(),
      alt: newAlt.trim() || 'WrapStore phone cases and accessories in Dharmapuri',
      width: 1800,
      height: 1200,
    };

    const updated = [...slides, newSlide];
    handleSaveAll(updated);
    setNewImage('');
    setNewAlt('');
    setShowAddModal(false);
    setActiveSlideIndex(updated.length - 1);
  };

  const currentPreviewSlide = slides[activeSlideIndex] || slides[0];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header & Save Confirmation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-semibold text-[#141414] tracking-tight">
            Hero Slider Management
          </h1>
          <p className="text-[13px] text-[#6B6B6B] mt-0.5">
            Update, reorder, and add high-resolution photos for the 3:2 homepage hero slider
          </p>
        </div>

        <div className="flex items-center gap-3">
          {savedSuccess && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-[6px] text-[12px] font-semibold animate-fade-in">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>Saved to live homepage!</span>
            </div>
          )}

          <button
            type="button"
            onClick={handleResetDefaults}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[6px] border border-[#E5E5E3] bg-white hover:border-[#141414] text-[12px] font-semibold text-[#141414] transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#6B6B6B]" />
            <span>Reset Defaults</span>
          </button>

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[6px] bg-[#141414] hover:bg-[#2A2A2A] text-white text-[12px] font-semibold transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#B0521F]" />
            <span>Add Slide</span>
          </button>
        </div>
      </div>

      {/* 2-Column Layout: Slides List on Left, Live 3:2 Aspect Preview on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Manage Slides List */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[14px] font-semibold text-[#141414]">
              Active Slides ({slides.length})
            </h2>
            <span className="text-[12px] text-[#6B6B6B]">
              Autoplay: 5 seconds per slide
            </span>
          </div>

          <div className="space-y-3">
            {slides.map((slide, index) => {
              const isSelected = activeSlideIndex === index;
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
                  {/* Thumbnail (3:2) */}
                  <div className="w-20 h-14 bg-[#FAFAF9] rounded-[4px] border border-[#E5E5E3] overflow-hidden shrink-0">
                    <img
                      src={slide.image}
                      alt={slide.alt || 'Hero slide'}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-[#FAFAF9] text-[#6B6B6B] border border-[#E5E5E3]">
                        #{index + 1}
                      </span>
                      <span className="text-[13px] font-semibold text-[#141414] truncate">
                        {slide.alt || 'Storefront slide photo'}
                      </span>
                    </div>
                    <div className="text-[11px] text-[#6B6B6B] truncate mt-0.5 font-mono">
                      {slide.image}
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
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
                      className="p-1.5 rounded-[4px] hover:bg-red-50 text-[#6B6B6B] hover:text-red-600 transition-colors cursor-pointer ml-1"
                      title="Delete slide"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Live Storefront 3:2 Preview */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[14px] font-semibold text-[#141414]">
              Live 3:2 Aspect Ratio Preview
            </h2>
            <span className="text-[12px] text-[#6B6B6B]">
              Slide #{activeSlideIndex + 1} of {slides.length}
            </span>
          </div>

          <div className="bg-white border border-[#E5E5E3] rounded-[8px] p-4 space-y-3">
            {/* The Full Hero Frame matching HeroFirstScreen */}
            <div className="relative aspect-[21/9] min-h-[220px] w-full rounded-[6px] overflow-hidden border border-[#E5E5E3] bg-[#FAFAF9] shadow-inner">
              {currentPreviewSlide ? (
                <>
                  {currentPreviewSlide.video ? (
                    <video
                      src={currentPreviewSlide.video}
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <img
                      src={currentPreviewSlide.image}
                      alt={currentPreviewSlide.alt}
                      className="w-full h-full object-cover"
                    />
                  )}
                  {/* Subtle slider indicators overlay */}
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/40 backdrop-blur-sm">
                    {slides.map((_, i) => (
                      <div
                        key={i}
                        className={`h-1.5 rounded-full transition-all ${
                          i === activeSlideIndex ? 'w-5 bg-white' : 'w-1.5 bg-white/50'
                        }`}
                      />
                    ))}
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-[#6B6B6B]">
                  <ImageIcon className="w-8 h-8 opacity-40 mb-2" />
                  <span>No slide selected</span>
                </div>
              )}
            </div>

            <div className="pt-2 text-[12px] text-[#6B6B6B] flex items-center justify-between">
              <span>Aspect ratio: 3:2 (Desktop & Mobile hero frame)</span>
              <a
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[#B0521F] font-semibold hover:underline"
              >
                <span>Preview on Homepage</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Add Slide Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-[8px] max-w-lg w-full p-6 border border-[#E5E5E3] shadow-2xl space-y-5">
            <div>
              <h3 className="text-[18px] font-semibold text-[#141414]">
                Add Hero Slider Photo
              </h3>
              <p className="text-[13px] text-[#6B6B6B] mt-0.5">
                Choose a store showroom preset or enter any high-resolution image URL.
              </p>
            </div>

            {/* Quick Presets */}
            <div className="space-y-2">
              <label className="text-[12px] font-semibold text-[#141414]">
                Quick Store Presets:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {PRESET_STORE_PHOTOS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setNewImage(preset.image);
                      setNewAlt(preset.alt);
                    }}
                    className={`p-2 rounded-[6px] border text-left flex items-center gap-2 cursor-pointer transition-colors ${
                      newImage === preset.image
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

            <form onSubmit={handleAddSlideSubmit} className="space-y-4 pt-2">
              <div>
                <label className="block text-[13px] font-medium text-[#141414] mb-1">
                  Image Path / Public URL <span className="text-[#B0521F]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="/hero/slide-1.webp or https://..."
                  value={newImage}
                  onChange={(e) => setNewImage(e.target.value)}
                  className="w-full px-3 py-2 text-[13px] bg-white border border-[#E5E5E3] rounded-[6px] text-[#141414] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#141414]"
                />
              </div>

              <div>
                <label className="block text-[13px] font-medium text-[#141414] mb-1">
                  Accessibility Alt Description
                </label>
                <input
                  type="text"
                  placeholder="WrapStore mobile accessories showroom in Dharmapuri"
                  value={newAlt}
                  onChange={(e) => setNewAlt(e.target.value)}
                  className="w-full px-3 py-2 text-[13px] bg-white border border-[#E5E5E3] rounded-[6px] text-[#141414] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#141414]"
                />
              </div>

              {/* Live Mini Preview */}
              {newImage && (
                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-[#6B6B6B]">Preview:</span>
                  <div className="aspect-[3/2] w-full max-h-36 rounded-[6px] overflow-hidden border border-[#E5E5E3] bg-[#FAFAF9]">
                    <img
                      src={newImage}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E5E5E3]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-[6px] border border-[#E5E5E3] text-[13px] font-semibold text-[#6B6B6B] hover:text-[#141414] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-[6px] bg-[#141414] hover:bg-[#2A2A2A] text-white text-[13px] font-semibold transition-colors cursor-pointer"
                >
                  Save & Add to Hero
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
