// Runs once before every test file — adds jest-dom's matchers
// (toBeInTheDocument, toHaveTextContent, etc) to Vitest's expect().
import '@testing-library/jest-dom/vitest'

// Testing Library's own cleanup() only auto-registers when `afterEach` is a
// global (Jest-style config) — this project doesn't set `test.globals: true`,
// so without this, each render() in a file piles onto the same document and
// later tests see duplicate elements from earlier ones.
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

afterEach(() => {
  cleanup()
})
