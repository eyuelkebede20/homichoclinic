This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Updating the Database Schema (Prisma)

If you pull new updates from the repository that change the database structure, or if you modify `prisma/schema.prisma` yourself, you need to sync those changes to your database.

### If you are running locally (npm run dev) with Docker just for the database:
Run this command in your terminal to update the database schema:
```bash
npx prisma db push --accept-data-loss
```
*(After this, you can safely seed your database with `http://localhost:3000/api/seed-db`)*

### If you are running the full app via Docker Compose:
The database schema automatically updates when the app container starts, **but only if you rebuild the image** so it catches the new schema files. Run:
```bash
docker compose up -d --build
```
*(After the container is healthy, visit `http://localhost:3000/api/seed-db` in your browser to seed initial accounts)*
