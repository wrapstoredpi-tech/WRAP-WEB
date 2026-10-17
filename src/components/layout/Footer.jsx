import React from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '../ui/Logo';
import { store } from '../../config/store';

export function Footer() {
  return (
    <footer className="w-full bg-white border-t border-[#E5E5E3] mt-16 text-[#141414]">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-12 sm:py-16">
        
        {/* Main Grid: 4 Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 pb-12 border-b border-[#E5E5E3]">
          
          {/* Brand Info */}
          <div className="space-y-3">
            <Link to="/" className="inline-block">
              <Logo size="md" />
            </Link>
            <p className="text-[14px] text-[#6B6B6B] leading-relaxed">
              Precision-molded protective phone cases and curated daily accessories. Physical store in Dharmapuri.
            </p>
            <div className="pt-2">
              <span className="block text-[12px] font-semibold text-[#141414]">Online Payment</span>
              <p className="text-[12px] text-[#6B6B6B] mt-0.5 leading-normal">
                Secure online payment by Razorpay (UPI, Cards, Net Banking, Wallets).
              </p>
            </div>
          </div>

          {/* Shop Column */}
          <div className="space-y-3">
            <h3 className="text-[16px] font-semibold text-[#141414]">
              Shop Collection
            </h3>
            <ul className="space-y-2 text-[14px] text-[#6B6B6B]">
              <li>
                <Link to="/?brand=Apple&category=Mobile%20Cases" className="hover:text-[#141414] transition-colors">
                  iPhone Cases
                </Link>
              </li>
              <li>
                <Link to="/?brand=Samsung&category=Mobile%20Cases" className="hover:text-[#141414] transition-colors">
                  Samsung Cases
                </Link>
              </li>
              <li>
                <Link to="/?category=Accessories" className="hover:text-[#141414] transition-colors">
                  All Accessories
                </Link>
              </li>
              <li>
                <Link to="/?subcategory=Tempered%20Glass" className="hover:text-[#141414] transition-colors">
                  Tempered Glass &amp; Lens Protectors
                </Link>
              </li>
            </ul>
          </div>

          {/* Quick Links Column */}
          <div className="space-y-3">
            <h3 className="text-[16px] font-semibold text-[#141414]">
              Quick Links
            </h3>
            <ul className="space-y-2 text-[14px] text-[#6B6B6B]">
              <li>
                <Link to="/about" className="hover:text-[#141414] transition-colors">
                  About us
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-[#141414] transition-colors">
                  Contact &amp; Store details
                </Link>
              </li>
              <li>
                <Link to="/track-order" className="hover:text-[#141414] transition-colors">
                  Track your order
                </Link>
              </li>
              <li>
                <Link to="/shipping-returns" className="hover:text-[#141414] transition-colors">
                  Shipping and returns
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-[#141414] transition-colors">
                  Privacy policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-[#141414] transition-colors">
                  Terms and conditions
                </Link>
              </li>
            </ul>
          </div>

          {/* Store Address & Contact Column */}
          <div className="space-y-3">
            <h3 className="text-[16px] font-semibold text-[#141414]">
              Store &amp; Location
            </h3>
            <div className="space-y-2 text-[14px] text-[#6B6B6B]">
              <div className="leading-relaxed">
                {store.addressLines.map((line, idx) => (
                  <p key={idx}>{line}</p>
                ))}
              </div>

              {/* Hide the hours row while store.hours is empty */}
              {store.hours && store.hours.trim() !== '' && (
                <p className="text-[12px] pt-1">
                  <strong className="text-[#141414] block">Hours:</strong>
                  {store.hours}
                </p>
              )}

              <div className="pt-1">
                <a
                  href={`tel:${store.phoneTel}`}
                  className="text-[14px] text-[#141414] hover:text-[#B0521F] hover:underline"
                >
                  Call {store.phoneDisplay}
                </a>
              </div>

              {store.whatsappNumber && (
                <div className="pt-1">
                  <a
                    href={`https://wa.me/${store.whatsappNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[14px] font-semibold text-[#B0521F] hover:underline inline-flex items-center gap-1"
                  >
                    WhatsApp: +{store.whatsappNumber} →
                  </a>
                </div>
              )}

              <div className="pt-1">
                <a
                  href={store.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[13px] text-[#6B6B6B] hover:text-[#141414] hover:underline"
                >
                  View on Google Maps →
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[12px] text-[#6B6B6B]">
          <p>© {new Date().getFullYear()} WrapStore. All rights reserved.</p>
          <p>Online payment only via Razorpay. Dharmapuri, Tamil Nadu.</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
