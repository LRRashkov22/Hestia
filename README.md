# Hestia

School Event and Notification Center

## Overview

Hestia is a school event and notification platform with a React-based frontend, an ASP.NET Core API backend, and a .NET worker service for event-driven notifications.

The app supports two main user roles:
- **Organizer**: manage events, view registrations, publish/cancel events, and monitor notifications.
- **Student**: browse events, register or cancel registration, and receive event notifications.

## Architecture

- `Client/` - React + TypeScript + Vite frontend.
- `SchoolEventCenter/` - ASP.NET Core Web API backend targeting .NET 10.
- `SchoolEventCenter.Worker/` - .NET background worker for RabbitMQ-driven notification/email processing.
- `SchoolEventCenter.slnx` - solution that brings together API, worker, modules, infrastructure, and tests.

### Key features

- JWT authentication with refresh tokens and role-based routing.
- Organizer and student dashboards.
- Event creation, editing, publishing, and cancellation.
- Registration management with waitlist support.
- Real-time notifications via SignalR and a background worker bridge.
- Modular backend with Identity, Event Management, Registration, Infrastructure, and Data layers.

## Project structure

- `Client/`
  - React application
  - API integration via `/api/identity`, `/api/events`, `/api/notifications`
  - Vite proxy for backend API and SignalR hubs
- `SchoolEventCenter/`
  - `SchoolEventCenter.Api.csproj` - main API entry point
  - `Program.cs` - builds API services, middleware, and starts the app
  - `Extensions/` - configuration, authentication, and middleware wiring
- `SchoolEventCenter.Worker/`
  - background consumer service for RabbitMQ notifications
  - `Program.cs` loads env settings and registers hosted services
- `SchoolEventCenter.Module.Data/` and other modules
  - shared DTOs, options, dependency injection, and domain services
- `Tests/`
  - automated tests for registration, auth, and event handling logic

## Requirements

- .NET 10 SDK
- Node.js (recommended latest LTS)
- npm
- RabbitMQ (for worker-driven notification processing)
- A database connection supported by the data layer (configured via connection string)

## Local setup

### 1. Backend

From the `SchoolEventCenter` folder:

```powershell
cd SchoolEventCenter
dotnet restore
```

Create a `.env` file or use environment variables with values such as:

```text
JwtSettings__Key=your-secure-jwt-key
JwtSettings__Issuer=Hestia
JwtSettings__Audience=Hestia
ConnectionStrings__DefaultConnection=YourDbConnectionString
RabbitMq__HostName=localhost
RabbitMq__Port=5672
RabbitMq__UserName=guest
RabbitMq__Password=guest
RabbitMq__ExchangeName=school-events
CorsSettings__AllowedOrigins__0=http://localhost:5173
```

Then run the API:

```powershell
dotnet run --project SchoolEventCenter.Api.csproj
```

### 2. Worker service

In a separate terminal, run the worker:

```powershell
dotnet run --project SchoolEventCenter.Worker.csproj
```

### 3. Frontend

From the `Client` folder:

```powershell
cd ..\Client
npm install
npm run dev
```

The frontend uses `VITE_API_BASE_URL` from `.env` or defaults to `https://localhost:7147` for API requests.

## Development commands

From `Client/`:
- `npm run dev` - start the React app
- `npm run build` - build production assets
- `npm run lint` - run ESLint checks

From `SchoolEventCenter/`:
- `dotnet run --project SchoolEventCenter.Api.csproj` - run API
- `dotnet run --project SchoolEventCenter.Worker.csproj` - run worker
- `dotnet test` - run backend tests

## Notes

- The backend loads `.env` files automatically up to five directory levels above the current working directory.
- API authentication and protected routes are managed with JWT bearer tokens.
- SignalR hub connections are proxied through the frontend development server using `/hubs`.

## Contact

For implementation details or contribution, inspect the `Client/src` pages and `SchoolEventCenter` service registration files.

