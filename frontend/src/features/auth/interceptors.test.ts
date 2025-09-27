import { describe, expect, it, beforeEach, vi } from 'vitest'
import { installAuthInterceptors } from './interceptors'
import { AxiosHeaders } from '@/lib/api'

type Tokens = { accessToken: string; refreshToken?: string }

type FakeAxios = ReturnType<typeof createFakeAxios>

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
    async request(config: any) {
      let nextConfig = config
      for (const handler of requestHandlers) {
        nextConfig = await handler(nextConfig)
      }
      return { status: 200, statusText: 'OK', data: { ok: true }, headers: {}, config: nextConfig }
    },
  }

  return { api: api as any, requestHandlers, responseHandlers }
}

const memoryStorage = () => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    reset: () => {
      store = {}
    },
  }
}

const storage = memoryStorage()

Object.defineProperty(global, 'localStorage', {
  value: storage,
  configurable: true,
})

describe('installAuthInterceptors', () => {
  beforeEach(() => {
    storage.reset()
    vi.clearAllMocks()
  })

  it('setzt Authorization-Header aus Tokens', async () => {
    const tokens: Tokens = { accessToken: 'abc', refreshToken: 'rt' }
    const { api, requestHandlers } = createFakeAxios()

    installAuthInterceptors(api, {
      getTokens: () => tokens,
      setTokens: vi.fn(),
      refresh: vi.fn(),
      onLogout: vi.fn(),
    })

    let config: any = { headers: new AxiosHeaders() }
    for (const handler of requestHandlers) {
      config = handler(config)
    }

    expect(config.headers.get('Authorization')).toBe('Bearer abc')
  })

  it('liest Tokens aus localStorage wenn Provider nichts liefert', async () => {
    storage.setItem('auth', JSON.stringify({ tokens: { accessToken: 'stored-token' } }))
    const { api, requestHandlers } = createFakeAxios()

    installAuthInterceptors(api, {
      getTokens: () => null,
      setTokens: vi.fn(),
      refresh: vi.fn(),
      onLogout: vi.fn(),
    })

    let config: any = { headers: new AxiosHeaders() }
    for (const handler of requestHandlers) {
      config = handler(config)
    }

    expect(config.headers.get('Authorization')).toBe('Bearer stored-token')
  })

  it('refresh Token nach 401 und wiederholt Request', async () => {
    const fake = createFakeAxios()
    const api = fake.api
    const refresh = vi.fn(async () => ({ accessToken: 'new-access', refreshToken: 'new-refresh' }))
    let currentTokens: Tokens | null = { accessToken: 'expired', refreshToken: 'refresh-token' }
    const setTokens = vi.fn((next: Tokens | null) => {
      currentTokens = next
    })
    const requestSpy = vi.spyOn(api, 'request')

    installAuthInterceptors(api, {
      getTokens: () => currentTokens,
      setTokens,
      refresh,
      onLogout: vi.fn(),
    })

    const responseHandler = fake.responseHandlers.at(-1)?.rejected
    expect(responseHandler).toBeTypeOf('function')

    const error = {
      config: { url: '/incidents', headers: new AxiosHeaders() },
      response: { status: 401 },
    }

    const result = await responseHandler!(error)

    expect(refresh).toHaveBeenCalledTimes(1)
    expect(setTokens).toHaveBeenCalledWith({ accessToken: 'new-access', refreshToken: 'new-refresh' })
    expect(requestSpy).toHaveBeenCalledTimes(1)
    const retriedConfig = requestSpy.mock.calls[0][0]
    const authHeader = retriedConfig.headers.get('Authorization')
    expect(authHeader).toBe('Bearer new-access')
    expect(result.data).toEqual({ ok: true })
  })
})
