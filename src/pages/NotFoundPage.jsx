import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Compass } from 'lucide-react';
import { setPageMeta } from '../lib/seo';

export function NotFoundPage() {
  useEffect(() => {
    // Set document title and meta description
    setPageMeta({
      title: 'Page not found | WrapStore',
      description: 'The page you are looking for could not be found.',
    });

    // Add meta robots noindex tag
    let metaRobots = document.querySelector('meta[name="robots"]');
    let created = false;
    if (!metaRobots) {
      metaRobots = document.createElement('meta');
      metaRobots.setAttribute('name', 'robots');
      document.head.appendChild(metaRobots);
      created = true;
    }
    const prevContent = metaRobots.getAttribute('content');
    metaRobots.setAttribute('content', 'noindex');

    return () => {
      if (created) {
        metaRobots.remove();
      } else if (prevContent) {
        metaRobots.setAttribute('content', prevContent);
      } else {
        metaRobots.removeAttribute('content');
      }
    };
  }, []);

  return (
    <main className="flex-1 w-full max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8 py-20 sm:py-28 flex items-center justify-center">
      <div className="max-w-md w-full bg-white border border-[#E5E5E3] rounded-[6px] p-8 sm:p-10 text-center shadow-xs space-y-5">
        <div className="w-14 h-14 rounded-full bg-[#F4F3F0] flex items-center justify-center mx-auto text-[#141414]">
          <Compass className="w-7 h-7 stroke-[1.6]" />
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-semibold text-[#141414] tracking-[-0.025em]">
            Page not found
          </h1>
          <p className="text-[14px] text-[#6B6B6B] leading-relaxed max-w-sm mx-auto">
            The page you are looking for doesn't exist, has been moved, or the link is incorrect.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/"
            className="w-full sm:w-auto min-h-[46px] px-6 bg-[#141414] hover:bg-[#262626] text-white text-[14px] font-semibold rounded-[6px] transition-colors flex items-center justify-center cursor-pointer shadow-xs"
          >
            Home
          </Link>
          <Link
            to="/cases"
            className="w-full sm:w-auto min-h-[46px] px-6 bg-[#B0521F] hover:bg-[#964317] text-white text-[14px] font-semibold rounded-[6px] transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
          >
            <span>Find your model</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </main>
  );
}

export default NotFoundPage;
