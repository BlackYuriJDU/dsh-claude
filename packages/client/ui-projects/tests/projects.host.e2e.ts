import { readFile, readdir } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import type { SessionEvent } from '@deepseek-ai/dsh-session'
import { LOADER_SMOKE_TEST_TIMEOUT_MS, runLoaderSmoke } from '@deepseek-ai/dsh-loader-smoke'

const driver = fileURLToPath(new URL('./fixtures/driver.host.ts', import.meta.url))
const configPath = fileURLToPath(new URL('./fixtures/projects.patch.yml', import.meta.url))
const repoTsconfig = fileURLToPath(new URL('../../../../tsconfig.json', import.meta.url))

async function jsonlFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true })
  const paths = await Promise.all(entries.map(async (entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return jsonlFiles(path)
    return entry.isFile() && entry.name.endsWith('.jsonl') ? [path] : []
  }))
  return paths.flat()
}

describe('ui-projects through the production headless profile', () => {
  it('logs the workspace project, with its knowledge file, as a runtime-context snapshot', async () => {
    const events: SessionEvent[] = []
    const { stderr } = await runLoaderSmoke({
      label: 'ui-projects headless smoke',
      tempDirPrefix: 'ui-projects-e2e-',
      binScript: driver,
      libBinScript: driver,
      configPath,
      tsconfigPath: repoTsconfig,
      inspect: async (cwd) => {
        const logs = await jsonlFiles(join(cwd, '.sessions'))
        // Both boots open a session; only the second one runs a turn.
        for (const log of logs) {
          const lines = (await readFile(log, 'utf8')).trimEnd().split('\n')
          events.push(...lines.slice(1).map(line => JSON.parse(line) as SessionEvent))
        }
      },
    })
    expect(stderr).not.toContain('UNHANDLED')
    const text = events
      .filter((event): event is SessionEvent<'user/message'> => event.type === 'user/message')
      .flatMap(event => event.data.content)
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join('\n')
    expect(text).toContain('Instructions:\nAnswer in one sentence.')
    expect(text).toContain('Knowledge file notes/brief.md:\nThe launch is on Friday.')
  }, LOADER_SMOKE_TEST_TIMEOUT_MS)
})
