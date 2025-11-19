# Incident Playbook Step Tracker

A comprehensive full-stack incident response management application built with Node.js, Vue 3, and Dgraph database. This application provides security teams with powerful tools to track, manage, and respond to security incidents effectively.

## Features

### Core Functionality
- **Incident Management**: Create, track, and manage security incidents with detailed information
- **TLP Classification**: Traffic Light Protocol (TLP) classification system for data sharing control
- **Severity Tracking**: High, Medium, and Low severity levels with color-coded badges
- **Artifact Management**: Track IOCs (Indicators of Compromise) and assets associated with incidents
- **User Management**: Role-based team member management (Incident Commander, Analyst, Technical Lead)
- **Playbook Templates**: Standardized response procedures for different incident types
- **Real-time Dashboard**: Statistics and overview of active incidents and team status

### Technical Features
- **RESTful API**: Complete CRUD operations for all entities
- **Type Safety**: Full TypeScript implementation in frontend
- **Graph Database**: Dgraph for efficient relationship queries
- **Security Middleware**: CORS, Helmet, Rate limiting
- **Responsive Design**: Mobile-friendly cybersecurity-themed UI
- **Error Handling**: Comprehensive error boundaries and logging
- **State Management**: Pinia stores for reactive state

## Technology Stack

### Backend
- **Runtime**: Node.js (ES Modules)
- **Framework**: Express.js
- **Database**: Dgraph (Graph Database)
- **Database Client**: dgraph-js-http
- **Security**: Helmet, CORS, Express Rate Limit
- **Logging**: Winston, Morgan
- **Environment**: dotenv

### Frontend
- **Framework**: Vue 3 (Composition API)
- **Language**: TypeScript
- **Build Tool**: Vite
- **Routing**: Vue Router 4
- **State Management**: Pinia
- **HTTP Client**: Axios
- **Styling**: Custom CSS with CSS Grid & Flexbox

## Project Structure

```
incident-playbook-step-tracker/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.js          # Dgraph client configuration
│   │   │   └── logger.js            # Winston logger setup
│   │   ├── database/
│   │   │   ├── schema.js            # Dgraph schema definition
│   │   │   ├── init-schema.js       # Schema initialization script
│   │   │   └── seed-data.js         # Sample data seeding script
│   │   ├── middleware/
│   │   │   ├── errorHandler.js      # Error handling middleware
│   │   │   └── validators.js        # Data validation functions
│   │   ├── routes/
│   │   │   ├── incidents.js         # Incident API endpoints
│   │   │   ├── users.js             # User API endpoints
│   │   │   └── playbooks.js         # Playbook API endpoints
│   │   └── server.js                # Express server setup
│   ├── logs/                        # Application logs
│   ├── .env                         # Environment variables
│   ├── .env.example                 # Environment template
│   └── package.json                 # Backend dependencies
├── frontend/
│   ├── src/
│   │   ├── components/              # Reusable Vue components
│   │   ├── router/
│   │   │   └── index.ts             # Vue Router configuration
│   │   ├── services/
│   │   │   └── api.ts               # API client with Axios
│   │   ├── stores/
│   │   │   ├── incidents.ts         # Incidents Pinia store
│   │   │   ├── users.ts             # Users Pinia store
│   │   │   └── playbooks.ts         # Playbooks Pinia store
│   │   ├── types/
│   │   │   └── index.ts             # TypeScript type definitions
│   │   ├── views/
│   │   │   ├── Dashboard.vue        # Dashboard view
│   │   │   ├── Incidents.vue        # Incidents list view
│   │   │   ├── IncidentDetail.vue   # Incident detail view
│   │   │   ├── Users.vue            # Users management view
│   │   │   └── Playbooks.vue        # Playbooks view
│   │   ├── App.vue                  # Root component
│   │   ├── main.ts                  # Application entry point
│   │   └── style.css                # Global styles
│   ├── index.html                   # HTML template
│   ├── vite.config.ts               # Vite configuration
│   ├── tsconfig.json                # TypeScript configuration
│   └── package.json                 # Frontend dependencies
├── docker-compose.yml               # Dgraph Docker setup
└── README.md                        # This file
```

## Installation & Setup

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Docker and Docker Compose (for Dgraph)

### 1. Clone the Repository
```bash
cd incident-playbook-step-tracker
```

### 2. Start Dgraph Database
```bash
# Start Dgraph using Docker Compose
docker-compose up -d

# Verify Dgraph is running
curl http://localhost:8080/health
```

### 3. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Initialize database schema
npm run init-db

# Seed sample data
npm run seed-db

# Start development server
npm run dev
```

The backend server will start on `http://localhost:3000`

### 4. Frontend Setup

```bash
# Navigate to frontend directory (from project root)
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend application will start on `http://localhost:5173`

## API Endpoints

### Health Check
- `GET /health` - Server health status

### Incidents
- `GET /api/incidents` - List all incidents
- `GET /api/incidents/:id` - Get incident by ID
- `POST /api/incidents` - Create new incident
- `PUT /api/incidents/:id` - Update incident
- `DELETE /api/incidents/:id` - Delete incident

### Users
- `GET /api/users` - List all users
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Playbooks
- `GET /api/playbooks` - List all playbooks
- `GET /api/playbooks/:id` - Get playbook by ID
- `POST /api/playbooks` - Create new playbook
- `PUT /api/playbooks/:id` - Update playbook
- `DELETE /api/playbooks/:id` - Delete playbook

## Data Models

### Incident
```typescript
{
  uid?: string
  title: string
  description: string
  severity: 'High' | 'Medium' | 'Low'
  tlp: 'Red' | 'Amber' | 'Green' | 'White'
  status: 'Open' | 'InProgress' | 'Resolved' | 'Closed'
  assigned_to?: User
  artifacts?: Artifact[]
  files?: string[]
  references?: string[]
  playbook?: PlaybookTemplate
  created_at?: string
  updated_at?: string
  closed_at?: string
}
```

### User
```typescript
{
  uid?: string
  name: string
  email: string
  role: 'incident_commander' | 'analyst' | 'technical_lead'
  department: string
  is_active: boolean
  created_at?: string
  updated_at?: string
  assigned_incidents?: Incident[]
}
```

### Artifact
```typescript
{
  uid?: string
  value: string
  artifact_type: 'ip' | 'domain' | 'hash' | 'url' | 'email'
  status: 'malicious' | 'clean' | 'unknown'
  kind: 'asset' | 'ioc'
  notes?: string
  created_at?: string
  updated_at?: string
}
```

### PlaybookTemplate
```typescript
{
  uid?: string
  name: string
  description: string
  incident_types?: string[]
  severity_levels?: string[]
  estimated_duration?: string
  steps?: PlaybookStep[]
  is_active?: boolean
  created_at?: string
  updated_at?: string
}
```

## TLP Classification

The application implements the Traffic Light Protocol for information sharing:

- **RED**: No sharing - Information for named recipients only
- **AMBER**: Limited sharing - Information for organization and clients
- **GREEN**: Community sharing - Information for the security community
- **WHITE**: Unlimited sharing - Information can be shared freely

## Development

### Backend Scripts
```bash
npm start          # Start production server
npm run dev        # Start development server with nodemon
npm run init-db    # Initialize Dgraph schema
npm run seed-db    # Seed sample data
```

### Frontend Scripts
```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run preview    # Preview production build
npm run type-check # TypeScript type checking
```

## Production Deployment

### Backend
1. Set `NODE_ENV=production` in `.env`
2. Configure production Dgraph URL
3. Set up proper CORS origins
4. Run `npm start`

### Frontend
1. Build production bundle: `npm run build`
2. Serve `dist` folder with web server (Nginx, Apache, etc.)
3. Configure API proxy or update `VITE_API_URL`

### Docker Deployment
```bash
# Ensure Dgraph is running
docker-compose up -d

# Backend (in production)
cd backend
npm install --production
npm start

# Frontend
cd frontend
npm run build
# Serve dist/ folder
```

## Environment Variables

### Backend (.env)
```env
PORT=3000
NODE_ENV=development
DGRAPH_URL=http://localhost:8080
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Frontend (optional)
```env
VITE_API_URL=http://localhost:3000
```

## Security Features

- **Helmet.js**: Sets security HTTP headers
- **CORS**: Configurable cross-origin resource sharing
- **Rate Limiting**: Prevents API abuse
- **Input Validation**: Server-side validation for all inputs
- **Error Handling**: Sanitized error messages in production
- **Logging**: Comprehensive request and error logging

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Troubleshooting

### Dgraph Connection Issues
```bash
# Check if Dgraph is running
docker ps

# Check Dgraph logs
docker-compose logs dgraph

# Restart Dgraph
docker-compose restart dgraph
```

### Backend Issues
```bash
# Check logs
tail -f backend/logs/combined.log

# Verify environment variables
cat backend/.env

# Reinitialize database
cd backend
npm run init-db
npm run seed-db
```

### Frontend Issues
```bash
# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check TypeScript errors
npm run type-check
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

ISC License

## Support

For issues and questions:
- Create an issue in the repository
- Check existing documentation
- Review API endpoints and data models

## Acknowledgments

- Built with Vue 3, Express, and Dgraph
- Designed for security operations teams
- Implements industry-standard TLP classification
- Follows OWASP security best practices

---

**Version**: 1.0.0
**Last Updated**: 2024
**Powered by**: Dgraph Graph Database
