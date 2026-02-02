# QTS Dashboard

A Next.js 14 dashboard application with TypeScript, App Router, Tailwind CSS, and Shadcn/ui.

## Tech Stack

- **Next.js 14** with App Router
- **TypeScript**
- **Tailwind CSS** for styling
- **Shadcn/ui** component library
- **ESLint** and **Prettier** for code quality

## Project Structure

```
qts-dashboard/
├── src/
│   ├── app/              # Next.js app router pages
│   ├── components/       # React components
│   │   ├── ui/          # Shadcn components
│   │   ├── features/    # Feature-specific components
│   │   └── layouts/    # Layout components
│   ├── lib/             # Utilities and helpers
│   ├── hooks/           # Custom React hooks
│   ├── types/           # TypeScript types
│   └── constants/       # Constants and configuration
├── public/              # Static assets
├── docs/                # Documentation
└── components.json      # Shadcn/ui configuration
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm, yarn, pnpm, or bun

### Installation

If you encounter npm cache permission errors, fix them first:

```bash
sudo chown -R $(whoami) ~/.npm
```

Then install dependencies:

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

```bash
npm run build
```

### Production

```bash
npm start
```

## Code Quality

- **Lint:** `npm run lint`
- **Format:** `npm run format` (Prettier)

## Absolute Imports

The project uses the `@` alias pointing to `src/`:

- `@/components` → `src/components`
- `@/lib` → `src/lib`
- `@/hooks` → `src/hooks`
- `@/types` → `src/types`
- `@/constants` → `src/constants`

## Adding Shadcn/ui Components

To add more Shadcn/ui components, run:

```bash
npx shadcn@latest add <component-name>
```

Example: `npx shadcn@latest add card dialog`

Components will be generated in `src/components/ui/` per the `components.json` configuration.

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Shadcn/ui Documentation](https://ui.shadcn.com)
- [Tailwind CSS](https://tailwindcss.com/docs)
