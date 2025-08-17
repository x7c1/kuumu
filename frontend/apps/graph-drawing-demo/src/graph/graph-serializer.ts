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

export async function saveToLocalDirectory(
  dependencies: DependencyEntry[],
  filename?: string,
  metadata?: { name?: string; description?: string }
): Promise<string> {
  const actualFilename = filename || generateFilename();
  const jsonString = serialize(dependencies, metadata);

  const response = await fetch('/api/save-graph', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      filename: actualFilename,
      content: jsonString
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to save graph: ${errorText}`);
  }

  const result = await response.json();
  return result.filename;
}

export interface SavedGraphFile {
  name: string;
  modified: string;
  size: number;
}

export async function listSavedGraphs(): Promise<SavedGraphFile[]> {
  const response = await fetch('/api/list-graphs');

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to list graphs: ${errorText}`);
  }

  return response.json();
}

export async function loadFromLocalDirectory(filename: string): Promise<{
  dependencies: DependencyEntry[];
  metadata?: { name?: string; description?: string };
}> {
  const response = await fetch('/api/load-graph', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ filename })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to load graph: ${errorText}`);
  }

  const content = await response.text();
  return deserialize(content);
}

export async function deleteFromLocalDirectory(filename: string): Promise<void> {
  const response = await fetch('/api/delete-graph', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ filename })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to delete graph: ${errorText}`);
  }
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
