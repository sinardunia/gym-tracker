import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'

import App from './App'

describe('App', () => {
  afterEach(() => {
    cleanup()
    localStorage.clear()
  })

  it('mounts and settles without render loops', async () => {
    render(<App />)
    expect(await screen.findByText('Gym Tracker')).toBeInTheDocument()
    await new Promise((resolve) => setTimeout(resolve, 300))
    expect(screen.getByText('Gym Tracker')).toBeInTheDocument()
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument()
  })
})