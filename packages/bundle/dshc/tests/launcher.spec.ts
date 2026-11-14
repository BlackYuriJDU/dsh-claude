/**
 * The `bin/dshc` launcher, run against a stand-in CLI that prints its argv: the
 * default port must not cut the launcher's own options off from `dsh`.
 */
import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'

const LAUNCHER = resolve(import.meta.dirname, '../../../../bin/dshc')
const root = mkdtempSync(join(tmpdir(), 'dshc-launcher-'))
mkdirSync(join(root, 'checkout/apps/cli/lib'), { recursive: true })
writeFileSync(join(root, 'checkout/apps/cli/lib/bin.js'), 'process.stdout.write(JSON.stringify(process.argv.slice(2)))\n')

afterAll(() => { rmSync(root, { recursive: true, force: true }) })

/** The argv the launcher hands to the CLI for these launcher arguments. */
function argvFor(...args: string[]): string[] {
  const result = spawnSync('bash', [LAUNCHER, ...args], {
    encoding: 'utf8',
    env: { ...process.env, DSHC_HOME: join(root, 'checkout'), DSHC_DSH_HOME: join(root, 'home'), DSHC_WORKSPACE: join(root, 'work'), DSHC_PORT: '3090' },
  })
  expect(result.stderr).toBe('')
  return JSON.parse(result.stdout) as string[]
}

describe.skipIf(process.platform === 'win32')('bin/dshc', () => {
  it('adds the default port when nothing else is given', () => {
    expect(argvFor()).toEqual(['dshc', '--port', '3090'])
  })

  it('keeps launcher options ahead of the default port so dsh reads them', () => {
    expect(argvFor('--patch', 'a.yml', '--patch=b.yml', '--open')).toEqual(['dshc', '--patch', 'a.yml', '--patch=b.yml', '--port', '3090', '--open'])
  })

  it('adds no port to a config dump, which takes no app arguments', () => {
    expect(argvFor('--patch', 'a.yml', '--dump-config')).toEqual(['dshc', '--patch', 'a.yml', '--dump-config'])
  })

  it('leaves an explicit port to the person', () => {
    expect(argvFor('--port=4000')).toEqual(['dshc', '--port=4000'])
  })
})
