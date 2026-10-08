import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Local category & accessory tile definitions matching the exact design reference.
 * "Tech" acts as the comprehensive "All" view with high-resolution bundled studio photography.
 */
export const CATEGORY_TILES = {
  tech: [
    {
      id: 'phone-cases',
      title: 'Phone Cases',
      image: '/subcategories/iphone.jpg',
      category: 'Mobile Cases',
      subcategory: null,
      alt: 'Precision Phone Cases & Armor',
    },
    {
      id: 'watch-bands',
      title: 'Watch Bands',
      image: '/subcategories/watch-strap.jpg',
      category: 'Accessories',
      subcategory: 'Watch Strap',
      alt: 'Apple Watch Straps & Bands',
    },
    {
      id: 'power-banks',
      title: 'Power Banks',
      image: '/subcategories/power-bank.jpg',
      category: 'Gadgets',
      subcategory: 'Power Bank',
      alt: 'MagSafe Wireless Power Banks',
    },
    {
      id: 'wireless-chargers',
      title: 'Wireless Chargers',
      image: '/subcategories/phone-stand.jpg',
      category: 'Accessories',
      subcategory: 'Phone Stand',
      alt: 'Multi-device Wireless Charging Stands',
    },
    {
      id: 'airpods-cases',
      title: 'AirPods Cases',
      image: '/subcategories/airpods-cases.jpg',
      category: 'Accessories',
      subcategory: 'AirPods Cases',
      alt: 'AirPods Armor & Silicone Cases',
    },
    {
      id: 'cables',
      title: 'Charging Cables',
      image: '/subcategories/cables.jpg',
      category: 'Gadgets',
      subcategory: 'Cables',
      alt: '240W Fast Braided Cables',
    },
    {
      id: 'screen-protectors',
      title: 'Screen Protectors',
      image: '/subcategories/tempered-glass.jpg',
      category: 'Accessories',
      subcategory: 'Tempered Glass',
      alt: '9H Tempered Glass Screen Guards',
    },
    {
      id: 'lens-protector',
      title: 'Lens Protectors',
      image: '/subcategories/lens-protector.jpg',
      category: 'Accessories',
      subcategory: 'Lens Protector',
      alt: 'Sapphire Camera Lens Rings',
    },
  ],
  bags: [
    {
      id: 'wallets',
      title: 'MagSafe Wallets',
      image: '/subcategories/wallet.jpg',
      category: 'Accessories',
      subcategory: 'Wallet',
      alt: 'Slim RFID MagSafe Leather Wallets',
    },
    {
      id: 'ipad-cases',
      title: 'iPad Cases & Sleeves',
      image: '/subcategories/ipad-case.jpg',
      category: 'Accessories',
      subcategory: 'iPad Case',
      alt: 'iPad Smart Folios and Protective Sleeves',
    },
    {
      id: 'watch-cases',
      title: 'Watch Armor Cases',
      image: '/subcategories/watch-cases.jpg',
      category: 'Accessories',
      subcategory: 'Watch Cases',
      alt: 'Smartwatch Impact Protection Bumpers',
    },
    {
      id: 'skins',
      title: 'Device Skins & Wraps',
      image: '/subcategories/skin.jpg',
      category: 'Accessories',
      subcategory: 'Skin',
      alt: '3M Precision Textured Vinyl Skins',
    },
  ],
  work: [
    {
      id: 'cables-work',
      title: 'Fast Charging Cables',
      image: '/subcategories/cables.jpg',
      category: 'Gadgets',
      subcategory: 'Cables',
      alt: 'Durable Ballistic Braided USB-C Cables',
    },
    {
      id: 'adapters',
      title: 'Power Adapters',
      image: '/subcategories/adapters.jpg',
      category: 'Gadgets',
      subcategory: 'Adapters',
      alt: '65W Dual Port GaN Fast Chargers',
    },
    {
      id: 'phone-stands',
      title: 'Desk Phone Stands',
      image: '/subcategories/phone-stand.jpg',
      category: 'Accessories',
      subcategory: 'Phone Stand',
      alt: 'Origami Foldable Magnetic Desk Stands',
    },
    {
      id: 'cleaning-kits',
      title: 'Cleaning & Care Kits',
      image: '/subcategories/cleaning-kit.jpg',
      category: 'Accessories',
      subcategory: 'Cleaning Kit',
      alt: '7-in-1 Port & Screen Precision Care Kits',
    },
    {
      id: 'ipad-temper',
      title: 'iPad Paper-Feel Glass',
      image: '/subcategories/ipad-temper.jpg',
      category: 'Accessories',
      subcategory: 'iPad Temper',
      alt: 'Matte Anti-Glare Drawing Protectors',
    },
    {
      id: 'badge-stickers',
      title: 'Badges & Decals',
      image: '/subcategories/badge-stickers.jpg',
      category: 'Accessories',
      subcategory: 'Badge / Stickers',
      alt: 'Metallic Embossed Accent Decals',
    },
  ],
};

const TABS = [
  { id: 'tech', label: 'Tech' },
  { id: 'bags', label: 'Bags' },
  { id: 'work', label: 'Work Essentials' },
];

export function ShopByCategory({ onSelectTile }) {
  const [activeTab, setActiveTab] = useState('tech');
  const navigate = useNavigate();

  const currentTiles = CATEGORY_TILES[activeTab] || CATEGORY_TILES.tech;

  const handleTileClick = (tile) => {
    if (onSelectTile) {
      onSelectTile(tile);
      return;
    }

    if (tile.category && tile.subcategory) {
      navigate(`/?category=${encodeURIComponent(tile.category)}&subcategory=${encodeURIComponent(tile.subcategory)}`);
    } else if (tile.category) {
      navigate(`/?category=${encodeURIComponent(tile.category)}`);
    } else {
      navigate('/');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleViewAll = () => {
    if (onSelectTile) {
      onSelectTile({ category: 'All' });
      return;
    }
    navigate('/?category=All');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <section className="w-full space-y-6 pt-2 pb-4 animate-fade-in" aria-label="Shop by Category">
      {/* ── Section Title ── */}
      <h2 className="text-[24px] sm:text-[28px] md:text-[32px] font-black uppercase tracking-tight text-[#141414]">
        SHOP BY CATEGORY
      </h2>

      {/* ── Subheader Controls: Filter Pills (Left) & View All (Right) ── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2.5">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 sm:px-5 py-2 rounded-md text-[13px] sm:text-[14px] font-semibold transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-black text-white border border-black shadow-xs'
                    : 'bg-transparent text-[#141414] border border-[#141414]/30 hover:border-black'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={handleViewAll}
          className="text-[14px] sm:text-[15px] font-medium text-[#141414] hover:text-[#9E381A] underline underline-offset-4 transition-colors cursor-pointer"
        >
          View All
        </button>
      </div>

      {/* ── Category Tile Grid (Clean 4-column layout matching reference image) ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
        {currentTiles.map((tile) => (
          <div
            key={tile.id}
            onClick={() => handleTileClick(tile)}
            className="group cursor-pointer flex flex-col focus:outline-none"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleTileClick(tile);
              }
            }}
          >
            {/* Square/Portrait Tile Container with Light Gray Studio Canvas */}
            <div className="relative aspect-square w-full rounded-sm overflow-hidden bg-[#ECEBE7] flex items-center justify-center p-4 sm:p-6 transition-colors duration-200 group-hover:bg-[#E5E4E0]">
              <img
                src={tile.image}
                alt={tile.alt || tile.title}
                loading="lazy"
                className="w-full h-full object-contain object-center transition-transform duration-300 ease-out group-hover:scale-105"
              />
            </div>

            {/* Clean Title Underneath the Tile */}
            <h3 className="mt-2.5 sm:mt-3 text-[14px] sm:text-[16px] font-medium sm:font-semibold text-[#141414] group-hover:text-[#9E381A] transition-colors leading-snug">
              {tile.title}
            </h3>
          </div>
        ))}
      </div>
    </section>
  );
}

export default ShopByCategory;
