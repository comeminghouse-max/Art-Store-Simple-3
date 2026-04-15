# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Personal art gallery and shop website ("Studio").

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React + Vite, Tailwind CSS, shadcn/ui, wouter routing, @tanstack/react-query

## Artifacts

- **art-shop** (react-vite): Personal art gallery and shop frontend at `/`
- **api-server** (api): Express backend at `/api`

## Features

- Homepage with hero and featured artworks
- Gallery with category filters (Abstract, Landscape, Portrait, Still Life)
- Artwork detail pages with price and inquire button
- About page (artist bio)
- Contact form (saves to DB)
- 6 seeded artworks with AI-generated images

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Schema

- `artworks` — title, description, category, price, imageUrl, available, year, dimensions, medium, featured
- `contact_messages` — name, email, subject, message

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
