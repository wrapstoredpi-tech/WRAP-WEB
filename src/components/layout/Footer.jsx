import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronUp, MessageCircle } from 'lucide-react';
import { Logo } from '../ui/Logo';
import { store } from '../../config/store';
import { useProductsContext } from '../../context/ProductsContext';
import { hasLiveCasesForBrand } from '../../lib/models';

function InstagramIcon({ className = 'w-4 h-4' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

export function Footer() {
  const { products = [] } = useProductsContext();
  const hasSamsung = hasLiveCasesForBrand(products, 'Samsung');

  // Check live accessory groups
  const hasScreen = products.some(
    (p) =>
      p.is_active !== false &&
      p.online_visible !== false &&
      (p.available_stock ?? p.current_stock ?? 0) > 0 &&
      ((p.subcategory || '').toLowerCase().includes('glass') ||
        (p.subcategory || '').toLowerCase().includes('screen') ||
        (p.subcategory || '').toLowerCase().includes('lens'))
  );

  const hasCables = products.some(
    (p) =>
      p.is_active !== false &&
      p.online_visible !== false &&
      (p.available_stock ?? p.current_stock ?? 0) > 0 &&
      ((p.subcategory || '').toLowerCase().includes('cable') ||
        (p.subcategory || '').toLowerCase().includes('charger') ||
        (p.subcategory || '').toLowerCase().includes('adapter'))
  );

  const hasPowerBanks = products.some(
    (p) =>
      p.is_active !== false &&
      p.online_visible !== false &&
      (p.available_stock ?? p.current_stock ?? 0) > 0 &&
      (p.subcategory || '').toLowerCase().includes('power')
  );

  const hasWatchStraps = products.some(
    (p) =>
      p.is_active !== false &&
      p.online_visible !== false &&
      (p.available_stock ?? p.current_stock ?? 0) > 0 &&
      ((p.subcategory || '').toLowerCase().includes('watch') ||
        (p.subcategory || '').toLowerCase().includes('strap'))
  );

  // Mobile accordion open states
  const [openAccordions, setOpenAccordions] = useState({
    shop: false,
    help: false,
    company: false,
  });

  const toggleAccordion = (key) => {
    setOpenAccordions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const whatsappUrl = store.whatsappNumber
    ? `https://wa.me/${store.whatsappNumber}`
    : 'https://wa.me/918122747947';
  const instagramUrl = store.instagramUrl || 'https://instagram.com/wrapstore.in';

  return (
    <footer className="w-full bg-white border-t border-[#E7E5E0] text-[#141414] select-none">
      <div className="w-full max-w-[1280px] mx-auto px-4 md:px-8 py-12 lg:py-16">
        
        {/* DESKTOP VIEW: Left brand column + 3 link columns */}
        <div className="hidden lg:grid lg:grid-cols-12 gap-10 pb-12">
          {/* Left Column (max 360px) */}
          <div className="lg:col-span-5 max-w-[360px] space-y-4">
            <Link to="/" className="inline-block" aria-label="WrapStore Home">
              <Logo size="md" />
            </Link>

            <p className="text-[14px] text-[#5A5A5A] leading-relaxed">
              Phone cases and accessories from Dharmapuri, shipped across India. Online payment only,
              through Razorpay.
            </p>

            {/* Round Instagram and WhatsApp icon buttons */}
            <div className="flex items-center gap-2.5 pt-1">
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Follow WrapStore on Instagram"
                className="w-10 h-10 rounded-full border border-[#E7E5E0] hover:border-[#141414] flex items-center justify-center text-[#141414] hover:bg-[#F4F2EE] transition-colors"
              >
                <InstagramIcon className="w-4 h-4" />
              </a>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Chat with WrapStore on WhatsApp"
                className="w-10 h-10 rounded-full border border-[#E7E5E0] hover:border-[#141414] flex items-center justify-center text-[#141414] hover:bg-[#F4F2EE] transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Right 3 Link Columns */}
          <div className="lg:col-span-7 grid grid-cols-3 gap-8">
            {/* Column 1: SHOP */}
            <div className="space-y-3.5">
              <h3 className="text-[12px] font-semibold text-[#141414] uppercase tracking-[0.06em]">
                Shop
              </h3>
              <ul className="space-y-2.5 text-[14px] text-[#5A5A5A]">
                <li>
                  <Link to="/cases?brand=Apple" className="hover:text-[#141414] transition-colors">
                    iPhone cases
                  </Link>
                </li>
                {hasSamsung && (
                  <li>
                    <Link to="/cases?brand=Samsung" className="hover:text-[#141414] transition-colors">
                      Samsung cases
                    </Link>
                  </li>
                )}
                {hasScreen && (
                  <li>
                    <Link to="/accessories/tempered-glass" className="hover:text-[#141414] transition-colors">
                      Screen protection
                    </Link>
                  </li>
                )}
                {hasCables && (
                  <li>
                    <Link to="/accessories/cables" className="hover:text-[#141414] transition-colors">
                      Cables & chargers
                    </Link>
                  </li>
                )}
                {hasPowerBanks && (
                  <li>
                    <Link to="/accessories/power-bank" className="hover:text-[#141414] transition-colors">
                      Power banks
                    </Link>
                  </li>
                )}
                {hasWatchStraps && (
                  <li>
                    <Link to="/accessories/watch-strap" className="hover:text-[#141414] transition-colors">
                      Watch straps
                    </Link>
                  </li>
                )}
              </ul>
            </div>

            {/* Column 2: HELP */}
            <div className="space-y-3.5">
              <h3 className="text-[12px] font-semibold text-[#141414] uppercase tracking-[0.06em]">
                Help
              </h3>
              <ul className="space-y-2.5 text-[14px] text-[#5A5A5A]">
                <li>
                  <Link to="/track-order" className="hover:text-[#141414] transition-colors">
                    Track order
                  </Link>
                </li>
                <li>
                  <Link to="/shipping-policy" className="hover:text-[#141414] transition-colors">
                    Shipping policy
                  </Link>
                </li>
                <li>
                  <Link to="/returns-and-refunds" className="hover:text-[#141414] transition-colors">
                    Returns and replacements
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="hover:text-[#141414] transition-colors">
                    Contact us
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3: COMPANY */}
            <div className="space-y-3.5">
              <h3 className="text-[12px] font-semibold text-[#141414] uppercase tracking-[0.06em]">
                Company
              </h3>
              <ul className="space-y-2.5 text-[14px] text-[#5A5A5A]">
                <li>
                  <Link to="/about" className="hover:text-[#141414] transition-colors">
                    About us
                  </Link>
                </li>
                <li>
                  <a
                    href={store.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-[#141414] transition-colors"
                  >
                    Visit the store
                  </a>
                </li>
                <li>
                  <Link to="/privacy-policy" className="hover:text-[#141414] transition-colors">
                    Privacy policy
                  </Link>
                </li>
                <li>
                  <Link to="/terms-and-conditions" className="hover:text-[#141414] transition-colors">
                    Terms and conditions
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* MOBILE VIEW: Brand + Accordions */}
        <div className="lg:hidden pb-8 space-y-6">
          {/* Brand Info */}
          <div className="space-y-3">
            <Link to="/" className="inline-block" aria-label="WrapStore Home">
              <Logo size="md" />
            </Link>
            <p className="text-[14px] text-[#5A5A5A] leading-relaxed">
              Phone cases and accessories from Dharmapuri, shipped across India. Online payment only,
              through Razorpay.
            </p>
            {/* Social Icons */}
            <div className="flex items-center gap-2.5 pt-1">
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Follow WrapStore on Instagram"
                className="w-10 h-10 rounded-full border border-[#E7E5E0] hover:border-[#141414] flex items-center justify-center text-[#141414] transition-colors"
              >
                <InstagramIcon className="w-4 h-4" />
              </a>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Chat with WrapStore on WhatsApp"
                className="w-10 h-10 rounded-full border border-[#E7E5E0] hover:border-[#141414] flex items-center justify-center text-[#141414] transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Accordion 1: SHOP */}
          <div className="border-t border-[#E7E5E0] pt-3">
            <button
              type="button"
              onClick={() => toggleAccordion('shop')}
              className="w-full flex items-center justify-between py-2 text-[14px] font-semibold text-[#141414] uppercase tracking-[0.06em] text-left cursor-pointer"
              aria-expanded={openAccordions.shop}
            >
              <span>Shop</span>
              {openAccordions.shop ? (
                <ChevronUp className="w-4 h-4 text-[#5A5A5A]" />
              ) : (
                <ChevronDown className="w-4 h-4 text-[#5A5A5A]" />
              )}
            </button>
            {openAccordions.shop && (
              <ul className="pt-2 pb-3 space-y-2.5 text-[14px] text-[#5A5A5A]">
                <li>
                  <Link to="/cases?brand=Apple" className="block py-0.5 hover:text-[#141414]">
                    iPhone cases
                  </Link>
                </li>
                {hasSamsung && (
                  <li>
                    <Link to="/cases?brand=Samsung" className="block py-0.5 hover:text-[#141414]">
                      Samsung cases
                    </Link>
                  </li>
                )}
                {hasScreen && (
                  <li>
                    <Link to="/accessories/tempered-glass" className="block py-0.5 hover:text-[#141414]">
                      Screen protection
                    </Link>
                  </li>
                )}
                {hasCables && (
                  <li>
                    <Link to="/accessories/cables" className="block py-0.5 hover:text-[#141414]">
                      Cables & chargers
                    </Link>
                  </li>
                )}
                {hasPowerBanks && (
                  <li>
                    <Link to="/accessories/power-bank" className="block py-0.5 hover:text-[#141414]">
                      Power banks
                    </Link>
                  </li>
                )}
                {hasWatchStraps && (
                  <li>
                    <Link to="/accessories/watch-strap" className="block py-0.5 hover:text-[#141414]">
                      Watch straps
                    </Link>
                  </li>
                )}
              </ul>
            )}
          </div>

          {/* Accordion 2: HELP */}
          <div className="border-t border-[#E7E5E0] pt-3">
            <button
              type="button"
              onClick={() => toggleAccordion('help')}
              className="w-full flex items-center justify-between py-2 text-[14px] font-semibold text-[#141414] uppercase tracking-[0.06em] text-left cursor-pointer"
              aria-expanded={openAccordions.help}
            >
              <span>Help</span>
              {openAccordions.help ? (
                <ChevronUp className="w-4 h-4 text-[#5A5A5A]" />
              ) : (
                <ChevronDown className="w-4 h-4 text-[#5A5A5A]" />
              )}
            </button>
            {openAccordions.help && (
              <ul className="pt-2 pb-3 space-y-2.5 text-[14px] text-[#5A5A5A]">
                <li>
                  <Link to="/track-order" className="block py-0.5 hover:text-[#141414]">
                    Track order
                  </Link>
                </li>
                <li>
                  <Link to="/shipping-policy" className="block py-0.5 hover:text-[#141414]">
                    Shipping policy
                  </Link>
                </li>
                <li>
                  <Link to="/returns-and-refunds" className="block py-0.5 hover:text-[#141414]">
                    Returns and replacements
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="block py-0.5 hover:text-[#141414]">
                    Contact us
                  </Link>
                </li>
              </ul>
            )}
          </div>

          {/* Accordion 3: COMPANY */}
          <div className="border-t border-[#E7E5E0] pt-3">
            <button
              type="button"
              onClick={() => toggleAccordion('company')}
              className="w-full flex items-center justify-between py-2 text-[14px] font-semibold text-[#141414] uppercase tracking-[0.06em] text-left cursor-pointer"
              aria-expanded={openAccordions.company}
            >
              <span>Company</span>
              {openAccordions.company ? (
                <ChevronUp className="w-4 h-4 text-[#5A5A5A]" />
              ) : (
                <ChevronDown className="w-4 h-4 text-[#5A5A5A]" />
              )}
            </button>
            {openAccordions.company && (
              <ul className="pt-2 pb-3 space-y-2.5 text-[14px] text-[#5A5A5A]">
                <li>
                  <Link to="/about" className="block py-0.5 hover:text-[#141414]">
                    About us
                  </Link>
                </li>
                <li>
                  <a
                    href={store.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block py-0.5 hover:text-[#141414]"
                  >
                    Visit the store
                  </a>
                </li>
                <li>
                  <Link to="/privacy-policy" className="block py-0.5 hover:text-[#141414]">
                    Privacy policy
                  </Link>
                </li>
                <li>
                  <Link to="/terms-and-conditions" className="block py-0.5 hover:text-[#141414]">
                    Terms and conditions
                  </Link>
                </li>
              </ul>
            )}
          </div>
        </div>

        {/* BOTTOM BAR: 1px top border, copyright left, payment badges right */}
        <div className="pt-8 border-t border-[#E7E5E0] flex flex-col md:flex-row items-center justify-between gap-4 text-[13px] text-[#5A5A5A]">
          <p className="text-center md:text-left">
            © {new Date().getFullYear()} WrapStore, Dharmapuri
          </p>

          {/* Payment Badges as small outlined text chips */}
          <div className="flex flex-wrap items-center justify-center gap-2" aria-label="Accepted payment methods">
            <span className="text-[11px] font-medium border border-[#E7E5E0] bg-[#FAFAF9] px-2.5 py-1 rounded-[4px] text-[#5A5A5A]">
              UPI
            </span>
            <span className="text-[11px] font-medium border border-[#E7E5E0] bg-[#FAFAF9] px-2.5 py-1 rounded-[4px] text-[#5A5A5A]">
              Visa
            </span>
            <span className="text-[11px] font-medium border border-[#E7E5E0] bg-[#FAFAF9] px-2.5 py-1 rounded-[4px] text-[#5A5A5A]">
              Mastercard
            </span>
            <span className="text-[11px] font-medium border border-[#E7E5E0] bg-[#FAFAF9] px-2.5 py-1 rounded-[4px] text-[#5A5A5A]">
              RuPay
            </span>
            <span className="text-[11px] font-medium border border-[#E7E5E0] bg-[#FAFAF9] px-2.5 py-1 rounded-[4px] text-[#5A5A5A]">
              Net banking
            </span>
          </div>
        </div>

      </div>
    </footer>
  );
}

export default Footer;
