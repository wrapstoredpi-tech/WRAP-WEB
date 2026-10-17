import React from 'react';
import { MapPin, ShieldCheck, MessageSquare } from 'lucide-react';
import { homeConfig } from '../../config/home';

export function HomeIntroSection() {
  const intro = homeConfig.intro || {};
  const facts = intro.facts || [];

  // Plain icons (no circles around them)
  const getIcon = (id) => {
    switch (id) {
      case 'location':
        return <MapPin className="w-5 h-5 text-[#B0521F] shrink-0" />;
      case 'payment':
        return <ShieldCheck className="w-5 h-5 text-[#B0521F] shrink-0" />;
      case 'support':
        return <MessageSquare className="w-5 h-5 text-[#B0521F] shrink-0" />;
      default:
        return null;
    }
  };

  return (
    <section className="bg-white border border-[#E5E5E3] rounded-[6px] p-6 sm:p-8 space-y-6" aria-labelledby="home-intro-heading">
      {/* Heading & 2 to 3 plain sentences */}
      <div className="max-w-3xl space-y-2">
        <h2 id="home-intro-heading" className="text-[24px] sm:text-[28px] font-semibold text-[#141414] tracking-[-0.01em]">
          {intro.heading || 'Phone cases and accessories, from a store in Dharmapuri'}
        </h2>
        <p className="text-[14px] sm:text-[16px] text-[#6B6B6B] leading-relaxed">
          {intro.description || 'Phone cases and accessories, from a store in Dharmapuri. Choose your phone, pick a design, pay securely online.'}
        </p>
      </div>

      {/* Three short facts in a row - compact, no icons in circles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-[#E5E5E3]">
        {facts.map((fact) => (
          <div key={fact.id || fact.title} className="flex items-start gap-3 p-3 rounded-[6px] bg-[#FAFAF9]">
            {getIcon(fact.id)}
            <div className="space-y-0.5">
              <h3 className="text-[14px] font-semibold text-[#141414]">
                {fact.title}
              </h3>
              <p className="text-[12px] text-[#6B6B6B] leading-normal">
                {fact.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default HomeIntroSection;
