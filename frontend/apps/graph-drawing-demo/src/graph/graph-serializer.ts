import type { DependencyEntry } from './dependency-tracker.ts';

export interface SerializedGraph {
  version: string;
  timestamp: number;
  dependencies: DependencyEntry[];
  metadata?: {
    name?: string;
    description?: string;
  };
}

const CURRENT_VERSION = '1.0.0';

export function serialize(
  dependencies: DependencyEntry[],
  metadata?: { name?: string; description?: string }
): string {
  const serialized: SerializedGraph = {
    version: CURRENT_VERSION,
    timestamp: Date.now(),
    dependencies: dependencies.map((dep) => ({
      id: dep.id,
      from: dep.from,
      to: dep.to,
      label: dep.label,
    })),
    metadata,
  };

  return JSON.stringify(serialized, null, 2);
}

export function deserialize(jsonString: string): {
  dependencies: DependencyEntry[];
  metadata?: { name?: string; description?: string };
} {
  try {
    const data: SerializedGraph = JSON.parse(jsonString);

    // Validate format
    if (!data.version || !data.dependencies || !Array.isArray(data.dependencies)) {
      throw new Error('Invalid graph file format');
    }

    // Check version compatibility
    if (!isCompatibleVersion(data.version)) {
      throw new Error(`Unsupported file version: ${data.version}`);
    }

    // Validate dependencies structure
    for (const dep of data.dependencies) {
      if (!isValidDependency(dep)) {
        throw new Error('Invalid dependency format in file');
      }
    }

    return {
      dependencies: data.dependencies,
      metadata: data.metadata,
    };
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error('Invalid JSON format');
    }
    throw error;
  }
}

export function exportToFile(
  dependencies: DependencyEntry[],
  filename: string = 'graph.json',
  metadata?: { name?: string; description?: string }
): void {
  const jsonString = serialize(dependencies, metadata);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

export function importFromFile(): Promise<{
  dependencies: DependencyEntry[];
  metadata?: { name?: string; description?: string };
}> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) {
        reject(new Error('No file selected'));
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const result = deserialize(content);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };

      reader.readAsText(file);
    };

    input.oncancel = () => {
      reject(new Error('File selection cancelled'));
    };

    input.click();
  });
}

function isCompatibleVersion(version: string): boolean {
  // For now, only support exact version match
  // In the future, could implement more sophisticated version checking
  return version === CURRENT_VERSION;
}

function isValidDependency(dep: unknown): dep is DependencyEntry {
  return (
    typeof dep === 'object' &&
    dep !== null &&
    typeof (dep as DependencyEntry).id === 'number' &&
    typeof (dep as DependencyEntry).from === 'string' &&
    typeof (dep as DependencyEntry).to === 'string' &&
    typeof (dep as DependencyEntry).label === 'string' &&
    (dep as DependencyEntry).from.length > 0 &&
    (dep as DependencyEntry).to.length > 0
  );
}

// Utility function to generate a filename with current timestamp
export function generateFilename(baseName: string = 'graph'): string {
  const now = new Date();
  const timestamp = now.toISOString().slice(0, 19).replace(/[:.]/g, '-');
  return `${baseName}-${timestamp}.json`;
}

// Utility function to validate graph data before serialization
export function validateGraphData(dependencies: DependencyEntry[]): string[] {
  const errors: string[] = [];

  if (!Array.isArray(dependencies)) {
    errors.push('Dependencies must be an array');
    return errors;
  }

  const seenIds = new Set<number>();
  const seenDependencies = new Set<string>();

  for (let i = 0; i < dependencies.length; i++) {
    const dep = dependencies[i];

    if (!isValidDependency(dep)) {
      errors.push(`Invalid dependency at index ${i}`);
      continue;
    }

    // Check for duplicate IDs
    if (seenIds.has(dep.id)) {
      errors.push(`Duplicate dependency ID: ${dep.id}`);
    }
    seenIds.add(dep.id);

    // Check for duplicate dependencies
    const depKey = `${dep.from}->${dep.to}`;
    if (seenDependencies.has(depKey)) {
      errors.push(`Duplicate dependency: ${depKey}`);
    }
    seenDependencies.add(depKey);

    // Check for self-dependencies
    if (dep.from === dep.to) {
      errors.push(`Self-dependency not allowed: ${dep.from}`);
    }
  }

  return errors;
}
