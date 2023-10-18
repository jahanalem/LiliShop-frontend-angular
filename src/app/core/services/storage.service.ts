import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class StorageService {

  constructor() { }

  private handleError<T>(operation: string, defaultValue: T | null, error: any): T | null {
    console.error(`Failed to ${operation} in local storage: ${error}`);
    return defaultValue;
  }

  public get<T>(key: string, defaultValue?: T): T | null {
    try {
      const item = localStorage.getItem(key);
      if (item === null) {
        return defaultValue || null;
      }
      return JSON.parse(item) as T;
    } catch (error) {
      return this.handleError('get item', defaultValue || null, error);
    }
  }

  public set<T>(key: string, value: T): boolean {
    try {
      const stringValue = JSON.stringify(value);
      localStorage.setItem(key, stringValue);
      return true;
    } catch (error) {
      this.handleError('set item', false, error);
      return false;
    }
  }

  public delete(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      this.handleError('delete item', null, error);
    }
  }

  public clearAll(): void {
    try {
      localStorage.clear();
    } catch (error) {
      this.handleError('clear all', null, error);
    }
  }
}
