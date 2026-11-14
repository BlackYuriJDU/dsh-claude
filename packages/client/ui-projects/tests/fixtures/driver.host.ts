#!/usr/bin/env node
/**
 * Test driver: registers the cwd as a workspace in one Headless Loader
 * composition, then boots a second one whose `ui-projects` Config holds that
 * workspace's project, and sends one turn.
 */

import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { resolveConfigPath } from '@deepseek-ai/dsh-app-boot'
import { runFixtureTurn } from '@deepseek-ai/dsh-loader-smoke'
import type {} from '@deepseek-ai/dsh-workspace'
import { bootProductionProfile } from '../../../../test-support/loader-smoke/tests/fixtures/production-profile.ts'

const configPath = process.argv[2]
if (configPath === undefined) throw new Error('ui-projects driver requires a config path')

mkdirSync(join(process.cwd(), 'notes'), { recursive: true })
writeFileSync(join(process.cwd(), 'notes', 'brief.md'), 'The launch is on Friday.')

const boot = (overlays: string[]) => bootProductionProfile({
  binName: 'ui-projects-e2e',
  profile: 'headless',
  overlayPaths: overlays.map(path => resolveConfigPath(path, undefined)),
})

// First boot: register the cwd as a workspace; the registry persists it.
const first = await boot([configPath])
let workspaceId: string
try {
  workspaceId = (await first.workspaceRegistry.create(process.cwd(), 'launch')).id
} finally {
  await first.fiber.dispose()
}

// Second boot: the project Config, keyed by the persisted workspace id, as Settings stores it.
const projectPatch = join(process.cwd(), 'project.patch.yml')
writeFileSync(projectPatch, `- id: ui-projects\n  config: ${JSON.stringify({
  projects: { [workspaceId]: { instructions: 'Answer in one sentence.', files: [{ id: 'brief', path: 'notes/brief.md' }] } },
})}\n`)
const ctx = await boot([configPath, projectPatch])
try {
  await runFixtureTurn(ctx, { task: 'when is the launch?' })
} finally {
  await ctx.fiber.dispose()
}
