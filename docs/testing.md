# Testing Guide

Reilly.asia uses **Vitest** for unit and integration tests. This guide covers how to write and run tests effectively.

## Quick Start

```bash
# Run all tests once
npm run test

# Watch mode (re-run on file changes)
npm run test:watch

# UI dashboard to browse tests
npm run test:ui

# Check coverage
npm run test -- --coverage
```

## Test File Organization

Place test files next to the code they test:

```
client/src/lib/
  ├── utils.ts
  └── utils.test.ts        ← Test file

client/src/components/
  ├── my-component.tsx
  └── my-component.test.tsx ← Test file

shared/
  ├── fleet.ts
  └── fleet.test.ts        ← Test file
```

**File naming**: `*.test.ts` or `*.test.tsx`

## Writing Unit Tests

### Basic Test Structure

```tsx
import { describe, it, expect } from 'vitest'
import { myFunction } from './my-function'

describe('myFunction', () => {
  it('should return the correct value', () => {
    const result = myFunction(input)
    expect(result).toBe(expectedValue)
  })

  it('should handle edge cases', () => {
    expect(myFunction(null)).toThrow()
  })
})
```

### Testing Utilities

```tsx
import { describe, it, expect } from 'vitest'
import { cn } from './utils'

describe('cn utility', () => {
  it('merges classnames', () => {
    expect(cn('px-2', 'py-1')).toContain('px-2')
    expect(cn('px-2', 'py-1')).toContain('py-1')
  })

  it('deduplicates tailwind classes', () => {
    const result = cn('p-2', 'p-4') // p-4 should win
    expect(result).toContain('p-4')
    expect(result).not.toContain('p-2')
  })

  it('handles conditional classes', () => {
    expect(cn('base', true && 'active')).toContain('active')
    expect(cn('base', false && 'active')).not.toContain('active')
  })
})
```

### Testing with Zod Schemas

```tsx
import { describe, it, expect } from 'vitest'
import { z } from 'zod'
import { repositorySchema } from './schema'

describe('repositorySchema', () => {
  it('validates correct repository data', () => {
    const data = {
      name: 'my-repo',
      url: 'https://github.com/user/my-repo',
      stars: 42
    }
    expect(repositorySchema.parse(data)).toBeDefined()
  })

  it('rejects invalid URLs', () => {
    const data = {
      name: 'my-repo',
      url: 'not-a-url',
      stars: 42
    }
    expect(() => repositorySchema.parse(data)).toThrow()
  })

  it('rejects negative star counts', () => {
    const data = {
      name: 'my-repo',
      url: 'https://github.com/user/my-repo',
      stars: -1
    }
    expect(() => repositorySchema.parse(data)).toThrow()
  })
})
```

## Testing React Components

### Rendering Components

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MyComponent } from './my-component'

describe('<MyComponent />', () => {
  it('renders correctly', () => {
    render(<MyComponent title="Test" />)
    expect(screen.getByText('Test')).toBeInTheDocument()
  })

  it('handles children', () => {
    render(<MyComponent title="Test">Child content</MyComponent>)
    expect(screen.getByText('Child content')).toBeInTheDocument()
  })
})
```

### Testing User Interactions

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from './button'

describe('<Button />', () => {
  it('calls onClick handler', async () => {
    const handleClick = vi.fn()
    const user = userEvent.setup()
    
    render(<Button onClick={handleClick}>Click me</Button>)
    await user.click(screen.getByRole('button'))
    
    expect(handleClick).toHaveBeenCalledOnce()
  })

  it('supports keyboard activation', async () => {
    const handleClick = vi.fn()
    const user = userEvent.setup()
    
    render(<Button onClick={handleClick}>Click me</Button>)
    await user.keyboard('{Enter}')
    
    expect(handleClick).toHaveBeenCalled()
  })
})
```

## Testing Hooks

### Custom Hooks (Not React Components)

```tsx
// useInfraApi.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useInfraApi } from './use-infra-api'

describe('useInfraApi', () => {
  beforeEach(() => {
    // Mock fetch if needed
    global.fetch = vi.fn()
  })

  it('fetches data on mount', async () => {
    const { result } = renderHook(() => useInfraApi())
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })
    
    expect(result.current.data).toBeDefined()
  })
})
```

## Testing API Routes

### Server Routes (server/routes.ts or worker/routes.ts)

```tsx
import { describe, it, expect, vi } from 'vitest'

describe('GET /api/infra', () => {
  it('returns infra data', async () => {
    // Mock fetch or your API client
    vi.mock('../lib/github-api', () => ({
      fetchInfra: vi.fn(() => Promise.resolve([
        { name: 'fleet1', status: 'active' }
      ]))
    }))

    // Call your handler
    const response = await handler()
    
    expect(response.status).toBe(200)
    expect(response.json).toContain('fleet1')
  })

  it('handles API errors gracefully', async () => {
    vi.mock('../lib/github-api', () => ({
      fetchInfra: vi.fn(() => Promise.reject(new Error('API down')))
    }))

    const response = await handler()
    
    expect(response.status).toBe(500)
    expect(response.error).toBeDefined()
  })
})
```

## Common Assertions

```tsx
// Truthiness
expect(value).toBeTruthy()
expect(value).toBeFalsy()

// Equality
expect(value).toBe(expectedValue) // ===
expect(object).toEqual({ a: 1 }) // deep equality

// Strings
expect(text).toContain('substring')
expect(text).toMatch(/regex/)

// Arrays
expect(array).toHaveLength(3)
expect(array).toContain(item)
expect(array).toEqual([1, 2, 3])

// Functions
expect(fn).toHaveBeenCalled()
expect(fn).toHaveBeenCalledWith(arg1, arg2)
expect(fn).toHaveBeenCalledOnce()

// Errors
expect(() => fn()).toThrow()
expect(() => fn()).toThrow(TypeError)

// DOM
expect(element).toBeInTheDocument()
expect(element).toBeVisible()
expect(element).toHaveClass('active')
expect(element).toHaveAttribute('href', '/path')
```

## Mocking

### Mocking External APIs

```tsx
import { vi } from 'vitest'

// Mock fetch
global.fetch = vi.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({ data: 'value' })
  })
)

// Mock modules
vi.mock('../lib/github-api', () => ({
  getRepositories: vi.fn(() => Promise.resolve([]))
}))
```

### Spying on Functions

```tsx
import { vi } from 'vitest'

const fn = vi.fn()
const result = fn(1, 2, 3)

// Assertions
expect(fn).toHaveBeenCalled()
expect(fn).toHaveBeenCalledWith(1, 2, 3)
expect(fn).toReturnValue(result)
```

## Coverage

Check test coverage:

```bash
npm run test -- --coverage
```

This generates a `coverage/` directory with HTML reports.

**Coverage targets:**
- Lines: >80%
- Branches: >75%
- Functions: >80%
- Statements: >80%

If you see a file with low coverage, add tests for those untested paths.

## Best Practices

### ✅ Do

- Test **behavior**, not implementation details
- Use descriptive test names: `it('validates email format')`
- Group related tests with `describe()`
- Keep tests focused (one assertion per test when possible)
- Mock external dependencies (APIs, timers)
- Use `beforeEach` for common setup

### ❌ Don't

- Test implementation details (`expect(component.state).toBe(...)`)
- Use vague test names: `it('works')`
- Create brittle tests that break on minor refactors
- Mock everything (only mock external concerns)
- Write tests that depend on each other
- Leave commented-out tests

## Example: Testing a Complete Feature

### Component: `VenueSelector.tsx`

```tsx
import { useState } from 'react'

export function VenueSelector({ venues, onSelect }) {
  const [selected, setSelected] = useState(null)

  return (
    <div>
      {venues.map(venue => (
        <button
          key={venue.id}
          onClick={() => {
            setSelected(venue.id)
            onSelect(venue.id)
          }}
          data-testid={`venue-${venue.id}`}
        >
          {venue.name}
        </button>
      ))}
    </div>
  )
}
```

### Test: `VenueSelector.test.tsx`

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { VenueSelector } from './venue-selector'

describe('<VenueSelector />', () => {
  const mockVenues = [
    { id: '1', name: 'Hall A' },
    { id: '2', name: 'Hall B' }
  ]

  it('renders all venues', () => {
    render(<VenueSelector venues={mockVenues} onSelect={() => {}} />)
    expect(screen.getByText('Hall A')).toBeInTheDocument()
    expect(screen.getByText('Hall B')).toBeInTheDocument()
  })

  it('calls onSelect when venue is clicked', async () => {
    const handleSelect = vi.fn()
    const user = userEvent.setup()

    render(<VenueSelector venues={mockVenues} onSelect={handleSelect} />)
    await user.click(screen.getByTestId('venue-1'))

    expect(handleSelect).toHaveBeenCalledWith('1')
  })

  it('allows multiple selections', async () => {
    const handleSelect = vi.fn()
    const user = userEvent.setup()

    render(<VenueSelector venues={mockVenues} onSelect={handleSelect} />)
    await user.click(screen.getByTestId('venue-1'))
    await user.click(screen.getByTestId('venue-2'))

    expect(handleSelect).toHaveBeenCalledTimes(2)
    expect(handleSelect).toHaveBeenNthCalledWith(2, '2')
  })

  it('handles empty venues list', () => {
    const { container } = render(<VenueSelector venues={[]} onSelect={() => {}} />)
    expect(container.querySelectorAll('button')).toHaveLength(0)
  })
})
```

## Debugging Tests

### Run a Single Test

```bash
npm run test -- venue-selector.test.ts
```

### Run Tests Matching a Pattern

```bash
npm run test -- --grep "VenueSelector"
```

### Watch Mode with UI

```bash
npm run test:ui
```

Then open the browser URL to see live test results and debug.

### Add Console Logs

```tsx
it('my test', () => {
  const value = myFunction()
  console.log('Debug value:', value) // Shows in test output
  expect(value).toBe(42)
})
```

## Continuous Integration

Tests run automatically on every push via GitHub Actions (or your CI):

1. `npm install`
2. `npm run check` (TypeScript)
3. `npm run test` (Vitest)

All must pass before merging.

## Resources

- [Vitest Docs](https://vitest.dev/)
- [Testing Library Docs](https://testing-library.com/)
- [Zod Docs](https://zod.dev/)

Happy testing! 🧪
