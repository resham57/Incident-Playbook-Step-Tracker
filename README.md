# Incident Playbook Step Tracker

A full-stack incident response management application built with Node.js, Vue 3, and Dgraph database.

## Prerequisites

- Node.js (v18 or higher)
- npm
- Dgraph (running instance)

## Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/resham57/Incident-Playbook-Step-Tracker.git
cd Incident-Playbook-Step-Tracker
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies (first time only)
npm install

# Copy environment file (first time only)
cp .env.example .env
```

Configure your Dgraph connection in `backend/.env`:
```
DGRAPH_URL=http://localhost:8080
```

```bash
# Initialize database schema (first time only)
npm run init-db

# Seed sample data (first time only, optional)
npm run seed-db

# Start backend server
npm run dev
```

The backend server will start on `http://localhost:3000`

**Note:** Keep this terminal running.

### 3. Frontend Setup

**Open a new terminal** and run the following commands:

```bash
# Navigate to frontend directory (from project root)
cd frontend

# Install dependencies (first time only)
npm install

# Copy environment file (first time only)
cp .env.example .env
```

Configure your backend API URL in `frontend/.env`:
```
VITE_API_URL=http://localhost:3000
```

```bash
# Start frontend server
npm run dev
```

The frontend application will start on `http://localhost:5173`

**Note:** Make sure both backend and frontend servers are running in separate terminals.

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

## Contributing

1. Create a new branch from the main branch:
   ```bash
   git checkout -b your-branch-name
   ```

2. Make your changes

3. Commit and push your changes:
   ```bash
   git add .
   git commit -m "Your commit message"
   git push origin your-branch-name
   ```

4. Create a pull request on GitHub

## License

ISC License
