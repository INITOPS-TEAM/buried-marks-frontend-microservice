# Frontend Microservices Project

This repository contains the frontend microservices.

## Project Structure

All frontend services are located in the `services/` directory:

- **Login Service** (`login_front`)
  - **Port**: 5100
  - **Description**: Authentication and Authorization service.
- **Map Service** (`map_front`)
  - **Port**: 5200
  - **Description**: Main Map interface for data visualization.
- **Admin Service** (`admin_front`)
  - **Port**: 5300
  - **Description**: Central administration and management panel.
- **Voting Service** (`voting_front`)
  - **Port**: 5400
  - **Description**: User voting and polling module.

## Prerequisites

- **Node.js**: version 18.x or higher
- **npm**: version 9.x or higher

## Setup Instructions

1. **Environment Variables**:
   In each service folder, copy the `.env.example` file to a new file named `.env`:

   ```bash
   cp services/login_front/.env.example services/login_front/.env
   ```

2.**Installation**:

```bash
cd services/login_front
npm ci
```

3.**Development**:

```bash
npm run dev
```

## Other

- Each service runs independently on its assigned port.
- Authentication state is shared across services via LocalStorage.
- Ensure all relevant services are running simultaneously for full functionality.
