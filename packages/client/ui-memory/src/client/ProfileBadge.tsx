/**
 * The signed-out account launcher's identity: the initials of the name set
 * in the "Your {product}" section, and the name itself while the sidebar
 * shows labels.
 */
import type { PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type { MemorySectionInjected } from './MemorySection.tsx'
import { useFormSnapshot } from './form-snapshot.ts'
import css from './ProfileBadge.module.css'

/** The launcher geometry plus the memory form that holds the name. */
export type ProfileBadgeProps = Pick<PropsRuntime<'settings.launcher.badge'>, 'wide'> & MemorySectionInjected

/**
 * Up to two initials: the first letters of the first and last words.
 * @param name - the person's name.
 * @returns the uppercase initials; empty for a blank name.
 */
export function initialsOf(name: string): string {
  const firsts: string[] = []
  for (const word of name.trim().split(/\s+/)) {
    for (const character of word) {
      firsts.push(character)
      break
    }
  }
  const pair = firsts.length > 1 ? [firsts[0], firsts.at(-1)] : firsts
  return pair.join('').toUpperCase()
}

/**
 * Render the initials circle and, when wide, the name.
 * @param props - launcher geometry and the memory form.
 * @returns the badge, or nothing while the name is blank.
 */
export function ProfileBadge({ wide, memory }: ProfileBadgeProps) {
  const name = useFormSnapshot(memory, snapshot => snapshot.value?.profileName?.trim() ?? '')
  if (name === '') return null
  return (
    <>
      <span className={css.avatar} aria-hidden="true">{initialsOf(name)}</span>
      {wide && <span className={css.name}>{name}</span>}
    </>
  )
}
