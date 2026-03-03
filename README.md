# Resolve — Workflow Architecture Demo

A React + TypeScript + GraphQL application modeling workspace-scoped workflows, activity feeds, and URL-driven state.

This project is intentionally architecture-focused. It demonstrates how complex UI behavior can be driven by explicit domain modeling rather than ad-hoc component logic.

## Live Demo

A deployed version of the application is available here:

🔗 https://resolve-demo.vercel.app/

No authentication is required.  
The app uses a simulated in-memory GraphQL execution layer, so data resets on hard refresh.

## Why This Project Exists

In previous roles, I worked on enterprise-style applications involving:

*   Workspace scoping
*   Workflow lifecycles
*   Activity feeds
*   URL-driven filtering and pagination
*   Mutation-driven state updates
    

Those systems were proprietary and are no longer publicly accessible.

Rather than describe that experience abstractly, this repository reconstructs similar architectural patterns in a standalone, inspectable demo.

The goal is not to build a startup product mockup. The goal is to demonstrate architectural thinking in a controlled, readable codebase.

This repository is intentionally architecture-focused rather than feature-heavy.

No authentication is required.  
The app uses a simulated in-memory GraphQL execution layer, so data resets on hard refresh.

## TL;DR (For Reviewers)

This is a multi-tenant React + Apollo SPA that models a realistic workflow system.

The URL drives navigational state (filters, pagination, workspace scoping).
Server state lives in Apollo.
Local UI state stays in components.

A custom in-memory Apollo execution layer simulates backend behavior —
mutations generate activity events, update derived stats, and trigger
normalized cache updates.

The focus is architectural clarity and predictable data flow.

## What It Demonstrates

- Multi-tenant workspace routing
- URL-driven filtering and pagination
- Deterministic workflow state transitions (Draft → In Review → Approved / Rejected)
- Activity generation tied to mutations
- Dashboard updates driven by normalized cache changes
- Intentional Apollo cache configuration
- Responsive layout with breakpoint-aware behavior
- Keyboard-accessible UI patterns
- Integration-style testing with Vitest and React Testing Library
    

## Core Domain Model

The application models a small but connected domain:

*   **Workspace**
    A tenant boundary that scopes all primary routes and data.
    
*   **Interaction**
    A workflow item that moves through defined lifecycle states.
    
*   **Identity**
    An individual or company participating in interactions.
    
*   **InteractionActivity**
    An event generated when interaction state changes occur.
    

Interactions reference identities through structured party roles and reviewer relationships.Activities reference identities as actors and decision-makers, forming a lifecycle history across entities.

The domain is intentionally simple, but the relationships are modeled explicitly.

## Architectural Highlights

This is a client-side React SPA backed by an in-memory GraphQL execution layer.

Key themes:

*   The URL drives view state (filters, pagination, tab selection)
*   Apollo Client manages server state through normalization
*   Workflow transitions generate activity records
*   Cache policies explicitly control pagination and merging
*   Domain logic lives in the execution layer, not UI components
*   Global state is avoided unless clearly necessary
    

A detailed breakdown of architectural decisions is available here:

→ **[ARCHITECTURE.md](./ARCHITECTURE.md)**

## Testing Strategy

Testing focuses on user-visible behavior rather than implementation details.

Coverage includes:

*   URL-driven filtering and pagination
*   Workspace scoping
*   Status transitions generating activity records
*   Dashboard updates after mutations
*   Keyboard accessibility behavior
    

The in-memory execution layer allows realistic integration-style tests without stubbing network calls.

## Tech Stack

*   React 18
*   TypeScript 
*   React Router
*   Apollo Client
*   Vitest + React Testing Library
*   SCSS Modules
*   Vite
    

## Running Locally

Install dependencies:

```bash
npm install
```
Start the development server:

```bash
npm run dev
```
Run tests:

```bash
npm run test  
```

## Notes

This project prioritizes architectural clarity over visual polish or backend infrastructure.

The GraphQL layer is simulated using a custom Apollo Link that:

*   Routes operations by name
*   Applies filtering and pagination
*   Generates activity side effects during mutations
*   Maintains an in-memory database

The result is a self-contained system that behaves like a backend-driven application while remaining easy to inspect and reason about.