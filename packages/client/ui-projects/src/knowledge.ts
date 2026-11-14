/**
 * Bounded knowledge-file reads with a stat cache. Characters are UTF-16 code
 * units, as in `String.length`. A read decodes at most `3 × maxChars` bytes,
 * since UTF-8 spends at most three bytes per code unit, and is repeated only when the
 * file's size or modification time changes, so prompt assembly never reads a
 * whole large file and unchanged files are not read again. A rewrite that
 * keeps both the size and the modification time is not seen until either changes.
 * @module @deepseek-ai/dsh-client-ui-projects/knowledge
 */

import { closeSync, openSync, readSync, statSync, type Stats } from 'node:fs'
import { isAbsolute, resolve } from 'node:path'
import type { KnowledgeRead, ProjectKnowledgeFile } from './projects.ts'

interface CachedRead {
  size: number
  mtimeMs: number
  maxChars: number
  result: KnowledgeRead
}

/** Reads knowledge files for one plugin instance; the cache lives with the reader. */
export class KnowledgeReader {
  private readonly cache = new Map<string, CachedRead>()

  /**
   * Read one file, resolving a relative path against its workspace folder.
   * @param file - the knowledge file entry.
   * @param workspacePath - the workspace folder that relative paths resolve against.
   * @param maxChars - characters to keep.
   * @returns the bounded text, or the reason the file could not be read.
   */
  read(file: ProjectKnowledgeFile, workspacePath: string, maxChars: number): KnowledgeRead {
    const path = isAbsolute(file.path) ? file.path : resolve(workspacePath, file.path)
    let stats: Stats
    try {
      stats = statSync(path)
    } catch (error: unknown) {
      this.cache.delete(path)
      return { kind: 'error', reason: errorReason(error) }
    }
    if (!stats.isFile()) return { kind: 'error', reason: 'not a regular file' }
    const cached = this.cache.get(path)
    if (cached !== undefined && cached.size === stats.size && cached.mtimeMs === stats.mtimeMs && cached.maxChars === maxChars) {
      return cached.result
    }
    const result = readBounded(path, maxChars, stats.size)
    this.cache.set(path, { size: stats.size, mtimeMs: stats.mtimeMs, maxChars, result })
    return result
  }
}

/**
 * Read the first `3 × maxChars` bytes and keep `maxChars` code units.
 * A multibyte sequence cut by the byte limit, and a surrogate pair cut by the
 * character limit, are dropped, not replaced.
 * @param path - absolute file path.
 * @param maxChars - characters to keep.
 * @param size - the file size from the preceding stat.
 * @returns the decoded, bounded text or the read failure.
 */
function readBounded(path: string, maxChars: number, size: number): KnowledgeRead {
  const buffer = Buffer.alloc(Math.min(size, maxChars * 3))
  let fd: number | undefined
  try {
    fd = openSync(path, 'r')
    const bytes = readSync(fd, buffer, 0, buffer.length, 0)
    const decoded = new TextDecoder('utf-8').decode(buffer.subarray(0, bytes), { stream: bytes < size })
    const text = decoded.slice(0, maxChars).replace(/[\uD800-\uDBFF]$/, '')
    return { kind: 'text', text, truncated: decoded.length > maxChars || bytes < size }
  } catch (error: unknown) {
    return { kind: 'error', reason: errorReason(error) }
  } finally {
    if (fd !== undefined) closeSync(fd)
  }
}

/**
 * Describe a filesystem failure for the model without the stack.
 * @param error - the thrown value.
 * @returns the error code when present, otherwise the message.
 */
function errorReason(error: unknown): string {
  if (error instanceof Error && 'code' in error && typeof error.code === 'string') return error.code
  return error instanceof Error ? error.message : String(error)
}
