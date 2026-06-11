// Global Vitest setup for the zoneless (no zone.js) test environment.
//
// The Node/jsdom execution context used by the unit-test runner does not always
// expose a working `localStorage`, which breaks `StorageService` and any test
// doing `vi.spyOn(localStorage, ...)`. Define a robust in-memory mock so those
// tests run deterministically.

function createStorageMock(): Storage {
  let store: Record<string, string> = {};
  return {
    get length(): number {
      return Object.keys(store).length;
    },
    clear(): void {
      store = {};
    },
    getItem(key: string): string | null {
      return Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null;
    },
    key(index: number): string | null {
      return Object.keys(store)[index] ?? null;
    },
    removeItem(key: string): void {
      delete store[key];
    },
    setItem(key: string, value: string): void {
      store[key] = String(value);
    },
  } as Storage;
}

function installGlobalStorage(name: 'localStorage' | 'sessionStorage'): void {
  const mock = createStorageMock();
  try {
    Object.defineProperty(globalThis, name, {
      value: mock,
      writable: true,
      configurable: true,
    });
  } catch {
    (globalThis as unknown as Record<string, unknown>)[name] = mock;
  }
}

installGlobalStorage('localStorage');
installGlobalStorage('sessionStorage');
