# Muscle-Meta Matrix

A Progressive Web App (PWA) for muscle-metabolic health optimization, featuring the Catabolic Risk Assessment (CRA) tool.

## Tech Stack

- **Frontend:** Next.js 14 (App Router) + TypeScript
- **Backend:** Convex (real-time database + functions)
- **Authentication:** Clerk
- **Styling:** Tailwind CSS + shadcn/ui components
- **Charts:** Recharts
- **PWA:** next-pwa

## Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm

### Installation

1. Clone the repository and navigate to the muscle-meta-matrix directory:

```bash
cd muscle-meta-matrix
npm install
```

2. Copy the environment variables template:

```bash
cp .env.example .env.local
```

3. Set up your environment variables in `.env.local`:
   - Create a Convex project at https://dashboard.convex.dev
   - Create a Clerk application at https://clerk.com
   - Fill in the required values

4. Start the Convex development server:

```bash
npx convex dev
```

5. In a separate terminal, start the Next.js development server:

```bash
npm run dev
```

6. Open http://localhost:3000 in your browser

## Project Structure

```
muscle-meta-matrix/
├── src/
│   ├── app/                  # Next.js App Router pages
│   │   ├── (auth)/          # Authentication pages
│   │   ├── (protected)/     # User-facing protected pages
│   │   └── (admin)/         # Admin portal
│   ├── components/          # React components
│   └── lib/                 # Utility functions
├── convex/                  # Convex backend
│   ├── schema.ts           # Database schema
│   ├── users.ts            # User functions
│   ├── assessments.ts      # Assessment functions
│   └── admin.ts            # Admin functions
└── public/                  # Static assets
```

## Features

### Phase 1 (Current)
- [x] User authentication (sign-in/sign-up)
- [x] Role-based routing (USER/ADMIN)
- [x] User dashboard
- [x] Admin dashboard with statistics
- [x] User management
- [x] Assessment management
- [x] PWA support

### Phase 2 (Planned)
- [ ] Full CRA assessment engine
- [ ] Results visualization with charts
- [ ] PDF report generation
- [ ] Email notifications
- [ ] 4-Pillar Assessment (4P-MMA)

## Environment Variables

See `.env.example` for required environment variables.

## Deployment

### Vercel (Frontend)

1. Connect your GitHub repository to Vercel
2. Add environment variables in the Vercel dashboard
3. Deploy

### Convex (Backend)

```bash
npx convex deploy
```

## License

Private - All rights reserved.
