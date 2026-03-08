# Architecture Overview

This document describes the architectural decisions and tradeoffs behind this demo application. It assumes familiarity with React, TypeScript, GraphQL, and modern SPA patterns.

---

# Project Goals

- Demonstrate senior-level frontend architecture in a standalone, public repository  
- Model realistic enterprise-style data relationships and workflows  
- Favor clarity, maintainability, and correctness over over-abstraction  
- Support deep linking, URL-driven state, and realistic navigation flows  
- Provide a demo that can be confidently walked through in interviews  

## Non-Goals

- Building a production-grade backend  
- Pixel-perfect visual design  
- Exhaustive feature completeness  

---

# High-Level Architecture

This application is structured as a client-side React SPA with a mocked GraphQL backend. While the data layer is simulated, the overall architecture mirrors how a real enterprise application would be structured.

Core principles:

- Treat server state as external and authoritative  
- Use the URL as the source of truth for view state where appropriate  
- Keep data flow explicit and predictable  
- Avoid global state unless there is a clear need  

---

# Core Domain Model

The application models a small set of domain concepts:

- **Interaction** — Represents a workflow item (e.g., contract, review, approval flow)  
- **Identity** — Represents a person or company  
- **InteractionActivity** — Represents lifecycle events tied to an interaction  
- **SearchResult** — A union type that allows search across multiple entity types  

Interactions reference identities through structured parties and reviewer relationships, modeling how individuals and organizations participate in a workflow.

Activities also reference identities as actors and decision-makers, creating a connected lifecycle history across entities.

The goal is not to simulate every possible business rule, but to model realistic relationships between entities and maintain consistency across views.

---

# Data Layer

Apollo Client is used for GraphQL queries and mutations.

Rather than using static mocks, the application relies on a custom Apollo Link that simulates a backend execution layer. This allows the UI to interact with data as if it were server-driven while remaining fully self-contained.

The goal is to preserve realistic data flow, request/response boundaries, and mutation-driven updates without introducing an actual backend service.

---

# Client Caching Strategy

Apollo Client’s normalized cache is configured explicitly to control pagination and object shape behavior.

Custom `typePolicies` are used to:

- Define pagination merge behavior for activity feeds  
- Normalize optional fields (e.g., `company`, `avatarUrl`) to `null` for shape stability  
- Return mutation-specific fields (e.g., `notifications`) without permanently merging them into stored entity state  
- Re-calculate permittedActions reactively whenever the global simulated role changes

Pagination for activity feeds relies on a cache `merge` policy, allowing incremental loading without local state concatenation.

These decisions ensure consistent object shapes and predictable list behavior across views.

---

# Mock Execution Layer

The custom Apollo Link (`dynamicMockLink`) acts as a lightweight in-memory execution layer rather than a simple static mock.

Instead of returning hard-coded responses, it:

- Routes operations by `operationName`  
- Applies filtering, sorting, and pagination based on query variables  
- Resolves record types into GraphQL types  
- Simulates network latency  
- Updates in-memory state during mutations  
- Persists state to localStorage via a throttled sync
- Enforces Role-Based Access Control (RBAC) at the resolver level
- Generates activity side effects when interactions transition  

This mirrors how a real backend would shape and return data, while keeping the application fully self-contained.

## Record vs. Resolved Types

The mock database stores plain record types (e.g., `IdentityRecord`, `InteractionRecord`). These records are projected into GraphQL-facing types using explicit resolver functions:

- `resolveIdentity`
- `resolveInteraction`
- `resolveInteractionActivity`

The resolver layer is responsible for shaping stored data into the structure expected by the UI.

Keeping these concerns separate avoids mixing storage details with view logic and makes data transformations easier to reason about.

## Contextual Projections

Not all queries return identical identity shapes.

For example, activity feeds use a reduced identity projection that omits fields such as `avatarUrl`. This mirrors realistic backend field selection behavior.

The mock execution layer shapes records per query context rather than exposing a single global object shape.

This allows:

- Profile views to receive full identity data  
- Activity feeds to receive lightweight identity representations  
- Different screens to request only what they need

## Mutation Side Effects

Mutations do more than update a single entity.

For example, transitioning an interaction:

- Updates interaction state  
- Generates corresponding activity records  
- Inserts those activities into the timeline  
- Returns contextual toast notifications derived from the transition  

The mutation layer is responsible for coordinating these effects so that
state changes, activity history, and user feedback remain consistent.

## Determinism & Testability

Because the execution layer is managed on the client:

- State can be reset between tests (or manually via the Developer Overlay)
- URL-driven behavior remains deterministic  
- Pagination and filtering logic can be tested without stubbing network calls  

This approach keeps the demo realistic while preserving isolation and predictability.

---

# State Management Strategy

State is intentionally layered:

- **Server state:** Apollo Client cache  
- **Navigation and cross-page state:** URL parameters  
- **Local UI state:** Component state (e.g., menus, modals, toggles)  

Redux was considered but intentionally not included, as the current scope does not require global client state. Avoiding unnecessary global state keeps data ownership clear and reduces complexity.

---

# Routing & URL-Driven State

React Router v6 is used with nested routes under a shared layout.

The URL acts as the source of truth for navigation and view state. This includes:

- Workspace context  
- Active route and route parameters  
- Selected tabs within detail views  
- Pagination state  
- Filter state  

This makes navigation predictable, shareable, and reload-safe. Refreshing the page or copying the URL preserves the current view.

Component state is reserved for UI behavior (e.g., open/closed popovers, drawers, or temporary input values), not for core application state.

## Workspace Scoping

All primary routes are scoped under a workspace prefix:

```
/w/:workspaceId/...
```

The workspace ID is treated as part of the application state and is included in all relevant queries. This models a basic multi-tenant structure and ensures data is properly isolated by workspace.

Switching workspaces updates the URL and re-scopes the entire application without requiring global state resets.

## Interaction Detail Routing

Interaction detail pages use URL-driven tabs:

```
/interactions/:interactionId/:tabId
```

- Invalid or missing tab IDs redirect to a valid default  
- Tab selection is derived from the route, not internal component state  

This allows deep linking while preserving browser navigation behavior.

---

# Component Design

Components are designed with clear separation of responsibility.

- Presentational (“dumb”) components receive data via props  
- Data-fetching and URL logic live in hooks or page-level components  
- Shared UI elements are reusable and layout-agnostic  

Examples:

- `StatusBadge` provides consistent status styling across list and detail views  
- `ActivityCard` provides a shared structural wrapper for activity types  
- The custom `Pagination` component triggers page changes without owning URL logic  

Components avoid embedding routing or data-fetching logic unless it is clearly part of their responsibility. Navigation intent is passed down via callbacks when possible.

The goal is to keep components predictable and easy to reuse across contexts.

---

# Filtering System

Filtering is designed to be:

- URL-driven  
- Predictable  
- Easy to extend  
- Accessible  

Filtering is separated into three layers:

1. **Reference data** (available filter options)  
2. **Filter state** (URL parameters)  
3. **Filter UI** (input components)  

Filter hooks:

- Treat the URL as the source of truth  
- Read values from search parameters
- Update search parameters via setSearchParams
- Expose domain values (IDs, enums), not labels  
- Do not fetch data  
- Do not serialize complex objects  

Multi-select filters use repeated query parameters:

```
?status=IN_REVIEW&status=APPROVED
?partyId=123&partyId=456
```

This keeps the URL readable and maps directly to GraphQL variables.

Filter components receive options via props and read/write state via hooks. They do not derive options from results or own data-fetching logic.

---

# Pagination

Two pagination strategies are used intentionally.

## Table-Style Pagination (Interactions List)

Pagination state is URL-driven:

```
?page=1&pageSize=25
```

- Persisted across reloads  
- Shareable via URL  
- Resets automatically when filters change  

A custom pagination component is used instead of a UI library version to keep behavior explicit and framework-agnostic.

## Infinite Scroll (Dashboard & Global Search)

Infinite scroll is used where pagination state does not need to persist in the URL. Both features utilize a **Cache-Driven Reactive Pattern** to ensure data consistency and UI performance.

### Core Implementation:

- **GraphQL Offset + Limit**: Pagination is handled via standard offset/limit variables.
- **Apollo Cache `typePolicies.merge`**: Results are never concatenated in local component state. Instead, the cache policy merges incoming results into the existing `results` array based on the `offset` argument.
- **Reactive Hooks**: Components (e.g., `useSearchResults`) react to cache updates. This ensures that if search data is updated elsewhere, the UI stays in sync without manual refetching.
- **Threshold Trigger**: A `handleScroll` listener triggers `fetchMore` when the user scrolls to within a specific threshold of the list bottom.

This pattern allows the list to grow "in place," naturally preserving scroll position and reducing the overhead of local state management.

---

# Activity System

The activity system models lifecycle events tied to interactions.

Activities are generated in a lifecycle-based sequence rather than randomly. When an interaction’s status is updated, a corresponding activity is created that reflects that change.

This ensures:

- Activity timelines appear in logical order  
- Status badges align with recorded activity  
- Workflow transitions feel intentional  

Each activity type uses a shared `ActivityCard` wrapper with type-specific content components.

---

# Application Layout

The application uses a shared layout with:

- A header  
- A sidebar  
- A main content area  

The header contains global controls (workspace switcher, search, user menu).  
The sidebar contains primary navigation.

## Responsive Behavior

Responsive design is treated as a core requirement.

Standard layout changes are handled through CSS breakpoints. In addition, some behaviors are driven by shared breakpoint logic where appropriate.

Examples include:

- The sidebar collapsing behind a hamburger menu on smaller screens  
- Filters moving into a bottom sheet on mobile  
- Global search switching between a dropdown (desktop) and full-screen takeover (mobile)  

This keeps layout changes intentional and predictable rather than scattered across isolated media queries.

---

# Styling Approach

Styling is handled using SCSS Modules and a small set of design tokens.

The token system centralizes:

- Spacing scale  
- Border radius values  
- Color palette  
- Status colors  
- Elevation and borders  

This avoids repeating hard-coded values and keeps visual decisions consistent across components.

CSS Modules provide style isolation while allowing predictable overrides. Class names use dash-case in SCSS and are accessed as camelCase in JSX for clarity and consistency.

Material UI is used selectively for complex controls (e.g., Global Search). Core layout and structural components are custom-built.

The goal is consistency and clarity rather than heavy theming.

---

# Accessibility

Accessibility is treated as a first-class concern.

- Semantic HTML elements are used where appropriate  
- Interactive elements are keyboard-navigable  
- Focus states are explicit  
- ARIA roles are added when semantic HTML alone is insufficient  
- Filters and pagination are accessible via keyboard  

Accessibility is addressed intentionally rather than retrofitted later.

---

# Testing Strategy

Testing focuses on user-visible behavior rather than implementation details. The goal is to verify that key workflows behave correctly across routing, workspace scoping, URL state, and status transitions.

The project uses Vitest and React Testing Library, with a shared renderWithRouter helper that mirrors the real application structure (Apollo, routing, modal provider). The in-memory mock database is reset between tests so each test starts from a clean state and changes made in one test do not carry over into another.

Coverage prioritizes:

- URL-driven filtering and pagination
- Workspace scoping
- Status transitions creating activities
- Dashboard updates after mutations
- Keyboard accessibility for buttons and modals

Accessibility checks focus on real interaction patterns (keyboard navigation, modal behavior, semantic roles) rather than automated audit tools.

Testing does add some setup complexity — particularly around routing, Apollo caching, and workspace context — but the test architecture mirrors the production architecture rather than altering it for convenience.

---

# Tradeoffs & Intentional Omissions

Some features are intentionally simplified to keep the focus on architectural clarity:

- Visual design is restrained: The UI uses a clean, functional aesthetic rather than high-fidelity custom brand styling.
- No real-time collaboration: While the app models multiple users and identities, it is a single-user simulation.
- Simplified Identity Management: Authentication is bypassed to allow immediate access to the demo environment.

These tradeoffs ensure the codebase remains readable and focused on the data-flow patterns.

---

# Summary

This project prioritizes realism, maintainability, and architectural clarity over novelty.

It demonstrates:

- URL-driven state management  
- Multi-tenant workspace scoping  
- Layered state strategy  
- Clear separation of concerns  
- Predictable data flow  
- Responsive behavior  
- Reusable component patterns  
- Role-Based Access Control (RBAC): Actions are gated by an intersection of workflow state and user permissions.
- Persistent Data Layer: Mock records are synchronized to localStorage to survive page refreshes.

The goal is not just to show how features are built, but to demonstrate clear thinking behind architectural decisions.
