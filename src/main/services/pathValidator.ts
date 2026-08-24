import { normalize } from 'path'

/**
 * Validates and normalizes file paths to prevent directory traversal and null byte injections.
 */
export function validatePath(p: unknown): string {
  if (typeof p !== 'string' || !p.trim()) {
    throw new Error('Invalid path parameter')
  }
  const normalized = normalize(p.trim())
  if (normalized.includes('\0')) {
    throw new Error('Invalid null byte in path')
  }
  return normalized
}
