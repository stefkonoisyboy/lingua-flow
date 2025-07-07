import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "../types/database.types";

// Type for factory functions
export type Factory<T> = (container: DIContainer) => T;

export class DIContainer {
  private services: Map<string, unknown> = new Map();
  private factories: Map<string, Factory<unknown>> = new Map();
  private singletons: Map<string, boolean> = new Map();

  // Register a service factory
  register<T>(
    token: string,
    factory: Factory<T>,
    singleton: boolean = true
  ): void {
    this.factories.set(token, factory as Factory<unknown>);
    this.singletons.set(token, singleton);

    // Clear any cached instance when re-registering
    if (this.services.has(token)) {
      this.services.delete(token);
    }
  }

  // Get a service instance
  resolve<T>(token: string): T {
    // Return cached instance for singletons
    if (this.singletons.get(token) && this.services.has(token)) {
      return this.services.get(token) as T;
    }

    const factory = this.factories.get(token);

    if (!factory) {
      throw new Error(`Service not registered: ${token}`);
    }

    const instance = factory(this) as T;

    // Cache the instance if it's a singleton
    if (this.singletons.get(token)) {
      this.services.set(token, instance);
    }

    return instance;
  }

  // Clear all cached instances
  clear(): void {
    this.services.clear();
  }
}

// Create a container for the current request
export function createRequestContainer(
  supabase: SupabaseClient<Database>
): DIContainer {
  const container = new DIContainer();
  container.register("supabase", () => supabase, true);
  return container;
}
