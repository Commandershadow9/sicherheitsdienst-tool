import { describe, expect, it, beforeEach, vi } from 'vitest'
import axios from 'axios'
import { installAuthInterceptors } from './interceptors'

type Tokens = { accessToken: string; refreshToken?: string }

const createInstance = () => axios.create({ baseURL: 'http://test.local', adapter: (config) => adapter(config) })

let adapter: (config: any) => Promise<any>

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
    adapter = vi.fn(async (config) => {
      return {
        status: 200,
        statusText: 'OK',
        config,
        data: { ok: true },
        headers: {},
      }
    })
    const api = createInstance()
    const setTokens = vi.fn()

    installAuthInterceptors(api, {
      getTokens: () => tokens,
      setTokens,
      refresh: vi.fn(),
      onLogout: vi.fn(),
    })

    await api.get('/users')

    expect(adapter).toHaveBeenCalledTimes(1)
    const callConfig = adapter.mock.calls[0][0]
    expect(callConfig.headers?.Authorization).toBe('Bearer abc')
    expect(setTokens).not.toHaveBeenCalled()
  })

  it('liest Tokens aus localStorage wenn Provider nichts liefert', async () => {
    storage.setItem('auth', JSON.stringify({ tokens: { accessToken: 'stored-token' } }))
    adapter = vi.fn(async (config) => ({
      status: 200,
      statusText: 'OK',
      config,
      data: {},
      headers: {},
    }))
    const api = createInstance()

    installAuthInterceptors(api, {
      getTokens: () => null,
      setTokens: vi.fn(),
      refresh: vi.fn(),
      onLogout: vi.fn(),
    })

    await api.get('/sites')

    const callConfig = adapter.mock.calls[0][0]
    expect(callConfig.headers?.Authorization).toBe('Bearer stored-token')
  })

  it('refresh Token nach 401 und wiederholt Request', async () => {
    const setTokens = vi.fn()
    const refresh = vi.fn(async () => ({ accessToken: 'new-access', refreshToken: 'new-refresh' }))

    const responses: Array<(arg: any) => Promise<any>> = [
      async (config) => {
        return Promise.reject({
          config,
          response: { status: 401, data: { message: 'unauthorized' }, headers: {}, config },
        })
      },
      async (config) => ({
        status: 200,
        statusText: 'OK',
        config,
        data: { ok: true },
        headers: {},
      }),
    ]

    adapter = vi.fn(async (config) => {
      const next = responses.shift()
      if (!next) throw new Error('unexpected extra call')
      return next(config)
    })

    const api = createInstance()

    installAuthInterceptors(api, {
      getTokens: () => ({ accessToken: 'expired', refreshToken: 'refresh-token' }),
      setTokens,
      refresh,
      onLogout: vi.fn(),
    })

    const result = await api.get('/incidents')

    expect(result.data).toEqual({ ok: true })
    expect(refresh).toHaveBeenCalledTimes(1)
    expect(setTokens).toHaveBeenCalledWith({ accessToken: 'new-access', refreshToken: 'new-refresh' })
    const configs = adapter.mock.calls.map((c) => c[0])
    expect(configs[0].headers?.Authorization).toBe('Bearer expired')
    expect(configs[1].headers?.Authorization).toBe('Bearer new-access')
  })
})
