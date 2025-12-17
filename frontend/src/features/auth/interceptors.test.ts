import { describe, expect, it, beforeEach, vi } from 'vitest'
import { installAuthInterceptors } from './interceptors'

const createFakeAxios = () => {
  const requestHandlers: Array<(config: any) => any> = []
  const responseHandlers: Array<{ fulfilled?: (value: any) => any; rejected?: (error: any) => any }> = []

  const api = {
    interceptors: {
      request: {
        use(fulfilled: (config: any) => any) {
          requestHandlers.push(fulfilled)
          return requestHandlers.length - 1
        },
      },
      response: {
        use(_fulfilled: ((value: any) => any) | undefined, rejected: (error: any) => any) {
          responseHandlers.push({ fulfilled: _fulfilled, rejected })
          return responseHandlers.length - 1
        },
      },
    },
    // Mock the recursive call (api.request)
    request: vi.fn(),
  }

  return { api: api as any, requestHandlers, responseHandlers }
}

describe('installAuthInterceptors', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('refresh session after 401 and retry original request', async () => {
    const { api, responseHandlers } = createFakeAxios()
    const refresh = vi.fn().mockResolvedValue(undefined)
    const onLogout = vi.fn()

    installAuthInterceptors(api, {
      refresh,
      onLogout,
    })

    const errorHandler = responseHandlers[0].rejected
    expect(errorHandler).toBeDefined()

    // 401 Error on a normal endpoint
    const error = {
      config: { url: '/api/data', _retry: false },
      response: { status: 401 },
    }

    // Mock the retry to succeed
    vi.mocked(api.request).mockResolvedValueOnce({ data: 'ok' })

    const result = await errorHandler!(error)

    expect(refresh).toHaveBeenCalledTimes(1)
    expect(api.request).toHaveBeenCalledWith(expect.objectContaining({ _retry: true }))
    expect(result).toEqual({ data: 'ok' })
    expect(onLogout).not.toHaveBeenCalled()
  })

  it('should logout if refresh fails', async () => {
    const { api, responseHandlers } = createFakeAxios()
    const refresh = vi.fn().mockRejectedValue(new Error('Refresh failed'))
    const onLogout = vi.fn()

    installAuthInterceptors(api, {
      refresh,
      onLogout,
    })

    const errorHandler = responseHandlers[0].rejected

    const error = {
      config: { url: '/api/data', _retry: false },
      response: { status: 401 },
    }

    await expect(errorHandler!(error)).rejects.toThrow('Refresh failed')

    expect(refresh).toHaveBeenCalledTimes(1)
    expect(onLogout).toHaveBeenCalledTimes(1)
  })

  it('should NOT refresh on 401 from login/refresh/me endpoints', async () => {
    const { api, responseHandlers } = createFakeAxios()
    const refresh = vi.fn()
    const onLogout = vi.fn()

    installAuthInterceptors(api, { refresh, onLogout })

    const errorHandler = responseHandlers[0].rejected
    const error = {
      config: { url: '/api/auth/login', _retry: false },
      response: { status: 401 },
    }

    await expect(errorHandler!(error)).rejects.toBe(error)
    expect(refresh).not.toHaveBeenCalled()
  })
})