# Dependency Injection in LinguaFlow

This document explains the server-side Dependency Injection (DI) architecture implemented in LinguaFlow.

## Overview

The DI system provides a way to decouple components from their dependencies, making the codebase more:
- Testable: Dependencies can be easily mocked for unit tests
- Maintainable: Dependencies are explicit and centrally managed
- Flexible: Implementation details can change without affecting consumers

## Architecture Components

### 1. DI Container (`container.ts`)

The core of our DI system is a simple container that manages service registration and resolution:

- `register<T>(token: string, factory: Factory<T>, singleton: boolean)`: Registers a service factory
- `resolve<T>(token: string): T`: Resolves a service instance
- `clear()`: Clears all cached instances

### 2. Interfaces (`interfaces/`)

We define interfaces for all our services and data access layers:
- `dal.interfaces.ts`: Interfaces for data access layers
- `service.interfaces.ts`: Interfaces for business logic services

### 3. Registry (`registry.ts`)

Centralizes the registration of all services and DALs:
- Defines tokens for all services
- Provides a `registerServices()` function to set up the container

### 4. Integration with tRPC (`server/trpc.ts`)

The tRPC context includes a container for each request:
- Creates a new container for each request
- Registers all services with request-scoped dependencies
- Makes services available to all tRPC procedures

## Usage Examples

### Server-side (tRPC)

```typescript
// In a tRPC router
export const projectsRouter = router({
  getProjects: protectedProcedure.query(async ({ ctx }) => {
    const projectsService = ctx.container.resolve<IProjectsService>(DI_TOKENS.PROJECTS_SERVICE);
    return projectsService.getProjects(ctx.user.id);
  }),
});
```

## Testing

The DI architecture makes testing straightforward:

```typescript
// Example test setup
const mockProjectsDal = { /* mock implementation */ };
const mockActivitiesDal = { /* mock implementation */ };

const container = new DIContainer();
container.register(DI_TOKENS.PROJECTS_DAL, () => mockProjectsDal);
container.register(DI_TOKENS.ACTIVITIES_DAL, () => mockActivitiesDal);

// Register the service under test with mocked dependencies
container.register(DI_TOKENS.PROJECTS_SERVICE, 
  (c) => new ProjectsService(
    c.resolve(DI_TOKENS.PROJECTS_DAL),
    c.resolve(DI_TOKENS.ACTIVITIES_DAL),
    // ...other dependencies
  )
);

// Get the service with mocked dependencies
const projectsService = container.resolve(DI_TOKENS.PROJECTS_SERVICE);
```

## Best Practices

1. Always code against interfaces, not concrete implementations
2. Keep service responsibilities focused and well-defined
3. Use the DI container for service resolution, not direct instantiation
4. Register all dependencies in the central registry
5. Prefer constructor injection over property or method injection 