/**
 * Real Catalog Mock Data for WrapStore
 * Reflects mobile-case & accessory catalog structure where one product design fits multiple phone models.
 */

export const mockProducts = [
  {
    id: "prod-001",
    product_id: "WS-000019",
    name: "Fererere Contour Case",
    category: "Mobile Cases",
    subcategory: "Samsung",
    brand_compatibility: ["Samsung"],
    compatible_models: ["Samsung Galaxy S24 Ultra", "Samsung Galaxy S24+", "Samsung Galaxy S24"],
    color_variants: ["Black", "Clear", "Blue"],
    mrp: 799,
    selling_price: 699,
    gst_percentage: 18,
    current_stock: 50,
    min_stock_level: 5,
    images: [
      { url: "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=1200&q=85", is_primary: true },
      { url: "https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?auto=format&fit=crop&w=1200&q=85", is_primary: false },
      { url: "https://images.unsplash.com/photo-1585336261026-7f09c62c3e10?auto=format&fit=crop&w=1200&q=85", is_primary: false },
      { url: "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=1200&q=85", is_primary: false },
    ],
    description: "Precision-molded contour case engineered for Samsung flagships. Features tactile responsive buttons, shock-absorbing perimeter geometry, and a scratch-resistant satin backplate.",
  },
  {
    id: "prod-002",
    product_id: "WS-000020",
    name: "Nomad Vachetta Leather Case",
    category: "Mobile Cases",
    subcategory: "Apple",
    brand_compatibility: ["Apple"],
    compatible_models: ["iPhone 16 Pro Max", "iPhone 16 Pro", "iPhone 15 Pro Max", "iPhone 15 Pro"],
    color_variants: ["Saddle Brown", "Black", "Tan"],
    mrp: 1499,
    selling_price: 1299,
    gst_percentage: 18,
    current_stock: 28,
    min_stock_level: 5,
    images: [
      { url: "https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?auto=format&fit=crop&w=1200&q=85", is_primary: true },
      { url: "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=1200&q=85", is_primary: false },
      { url: "https://images.unsplash.com/photo-1585336261026-7f09c62c3e10?auto=format&fit=crop&w=1200&q=85", is_primary: false },
    ],
    description: "Form-fitted from full-grain vegetable-tanned Scandinavian leather. Features machined anodized aluminum buttons, MagSafe alignment magnets, and develops a rich natural patina with use.",
  },
  {
    id: "prod-003",
    product_id: "WS-000021",
    name: "Apex Matte Armor Case",
    category: "Mobile Cases",
    subcategory: "Apple",
    brand_compatibility: ["Apple"],
    compatible_models: ["iPhone 16", "iPhone 16 Plus", "iPhone 15", "iPhone 15 Plus"],
    color_variants: ["Obsidian", "Frost", "Midnight", "Olive"],
    mrp: 999,
    selling_price: 849,
    gst_percentage: 18,
    current_stock: 40,
    min_stock_level: 5,
    images: [
      { url: "https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=1200&q=85", is_primary: true },
      { url: "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=1200&q=85", is_primary: false },
      { url: "https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?auto=format&fit=crop&w=1200&q=85", is_primary: false },
    ],
    description: "Ultra-slim 1.3mm armor chassis with air-cushion corner dampeners. Oleophobic matte coating repels fingerprint oils while maintaining superior grip.",
  },
  {
    id: "prod-004",
    product_id: "WS-000022",
    name: "AeroShield Clear Hybrid",
    category: "Mobile Cases",
    subcategory: "Samsung",
    brand_compatibility: ["Samsung"],
    compatible_models: ["Samsung Galaxy S24 Ultra", "Samsung Galaxy S23 Ultra", "Samsung Galaxy S24+"],
    color_variants: ["Clear", "Space Gray", "Blue"],
    mrp: 699,
    selling_price: 549,
    gst_percentage: 18,
    current_stock: 0, // OUT OF STOCK 1
    min_stock_level: 5,
    images: [
      { url: "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=1200&q=85", is_primary: true },
      { url: "https://images.unsplash.com/photo-1585336261026-7f09c62c3e10?auto=format&fit=crop&w=1200&q=85", is_primary: false },
    ],
    description: "Anti-yellowing optical clarity with reinforced Bayer polymer bumpers. Highlights the native device color while providing 8ft drop certification.",
  },
  {
    id: "prod-005",
    product_id: "WS-000023",
    name: "Terracotta Minimal Folio",
    category: "Mobile Cases",
    subcategory: "Apple",
    brand_compatibility: ["Apple"],
    compatible_models: ["iPhone 16 Pro Max", "iPhone 15 Pro Max"],
    color_variants: ["Terracotta", "Black", "Walnut"],
    mrp: 1899,
    selling_price: 1599,
    gst_percentage: 18,
    current_stock: 3, // LOW STOCK STATE (3 left)
    min_stock_level: 5,
    images: [
      { url: "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=1200&q=85", is_primary: true },
      { url: "https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?auto=format&fit=crop&w=1200&q=85", is_primary: false },
    ],
    description: "Handcrafted magnetic folio featuring 3 card slots, banknote compartment, and a detachable MagSafe inner shell with seamless transition between wallet and case.",
  },
  {
    id: "prod-006",
    product_id: "WS-000024",
    name: "Carbon Matrix Ultralight Case",
    category: "Mobile Cases",
    subcategory: "Samsung",
    brand_compatibility: ["Samsung"],
    compatible_models: ["Samsung Galaxy Z Fold 5", "Samsung Galaxy Z Fold 6", "Samsung Galaxy S24 Ultra"],
    color_variants: ["Black", "Midnight"],
    mrp: 1699,
    selling_price: 1499,
    gst_percentage: 18,
    current_stock: 18,
    min_stock_level: 4,
    images: [
      { url: "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=1200&q=85", is_primary: true },
      { url: "https://images.unsplash.com/photo-1585336261026-7f09c62c3e10?auto=format&fit=crop&w=1200&q=85", is_primary: false },
    ],
    description: "600D aerospace-grade aramid fiber construction. 5x stronger than steel on an equal weight basis with zero wireless charging interference.",
  },
  {
    id: "prod-007",
    product_id: "WS-000025",
    name: "Silicone Touch Shell",
    category: "Mobile Cases",
    subcategory: "Apple",
    brand_compatibility: ["Apple"],
    compatible_models: ["iPhone 16 Pro", "iPhone 16", "iPhone 15 Pro", "iPhone 15"],
    color_variants: ["Amber", "Sage", "Charcoal", "Sierra Blue"],
    mrp: 899,
    selling_price: 749,
    gst_percentage: 18,
    current_stock: 45,
    min_stock_level: 8,
    images: [
      { url: "https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?auto=format&fit=crop&w=1200&q=85", is_primary: true },
      { url: "https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=1200&q=85", is_primary: false },
    ],
    description: "Liquid silicone rubber exterior delivering a velvety, soft-touch tactile feel. Internal microfibre lining prevents device back glass scratches.",
  },
  {
    id: "prod-008",
    product_id: "WS-000026",
    name: "Tactical Bumper Grip Case",
    category: "Mobile Cases",
    subcategory: "Samsung",
    brand_compatibility: ["Samsung"],
    compatible_models: ["Samsung Galaxy S24", "Samsung Galaxy S24+", "Samsung Galaxy A55"],
    color_variants: ["Black", "Olive", "Sand"],
    mrp: 799,
    selling_price: 599,
    gst_percentage: 18,
    current_stock: 35,
    min_stock_level: 5,
    images: [
      { url: "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=1200&q=85", is_primary: true },
      { url: "https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?auto=format&fit=crop&w=1200&q=85", is_primary: false },
    ],
    description: "Textured lateral knurling provides unyielding grip during outdoor activity. Raised 1.5mm bezel protects the front AMOLED screen and camera cluster.",
  },
  {
    id: "prod-009",
    product_id: "WS-000027",
    name: "Universal MagSafe Snap Stand",
    category: "Accessories",
    subcategory: "Stands",
    brand_compatibility: ["Apple", "Samsung"],
    compatible_models: [], // ACCESSORY WITHOUT PHONE MODEL LOCK
    color_variants: ["Black", "Saddle Brown", "Slate"],
    mrp: 699,
    selling_price: 549,
    gst_percentage: 18,
    current_stock: 60,
    min_stock_level: 10,
    images: [
      { url: "https://images.unsplash.com/photo-1586105251261-72a756497a11?auto=format&fit=crop&w=1200&q=85", is_primary: true },
      { url: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=1200&q=85", is_primary: false },
    ],
    description: "Fold-flat origami magnetic stand and grip. Converts effortlessly between portrait FaceTime viewing and landscape video streaming angles.",
  },
  {
    id: "prod-010",
    product_id: "WS-000028",
    name: "Braided 240W USB-C Cable",
    category: "Gadgets",
    subcategory: "Cables",
    brand_compatibility: [],
    compatible_models: [], // GADGET WITHOUT PHONE MODEL LOCK
    color_variants: ["Charcoal", "Silver", "Amber"],
    mrp: 499,
    selling_price: 399,
    gst_percentage: 18,
    current_stock: 0, // OUT OF STOCK 2
    min_stock_level: 5,
    images: [
      { url: "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=1200&q=85", is_primary: true },
      { url: "https://images.unsplash.com/photo-1585336261026-7f09c62c3e10?auto=format&fit=crop&w=1200&q=85", is_primary: false },
    ],
    description: "Double-braided ballistic nylon jacket tested for 30,000+ bends. Supports USB Power Delivery 3.1 up to 240W and 480Mbps ultra-fast data transfer.",
  },
  {
    id: "prod-011",
    product_id: "WS-000029",
    name: "Magnetic 3-in-1 Travel Charger",
    category: "Gadgets",
    subcategory: "Wireless Chargers",
    brand_compatibility: ["Apple", "Samsung"],
    compatible_models: [], // GADGET WITHOUT PHONE MODEL LOCK
    color_variants: ["Black", "White"],
    mrp: 3499,
    selling_price: 2899,
    gst_percentage: 18,
    current_stock: 15,
    min_stock_level: 3,
    images: [
      { url: "https://images.unsplash.com/photo-1585336261026-7f09c62c3e10?auto=format&fit=crop&w=1200&q=85", is_primary: true },
      { url: "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=1200&q=85", is_primary: false },
    ],
    description: "Compact tri-fold wireless charging hub that powers phone, earbuds, and smartwatch simultaneously from a single USB-C port.",
  },
  {
    id: "prod-012",
    product_id: "WS-000030",
    name: "Merino Wool Felt Sleeve",
    category: "Accessories",
    subcategory: "Sleeves",
    brand_compatibility: ["Apple", "Universal"],
    compatible_models: [], // ACCESSORY
    color_variants: ["Charcoal", "Sand", "Slate"],
    mrp: 1499,
    selling_price: 1199,
    gst_percentage: 18,
    current_stock: 22,
    min_stock_level: 5,
    images: [
      { url: "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=1200&q=85", is_primary: true },
      { url: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=1200&q=85", is_primary: false },
    ],
    description: "100% natural water-resistant Merino wool felt crafted with vegetable-tanned leather pull tab for everyday device protection.",
  },
  {
    id: "prod-013",
    product_id: "WS-000031",
    name: "Dual-Tone Leather Desk Mat",
    category: "Accessories",
    subcategory: "Desk Carry",
    brand_compatibility: [],
    compatible_models: [], // ACCESSORY
    color_variants: ["Deep Walnut", "Tan", "Black"],
    mrp: 1999,
    selling_price: 1699,
    gst_percentage: 18,
    current_stock: 19,
    min_stock_level: 4,
    images: [
      { url: "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=1200&q=85", is_primary: true },
      { url: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=1200&q=85", is_primary: false },
    ],
    description: "Reversible water-resistant vegan leather desk blotter (90x40cm) providing smooth mouse tracking and plush wrist cushioning.",
  },
  {
    id: "prod-014",
    product_id: "WS-000032",
    name: "Frosted Edge Armor Case",
    category: "Mobile Cases",
    subcategory: "Apple",
    brand_compatibility: ["Apple"],
    compatible_models: ["iPhone 16 Pro Max", "iPhone 16 Pro", "iPhone 15 Pro Max", "iPhone 15 Pro"],
    color_variants: ["Natural Titanium", "Desert Titanium", "Black"],
    mrp: 1099,
    selling_price: 899,
    gst_percentage: 18,
    current_stock: 32,
    min_stock_level: 6,
    images: [
      { url: "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=1200&q=85", is_primary: true },
      { url: "https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?auto=format&fit=crop&w=1200&q=85", is_primary: false },
    ],
    description: "Machined composite rim styled to harmonize with natural titanium alloy phone rails. Subtle frosted backplate prevents smudging.",
  },
  {
    id: "prod-015",
    product_id: "WS-000033",
    name: "Ultra Armor Kickstand Case",
    category: "Mobile Cases",
    subcategory: "Samsung",
    brand_compatibility: ["Samsung"],
    compatible_models: ["Samsung Galaxy S24 Ultra", "Samsung Galaxy S24+", "Samsung Galaxy S23 Ultra"],
    color_variants: ["Black", "Blue", "Olive"],
    mrp: 1299,
    selling_price: 999,
    gst_percentage: 18,
    current_stock: 14,
    min_stock_level: 4,
    images: [
      { url: "https://images.unsplash.com/photo-1585336261026-7f09c62c3e10?auto=format&fit=crop&w=1200&q=85", is_primary: true },
      { url: "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=1200&q=85", is_primary: false },
    ],
    description: "Integrated zinc-alloy kickstand with stepless angle adjustment between 0° and 60°. Dual-layer shock deflection system.",
  },
];

// Enrich product items with convenient normalized properties for legacy UI compatibility
export const MOCK_PRODUCTS = mockProducts.map((prod) => {
  const primaryImg =
    (Array.isArray(prod.images) && prod.images.find((img) => typeof img === 'object' && img.is_primary)?.url) ||
    (Array.isArray(prod.images) && typeof prod.images[0] === 'string' ? prod.images[0] : prod.images?.[0]?.url) ||
    '';

  const imagesList = Array.isArray(prod.images)
    ? prod.images.map((img) => (typeof img === 'string' ? img : img.url))
    : [];

  const discount =
    prod.mrp && prod.selling_price && prod.mrp > prod.selling_price
      ? Math.round(((prod.mrp - prod.selling_price) / prod.mrp) * 100)
      : 0;

  const mobileBrand =
    prod.brand_compatibility && prod.brand_compatibility.length > 0
      ? prod.brand_compatibility[0]
      : 'Universal';

  const mobileModel =
    prod.compatible_models && prod.compatible_models.length > 0
      ? prod.compatible_models[0]
      : 'Standard';

  return {
    ...prod,
    image_url: primaryImg,
    images: imagesList,
    discount_percentage: discount,
    mobile_brand: mobileBrand,
    mobile_model: mobileModel,
    is_primary: prod.current_stock > 20,
    created_at: '2026-09-01T00:00:00Z',
  };
});

export const CATEGORIES = [
  'All',
  'Mobile Cases',
  'Accessories',
  'Gadgets',
];

export const BRANDS = [
  'All Brands',
  'Apple',
  'Samsung',
];

// Extract unique list of colors across all products
export const ALL_COLORS = Array.from(
  new Set(mockProducts.flatMap((p) => p.color_variants || []))
).filter(Boolean);

// Extract models by brand
export const BRAND_MODELS_MAP = {
  Apple: Array.from(
    new Set(
      mockProducts
        .filter((p) => p.brand_compatibility?.includes('Apple'))
        .flatMap((p) => p.compatible_models || [])
    )
  ),
  Samsung: Array.from(
    new Set(
      mockProducts
        .filter((p) => p.brand_compatibility?.includes('Samsung'))
        .flatMap((p) => p.compatible_models || [])
    )
  ),
  Universal: [
    'Universal (All Devices)',
    'MagSafe Compatible',
    'Standard USB-C',
  ],
};

export const FILTER_OPTIONS = {
  categories: ['All Categories', 'Mobile Cases', 'Accessories', 'Gadgets'],
  subcategories: ['All Types', 'Samsung', 'Apple', 'Stands', 'Cables', 'Wireless Chargers', 'Sleeves', 'Desk Carry'],
  brands: ['All Brands', 'Apple', 'Samsung', 'Universal'],
  colors: ALL_COLORS,
  brandModels: BRAND_MODELS_MAP,
  priceRanges: [
    { label: 'All Prices', min: 0, max: Infinity },
    { label: 'Under ₹500', min: 0, max: 500 },
    { label: '₹500 – ₹1,000', min: 500, max: 1000 },
    { label: '₹1,000 – ₹2,000', min: 1000, max: 2000 },
    { label: 'Over ₹2,000', min: 2000, max: Infinity },
  ],
  sortOptions: [
    { label: 'Newest Arrivals', value: 'newest' },
    { label: 'Price: Low to High', value: 'price_asc' },
    { label: 'Price: High to Low', value: 'price_desc' },
    { label: 'Discount: High to Low', value: 'discount' },
    { label: 'Stock: In Stock First', value: 'in_stock' },
  ],
};

export default mockProducts;

