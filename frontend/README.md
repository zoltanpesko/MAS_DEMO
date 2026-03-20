# MAS Asset Viewer - Frontend

This is a Next.js frontend application with the HeroGeometric landing component integrated into the MAS Asset Viewer.

## Features

- **HeroGeometric Component**: Beautiful animated landing page with geometric shapes
- **Next.js 14+**: Modern React framework with App Router
- **TypeScript**: Full type safety
- **Tailwind CSS**: Utility-first CSS framework
- **Framer Motion**: Smooth animations
- **shadcn/ui**: Component structure following best practices

## Getting Started

### Prerequisites

- Node.js 14 or higher
- npm or yarn

### Installation

1. Install dependencies:
```bash
cd frontend
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
frontend/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page with HeroGeometric
│   └── globals.css        # Global styles with Tailwind
├── components/
│   ├── ui/                # UI components (shadcn/ui structure)
│   │   └── shape-landing-hero.tsx  # HeroGeometric component
│   └── demo.tsx           # Demo component
├── lib/
│   └── utils.ts           # Utility functions (cn helper)
├── public/                # Static files
│   ├── asset-viewer.html  # Original asset viewer
│   └── maximo-data-sync-test.html
├── tailwind.config.ts     # Tailwind configuration
├── tsconfig.json          # TypeScript configuration
├── next.config.js         # Next.js configuration
└── package.json           # Dependencies and scripts
```

## Components

### HeroGeometric

The main landing component with animated geometric shapes.

**Usage:**
```tsx
import { HeroGeometric } from "@/components/ui/shape-landing-hero";

<HeroGeometric 
  badge="Your Badge Text"
  title1="First Title Line"
  title2="Second Title Line"
/>
```

**Props:**
- `badge` (optional): Badge text displayed at the top
- `title1` (optional): First line of the title
- `title2` (optional): Second line of the title (with gradient)

### Demo Component

Example usage of the HeroGeometric component.

```tsx
import { DemoHeroGeometric } from "@/components/demo";

<DemoHeroGeometric />
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Integration with Asset Viewer

The landing page includes a "View Assets" button that links to the existing asset viewer HTML page. The Next.js configuration includes rewrites to serve the static HTML files.

## Customization

### Colors

Edit `app/globals.css` to customize the color scheme:

```css
:root {
  --background: 0 0% 100%;
  --foreground: 0 0% 3.9%;
  /* ... more color variables */
}
```

### Animations

Modify animation parameters in `components/ui/shape-landing-hero.tsx`:

```tsx
<motion.div
  animate={{ y: [0, 15, 0] }}
  transition={{
    duration: 12,  // Adjust animation duration
    repeat: Number.POSITIVE_INFINITY,
    ease: "easeInOut",
  }}
>
```

## Dependencies

- **next**: ^16.2.0
- **react**: ^19.2.4
- **react-dom**: ^19.2.4
- **typescript**: ^5.9.3
- **tailwindcss**: ^4.2.2
- **framer-motion**: ^12.38.0
- **lucide-react**: ^0.577.0
- **clsx**: ^2.1.1
- **tailwind-merge**: ^3.5.0
- **class-variance-authority**: ^0.7.1

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Framer Motion](https://www.framer.com/motion/)
- [shadcn/ui](https://ui.shadcn.com/)