import { describe, expect, it, vi } from 'vitest'
import { copyElementImageToTextureSafe } from '../src/renderer/dom-content-sync'

describe('copyElementImageToTextureSafe', () => {
  it('calls queue.copyElementImageToTexture with exactly two arguments in dictionary form', () => {
    const queue = {
      copyElementImageToTexture: vi.fn(),
    } as unknown as GPUQueue
    const element = document.createElement('div')
    const texture = {} as GPUTexture

    const result = copyElementImageToTextureSafe(queue, element, 100, 200, texture)

    expect(result).toBe('copied')
    expect(queue.copyElementImageToTexture).toHaveBeenCalledTimes(1)
    
    const args = vi.mocked(queue.copyElementImageToTexture).mock.calls[0]
    expect(args).toHaveLength(2)

    expect(args[0]).toEqual({ source: element })
    expect(args[1]).toEqual({
      destination: { texture },
      width: 100,
      height: 200,
    })
  })

  it('returns retry for InvalidStateError without emitting unsupported error', () => {
    const queue = {
      copyElementImageToTexture: vi.fn().mockImplementation(() => {
        throw new DOMException('Invalid state', 'InvalidStateError')
      }),
    } as unknown as GPUQueue
    const element = document.createElement('div')
    const texture = {} as GPUTexture

    const dispatchEventSpy = vi.spyOn(window, 'dispatchEvent')

    const result = copyElementImageToTextureSafe(queue, element, 100, 200, texture)

    expect(result).toBe('retry')
    expect(dispatchEventSpy).not.toHaveBeenCalledWith(expect.objectContaining({ type: 'liquid-dom-unsupported-error' }))
  })

  it('returns failed for TypeError and emits unsupported error once', () => {
    const queue = {
      copyElementImageToTexture: vi.fn().mockImplementation(() => {
        throw new TypeError('Failed to execute copyElementImageToTexture on GPUQueue')
      }),
    } as unknown as GPUQueue
    const element = document.createElement('div')
    const texture = {} as GPUTexture

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const dispatchEventSpy = vi.spyOn(window, 'dispatchEvent')

    const result = copyElementImageToTextureSafe(queue, element, 100, 200, texture)

    expect(result).toBe('failed')
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
    
    // Check that event was dispatched
    expect(dispatchEventSpy).toHaveBeenCalledTimes(1)
    expect(dispatchEventSpy.mock.calls[0][0].type).toBe('liquid-dom-unsupported-error')

    consoleErrorSpy.mockRestore()
  })
})
