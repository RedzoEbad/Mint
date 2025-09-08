# MINT International Platform

A comprehensive platform to bridge opportunity gaps in Saudi Arabia for overseas employment.

## Features

- **Role-Based Authentication**: Super Admin, Receptionist, Process Agent, Accountant
- **Candidate Management**: Registration, profile management, status tracking
- **Workflow Management**: Medical → Visa → Protector → Passport → Flight tracking
- **Payment Processing**: Payment validation and expense management
- **Analytics & Reporting**: Comprehensive dashboards and financial reports
- **Responsive Design**: Mobile-first design with MINT International branding

## Setup Instructions

### 1. Database Setup

1. Install PostgreSQL on your local machine
2. Create a new database named `mint_international`
3. Update the database credentials in `.env.local`
4. Run the database scripts:
   \`\`\`bash
   # Execute the SQL scripts in order
   psql -U username -d mint_international -f scripts/01-create-database-schema.sql
   psql -U username -d mint_international -f scripts/02-seed-initial-data.sql
   \`\`\`

### 2. Environment Configuration

1. Copy `.env.local` and update the values:
   - Set your PostgreSQL connection details
   - Generate a secure JWT secret
   - Configure file upload settings
   - Set up email configuration (optional)

### 3. Installation & Development

\`\`\`bash
# Install dependencies
npm install

# Run development server
npm run dev
\`\`\`

### 4. Create first admin and get a JWT

1) Seed the first admin (super_admin) user with hashed password (via Node script):

\`\`\`bash
# Windows PowerShell
$env:DATABASE_URL="postgres://USER:PASSWORD@HOST:PORT/DBNAME"
$env:ADMIN_EMAIL="admin@mintinternational.org"
$env:ADMIN_PASSWORD="admin123"
npm run db:init
\`\`\`

2) Start the app and log in to obtain a JWT:

\`\`\`bash
npm run dev
\`\`\`

Request a token using the login endpoint:

\`\`\`bash
# PowerShell
$tokenResponse = Invoke-RestMethod -Method POST `
  -Uri http://localhost:3000/api/auth/login `
  -Headers @{ 'Content-Type' = 'application/json' } `
  -Body (@{ email = 'admin@mintinternational.org'; password = 'admin123' } | ConvertTo-Json)
$tokenResponse
\`\`\`

Or with curl:

\`\`\`bash
curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@mintinternational.org","password":"admin123"}'
\`\`\`

The response contains `token`. Use it in subsequent requests:

\`\`\`bash
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3000/api/candidates
\`\`\`

## API Documentation

Access Swagger UI at: `http://localhost:3000/api/docs`

The OpenAPI spec is served at: `http://localhost:3000/api/openapi`

You can authorize requests in the Swagger UI using the JWT token from the login endpoint.

### Roles and account management
### Uploads

Folder structure under `public/uploads` (created on demand):

- `public/uploads/profile-images`
- `public/uploads/cv`
- `public/uploads/receipts`
- `public/uploads/others`

Upload endpoint:

- POST `/api/uploads/{type}` — multipart/form-data with field `file`
- Roles: super_admin, admin, receptionist, process_agent, accountant
- Response: `{ success: true, url, filename }`

Example (PowerShell):

\`\`\`powershell
$token = "YOUR_JWT"
Invoke-WebRequest -Uri http://localhost:3000/api/uploads/profile-images -Method POST -Headers @{
  Authorization = "Bearer $token"
} -InFile .\avatar.jpg -ContentType "multipart/form-data"
\`\`\`

In forms, save the returned `url` (e.g. `/uploads/profile-images/abc-123.jpg`) to the DB field and render with `next/image`.

Roles:
- super_admin: Full access, including creating Admins and all employees
- admin: Employee account management (create/update/delete), read-only access to other modules
- receptionist, process_agent, accountant: Role-specific limited access

Super Admin can manage Admins and all employees from the dashboard Users page.
Admins can manage employee accounts (receptionist, process_agent, accountant, admin) but cannot create super_admins.

### Demo accounts

You can use these accounts to explore dashboards:

- Receptionist — Email: `receptionist@mintinternational.org`, Password: `receptionist123`
- Process Agent — Email: `agent@mintinternational.org`, Password: `agent123`
- Accountant — Email: `accounts@mintinternational.org`, Password: `accounts123`

The init script seeds them automatically if missing. To customize, set env vars before running `npm run db:init`:

\`\`\`powershell
$env:RECEPTIONIST_EMAIL="receptionist@mintinternational.org"
$env:RECEPTIONIST_PASSWORD="receptionist123"
$env:AGENT_EMAIL="agent@mintinternational.org"
$env:AGENT_PASSWORD="agent123"
$env:ACCOUNTS_EMAIL="accounts@mintinternational.org"
$env:ACCOUNTS_PASSWORD="accounts123"
npm run db:init
\`\`\`

## Project Structure

\`\`\`
├── app/
│   ├── api/                 # API routes
│   ├── dashboard/           # Role-based dashboards
│   ├── login/              # Authentication pages
│   └── unauthorized/       # Access denied page
├── components/
│   ├── ui/                 # Reusable UI components
│   ├── auth-provider.tsx   # Authentication context
│   └── dashboard-layout.tsx # Shared dashboard layout
├── lib/
│   ├── auth.ts            # Authentication utilities
│   ├── database.ts        # Database connection
│   └── utils.ts           # Utility functions
├── scripts/               # Database scripts
└── public/images/         # Static assets
\`\`\`

## Security Features

- JWT-based authentication with secure token handling
- Role-based access control (RBAC)
- Password hashing with bcrypt
- SQL injection prevention with parameterized queries
- Audit logging for sensitive operations
- File upload validation and size limits

## Technologies Used

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, PostgreSQL
- **Authentication**: JWT, bcrypt
- **UI Components**: shadcn/ui, Radix UI
- **Database**: PostgreSQL with raw SQL queries
- **File Handling**: Built-in Next.js file upload

## License

© 2024 MINT International. All rights reserved.
