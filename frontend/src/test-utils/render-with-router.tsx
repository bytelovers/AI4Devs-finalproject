/**
 * Test helper for rendering components inside a React Router v6/v7 context.
 *
 * Use this helper when a component uses `useNavigate`, `useLocation`,
 * `useParams`, `useBlocker` or other router hooks.
 *
 * Usage:
 *   renderWithRouter(<Component />)
 *   renderWithRouter(<Component />, { route: '/contacts' })
 *
 * Default route: `/` (HomeView).
 */

import { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

export interface RouterRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  /** Initial route path inside MemoryRouter. Default: '/'. */
  route?: string
  /** Initial entries (pathname history stack). Default: `[{ pathname: route }]`. */
  initialEntries?: Array<{ pathname: string }>
}

export function renderWithRouter(
  ui: ReactElement,
  { route = '/', initialEntries, ...options }: RouterRenderOptions = {}
) {
  const entries = initialEntries ?? [{ pathname: route }]
  return render(ui, {
    wrapper: ({ children }) => (
      <MemoryRouter initialEntries={entries}>{children}</MemoryRouter>
    ),
    ...options,
  })
}

export * from '@testing-library/react'
export { renderWithRouter as render }
