export interface ParseResult {
  from: string;
  to: string;
}

export interface ParseError {
  message: string;
  input: string;
}

export function parseDependency(input: string): ParseResult | null {
  const trimmed = input.trim();

  if (!trimmed) {
    return null;
  }

  const match = trimmed.match(/^([a-zA-Z0-9_]+)\s*->\s*([a-zA-Z0-9_]+)$/);

  if (!match) {
    return null;
  }

  const from = match[1];
  const to = match[2];

  // Prevent self-dependencies
  if (from === to) {
    return null;
  }

  return { from, to };
}

export function validateDependencyInput(input: string): ParseError | null {
  const trimmed = input.trim();

  if (!trimmed) {
    return { message: 'Input cannot be empty', input };
  }

  if (!trimmed.includes('->')) {
    return { message: 'Input must contain "->" separator', input };
  }

  const parts = trimmed.split('->');
  if (parts.length !== 2) {
    return { message: 'Input must have exactly one "->" separator', input };
  }

  const from = parts[0].trim();
  const to = parts[1].trim();

  if (!from) {
    return { message: 'Left side of "->" cannot be empty', input };
  }

  if (!to) {
    return { message: 'Right side of "->" cannot be empty', input };
  }

  if (!/^[a-zA-Z0-9_]+$/.test(from)) {
    return { message: 'Left side must contain only letters, numbers, and underscores', input };
  }

  if (!/^[a-zA-Z0-9_]+$/.test(to)) {
    return { message: 'Right side must contain only letters, numbers, and underscores', input };
  }

  if (from === to) {
    return { message: 'Node cannot depend on itself', input };
  }

  return null;
}
