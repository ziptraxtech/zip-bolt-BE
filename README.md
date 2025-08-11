# ZipSureAI Software Backend

A comprehensive fleet operations and job allocation platform designed for organizations to manage riders, allocate jobs, monitor performance, and handle payments through a role-based system.

## Features

- **Role-Based Access Control**: Superadmin, Admin, Allocator, and Rider roles
- **Subscription Management**: Plan-based subscriptions with payment integration
- **Job Allocation System**: Real-time job assignment and tracking
- **Analytics Dashboards**: Comprehensive reporting for different roles
- **Payment Integration**: Razorpay integration for subscription payments
- **Real-time Notifications**: Socket.io for instant job notifications
- **API Documentation**: Swagger/OpenAPI documentation

## Architecture

- **Backend**: Node.js with Express.js
- **Database**: PostgreSQL with Sequelize ORM
- **Authentication**: JWT-based authentication
- **Payment**: Razorpay integration
- **Real-time**: Socket.io for notifications
- **Documentation**: Swagger/OpenAPI

## Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn package manager

## Quick Start

For developers who want to get up and running quickly:

```bash
# Clone and setup
git clone https://github.com/zip-bolt/zip-bolt-BE.git
cd zip-bolt
npm install

# Copy environment file and update with your credentials
cp env.example .env

# Setup database and start server
npm run db:setup
npm run dev
```

The application will be available at `http://localhost:3000` with demo credentials:
- **Superadmin**: superadmin@zipsure.ai / password123
- **Admin**: admin@demologistics.com / password123
- **Allocator**: allocator@demologistics.com / password123
- **Rider**: rider1@demologistics.com / password123

## Detailed Installation

```bash
git clone https://github.com/zip-bolt/zip-bolt-BE.git
cd zip-bolt
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Copy the example environment file and configure your settings:

```bash
cp env.example .env
```

Edit `.env` file with your configuration:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=zipsure_ai
DB_USER=your_username
DB_PASSWORD=your_password

# JWT Configuration
JWT_SECRET=your_secure_jwt_secret

# Razorpay Configuration
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_secret_key

# Email Configuration
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_email_app_password
```

### 4. Database Setup

Create the PostgreSQL database:

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE zipsure_ai;
```

### 5. Setup Database (Recommended)

```bash
npm run db:setup
```

This will automatically:
- Check if PostgreSQL is running
- Create the database if it doesn't exist
- Run all migrations
- Seed with demo data

### 6. Manual Database Setup (Alternative)

If you prefer to run migrations manually:

```bash
npm run db:migrate
npm run db:seed
```

### 7. Start the Application

#### Development Mode
```bash
npm run dev
```

#### Production Mode
```bash
npm start
```

The application will be available at `http://localhost:3000`

## Demo Data

The application comes with pre-seeded demo data including:

- **Demo Organization**: Demo Logistics Pvt Ltd
- **Subscription Plans**: Basic, Premium, and Enterprise plans
- **Demo Users**: One user for each role (Superadmin, Admin, Allocator, Rider)
- **Demo Vehicles**: Sample vehicles for the demo organization
- **Demo Jobs**: Sample job assignments

You can reset the demo data anytime using: `npm run db:reset`

## API Documentation

Once the server is running, you can access the Swagger API documentation at:

```
http://localhost:3000/api-docs
```

## Database Schema

The application uses the following main entities:

- **Users**: Authentication and role management
- **Organizations**: Company/vendor information
- **SubscriptionPlans**: Available subscription tiers
- **Subscriptions**: Active subscriptions for organizations
- **Vehicles**: Fleet management
- **Jobs**: Job allocation and tracking
- **Payments**: Payment history and transactions

## Roles and Permissions

### Superadmin
- Manage organization-wide settings
- View global analytics dashboard
- Manage subscription plans
- Receive payments from Admins

### Admin (Vendor)
- Manage organization's fleet and users
- View organization-specific analytics
- Subscribe to plans
- Make payments to Superadmin

### Allocator
- Assign jobs to Riders
- Track job statuses

### Rider
- Receive job notifications
- Accept/reject job assignments
- Update job progress

## Testing

Run the test suite:

```bash
npm test
```

## Project Structure

```
zip-bolt/
├── config/                 # Configuration files
├── controllers/           # Route controllers
├── middleware/           # Custom middleware
├── models/              # Sequelize models
├── routes/              # API routes
├── services/            # Business logic
├── utils/               # Utility functions
├── migrations/          # Database migrations
├── seeders/             # Database seeders
├── logs/                # Application logs
├── uploads/             # File uploads
├── server.js            # Main server file
├── package.json         # Dependencies
└── README.md           # This file
```

## 🔧 Available Scripts

- `npm start` - Start the production server
- `npm run dev` - Start the development server with nodemon
- `npm test` - Run test suite
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed database with initial data
- `npm run db:reset` - Reset database completely (drop, create, migrate, seed)
- `npm run db:setup` - Setup database (check PostgreSQL, create DB, migrate, seed)

## API Endpoints

### Authentication
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/logout` - User logout
- `POST /api/v1/auth/refresh` - Refresh JWT token

### Users
- `GET /api/v1/users` - Get all users (Admin only)
- `POST /api/v1/users` - Create new user (Admin only)
- `GET /api/v1/users/:id` - Get user by ID
- `PUT /api/v1/users/:id` - Update user
- `DELETE /api/v1/users/:id` - Delete user (Admin only)

### Organizations
- `GET /api/v1/organizations` - Get all organizations (Superadmin only)
- `POST /api/v1/organizations` - Create organization
- `GET /api/v1/organizations/:id` - Get organization by ID
- `PUT /api/v1/organizations/:id` - Update organization

### Subscriptions
- `GET /api/v1/subscriptions/plans` - Get available plans
- `POST /api/v1/subscriptions` - Create subscription
- `GET /api/v1/subscriptions/:id` - Get subscription details

### Jobs
- `GET /api/v1/jobs` - Get all jobs
- `POST /api/v1/jobs` - Create new job (Allocator only)
- `GET /api/v1/jobs/:id` - Get job by ID
- `PUT /api/v1/jobs/:id` - Update job status
- `DELETE /api/v1/jobs/:id` - Delete job

### Analytics
- `GET /api/v1/analytics/superadmin` - Superadmin dashboard
- `GET /api/v1/analytics/admin` - Admin dashboard

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Graphs

see the [Graphs](graph.md) file for details.

## Author

**Dhruv Shridhar**

## Troubleshooting

### Common Issues

#### Database Connection Issues
- Ensure PostgreSQL is running: `sudo systemctl status postgresql`
- Check database credentials in `.env` file
- Verify database exists: `psql -U your_username -d zipsure_ai`

#### Migration Issues
- If migrations fail, try resetting the database: `npm run db:reset`
- Check for existing tables that might conflict
- Ensure you have proper database permissions

#### Node.js Version Issues
- This project requires Node.js >= 14.0.0
- Check your version: `node --version`
- Use nvm to switch versions if needed: `nvm use 16`

#### Port Already in Use
- Change the port in `.env` file: `PORT=3001`
- Or kill the process using the port: `lsof -ti:3000 | xargs kill -9`

### Getting Help

For support and questions, please contact the development team or create an issue in the repository.

## Version History

- **v1.0.0** - Initial release with core functionality
  - Role-based authentication
  - Job allocation system
  - Subscription management
  - Analytics dashboards
  - Payment integration 
