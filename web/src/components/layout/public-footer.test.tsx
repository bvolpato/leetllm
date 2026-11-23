import { expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { ComponentProps } from 'react'
import { PublicFooter } from './public-footer'

type MockLinkProps = ComponentProps<'a'> & { prefetch?: boolean }

vi.mock('next/link', () => ({
  default: ({ prefetch, ...props }: MockLinkProps) => (
    <a {...props} data-prefetch={prefetch === false ? 'false' : 'default'} />
  ),
}))

vi.mock('next/navigation', () => ({
  usePathname: () => '/',
}))

test('PublicFooter does not prefetch the glossary and blog routes', () => {
  render(<PublicFooter />)

  for (const [name, href] of [['Glossary', '/glossary'], ['Blog', '/blog']]) {
    const link = screen.getByRole('link', { name })
    expect(link.getAttribute('href')).toBe(href)
    expect(link.getAttribute('data-prefetch')).toBe('false')
  }
})
