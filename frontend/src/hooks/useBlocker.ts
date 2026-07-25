/**
 * useBlocker — wraps React Router's `useBlocker` to provide a
 * declarative dirty-form confirmation pattern.
 *
 * Usage:
 *   useBlocker(isDirty, '¿Descartar cambios?')
 *
 * Shows a native `window.confirm` dialog when the user tries to leave
 * the current route while `isDirty` is true. If the user confirms,
 * the navigation proceeds; otherwise it is aborted.
 */

import { useEffect } from 'react'
import { useBlocker as useRouterBlocker } from 'react-router-dom'

export function useBlocker(when: boolean, message: string = '¿Descartar los cambios?') {
  const blocker = useRouterBlocker(when)

  useEffect(() => {
    if (blocker.state === 'blocked') {
      // Use native confirm for simplicity; replaceable with custom modal.
      // eslint-disable-next-line no-alert
      const ok = window.confirm(message)
      if (ok) {
        blocker.proceed()
      } else {
        blocker.reset()
      }
    }
  }, [blocker.state, message])
  // Note: depend on blocker.state (mutable) not blocker (stable reference)
  // RRv7's useBlocker returns a stable blocker object; only blocker.state changes.

  return blocker
}
