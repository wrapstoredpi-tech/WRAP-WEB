import React, { useState } from 'react';
import { formatINR } from '../../lib/currency';

/**
 * groupOrderItems(rawItems)
 * Groups component rows (with combo_id / combo_name) back under their combo name.
 * Normal product lines remain unchanged.
 */
export function groupOrderItems(rawItems = []) {
  if (!Array.isArray(rawItems)) return [];

  const grouped = [];
  const comboMap = new Map();

  for (const item of rawItems) {
    // 1. Direct combo line with combo_items or components array
    if (item.is_combo || (Array.isArray(item.combo_items) && item.combo_items.length > 0)) {
      grouped.push({
        ...item,
        is_combo: true,
        components: item.combo_items || item.components || [],
      });
      continue;
    }

    // 2. Combo line formatted with "[Includes: ...]"
    if (item.name && item.name.includes('[Includes:')) {
      const parts = item.name.split('[Includes:');
      const comboName = parts[0].trim();
      const rawIncludes = parts[1].replace(/\]$/, '').trim();
      const componentNames = rawIncludes.split(',').map((s) => s.trim()).filter(Boolean);
      grouped.push({
        ...item,
        name: comboName,
        is_combo: true,
        components: componentNames.map((cn) => {
          const match = cn.match(/^(.*?)\s*\((\d+)\s*unit/i);
          return {
            name: match ? match[1].trim() : cn,
            product_name: match ? match[1].trim() : cn,
            allotted_qty: match ? parseInt(match[2], 10) : 1,
          };
        }),
      });
      continue;
    }

    // 3. Stored component rows with combo_id or combo_name
    const comboKey = item.combo_id || item.combo_name;
    if (comboKey) {
      if (!comboMap.has(comboKey)) {
        const comboGroup = {
          id: `combo_${comboKey}`,
          name: item.combo_name || 'Combo Bundle',
          selected_model: item.selected_model || item.mobile_model || 'Universal',
          quantity: item.combo_quantity || 1,
          price: item.combo_price || item.price || 0,
          is_combo: true,
          components: [],
        };
        comboMap.set(comboKey, comboGroup);
        grouped.push(comboGroup);
      }
      const comboGroup = comboMap.get(comboKey);
      comboGroup.components.push({
        name: item.name || item.product_name,
        product_name: item.name || item.product_name,
        allotted_qty: item.allotted_qty || item.quantity || 1,
        mobile_model: item.mobile_model || item.selected_model,
      });
      continue;
    }

    // 4. Standard product line
    grouped.push(item);
  }

  return grouped;
}

/**
 * CompactComboComponentList
 * Renders compact text rows (name and quantity, no thumbnails).
 * Expanded for 4 or fewer items; collapsible toggle for > 4 items.
 */
export function CompactComboComponentList({ components = [], quantity = 1 }) {
  const [showAll, setShowAll] = useState(false);

  if (!Array.isArray(components) || components.length === 0) return null;
  const displayed = showAll ? components : components.slice(0, 4);

  return (
    <div className="pl-3 border-l border-[#E5E5E3] mt-1.5 space-y-1 text-[12px] text-[#737373]">
      {displayed.map((c, idx) => (
        <div key={idx} className="flex justify-between items-center gap-2">
          <span className="truncate">• {c.product_name || c.name}</span>
          <span className="tabular-nums shrink-0">
            × {(c.allotted_qty || 1) * (quantity || 1)}
          </span>
        </div>
      ))}
      {components.length > 4 && (
        <button
          type="button"
          onClick={() => setShowAll((prev) => !prev)}
          className="text-[11px] font-semibold text-[#B0521F] hover:underline pt-0.5 cursor-pointer block text-left"
        >
          {showAll ? 'Show fewer' : `Show all ${components.length} items`}
        </button>
      )}
    </div>
  );
}

export default { groupOrderItems, CompactComboComponentList };

