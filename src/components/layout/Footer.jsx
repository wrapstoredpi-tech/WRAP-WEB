import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check } from 'lucide-react';
import { Button } from '../ui/Button';
import { Logo } from '../ui/Logo';
import { useProductsContext } from '../../context/ProductsContext';

export function Footer() {
  const { categories = [] } = useProductsContext();
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
    <footer className="bg-white border-t border-[#E7E5E4] mt-24 text-[#141414]">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 pb-14 border-b border-[#E7E5E4]">
          
          {/* Brand Premise & Newsletter (5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            <Logo size="md" />
            
            <p className="text-body text-[#666664] max-w-sm pt-1 leading-relaxed">
              Quiet design and intentional craft. Low-profile protective structures and daily carry essentials.
            </p>

            {/* Newsletter Subscription */}
            <div className="pt-2 max-w-sm space-y-2">
              <span className="text-[12px] uppercase font-semibold text-[#666664] tracking-wider block">
                Stay in the loop
              </span>
              <form onSubmit={handleSubscribe} className="flex gap-2">
                <input
                  type="email"
                  required
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 bg-[#FAFAF9] border border-[#E7E5E4] rounded-lg px-3.5 py-2.5 text-body text-[#141414] placeholder:text-[#A8A29E] focus:outline-none focus:border-[#141414] transition-colors"
                />
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  rightIcon={subscribed ? <Check className="w-4 h-4 text-emerald-400" /> : <ArrowRight className="w-4 h-4" />}
                >
                  {subscribed ? 'Joined' : 'Subscribe'}
                </Button>
              </form>
              {subscribed && (
                <p className="text-caption text-emerald-700 mt-1 animate-fade-in font-semibold">
                  Thank you for subscribing to WrapStore updates.
                </p>
              )}
            </div>
          </div>

          {/* Navigation Links Grid (7 Cols: 3 Sub-columns) */}
          <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8">
            
            {/* Column 1: Collection */}
            <div className="space-y-3">
              <p className="text-caption uppercase font-semibold text-[#141414] tracking-wider">
                Collection
              </p>
              <ul className="space-y-2.5 text-body text-[#666664]">
                <li>
                  <Link to="/" className="hover:text-[#141414] transition-colors">
                    All Products
                  </Link>
                </li>
                {categories.map((cat) => (
                  <li key={cat.id}>
                    <Link
                      to={`/?category=${encodeURIComponent(cat.name)}`}
                      className="hover:text-[#141414] transition-colors"
                    >
                      {cat.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 2: Assistance */}
            <div className="space-y-3">
              <p className="text-caption uppercase font-semibold text-[#141414] tracking-wider">
                Assistance
              </p>
              <ul className="space-y-2.5 text-body text-[#666664]">
                <li>
                  <Link to="/track-order" className="hover:text-[#141414] transition-colors">
                    Track Order
                  </Link>
                </li>
                <li>
                  <Link to="/cart" className="hover:text-[#141414] transition-colors">
                    Shopping Bag
                  </Link>
                </li>
                <li>
                  <Link to="/checkout" className="hover:text-[#141414] transition-colors">
                    Checkout
                  </Link>
                </li>
                <li>
                  <span className="text-[#666664] cursor-default">
                    Lifetime Guarantee
                  </span>
                </li>
                <li>
                  <span className="text-[#666664] cursor-default">
                    30-Day Returns
                  </span>
                </li>
              </ul>
            </div>

            {/* Column 3: Studio */}
            <div className="space-y-3">
              <p className="text-caption uppercase font-semibold text-[#141414] tracking-wider">
                Studio
              </p>
              <ul className="space-y-2.5 text-body text-[#666664]">
                <li>
                  <span className="text-[#666664] cursor-default">
                    Precision Fit
                  </span>
                </li>
                <li>
                  <span className="text-[#666664] cursor-default">
                    Tactile Materials
                  </span>
                </li>
                <li>
                  <span className="text-[#666664] cursor-default">
                    Everyday Carry
                  </span>
                </li>
                <li>
                  <span className="text-[#666664] cursor-default">
                    Support: contact@wrapstore.in
                  </span>
                </li>
              </ul>
            </div>

          </div>
        </div>

        {/* Bottom Bar: Copyright and Legal Links (No INR) */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-caption text-[#666664]">
          <p className="font-normal">
            &copy; {new Date().getFullYear()} WrapStore. All rights reserved.
          </p>

          <div className="flex items-center space-x-6 text-caption text-[#666664]">
            <span className="cursor-default hover:text-[#141414] transition-colors">Privacy Policy</span>
            <span className="cursor-default hover:text-[#141414] transition-colors">Terms of Service</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
