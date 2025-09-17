# Pariti - Money Sharing App

A comprehensive money sharing application for groups and friends, built with Next.js, TypeScript, and Prisma. Pariti simplifies expense tracking, resource management, and settlement calculations for shared living, travel, and group activities.

## Features

- 🏠 **Group Management**: Create and manage expense sharing groups with customizable settings
- 👥 **Advanced Member Management**: Add members with weights, active periods, and contact information
- 💰 **Expense Tracking**: Track expenses with automatic balance calculations and recurring expense support
- 📦 **Resource Management**: Create shared resources (utilities, groceries, etc.) and track consumption
- ⚖️ **Weighted Splitting**: Support for equal or weighted expense distribution among members
- 🔄 **Recurring Expenses**: Set up weekly, monthly, or yearly recurring expenses
- 💳 **Settlement System**: Generate optimized settlements to minimize transactions
- 🏦 **QR Code Payments**: Generate QR codes for easy bank transfers
- 🌍 **Internationalization**: Support for multiple languages (English, German)
- 🔗 **Link-based Access**: No login required - just share group links
- 📱 **Mobile Responsive**: Optimized for mobile devices with modern UI
- 🎨 **Modern UI**: Built with shadcn/ui and Tailwind CSS 4
- 🌙 **Dark Mode**: Built-in theme switching

## Tech Stack

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS 4
- **UI Components**: shadcn/ui, Radix UI primitives
- **Database**: PostgreSQL with Prisma ORM
- **State Management**: Zustand, TanStack Query
- **Forms**: React Hook Form with Zod validation
- **Internationalization**: next-intl
- **URL State**: nuqs for URL-based state management
- **Icons**: Lucide React
- **Deployment**: Docker with support for Nginx and Traefik proxies

## Getting Started

### Prerequisites

- Node.js 20+ (managed via Volta)
- pnpm
- Docker and Docker Compose

### Setup

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd pariti
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
   DATABASE_URL="postgresql://pariti_user:pariti123@localhost:5432/pariti_db"
   ```

5. **Start the development server**

   ```bash
   pnpm dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Available Scripts

### Development
- `pnpm dev` - Start development server with Turbopack
- `pnpm build` - Build for production with Turbopack
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint

### Database
- `pnpm db:start` - Start PostgreSQL database
- `pnpm db:stop` - Stop PostgreSQL database
- `pnpm db:reset` - Reset database (removes all data)
- `pnpm db:push` - Push schema changes to database
- `pnpm db:generate` - Generate Prisma client
- `pnpm db:studio` - Open Prisma Studio

### Docker Deployment
- `pnpm docker:build` - Build Docker image
- `pnpm docker:push` - Push Docker image to registry
- `pnpm docker:deploy:nginx` - Deploy with Nginx proxy
- `pnpm docker:deploy:traefik` - Deploy with Traefik proxy
- `pnpm docker:update` - Update running containers with new image

## Database Schema

The app uses the following main entities:

- **Groups**: Expense sharing groups with currency and weight settings
- **Members**: People in each group with weights, active periods, and contact info
- **Expenses**: Individual expenses with amounts, dates, and recurring options
- **ExpenseMembers**: Junction table for expense splitting with custom amounts
- **Resources**: Shared resources (utilities, groceries, etc.) with unit pricing
- **Consumptions**: Resource usage tracking with member allocation
- **ConsumptionMembers**: Junction table for consumption splitting
- **Settlements**: Settlement records for balancing payments
- **SettlementMembers**: Individual settlement transactions between members/resources

## How to Use

1. **Create a Group**: Click "Create Group" on the homepage and configure settings
2. **Add Members**: Add friends and family with optional weights and contact information
3. **Track Expenses**: Add expenses with automatic splitting or custom amounts
4. **Manage Resources**: Create shared resources like utilities or groceries
5. **Log Consumption**: Track resource usage and split costs among members
6. **Generate Settlements**: Create optimized settlement plans to balance all debts
7. **Share**: Share the group link with others to let them join

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

### Docker Deployment

The application includes comprehensive Docker deployment support with multiple proxy configurations:

#### Quick Deploy
```bash
# Deploy with Nginx proxy
pnpm docker:deploy:nginx

# Deploy with Traefik proxy
pnpm docker:deploy:traefik
```

#### Docker Deployment
```bash
cd docker
./deploy.sh nginx  # or traefik
```

#### Updating Existing Deployment
```bash
# Update to latest image
pnpm docker:update

# Update to specific image tag
./scripts/update.sh nginx v1.2.3

# Interactive update (prompts for options)
./scripts/update.sh
```

The deployment script will:
- Generate secure database credentials
- Prompt for domain and admin email
- Create environment configuration
- Deploy with SSL certificates (Let's Encrypt)
- Set up reverse proxy configuration

The update script will:
- Pull the latest Docker image
- Stop the application container (preserves database)
- Start the application with the new image
- Provide rollback capability if update fails
- Show deployment status and logs

## Advanced Features

### Weighted Expense Splitting
- Support for custom member weights to adjust expense distribution
- Manual override capabilities for individual expense amounts
- Automatic recalculation when member weights change

### Resource Management
- Create shared resources with unit-based pricing (hours, rolls, km, etc.)
- Track consumption in either units or monetary amounts
- Automatic cost distribution among active members

### Settlement System
- **Optimized Settlements**: Minimize the number of transactions needed
- **Around Member**: All payments flow through a central member
- **Around Resource**: All payments flow through a central resource
- QR code generation for easy bank transfers

### Recurring Expenses
- Set up weekly, monthly, or yearly recurring expenses
- Automatic generation of expense instances
- Flexible start dates and frequency options

### Internationalization
- Multi-language support (English, German)
- Localized date and currency formatting
- Extensible translation system

### Modern Architecture
- **Server Actions**: Type-safe server-side operations with Next.js
- **URL State Management**: Persistent state in URL parameters
- **Optimistic Updates**: Immediate UI feedback with rollback capability
- **Type Safety**: End-to-end TypeScript with Zod validation

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details
