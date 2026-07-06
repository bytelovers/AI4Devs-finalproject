import '@testing-library/jest-dom';

// Mock ImageData for Node environment tests
if (typeof globalThis.ImageData === 'undefined') {
  class ImageDataMock {
    width: number;
    height: number;
    data: Uint8ClampedArray;
    constructor(width: number, height: number) {
      this.width = width;
      this.height = height;
      this.data = new Uint8ClampedArray(width * height * 4);
    }
  }
  globalThis.ImageData = ImageDataMock as any;
}
