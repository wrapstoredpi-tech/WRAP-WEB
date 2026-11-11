import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronUp, MapPin, Phone, MessageSquare, ExternalLink } from 'lucide-react';
import { Logo } from '../ui/Logo';
import { store } from '../../config/store';
import { useProductsContext } from '../../context/ProductsContext';
import { hasLiveCasesForBrand, getLiveCombos } from '../../lib/models';

export function Footer() {
  const { products = [] } = useProductsContext();
  const hasSamsung = hasLiveCasesForBrand(products, 'Samsung');
  const combos = getLiveCombos(products, 1);
  const hasCombos = combos.length > 0;

  // Mobile accordion open states
  const [openAccordions, setOpenAccordions] = useState({
    shop: false,
    help: false,
    store: false,
  });

  const toggleAccordion = (key) => {
    setOpenAccordions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <footer className="w-full bg-white border-t border-[#E5E5E3] mt-16 text-[#141414] select-none">
      <div className="w-full max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8 py-10 sm:py-16">
        
        {/* DESKTOP VIEW (lg:grid lg:grid-cols-4): 4 Columns */}
        <div className="hidden lg:grid lg:grid-cols-4 gap-8 pb-12 border-b border-[#E5E5E3]">
          {/* Brand Info */}
          <div className="space-y-3">
            <Link to="/" className="inline-block" aria-label="WrapStore Home">
              <Logo size="md" />
            </Link>
            <p className="text-[14px] text-[#6B6B6B] leading-relaxed">
              Phone cases and accessories from Dharmapuri.
            </p>
            <div className="pt-2">
              <span className="block text-[12px] font-semibold text-[#141414]">Prepaid Orders</span>
              <p className="text-[12px] text-[#6B6B6B] mt-0.5 leading-normal">
                100% online payment via Razorpay (UPI, Cards, Net Banking).
              </p>
            </div>
          </div>

          {/* Column 1: Shop (Live groups only) */}
          <div className="space-y-3">
            <h3 className="text-[15px] font-semibold text-[#141414]">
              Shop
            </h3>
            <ul className="space-y-2.5 text-[14px] text-[#6B6B6B]">
              <li>
                <Link to="/cases?brand=Apple" className="hover:text-[#B0521F] transition-colors">
                  iPhone Cases
                </Link>
              </li>
              {hasSamsung && (
                <li>
                  <Link to="/cases?brand=Samsung" className="hover:text-[#B0521F] transition-colors">
                    Samsung Cases
                  </Link>
                </li>
              )}
              <li>
                <Link to="/?category=Accessories" className="hover:text-[#B0521F] transition-colors">
                  Accessories
                </Link>
              </li>
              {hasCombos && (
                <li>
                  <Link to="/combos" className="hover:text-[#B0521F] transition-colors">
                    Combos
                  </Link>
                </li>
              )}
            </ul>
          </div>

          {/* Column 2: Help & Policies */}
          <div className="space-y-3">
            <h3 className="text-[15px] font-semibold text-[#141414]">
              Help & Policies
            </h3>
            <ul className="space-y-2.5 text-[14px] text-[#6B6B6B]">
              <li>
                <Link to="/about" className="hover:text-[#B0521F] transition-colors">
                  About us
                </Link>
              </li>
              <li>
                <Link to="/track-order" className="hover:text-[#B0521F] transition-colors">
                  Track order
                </Link>
              </li>
              <li>
                <Link to="/shipping-policy" className="hover:text-[#B0521F] transition-colors">
                  Shipping policy
                </Link>
              </li>
              <li>
                <Link to="/returns-and-refunds" className="hover:text-[#B0521F] transition-colors">
                  Returns and refunds
                </Link>
              </li>
              <li>
                <Link to="/privacy-policy" className="hover:text-[#B0521F] transition-colors">
                  Privacy policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-[#B0521F] transition-colors">
                  Terms and conditions
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-[#B0521F] transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Store & Contact */}
          <div className="space-y-3">
            <h3 className="text-[15px] font-semibold text-[#141414]">
              Store
            </h3>
            <div className="space-y-2.5 text-[14px] text-[#6B6B6B]">
              <div className="leading-relaxed">
                {store.addressLines.map((line, idx) => (
                  <p key={idx}>{line}</p>
                ))}
              </div>

              {store.hours && store.hours.trim() !== '' && (
                <p className="text-[13px] pt-1 text-[#141414]">
                  <strong>Hours:</strong> {store.hours}
                </p>
              )}

              <div className="pt-1 space-y-1.5">
                <div>
                  <a
                    href={`tel:${store.phoneTel}`}
                    className="hover:text-[#B0521F] transition-colors inline-flex items-center gap-1.5"
                  >
                    <Phone className="w-3.5 h-3.5 text-[#B0521F]" />
                    <span>Call {store.phoneDisplay}</span>
                  </a>
                </div>
                {store.whatsappNumber && (
                  <div>
                    <a
                      href={`https://wa.me/${store.whatsappNumber}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-[#B0521F] transition-colors inline-flex items-center gap-1.5 font-medium text-[#141414]"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-[#25D366]" />
                      <span>WhatsApp us</span>
                    </a>
                  </div>
                )}
                <div>
                  <a
                    href={store.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-[#B0521F] transition-colors inline-flex items-center gap-1.5"
                  >
                    <MapPin className="w-3.5 h-3.5 text-[#B0521F]" />
                    <span>View on Google Maps</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* MOBILE VIEW (< 1024px): Brand info + Accordions */}
        <div className="lg:hidden pb-8 border-b border-[#E5E5E3] space-y-6">
          {/* Brand Info */}
          <div className="space-y-2">
            <Link to="/" className="inline-block" aria-label="WrapStore Home">
              <Logo size="md" />
            </Link>
            <p className="text-[14px] text-[#6B6B6B] leading-relaxed">
              Phone cases and accessories from Dharmapuri.
            </p>
          </div>

          {/* Accordion 1: Shop */}
          <div className="border-t border-[#E5E5E3] pt-3">
            <button
              type="button"
              onClick={() => toggleAccordion('shop')}
              className="w-full flex items-center justify-between py-2 text-[15px] font-semibold text-[#141414] text-left cursor-pointer"
              aria-expanded={openAccordions.shop}
            >
              <span>Shop</span>
              {openAccordions.shop ? (
                <ChevronUp className="w-4 h-4 text-[#6B6B6B]" />
              ) : (
                <ChevronDown className="w-4 h-4 text-[#6B6B6B]" />
              )}
            </button>
            {openAccordions.shop && (
              <ul className="pt-2 pb-3 space-y-2 text-[14px] text-[#6B6B6B]">
                <li>
                  <Link to="/cases?brand=Apple" className="hover:text-[#B0521F] block py-1">
                    iPhone Cases
                  </Link>
                </li>
                {hasSamsung && (
                  <li>
                    <Link to="/cases?brand=Samsung" className="hover:text-[#B0521F] block py-1">
                      Samsung Cases
                    </Link>
                  </li>
                )}
                <li>
                  <Link to="/?category=Accessories" className="hover:text-[#B0521F] block py-1">
                    Accessories
                  </Link>
                </li>
                {hasCombos && (
                  <li>
                    <Link to="/combos" className="hover:text-[#B0521F] block py-1">
                      Combos
                    </Link>
                  </li>
                )}
              </ul>
            )}
          </div>

          {/* Accordion 2: Help & Policies */}
          <div className="border-t border-[#E5E5E3] pt-3">
            <button
              type="button"
              onClick={() => toggleAccordion('help')}
              className="w-full flex items-center justify-between py-2 text-[15px] font-semibold text-[#141414] text-left cursor-pointer"
              aria-expanded={openAccordions.help}
            >
              <span>Help & Policies</span>
              {openAccordions.help ? (
                <ChevronUp className="w-4 h-4 text-[#6B6B6B]" />
              ) : (
                <ChevronDown className="w-4 h-4 text-[#6B6B6B]" />
              )}
            </button>
            {openAccordions.help && (
              <ul className="pt-2 pb-3 space-y-2 text-[14px] text-[#6B6B6B]">
                <li>
                  <Link to="/about" className="hover:text-[#B0521F] block py-1">
                    About us
                  </Link>
                </li>
                <li>
                  <Link to="/track-order" className="hover:text-[#B0521F] block py-1">
                    Track order
                  </Link>
                </li>
                <li>
                  <Link to="/shipping-policy" className="hover:text-[#B0521F] block py-1">
                    Shipping policy
                  </Link>
                </li>
                <li>
                  <Link to="/returns-and-refunds" className="hover:text-[#B0521F] block py-1">
                    Returns and refunds
                  </Link>
                </li>
                <li>
                  <Link to="/privacy-policy" className="hover:text-[#B0521F] block py-1">
                    Privacy policy
                  </Link>
                </li>
                <li>
                  <Link to="/terms" className="hover:text-[#B0521F] block py-1">
                    Terms and conditions
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="hover:text-[#B0521F] block py-1">
                    Contact
                  </Link>
                </li>
              </ul>
            )}
          </div>

          {/* Accordion 3: Store */}
          <div className="border-t border-[#E5E5E3] pt-3">
            <button
              type="button"
              onClick={() => toggleAccordion('store')}
              className="w-full flex items-center justify-between py-2 text-[15px] font-semibold text-[#141414] text-left cursor-pointer"
              aria-expanded={openAccordions.store}
            >
              <span>Store</span>
              {openAccordions.store ? (
                <ChevronUp className="w-4 h-4 text-[#6B6B6B]" />
              ) : (
                <ChevronDown className="w-4 h-4 text-[#6B6B6B]" />
              )}
            </button>
            {openAccordions.store && (
              <div className="pt-2 pb-3 space-y-2.5 text-[14px] text-[#6B6B6B]">
                <div>
                  {store.addressLines.map((line, idx) => (
                    <p key={idx}>{line}</p>
                  ))}
                </div>
                {store.hours && store.hours.trim() !== '' && (
                  <p className="text-[13px] text-[#141414]">
                    <strong>Hours:</strong> {store.hours}
                  </p>
                )}
                <div className="pt-1 space-y-2">
                  <div>
                    <a
                      href={`tel:${store.phoneTel}`}
                      className="hover:text-[#B0521F] inline-flex items-center gap-1.5"
                    >
                      <Phone className="w-3.5 h-3.5 text-[#B0521F]" />
                      <span>Call {store.phoneDisplay}</span>
                    </a>
                  </div>
                  {store.whatsappNumber && (
                    <div>
                      <a
                        href={`https://wa.me/${store.whatsappNumber}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-[#B0521F] inline-flex items-center gap-1.5 font-medium text-[#141414]"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-[#25D366]" />
                        <span>WhatsApp us</span>
                      </a>
                    </div>
                  )}
                  <div>
                    <a
                      href={store.mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-[#B0521F] inline-flex items-center gap-1.5"
                    >
                      <MapPin className="w-3.5 h-3.5 text-[#B0521F]" />
                      <span>View on Google Maps</span>
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Bar: Copyright & Payment Notice */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[12px] text-[#6B6B6B]">
          <p>© {new Date().getFullYear()} WrapStore. All rights reserved.</p>
          <p>Online payment only via Razorpay. Dharmapuri, Tamil Nadu.</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
