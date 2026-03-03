import { expect, afterEach, beforeEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers'; 
import '@testing-library/jest-dom/vitest'; // Provides the types for Vitest
import { resetMockDb } from '../../src/mocks/mockDB';
import { client } from "../../src/api/mockApolloClient";

// This bridges the matchers to Vitest's expect
expect.extend(matchers);

global.IntersectionObserver = class IntersectionObserver {
  // Required properties for the interface
  readonly root: Element | null = null;
  readonly rootMargin: string = '';
  readonly thresholds: ReadonlyArray<number> = [];

  constructor(private callback: IntersectionObserverCallback) {}

  observe() {
    this.callback([{ isIntersecting: true } as IntersectionObserverEntry], this as unknown as IntersectionObserver);
  }

  takeRecords(): IntersectionObserverEntry[] { return []; }
  unobserve() { return null; }
  disconnect() { return null; }
}; 

afterEach(() => {
  cleanup();
});

beforeEach(async () => {
  resetMockDb();
  await client.clearStore();
});


