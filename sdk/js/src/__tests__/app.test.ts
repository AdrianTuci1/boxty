import { describe, it, expect } from 'vitest'
import { BoxtyApp, Volume, Mount, Secret, Image } from '../app.ts'

describe('BoxtyApp', () => {
  it('starts empty', () => {
    const app = new BoxtyApp('demo')
    const manifest = app.toManifest()

    expect(manifest.name).toBe('demo')
    expect(manifest.image).toBeNull()
    expect(manifest.volumes).toEqual([])
    expect(manifest.secrets).toEqual([])
    expect(manifest.functions).toEqual([])
    expect(manifest.endpoints).toEqual([])
  })

  it('registers a function with resources', () => {
    const app = new BoxtyApp('demo')
    const vol = Volume.fromName('data', { sizeGb: 20 })
    const secret = Secret.fromName('api-key')
    const image = Image.debianSlim().pipInstall('requests').aptInstall('curl')

    app.function({
      name: 'handler',
      handler: async () => 'ok',
      image,
      volumes: { '/data': vol },
      secrets: [secret],
      timeout: 60,
      gpu: 'a100',
    })

    const manifest = app.toManifest()
    expect(manifest.functions).toHaveLength(1)

    const fn = manifest.functions[0]
    expect(fn.name).toBe('handler')
    expect(fn.timeout).toBe(60)
    expect(fn.gpu).toBe('a100')
    expect(fn.image).toEqual({
      base: 'debian:slim',
      pipPackages: ['requests'],
      aptPackages: ['curl'],
    })
    expect(fn.volumes).toEqual({
      '/data': { name: 'data', persistent: true, sizeGb: 20, type: 'block-storage', createIfMissing: true },
    })
    expect(fn.secrets).toEqual([{ name: 'api-key', createIfMissing: true }])
  })

  it('registers a web endpoint', () => {
    const app = new BoxtyApp('demo')
    app.webEndpoint({
      name: 'serve',
      handler: () => {},
      port: 8080,
      timeout: 120,
      public: false,
    })

    const manifest = app.toManifest()
    expect(manifest.endpoints).toHaveLength(1)

    const ep = manifest.endpoints[0]
    expect(ep.name).toBe('serve')
    expect(ep.port).toBe(8080)
    expect(ep.timeout).toBe(120)
    expect(ep.public).toBe(false)
  })

  it('creates app-level volumes and secrets', () => {
    const app = new BoxtyApp('demo')
    app.volume('cache', 50, 'ssd', false)
    app.secret('token', false)

    const manifest = app.toManifest()
    expect(manifest.volumes).toEqual([
      { name: 'cache', persistent: true, sizeGb: 50, type: 'ssd', createIfMissing: false },
    ])
    expect(manifest.secrets).toEqual([{ name: 'token', createIfMissing: false }])
  })

  it('exports manifest JSON', () => {
    const app = new BoxtyApp('demo')
    app.function({ name: 'fn', handler: () => 'ok' })

    const json = app.toManifestJson()
    expect(JSON.parse(json).name).toBe('demo')
    expect(JSON.parse(json).functions).toHaveLength(1)
  })
})

describe('Volume', () => {
  it('manifests defaults', () => {
    const vol = Volume.fromName('data')
    expect(vol.toManifest()).toEqual({
      name: 'data',
      persistent: true,
      sizeGb: 10,
      type: 'block-storage',
      createIfMissing: true,
    })
  })
})

describe('Mount', () => {
  it('manifests include/exclude only when present', () => {
    const mount = Mount.fromLocalDir('./src', { include: ['*.ts'] })
    expect(mount.toManifest()).toEqual({
      localDir: './src',
      remotePath: '/workspace',
      include: ['*.ts'],
    })
  })
})

describe('Image', () => {
  it('builds a manifest from fluent API', () => {
    const image = Image.debianSlim()
      .pipInstall('fastapi', 'uvicorn')
      .runCommand('echo hi')
      .env({ APP: '1' })
      .pythonVersion('3.12')

    expect(image.toManifest()).toEqual({
      base: 'debian:slim',
      pipPackages: ['fastapi', 'uvicorn'],
      runCommands: ['echo hi'],
      env: { APP: '1' },
      pythonVersion: '3.12',
    })
  })
})
