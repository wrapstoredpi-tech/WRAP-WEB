import React from 'react';
import { pagesConfig } from '../config/pages';
import { storeConfig } from '../config/store';
import { MessageSquare, ExternalLink } from 'lucide-react';

export function StaticPage({ pageKey }) {
  const config = pagesConfig[pageKey];

  if (!config) {
    return (
      <main className="flex-1 max-w-[800px] w-full mx-auto px-4 sm:px-6 py-16 text-center">
        <h1 className="text-[28px] font-semibold text-[#141414]">Page Not Found</h1>
      </main>
    );
  }

  return (
    <main className="flex-1 max-w-[800px] w-full mx-auto px-4 sm:px-6 py-12 sm:py-16 space-y-8">
      {/* Page Title & Intro */}
      <div className="space-y-2 pb-6 border-b border-[#E5E5E3]">
        <h1 className="text-[28px] font-semibold text-[#141414] tracking-[-0.01em]">
          {config.title}
        </h1>
        {config.intro && (
          <p className="text-[16px] text-[#6B6B6B] leading-relaxed">
            {config.intro}
          </p>
        )}
      </div>

      {/* Sections */}
      <div className="space-y-8">
        {config.sections?.map((section, idx) => (
          <div key={idx} className="space-y-2">
            <h2 className="text-[20px] font-semibold text-[#141414]">
              {section.heading}
            </h2>
            <div className="text-[14px] text-[#6B6B6B] leading-relaxed whitespace-pre-line">
              {section.content}
            </div>
          </div>
        ))}
      </div>

      {/* Special actions for Contact page */}
      {pageKey === 'contact' && (
        <div className="pt-6 border-t border-[#E5E5E3] flex flex-wrap gap-3">
          <a
            href={storeConfig.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 min-h-[44px] px-5 py-2.5 bg-[#141414] hover:bg-[#383836] text-white text-[14px] font-semibold rounded-[6px] transition-colors"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Chat on WhatsApp</span>
          </a>

          <a
            href={storeConfig.mapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 min-h-[44px] px-5 py-2.5 bg-white border border-[#E5E5E3] text-[#141414] text-[14px] font-semibold rounded-[6px] transition-colors"
          >
            <ExternalLink className="w-4 h-4 text-[#6B6B6B]" />
            <span>Open in Google Maps</span>
          </a>
        </div>
      )}
    </main>
  );
}

export default StaticPage;
