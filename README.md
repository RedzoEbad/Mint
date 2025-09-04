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

### 4. Default Login Credentials

**Super Admin:**
- Email: admin@mintinternational.org
- Password: admin123

**Receptionist:**
- Email: receptionist@mintinternational.org
- Password: receptionist123

**Process Agent:**
- Email: agent@mintinternational.org
- Password: agent123

**Accountant:**
- Email: accounts@mintinternational.org
- Password: accounts123

## API Documentation

Access Swagger UI at: `http://localhost:3000/api/docs` (when ENABLE_SWAGGER=true)

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
