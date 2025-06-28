# DriveOrbit Admin Dashboard

A modern admin dashboard built with Next.js, TypeScript, and Tailwind CSS with comprehensive authentication system.

## Features

- ⚡ **Next.js 15** with App Router
- 🎯 **TypeScript** for type safety  
- 🎨 **Tailwind CSS** for modern dark theme styling
- 🚀 **Turbopack** for fast development
- 🔐 **Authentication System** with login/signup
- 🔒 **Protected Routes** and role-based access
- 📱 **Responsive design**
- 🔧 **ESLint** for code quality
- 🌙 **Dark Theme** optimized UI

## Authentication

The project includes a complete authentication system that integrates with your backend:

### Backend Endpoints
- **Signup**: `POST /api/admin/auth/signup`
- **Login**: `POST /api/admin/auth/login` 
- **Profile**: `GET /api/admin/auth/profile`

### Features
- User registration with role assignment
- Firebase ID token authentication
- Protected dashboard routes
- User session management
- Form validation and error handling

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm, yarn, pnpm, or bun
- Backend API running on http://localhost:8080 (configurable)

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd Admin-Dashboard
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

3. Configure environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` with your settings:
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
```

4. Run the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

5. Open [http://localhost:3000](http://localhost:3000) with your browser.

## Authentication Flow

1. **Home Page** (`/`) - Redirects to login or dashboard based on auth status
2. **Login Page** (`/auth/login`) - User authentication
3. **Signup Page** (`/auth/signup`) - New user registration  
4. **Dashboard** (`/dashboard`) - Protected admin interface

### Default Test Credentials
For testing, you can use:
- Email: `admin@driveorbit.com`
- Password: `SecureAdminPass123!`

## Scripts

- `npm run dev` - Start the development server with Turbopack
- `npm run build` - Build the application for production
- `npm run start` - Start the production server
- `npm run lint` - Run ESLint

## Project Structure

```
src/
├── app/
│   ├── auth/
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── dashboard/page.tsx
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   └── ui/
│       ├── Alert.tsx
│       ├── Button.tsx
│       └── InputField.tsx
└── lib/
    ├── contexts/
    │   └── AuthContext.tsx
    ├── services/
    │   └── auth.ts
    ├── types/
    │   └── auth.ts
    ├── config.ts
    └── firebase.ts
```

## Clean Architecture

The project follows clean architecture principles:

- **Presentation Layer**: React components and pages
- **Application Layer**: Context providers and custom hooks
- **Domain Layer**: TypeScript interfaces and types
- **Infrastructure Layer**: API services and external integrations

## API Integration

### Authentication Service
Located in `src/lib/services/auth.ts`, handles:
- User signup requests
- Login with Firebase ID tokens
- Profile fetching
- Token management

### Request Format

**Signup:**
```json
{
  "email": "admin@driveorbit.com",
  "password": "SecureAdminPass123!",
  "fullName": "System Administrator", 
  "role": "super-admin"
}
```

**Login:**
```json
{
  "idToken": "firebase_id_token_here"
}
```

## Development

- Edit pages in `src/app/`
- Add new components in `src/components/`
- Update authentication logic in `src/lib/contexts/AuthContext.tsx`
- Customize API endpoints in `src/lib/config.ts`
- Global styles are in `src/app/globals.css`

## Built With

- [Next.js](https://nextjs.org/) - React framework
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS
- [ESLint](https://eslint.org/) - Code linting

## Deploy

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.
