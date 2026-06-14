import { describe, it, expect } from 'vitest'
import { slugifyProjectTitle } from '../lib/slug.js'

describe('slugifyProjectTitle', () => {
  it('lowercases and replaces spaces with hyphens', () => {
    expect(slugifyProjectTitle('My Cool Project')).toBe('my-cool-project')
  })

  it('strips special characters', () => {
    expect(slugifyProjectTitle('Build the #1 App!')).toBe('build-the-1-app')
  })

  it('collapses multiple hyphens', () => {
    expect(slugifyProjectTitle('foo  bar')).toBe('foo-bar')
  })

  it('handles empty string gracefully', () => {
    expect(slugifyProjectTitle('')).toBe('')
  })
})
