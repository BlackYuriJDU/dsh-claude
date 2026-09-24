/**
 * The destructive-command gate: the pattern table naming the dangerous shapes
 * (recursive deletes, disk and power control, force pushes, process sweeps,
 * piped remote execution, SQL drops, package removal) and
 * {@link approveDangerousOperation} — the pre-execution approval ask the shell
 * tool families run BEFORE anything spawns when a command matches. It lives
 * beside {@link approveEscalation} on purpose: same structural approval seam,
 * same fail-closed text dialect, same "nothing has run" guarantee. Unlike the
 * escalation ladder this gate is mode-independent — a `danger-full-access`
 * deployment (whose sandbox never denies and advertises no escalation) is
 * exactly the composition the gate guards.
 *
 * The classifier is deliberately textual and conservative: it matches the
 * command string only, one flat table per shell family, and prefers false
 * negatives over friction — routine single-file deletes and plain `git push`
 * stay ungated. The filesystem tools carry no gate: their write path is the
 * daily editing loop and destructive file effects reach the disk through the
 * gated shell tools anyway.
 *
 * @module dsh-sandbox/danger
 */

import { assertNever } from '@deepseek-ai/dsh-llm'
import type { EscalationApproval, EscalationOutcome } from './escalation.ts'

/** The shell command families with their own syntax gate. */
export type CommandFamily = 'bash' | 'pwsh'

/** One classifier hit: a stable id for tests/audit plus a human-readable reason. */
export interface DangerousCommandMatch {
  /** Stable machine id of the matched pattern family (e.g. `recursive-delete`). */
  id: string
  /** Short human-readable reason shown in the approval prompt and denial. */
  reason: string
}

/** One destructive shape: the id, its reason, and the families it applies to. */
interface DangerRule {
  id: string
  reason: string
  families: readonly CommandFamily[]
  pattern: RegExp
}

/** The flat destructive-shape table. Order is irrelevant; every hit matches. */
const DANGER_RULES: readonly DangerRule[] = [
  // ── deletes and mass destruction ──────────────────────────────────────────
  {
    id: 'recursive-delete',
    reason: 'recursive delete (rm -r / --recursive)',
    families: ['bash'],
    pattern: /\brm\b[^|;&]*\s(?:-[a-zA-Z]*[rR][a-zA-Z]*|--recursive)\b/,
  },
  {
    id: 'recursive-delete',
    reason: 'recursive delete (Remove-Item -Recurse / rd /s)',
    families: ['pwsh'],
    pattern: /(?:Remove-Item\b[^|;&]*-Recurse|\brd\s+\/s\b)/i,
  },
  {
    id: 'find-delete',
    reason: 'mass delete (find -delete)',
    families: ['bash'],
    pattern: /\bfind\b[^|;&]*\s-delete\b/,
  },
  {
    id: 'shred-file',
    reason: 'irreversible file destruction (shred / truncate -s 0)',
    families: ['bash'],
    pattern: /\b(?:shred\b|truncate\b[^|;&]*-s\s*0\b)/,
  },
  // ── disk and raw device effects ───────────────────────────────────────────
  {
    id: 'disk-write',
    reason: 'disk-level write (dd of= / mkfs / wipefs / Format-Volume)',
    families: ['bash', 'pwsh'],
    pattern: /\bdd\b[^|;&]*\bof=|\bmkfs(\.\w+)?\b|\bwipefs\b|\bFormat-Volume\b|\bClear-Disk\b/i,
  },
  {
    id: 'raw-device-write',
    reason: 'raw device write (redirect into /dev/sd* / nvme*)',
    families: ['bash', 'pwsh'],
    pattern: /(?:>\s*|\btee\s+)\/dev\/(?:sd[a-z]|nvme\d+n\d+)\b/,
  },
  // ── system control ────────────────────────────────────────────────────────
  {
    id: 'power-control',
    reason: 'system power control (shutdown / reboot / Stop-Computer)',
    families: ['bash', 'pwsh'],
    pattern: /\b(?:shutdown|reboot|halt|poweroff|init\s+[06]|Stop-Computer|Restart-Computer)\b/,
  },
  {
    id: 'process-sweep',
    reason: 'process sweep (pkill / killall / Stop-Process -Name)',
    families: ['bash', 'pwsh'],
    pattern: /\b(?:pkill|killall)\b|\bStop-Process\b[^|;&]*-Name\b/,
  },
  {
    id: 'recursive-perms',
    reason: 'recursive permission/ownership change (chmod -R / chown -R)',
    families: ['bash'],
    pattern: /\bch(?:mod|own)\b[^|;&]*\s-[a-zA-Z]*[Rr][a-zA-Z]*\b/,
  },
  // ── git history ───────────────────────────────────────────────────────────
  {
    id: 'git-force-push',
    reason: 'force push rewrites remote history',
    families: ['bash', 'pwsh'],
    pattern: /\bgit\s+push\b[^|;&]*\s(?:--force(?:-with-lease)?|-f)\b/,
  },
  {
    id: 'git-history-discard',
    reason: 'uncommitted-work/history discard (reset --hard / clean -f / checkout -- / branch -D)',
    families: ['bash', 'pwsh'],
    pattern: /\bgit\s+(?:reset\b[^|;&]*--hard|clean\b[^|;&]*-[a-zA-Z]*f|checkout\b[^|;&]*--\s|branch\b[^|;&]*\s-D\b|restore\b[^|;&]*--worktree)/,
  },
  // ── remote code execution ─────────────────────────────────────────────────
  {
    id: 'piped-remote-exec',
    reason: 'piped remote script execution (curl|sh / iex (iwr))',
    families: ['bash', 'pwsh'],
    pattern: /\b(?:curl|wget)\b[^|;&]*\|\s*(?:sudo\s+)?(?:ba|z|da|f)?sh\b|\biex\b[^|;&]*\b(?:iwr|Invoke-RestMethod)\b|\bInvoke-Expression\b/i,
  },
  // ── packages and databases ────────────────────────────────────────────────
  {
    id: 'package-removal',
    reason: 'package removal (apt/dnf remove, snap remove, pacman -R)',
    families: ['bash'],
    pattern: /\b(?:apt(?:-get)?\s+(?:remove|purge)|dnf\s+(?:remove|erase)|yum\s+remove|snap\s+remove|pacman\s+-R)\b/,
  },
  {
    id: 'sql-destruct',
    reason: 'SQL DROP/TRUNCATE',
    families: ['bash', 'pwsh'],
    pattern: /\bDROP\s+(?:TABLE|DATABASE|SCHEMA)\b|\bTRUNCATE\s+TABLE\b/i,
  },
  // ── credentials ───────────────────────────────────────────────────────────
  {
    id: 'credential-write',
    reason: 'credential store write (~/.ssh/authorized_keys, ~/.aws)',
    families: ['bash', 'pwsh'],
    pattern: /(?:>\s*|>>\s*|\btee\s+[a-zA-Z]*\s*)\S*(?:\.ssh\/authorized_keys|\.aws\/credentials)/,
  },
]

/**
 * Judge one shell command against the destructive-shape table.
 * @param command - the raw command string, exactly as the model supplied it.
 * @param family - the shell family the command targets.
 * @returns the first matching shape, or undefined when nothing dangerous matched.
 */
export function classifyDangerousCommand(command: string, family: CommandFamily): DangerousCommandMatch | undefined {
  const hit = DANGER_RULES.find(rule => rule.families.includes(family) && rule.pattern.test(command))
  return hit === undefined ? undefined : { id: hit.id, reason: hit.reason }
}

/**
 * Resolve a destructive-command approval BEFORE anything executes, mapping
 * every outcome to the same fail-closed dialect as {@link approveEscalation}:
 * `'allowed-once'` resolves; every other path throws the verbatim denial (the
 * tool registry turns the throw into the call's isError result, and nothing
 * has run). A missing approver or agent fails closed the same way — a
 * destructive command without an approval channel never runs.
 * @param match - the classifier hit that triggered the gate.
 * @param approval - the approval ingredients the tool holds (see {@link EscalationApproval}).
 * @param subject - the family's noun for the gated action (`command` for the shell tools).
 */
export async function approveDangerousOperation<A, C>(
  match: DangerousCommandMatch,
  approval: EscalationApproval<A, C>,
  subject: string,
): Promise<void> {
  if (approval.approver === undefined) {
    throw new Error(`this destructive ${subject} (${match.reason}) requires approval, but no approval service is composed`)
  }
  if (approval.agent === undefined) {
    throw new Error(`this destructive ${subject} (${match.reason}) requires approval, but the call has no agent to route it through`)
  }
  // Self-contained for the audit trail: approval/asked stores this reason.
  const outcome: EscalationOutcome = await approval.approver.request({
    agent: approval.agent,
    toolName: approval.toolName,
    callId: approval.callId,
    reason: `destructive ${subject}: ${match.reason}`,
    ...approval.signal ? { signal: approval.signal } : {},
  })
  switch (outcome) {
    case 'allowed-once': return
    case 'rejected': throw new Error(`the user rejected this destructive ${subject} (${match.reason})`)
    case 'cancelled': throw new Error(`approval for this destructive ${subject} was cancelled`)
    case 'unavailable': throw new Error(`this destructive ${subject} (${match.reason}) requires approval, but no approval channel is available`)
    /* v8 ignore next -- the approver contract returns the closed vocabulary; this branch is only the static exhaustiveness guard. */
    default: return assertNever(outcome, 'EscalationOutcome')
  }
}

/** Test-only visibility into the rule table (specs assert ids and family scoping). */
export function dangerRuleIds(family: CommandFamily): readonly string[] {
  return DANGER_RULES.filter(rule => rule.families.includes(family)).map(rule => rule.id)
}
