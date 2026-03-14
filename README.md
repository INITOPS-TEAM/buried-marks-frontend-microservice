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

    The environment variables of Vite are [injected at runtime](https://vite.dev/guide/env-and-mode).

    `map_front` microservice uses `VITE_MAPBOX_TOKEN` - sensitive key. As this value should be injected into image after build,  [`services/map_front/entrypoint.sh`](map_front/entrypoint.sh) is used to parse pre-configured prefixed variables and set secret values into them from [`.env.map.front`](https://github.com/INITOPS-TEAM/buried-marks-infrastructure/blob/main/.env.map.front.example) file in infrastructure repo.

    In each service folder, there is the `.env.production` file with configured `VITE_*_URL` values.

1. **Installation**:

    ```bash
    cd services/<name>_front
    npm сі
    ```

2. **Development**:

    ```bash
    npm run dev
    ```

## Other

- Each service runs independently on its assigned port.
- Authentication state is shared across services via LocalStorage.
- Ensure all relevant services are running simultaneously for full functionality.
