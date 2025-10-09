🚀 Project Setup Guide

This guide will help you set up the project locally with PostgreSQL, Prisma, and Next.js.

📦 1. Install Dependencies
npm install


This will install all required Node.js dependencies.

⚙️ 2. Setup Environment Variables

Create a .env file in the project root and add the following variables.
Update the values according to your PostgreSQL credentials, SMTP settings, and project config.

# --- Database ---
# Format: postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public
i.e
DATABASE_URL="postgresql://myuser:test123@localhost:5432/my_db?schema=public"

# --- NextAuth (Authentication) ---
NEXTAUTH_URL="http://localhost:3002"   # URL where your app runs
NEXTAUTH_SECRET=your-secret-key        # generate via: openssl rand -base64 32

# --- SMTP (Brevo / Sendinblue) ---
SMTP_HOST="smtp-relay.brevo.com"
SMTP_PORT=587
SMTP_USER=your-brevo-login-email       # OR SMTP login from Brevo dashboard
SMTP_PASS=your-brevo-smtp-key          # NOT your account password!
SMTP_FROM=                             # Must be a verified sender in Brevo

# --- Public Base URL ---
NEXT_PUBLIC_BASE_URL="http://localhost:3002"


⚠️ Important Notes

Create a PostgreSQL database and user manually before adding credentials.

Example:

CREATE DATABASE my_db;
CREATE USER my_user WITH PASSWORD '12345';   // select according to your choice
GRANT ALL PRIVILEGES ON DATABASE my_db TO my_user;

🛠️ 3. Setup Prisma
Generate Prisma client
npx prisma generate

Apply migrations

If you already have migration files, run:

npx prisma migrate deploy


If you don’t have migrations yet, create and apply an initial one:

npx prisma migrate dev --name init

📂 4. Import CSV Data

A script is provided to import data into your database.

node ./scripts/import-csv.js ./public/final-seo.csv


📝 Adjust the path (./public/final-seo.csv) if your CSV file is in a different location.

▶️ 5. Start Development Server
npm run dev


This will start your Next.js development server at:

👉 http://localhost:3002