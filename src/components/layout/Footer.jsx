import React, { useState } from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { Button } from '../ui/Button';
import { Logo } from '../ui/Logo';

export function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setTimeout(() => {
        setEmail('');
      }, 2500);
    }
  };

  return (
    <footer className="bg-neutral-100 border-t border-neutral-200 mt-24 text-neutral-900">
      <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 pt-16 pb-12">
        {/* Top Section: Editorial Newsletter & Brand Premise */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 pb-16 border-b border-neutral-200">
          <div className="lg:col-span-6 space-y-4">
            <span className="text-metadata uppercase text-neutral-500 font-semibold tracking-editorial">
              Newsletter & Releases
            </span>
            <h3 className="font-sans font-medium text-h2 text-neutral-900 tracking-tight">
              Quiet design. Intentional craft.
            </h3>
            <p className="text-body text-neutral-500 max-w-md">
              Receive limited run notifications, material field notes, and private archive sales directly to your inbox.
            </p>

            {/* Newsletter Form */}
            <form onSubmit={handleSubscribe} className="pt-2 max-w-md">
              <div className="flex flex-col sm:flex-row gap-2.5">
                <input
                  type="email"
                  required
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="
                    flex-1 bg-base-offwhite border border-neutral-300 px-4 py-3 text-body-sm
                    text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-accent
                  "
                />
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  rightIcon={subscribed ? <Check className="w-4 h-4 text-emerald-400" /> : <ArrowRight className="w-4 h-4" />}
                >
                  {subscribed ? 'Subscribed' : 'Join'}
                </Button>
              </div>
              {subscribed && (
                <p className="text-body-sm text-accent mt-2 animate-fade-in font-medium">
                  Welcome to the WrapStore index.
                </p>
              )}
            </form>
          </div>

          {/* Navigation Links Grid */}
          <div className="lg:col-span-6 grid grid-cols-2 sm:grid-cols-3 gap-8">
            {/* Column 1: Shop */}
            <div className="space-y-4">
              <p className="text-metadata uppercase font-semibold text-neutral-900 tracking-editorial">
                Collection
              </p>
              <ul className="space-y-2.5 text-body-sm text-neutral-500">
                <li><a href="#new" className="hover:text-neutral-900 transition-colors">New Arrivals</a></li>
                <li><a href="#cases" className="hover:text-neutral-900 transition-colors">Phone Cases</a></li>
                <li><a href="#sleeves" className="hover:text-neutral-900 transition-colors">Laptop Sleeves</a></li>
                <li><a href="#desk" className="hover:text-neutral-900 transition-colors">Desk Mats</a></li>
                <li><a href="#leather" className="hover:text-neutral-900 transition-colors">Small Leather Goods</a></li>
                <li><a href="#archive" className="hover:text-neutral-900 transition-colors">Archive</a></li>
              </ul>
            </div>

            {/* Column 2: Assistance */}
            <div className="space-y-4">
              <p className="text-metadata uppercase font-semibold text-neutral-900 tracking-editorial">
                Assistance
              </p>
              <ul className="space-y-2.5 text-body-sm text-neutral-500">
                <li><a href="#shipping" className="hover:text-neutral-900 transition-colors">Shipping & Returns</a></li>
                <li><a href="#care" className="hover:text-neutral-900 transition-colors">Material Care Guide</a></li>
                <li><a href="#warranty" className="hover:text-neutral-900 transition-colors">Lifetime Guarantee</a></li>
                <li><a href="#orders" className="hover:text-neutral-900 transition-colors">Order Tracking</a></li>
                <li><a href="#contact" className="hover:text-neutral-900 transition-colors">Contact Concierge</a></li>
              </ul>
            </div>

            {/* Column 3: Philosophy */}
            <div className="space-y-4">
              <p className="text-metadata uppercase font-semibold text-neutral-900 tracking-editorial">
                Studio
              </p>
              <ul className="space-y-2.5 text-body-sm text-neutral-500">
                <li><a href="#about" className="hover:text-neutral-900 transition-colors">Our Approach</a></li>
                <li><a href="#sustainability" className="hover:text-neutral-900 transition-colors">Tannery Provenance</a></li>
                <li><a href="#press" className="hover:text-neutral-900 transition-colors">Journal & Stories</a></li>
                <li><a href="#careers" className="hover:text-neutral-900 transition-colors">Careers</a></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Wordmark, Copyright, Currency & Policies */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-body-sm text-neutral-500">
          <div className="flex items-center space-x-3.5">
            <Logo size="sm" className="h-5 opacity-90" />
            <span>&copy; {new Date().getFullYear()} WrapStore Studio Inc. All rights reserved.</span>
          </div>

          <div className="flex items-center space-x-6 text-xs text-neutral-500">
            <a href="#privacy" className="hover:text-neutral-900 transition-colors">Privacy Policy</a>
            <a href="#terms" className="hover:text-neutral-900 transition-colors">Terms of Service</a>
            <span className="text-neutral-300">|</span>
            <span className="text-neutral-700 font-medium">USD ($)</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
