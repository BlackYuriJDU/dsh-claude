/** One subscription per form for the sections that read the memory Config form. */
import { useCallback, useSyncExternalStore } from 'react'
import type { ConfigForm, ConfigFormSnapshot } from '@deepseek-ai/dsh-client-ui-settings/client'

/**
 * Read a selection of a Config form's snapshot, subscribing once per form.
 * @param form - the Config form to observe.
 * @param select - picks a value that keeps its reference while the snapshot does.
 * @returns the selected value from the current snapshot.
 */
export function useFormSnapshot<T, S>(form: ConfigForm<T>, select: (snapshot: ConfigFormSnapshot<T>) => S): S {
  const subscribe = useCallback((listener: () => void) => form.subscribe(listener), [form])
  return useSyncExternalStore(subscribe, () => select(form.getSnapshot()))
}
