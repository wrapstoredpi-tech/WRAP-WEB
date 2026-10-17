import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProductsContext } from '../../context/ProductsContext';
import { getSubcategoryImageUrl } from '../../lib/subcategoryImages';

export function AccessoriesSection() {
  const navigate = useNavigate();
  const { products, categories, subcategories } = useProductsContext();

  // Find subcategories that have at least 1 product
  const liveAccessories = useMemo(() => {
    // Determine which categories are accessory categories (not mobile cases)
    const accessoryCategoryIds = new Set(
      categories
        .filter((c) => {
          const name = c.name.toLowerCase();
          return !name.includes('case') && !name.includes('mobile');
        })
        .map((c) => c.id)
    );

    // Count products per subcategory
    const counts = {};
    for (const p of products) {
      if (p.subcategory_id) {
        counts[p.subcategory_id] = (counts[p.subcategory_id] || 0) + 1;
      }
      if (p.subcategory) {
        counts[p.subcategory] = (counts[p.subcategory] || 0) + 1;
      }
    }

    // Filter subcategories that belong to accessories and have products > 0
    let subs = subcategories.filter((sub) => {
      const isAccessory = accessoryCategoryIds.size > 0 ? accessoryCategoryIds.has(sub.category_id) : true;
      const count = counts[sub.id] || counts[sub.name] || 0;
      return isAccessory && count > 0;
    });

    // If database has no separate subcategories for accessories yet, fallback to active product subcategories
    if (subs.length === 0) {
      const activeNames = new Set(
        products
          .filter((p) => {
            const cat = (p.category || '').toLowerCase();
            return !cat.includes('case');
          })
          .map((p) => p.subcategory)
          .filter(Boolean)
      );

      subs = Array.from(activeNames).map((name) => ({
        id: name,
        name,
        slug: name.toLowerCase().replace(/\s+/g, '-'),
      }));
    }

    // Curate list with images
    return subs.map((sub) => {
      const img = getSubcategoryImageUrl(sub);
      return {
        ...sub,
        image: img || '/subcategories/tempered-glass.jpg',
      };
    });
  }, [products, categories, subcategories]);

  if (liveAccessories.length === 0) return null;

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-[28px] font-semibold text-[#141414] tracking-[-0.01em]">
          Accessories
        </h2>
        <p className="text-[14px] text-[#6B6B6B]">
          Screen protection, straps, chargers and everyday mobile essentials.
        </p>
      </div>

      {/* Large Rectangular Photo Tiles: 4 columns desktop, 2 mobile */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {liveAccessories.map((sub) => (
          <button
            key={sub.id || sub.name}
            type="button"
            onClick={() => navigate(`/?category=Accessories&subcategory=${encodeURIComponent(sub.name)}`)}
            className="group block w-full rounded-[6px] overflow-hidden border border-[#E5E5E3] bg-white hover:border-[#141414] transition-colors text-left cursor-pointer"
          >
            {/* Rectangular aspect ratio */}
            <div className="aspect-[16/10] w-full overflow-hidden bg-[#FAFAF9]">
              <img
                src={sub.image}
                alt={sub.name}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
              />
            </div>
            <div className="p-3.5 bg-white border-t border-[#E5E5E3] flex items-center justify-between">
              <span className="text-[16px] font-semibold text-[#141414] line-clamp-1">
                {sub.name}
              </span>
              <span className="text-[12px] font-semibold text-[#B0521F] shrink-0 ml-2">
                View →
              </span>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

export default AccessoriesSection;
