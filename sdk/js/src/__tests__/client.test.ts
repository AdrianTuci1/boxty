import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { BoxtyClient } from '../client.ts'

describe('BoxtyClient', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    delete process.env.BOXTY_GATEWAY_URL
    delete process.env.BOXTY_TOKEN
  })

  it('uses default gateway URL when no env or argument is provided', () => {
    const client = new BoxtyClient()
    expect(client['base']).toBe('http://127.0.0.1:8080')
  })

  it('reads gateway URL and token from environment', () => {
    process.env.BOXTY_GATEWAY_URL = 'https://boxty.example.com'
    process.env.BOXTY_TOKEN = 'tok'
    const client = BoxtyClient.fromEnv()
    expect(client['base']).toBe('https://boxty.example.com')
    expect(client['token']).toBe('tok')
  })

  it('trims trailing slashes from gateway URL', () => {
    const client = new BoxtyClient('http://localhost:3000//')
    expect(client['base']).toBe('http://localhost:3000')
  })

  it('returns state from /api/cli/state', async () => {
    const state = {
      wallet: { address: '0xabc', balance: 1 },
      provider: null,
      apps: [],
      summary: { providerCount: 0, consumerCount: 0, appCount: 0 },
    }
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => state,
    } as Response)

    const client = new BoxtyClient('http://localhost:3000')
    const result = await client.state()

    expect(fetchMock).toHaveBeenCalledWith('http://localhost:3000/api/cli/state', {})
    expect(result).toEqual(state)
  })

  it('registers a user via signup', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ user_id: 'u1', access_token: 'at' }),
    } as Response)

    const client = new BoxtyClient('http://localhost:3000')
    const result = await client.signup('ext-1', 'a@example.com')

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/v1/auth/register',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ external_user_id: 'ext-1', email: 'a@example.com', organization_id: undefined }),
      },
    )
    expect(result).toEqual({ user_id: 'u1', access_token: 'at' })
  })

  it('throws on non-OK responses', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      text: async () => 'bad',
    } as Response)

    const client = new BoxtyClient('http://localhost:3000')
    await expect(client.state()).rejects.toThrow('Boxty API error 400 Bad Request: bad')
  })

  it('authorizes a device code', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ device_code: 'dc', user_code: 'UC', verification_uri: 'http://auth' }),
    } as Response)

    const client = new BoxtyClient('http://localhost:3000')
    const result = await client.authorizeDevice({ client_id: 'cli' })

    expect(result).toEqual({ device_code: 'dc', user_code: 'UC', verification_uri: 'http://auth' })
  })
})
