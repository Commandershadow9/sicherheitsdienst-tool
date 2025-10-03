import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { AuthProvider, useAuth } from './AuthProvider'
import { api } from '@/lib/api'

// Mock API module
vi.mock('@/lib/api', () => ({
  api: {
    post: vi.fn(),
    get: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
}))

// Mock interceptors
vi.mock('./interceptors', () => ({
  installAuthInterceptors: vi.fn(),
}))

// Helper component to access auth context
function TestComponent() {
  const { isAuthenticated, user, hydrated } = useAuth()
  return (
    <div>
      <div data-testid="authenticated">{String(isAuthenticated)}</div>
      <div data-testid="user">{user ? JSON.stringify(user) : 'null'}</div>
      <div data-testid="hydrated">{String(hydrated)}</div>
    </div>
  )
}

describe('AuthProvider', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('should initialize with no authentication', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    expect(screen.getByTestId('authenticated')).toHaveTextContent('false')
    expect(screen.getByTestId('user')).toHaveTextContent('null')
  })

  it('should hydrate from localStorage', async () => {
    const storedAuth = {
      tokens: { accessToken: 'test-token', refreshToken: 'test-refresh' },
      user: { id: '1', email: 'test@example.com', role: 'EMPLOYEE' as const },
    }
    localStorage.setItem('auth', JSON.stringify(storedAuth))

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('true')
    })

    const userText = screen.getByTestId('user').textContent
    expect(userText).toContain('test@example.com')
  })

  it('should handle login successfully', async () => {
    const mockLoginResponse = {
      data: {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        user: { id: '2', email: 'user@example.com', role: 'MANAGER' as const },
      },
    }

    vi.mocked(api.post).mockResolvedValueOnce(mockLoginResponse)

    function LoginTest() {
      const { login, isAuthenticated } = useAuth()
      return (
        <div>
          <button onClick={() => login('user@example.com', 'password123')}>Login</button>
          <div data-testid="authenticated">{String(isAuthenticated)}</div>
        </div>
      )
    }

    render(
      <AuthProvider>
        <LoginTest />
      </AuthProvider>
    )

    const loginButton = screen.getByText('Login')
    loginButton.click()

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('true')
    })

    expect(api.post).toHaveBeenCalledWith('/auth/login', {
      email: 'user@example.com',
      password: 'password123',
    })

    const stored = JSON.parse(localStorage.getItem('auth') || '{}')
    expect(stored.tokens.accessToken).toBe('new-access-token')
    expect(stored.user.email).toBe('user@example.com')
  })

  it('should handle logout', async () => {
    const storedAuth = {
      tokens: { accessToken: 'test-token', refreshToken: 'test-refresh' },
      user: { id: '1', email: 'test@example.com', role: 'EMPLOYEE' as const },
    }
    localStorage.setItem('auth', JSON.stringify(storedAuth))

    function LogoutTest() {
      const { logout, isAuthenticated } = useAuth()
      return (
        <div>
          <button onClick={logout}>Logout</button>
          <div data-testid="authenticated">{String(isAuthenticated)}</div>
        </div>
      )
    }

    render(
      <AuthProvider>
        <LogoutTest />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('true')
    })

    const logoutButton = screen.getByText('Logout')
    logoutButton.click()

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('false')
    })

    expect(localStorage.getItem('auth')).toBeNull()
  })

  it('should fetch user when tokens exist but no user', async () => {
    const storedAuth = {
      tokens: { accessToken: 'test-token', refreshToken: 'test-refresh' },
      user: null,
    }
    localStorage.setItem('auth', JSON.stringify(storedAuth))

    const mockMeResponse = {
      data: {
        user: { id: '3', email: 'fetched@example.com', role: 'ADMIN' as const },
      },
    }

    vi.mocked(api.get).mockResolvedValueOnce(mockMeResponse)

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      const userText = screen.getByTestId('user').textContent
      expect(userText).toContain('fetched@example.com')
    })

    expect(api.get).toHaveBeenCalledWith('/auth/me')
  })

  it('should handle hydration', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('hydrated')).toHaveTextContent('true')
    })
  })
})
