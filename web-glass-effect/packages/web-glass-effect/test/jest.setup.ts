import '@testing-library/jest-dom';

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

class MutationObserverMock {
  observe() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}

Object.defineProperty(globalThis, 'ResizeObserver', {
  configurable: true,
  writable: true,
  value: ResizeObserverMock,
});

Object.defineProperty(globalThis, 'MutationObserver', {
  configurable: true,
  writable: true,
  value: MutationObserverMock,
});

if (!('ImageData' in globalThis)) {
  class ImageDataPolyfill {
    data: Uint8ClampedArray;
    width: number;
    height: number;
    colorSpace = 'srgb';

    constructor(width: number, height: number) {
      this.width = width;
      this.height = height;
      this.data = new Uint8ClampedArray(width * height * 4);
    }
  }

  Object.defineProperty(globalThis, 'ImageData', {
    configurable: true,
    writable: true,
    value: ImageDataPolyfill,
  });
}

Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  configurable: true,
  writable: true,
  value: jest.fn(() => ({
    putImageData: jest.fn(),
  })),
});

Object.defineProperty(HTMLCanvasElement.prototype, 'toDataURL', {
  configurable: true,
  writable: true,
  value: jest.fn(() => 'data:image/png;base64,AAAA'),
});
