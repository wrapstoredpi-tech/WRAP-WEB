import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export function Breadcrumbs({ category, productName, onCategoryClick }) {
  return (
    <nav aria-label="Breadcrumb" className="py-4 text-xs font-medium text-neutral-500">
      <ol className="flex items-center space-x-2 truncate">
        <li>
          <Link
            to="/"
            className="hover:text-neutral-900 transition-colors uppercase tracking-editorial"
          >
            Home
          </Link>
        </li>

        <li>
          <ChevronRight className="w-3 h-3 text-neutral-400" />
        </li>

        {category && (
          <>
            <li>
              <Link
                to={`/?category=${encodeURIComponent(category)}`}
                onClick={onCategoryClick}
                className="hover:text-neutral-900 transition-colors uppercase tracking-editorial truncate"
              >
                {category}
              </Link>
            </li>
            <li>
              <ChevronRight className="w-3 h-3 text-neutral-400" />
            </li>
          </>
        )}

        <li className="text-neutral-900 font-semibold truncate" aria-current="page">
          {productName}
        </li>
      </ol>
    </nav>
  );
}

export default Breadcrumbs;
