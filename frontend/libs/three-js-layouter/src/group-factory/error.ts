export interface GroupFactoryError {
  kind: 'WebGLTextCreationError' | 'UnsupportedNodeType';
  message: string;
  cause?: unknown;
}

export function createWebGLTextCreationError(cause?: unknown): GroupFactoryError {
  return {
    kind: 'WebGLTextCreationError',
    message: 'Failed to create WebGL text',
    cause,
  };
}

export function createUnsupportedNodeTypeError(node: unknown): GroupFactoryError {
  return {
    kind: 'UnsupportedNodeType',
    message: `Unsupported node type: ${JSON.stringify(node)}`,
  };
}

export function isGroupFactoryError(value: unknown): value is GroupFactoryError {
  return typeof value === 'object' && value !== null && 'kind' in value && 'message' in value;
}
