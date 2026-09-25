# WrapStore Web (`wrapstore-web`)

Minimal, editorial, photography-forward e-commerce design system shell for **WRAPSTORE**.

## 🎨 Design System Foundation

### 1. Color Palette Tokens
- **Off-White (`#FAFAF8`)**: Base background surface (`bg-base-offwhite`, `bg-neutral-50`).
- **Charcoal (`#1A1A1A`)**: High-contrast text and primary actions (`text-neutral-900`, `bg-neutral-900`).
- **Mid-Gray (`#6B6B6B`)**: Muted secondary text, borders, metadata (`text-neutral-500`, `border-neutral-200`).
- **Deep Amber (`#C7622D`)**: Singular accent color used sparingly for active states, CTAs, and badges (`bg-accent`, `text-accent`).

### 2. Typography Scale
- **Google Fonts**: Inter & Plus Jakarta Sans
- **Hierarchy**:
  - `text-display` (3.5rem / 56px) - Large editorial hero titles & product names
  - `text-hero` (2.75rem / 44px) - Section headers
  - `text-h1` (2.25rem / 36px) - Category & Product titles
  - `text-h2` (1.75rem / 28px) - Section subtitles & features
  - `text-h3` (1.25rem / 20px) - Card titles & list headers
  - `text-body` / `text-body-lg` / `text-body-sm` - Descriptive copy
  - `text-metadata` (0.6875rem / 11px uppercase) - Price, stock levels, and specifications

### 3. Components

- **Header (`src/components/layout/Header.jsx`)**:
  - Editorial "WRAPSTORE" wordmark.
  - Sticky header with dynamic shadow/blur transition on scroll.
  - Horizontal navigation with active indicators.
  - Search trigger with modal overlay.
  - Shopping bag icon with dynamic item count badge.
  - Mobile-first drawer menu (< 768px) with category navigation.

- **Footer (`src/components/layout/Footer.jsx`)**:
  - Newsletter subscription form with inline feedback.
  - 3-column navigation grid.
  - Copyright, policies, and currency indicator.

- **Button (`src/components/ui/Button.jsx`)**:
  - `primary` (Charcoal solid)
  - `secondary` (Outline / neutral wash)
  - `ghost` (Subtle text button)
  - `accent` (Deep Amber CTA)
  - Sizes: `sm`, `md`, `lg` (all touch target compliant).
  - States: Loading spinner, disabled, leading/trailing icons, full width.

- **Badge (`src/components/ui/Badge.jsx`)**:
  - `new`, `outofstock`, `discount`, `accent`, `neutral`, `outline`.
  - Micro-typography with uppercase letter spacing.

- **Skeleton (`src/components/ui/Skeleton.jsx`)**:
  - `Skeleton`, `SkeletonText`, `SkeletonCard` with shimmer sweep effect.

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Start local Vite dev server
npm run dev

# Build for production
npm run build
```
