npx kill-port 3000
set DATABASE_URL=postgresql://postgres:password@localhost:5432/artshop
set PORT=3000
set CLERK_PUBLISHABLE_KEY=pk_test_bWFqb3Itb2N0b3B1cy00NC5jbGVyay5hY2NvdW50cy5kZXYk
set CLERK_SECRET_KEY=sk_test_i8rhYI6JtYlLaBG0p5tgHanyeGZ165gi54OIRXFaHw
set NODE_ENV=development
cmd /k pnpm run start