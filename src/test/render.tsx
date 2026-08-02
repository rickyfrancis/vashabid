import { render as rtlRender, screen, within } from '@testing-library/react'
import type { RenderOptions } from '@testing-library/react'
import type { ReactElement } from 'react'

function render(ui: ReactElement, options?: RenderOptions) {
  return rtlRender(ui, { ...options })
}

export { render, screen, within }
export { act, fireEvent, waitFor } from '@testing-library/react'
