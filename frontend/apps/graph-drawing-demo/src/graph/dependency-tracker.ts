export interface DependencyEntry {
  id: number;
  from: string;
  to: string;
  label: string;
}

export class DependencyTracker {
  private dependencies: DependencyEntry[] = [];
  private nextId = 1;
  private onChangeCallbacks: (() => void)[] = [];
  private readonly storageKey = 'graph-drawing-demo-dependencies';

  constructor() {
    this.loadFromStorage();
  }

  addDependency(from: string, to: string): DependencyEntry | null {
    // Check for duplicate dependencies
    const exists = this.dependencies.find((dep) => dep.from === from && dep.to === to);
    if (exists) {
      return null;
    }

    const entry: DependencyEntry = {
      id: this.nextId++,
      from,
      to,
      label: `${from}->${to}`,
    };

    this.dependencies.push(entry);
    this.saveToStorage();
    this.notifyChange();
    return entry;
  }

  removeDependency(id: number): boolean {
    const index = this.dependencies.findIndex((dep) => dep.id === id);
    if (index === -1) {
      return false;
    }

    this.dependencies.splice(index, 1);
    this.saveToStorage();
    this.notifyChange();
    return true;
  }

  getDependencies(): DependencyEntry[] {
    return [...this.dependencies];
  }

  getFormattedList(): string[] {
    return this.dependencies.map((dep) => `${dep.id}:${dep.label}`);
  }

  hasDependency(from: string, to: string): boolean {
    return this.dependencies.some((dep) => dep.from === from && dep.to === to);
  }

  getUniqueNodes(): string[] {
    const nodes = new Set<string>();
    this.dependencies.forEach((dep) => {
      nodes.add(dep.from);
      nodes.add(dep.to);
    });
    return Array.from(nodes).sort();
  }

  clear(): void {
    this.dependencies = [];
    this.nextId = 1;
    this.saveToStorage();
    this.notifyChange();
  }

  onChange(callback: () => void): void {
    this.onChangeCallbacks.push(callback);
  }

  private notifyChange(): void {
    this.onChangeCallbacks.forEach((callback) => callback());
  }

  private saveToStorage(): void {
    try {
      const data = {
        dependencies: this.dependencies,
        nextId: this.nextId,
      };
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save dependencies to localStorage:', error);
    }
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const data = JSON.parse(stored);
        if (data.dependencies && Array.isArray(data.dependencies)) {
          this.dependencies = data.dependencies;
          this.nextId = data.nextId || this.getMaxId() + 1;
        }
      }
    } catch (error) {
      console.warn('Failed to load dependencies from localStorage:', error);
    }
  }

  // Get the maximum ID from existing dependencies to prevent ID conflicts
  // when restoring from localStorage without a saved nextId (backward compatibility)
  private getMaxId(): number {
    return this.dependencies.reduce((maxId, dep) => Math.max(maxId, dep.id), 0);
  }
}
