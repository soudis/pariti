# Parity - Money Sharing App

A modern money sharing app for groups and friends, built with Next.js, TypeScript, and Prisma.

## Features

- 🏠 **Group Management**: Create and manage expense sharing groups
- 👥 **Member Management**: Add and remove members from groups
- 💰 **Expense Tracking**: Track expenses and automatically calculate who owes what
- 🔗 **Link-based Access**: No login required - just share group links
- 📱 **Mobile Responsive**: Optimized for mobile devices
- 🎨 **Modern UI**: Built with shadcn/ui and Tailwind CSS

## Tech Stack

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS 4
- **UI Components**: shadcn/ui
- **Database**: PostgreSQL with Prisma ORM
- **State Management**: Zustand, TanStack Query
- **Forms**: React Hook Form with Zod validation

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm
- Docker and Docker Compose

### Setup

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd shary
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Set up the database**

   ```bash
   # Start PostgreSQL with Docker
   pnpm db:start

   # Create the database schema
   pnpm db:push
   ```

4. **Set up environment variables**
   Create a `.env` file in the root directory:

   ```env
   DATABASE_URL="postgresql://shary:shary123@localhost:5432/shary"
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-secret-key-here"
   ```

5. **Start the development server**

   ```bash
   pnpm dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm db:start` - Start PostgreSQL database
- `pnpm db:stop` - Stop PostgreSQL database
- `pnpm db:reset` - Reset database (removes all data)
- `pnpm db:push` - Push schema changes to database
- `pnpm db:generate` - Generate Prisma client
- `pnpm db:studio` - Open Prisma Studio

## Database Schema

The app uses the following main entities:

- **Groups**: Expense sharing groups
- **Members**: People in each group
- **Expenses**: Individual expenses with amounts
- **ExpenseMembers**: Junction table for expense splitting

## How to Use

1. **Create a Group**: Click "Create Group" on the homepage
2. **Add Members**: Add friends and family to your group
3. **Track Expenses**: Add expenses and select which members they apply to
4. **Share**: Share the group link with others to let them join

## Development

### Database Management

The app uses Docker Compose for local PostgreSQL development:

```bash
# Start database
pnpm db:start

# Stop database
pnpm db:stop

# Reset database (removes all data)
pnpm db:reset
```

Or use Docker Compose directly:

```bash
# Start database
docker compose up -d postgres

# Stop database
docker compose down

# Reset database (removes all data)
docker compose down -v && docker compose up -d postgres
```

### Prisma Commands

```bash
# Generate Prisma client after schema changes
pnpm db:generate

# Push schema changes to database
pnpm db:push

# Open Prisma Studio (database GUI)
pnpm db:studio
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details
