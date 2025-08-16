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
    this.notifyChange();
    return entry;
  }

  removeDependency(id: number): boolean {
    const index = this.dependencies.findIndex((dep) => dep.id === id);
    if (index === -1) {
      return false;
    }

    this.dependencies.splice(index, 1);
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
    this.notifyChange();
  }

  onChange(callback: () => void): void {
    this.onChangeCallbacks.push(callback);
  }

  private notifyChange(): void {
    this.onChangeCallbacks.forEach((callback) => callback());
  }
}
