import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export function Breadcrumbs({ category, productName, onCategoryClick }) {
  return (
    <nav aria-label="Breadcrumb" className="py-4 text-[12px] text-[#666664]">
      <ol className="flex items-center space-x-2 truncate font-normal">
        <li>
          <Link
            to="/"
            className="hover:text-[#141414] transition-colors"
          >
            Catalog
          </Link>
        </li>

        <li>
          <ChevronRight className="w-3.5 h-3.5 text-[#A8A29E]" />
        </li>

        {category && (
          <>
            <li>
              <Link
                to={`/?category=${encodeURIComponent(category)}`}
                onClick={onCategoryClick}
                className="hover:text-[#141414] transition-colors truncate"
              >
                {category}
              </Link>
            </li>
            <li>
              <ChevronRight className="w-3.5 h-3.5 text-[#A8A29E]" />
            </li>
          </>
        )}

        <li className="text-[#141414] font-semibold truncate" aria-current="page">
          {productName}
        </li>
      </ol>
    </nav>
  );
}

export default Breadcrumbs;
