import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { EMPTY_STATE, loadState, saveState, STORAGE_KEY } from './storage'

describe('storage', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => localStorage.clear())

  it('returns EMPTY_STATE when nothing stored', () => {
    expect(loadState()).toEqual(EMPTY_STATE)
  })

  it('round-trips state through localStorage with a savedAt stamp', () => {
    const state = { ...EMPTY_STATE, sessions: [] }
    saveState(state)
    const loaded = loadState()
    expect(loaded.sessions).toEqual([])
    expect(typeof loaded.savedAt).toBe('string')
    expect(localStorage.getItem(STORAGE_KEY)).not.toBeNull()
  })

  it('returns EMPTY_STATE for corrupt data', () => {
    localStorage.setItem(STORAGE_KEY, '{corrupt')
    expect(loadState()).toEqual(EMPTY_STATE)
  })
})