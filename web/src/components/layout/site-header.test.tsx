import { beforeEach, expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { ComponentProps } from 'react'
import { SiteHeader } from './site-header'

const { mockUsePathname } = vi.hoisted(() => ({ mockUsePathname: vi.fn(() => '/') }))
type MockLinkProps = ComponentProps<'a'> & { prefetch?: boolean }

vi.mock('next/link', () => ({
  default: ({ prefetch, ...props }: MockLinkProps) => (
    <a {...props} data-prefetch={prefetch === false ? 'false' : 'default'} />
  ),
}))

// Mock next-themes to avoid provider requirement in tests
vi.mock('next-themes', () => ({
  useTheme: () => ({ theme: 'dark', setTheme: vi.fn() }),
}))

vi.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname(),
}))

vi.mock('@/lib/use-is-logged-in', () => ({
  useIsLoggedIn: () => ({ user: null, isLoggedIn: false, authLoaded: true }),
}))

beforeEach(() => mockUsePathname.mockReturnValue('/'))

test('SiteHeader renders brand name', () => {
  render(<SiteHeader />)
  expect(screen.getByText('LeetLLM')).toBeDefined()
})

test('SiteHeader provides a persistent slot for the Leety launcher', () => {
  render(<SiteHeader />)
  expect(document.querySelector('#leety-launcher-host')).toBeTruthy()
})

test('SiteHeader renders navigation links', () => {
  render(<SiteHeader />)
  // Links appear in desktop nav
  expect(screen.getAllByText('Tracks').length).toBeGreaterThanOrEqual(1)
  expect(screen.getAllByText('Blog').length).toBeGreaterThanOrEqual(1)
})

test('SiteHeader leaves heavy glossary and blog routes out of viewport prefetch', () => {
  render(<SiteHeader />)

  for (const [name, href] of [['Glossary', '/glossary'], ['Blog', '/blog']]) {
    const link = screen.getByRole('link', { name })
    expect(link.getAttribute('href')).toBe(href)
    expect(link.getAttribute('data-prefetch')).toBe('false')
  }

  expect(screen.getByRole('link', { name: 'Tracks' }).getAttribute('data-prefetch')).toBe('default')
})

test('SiteHeader renders theme toggle', () => {
  render(<SiteHeader />)
  // In test env, useSyncExternalStore returns server snapshot so the SSR fallback renders
  expect(screen.getByLabelText(/switch to .* mode|toggle theme/i)).toBeDefined()
})

test('SiteHeader identifies the current section on a lesson page', () => {
  mockUsePathname.mockReturnValue('/learn/transformer-architecture')
  render(<SiteHeader />)
  expect(screen.getByRole('navigation', { name: 'Primary navigation' })).toBeDefined()
  expect(screen.getByRole('link', { name: 'Learn' }).getAttribute('aria-current')).toBe('true')
  expect(screen.getByRole('link', { name: 'Blog' }).getAttribute('aria-current')).toBeNull()
})

test('SiteHeader marks the exact destination as the current page', () => {
  mockUsePathname.mockReturnValue('/blog')
  render(<SiteHeader />)
  expect(screen.getByRole('link', { name: 'Blog' }).getAttribute('aria-current')).toBe('page')
})
