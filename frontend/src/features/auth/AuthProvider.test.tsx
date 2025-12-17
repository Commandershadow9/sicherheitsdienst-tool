import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
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
    request: vi.fn(),
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
      <div data-testid="user">{user ? user.email : 'null'}</div>
      <div data-testid="hydrated">{String(hydrated)}</div>
    </div>
  )
}

describe('AuthProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize and check session via /auth/me', async () => {
    // Mock successful session check
    vi.mocked(api.get).mockResolvedValueOnce({
      data: {
        success: true,
        data: { id: '123', email: 'session@example.com', role: 'EMPLOYEE' }
      }
    })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    // Initial state might be unhydrated, but wait for hydration
    await waitFor(() => {
      expect(screen.getByTestId('hydrated')).toHaveTextContent('true')
    })

    expect(api.get).toHaveBeenCalledWith('/auth/me')
    expect(screen.getByTestId('authenticated')).toHaveTextContent('true')
    expect(screen.getByTestId('user')).toHaveTextContent('session@example.com')
  })

  it('should handle session check failure (not logged in)', async () => {
    // Mock 401 response
    vi.mocked(api.get).mockRejectedValueOnce({
      response: { status: 401 }
    })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('hydrated')).toHaveTextContent('true')
    })

    expect(api.get).toHaveBeenCalledWith('/auth/me')
    expect(screen.getByTestId('authenticated')).toHaveTextContent('false')
    expect(screen.getByTestId('user')).toHaveTextContent('null')
  })

  it('should handle login successfully', async () => {
    // Mock session check to fail first (not logged in initially)
    vi.mocked(api.get).mockRejectedValueOnce({ response: { status: 401 } })
    
    // Mock login response
    vi.mocked(api.post).mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          user: { id: '2', email: 'login@example.com', role: 'MANAGER' }
        }
      }
    })

    function LoginTest() {
      const { login, isAuthenticated } = useAuth()
      return (
        <div>
          <button onClick={() => login('login@example.com', 'pw')}>Login</button>
          <div data-testid="authenticated">{String(isAuthenticated)}</div>
        </div>
      )
    }

    render(
      <AuthProvider>
        <LoginTest />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('false')
    })

    const loginButton = screen.getByText('Login')
    await act(async () => {
      loginButton.click()
    })

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('true')
    })

    expect(api.post).toHaveBeenCalledWith('/auth/login', { email: 'login@example.com', password: 'pw' })
  })

  it('should handle logout', async () => {
     // Mock session check (logged in)
     vi.mocked(api.get).mockResolvedValueOnce({
      data: {
        success: true,
        data: { id: '123', email: 'session@example.com', role: 'EMPLOYEE' }
      }
    })
    
    // Mock logout
    vi.mocked(api.post).mockResolvedValueOnce({ data: { success: true } })

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
    await act(async () => {
      logoutButton.click()
    })

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('false')
    })

    expect(api.post).toHaveBeenCalledWith('/auth/logout')
  })
})