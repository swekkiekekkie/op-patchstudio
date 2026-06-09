import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

afterEach(() => {
  cleanup()
})

// Mock AudioBuffer class
class MockAudioBuffer {
  numberOfChannels: number;
  length: number;
  sampleRate: number;
  duration: number;
  private channelData: Float32Array[];

  constructor(numberOfChannels: number, length: number, sampleRate: number) {
    this.numberOfChannels = numberOfChannels;
    this.length = length;
    this.sampleRate = sampleRate;
    this.duration = length / sampleRate;
    this.channelData = [];
    
    // Create Float32Array for each channel
    for (let i = 0; i < numberOfChannels; i++) {
      this.channelData[i] = new Float32Array(length);
    }
  }

  getChannelData(channel: number): Float32Array {
    return this.channelData[channel];
  }

  copyFromChannel(destination: Float32Array, channelNumber: number, startInChannel: number = 0): void {
    const source = this.channelData[channelNumber];
    const length = Math.min(destination.length, source.length - startInChannel);
    for (let i = 0; i < length; i++) {
      destination[i] = source[startInChannel + i];
    }
  }

  copyToChannel(source: Float32Array, channelNumber: number, startInChannel: number = 0): void {
    const destination = this.channelData[channelNumber];
    const length = Math.min(source.length, destination.length - startInChannel);
    for (let i = 0; i < length; i++) {
      destination[startInChannel + i] = source[i];
    }
  }
}

// Mock Audio APIs that aren't available in jsdom
global.AudioContext = vi.fn().mockImplementation(() => ({
  createBufferSource: vi.fn(() => ({
    buffer: null,
    connect: vi.fn(() => ({ connect: vi.fn() })),
    start: vi.fn(),
    stop: vi.fn(),
    playbackRate: { value: 1 }
  })),
  createBuffer: vi.fn((numberOfChannels: number, length: number, sampleRate: number) => {
    return new MockAudioBuffer(numberOfChannels, length, sampleRate);
  }),
  createGain: vi.fn(() => ({
    gain: { value: 1 },
    connect: vi.fn(() => ({ connect: vi.fn() }))
  })),
  createStereoPanner: vi.fn(() => ({
    pan: { value: 0 },
    connect: vi.fn(() => ({ connect: vi.fn() }))
  })),
  destination: {},
  sampleRate: 44100,
  state: 'running',
  resume: vi.fn(() => Promise.resolve()),
  suspend: vi.fn(() => Promise.resolve()),
  close: vi.fn(() => Promise.resolve()),
  decodeAudioData: vi.fn(() => Promise.resolve(new MockAudioBuffer(1, 1000, 44100)))
}))

// Make AudioBuffer available globally
global.AudioBuffer = MockAudioBuffer as unknown as typeof AudioBuffer;

// Mock MediaRecorder
class MediaRecorderMock {
  static isTypeSupported = vi.fn(() => true)
  start = vi.fn()
  stop = vi.fn()
  pause = vi.fn()
  resume = vi.fn()
  state = 'inactive'
  ondataavailable = null
  onstop = null
  onerror = null
}

global.MediaRecorder = MediaRecorderMock as unknown as typeof MediaRecorder

// Mock WebMIDI API
type MockMidiPort = ReturnType<typeof createMockMidiPort>

const createMockMidiPort = (id: string, name: string, type: 'input' | 'output', manufacturer: string = 'Test Manufacturer') => ({
  id,
  name,
  manufacturer,
  type,
  connection: 'open' as const,
  state: 'connected' as const,
  onmidimessage: null,
  onstatechange: null,
  send: vi.fn(),
  open: vi.fn(() => Promise.resolve()),
  close: vi.fn(() => Promise.resolve())
})

const createMockMidiAccess = (inputs: MockMidiPort[] = [], outputs: MockMidiPort[] = []) => ({
  inputs: new Map(inputs.map(input => [input.id, input])),
  outputs: new Map(outputs.map(output => [output.id, output])),
  onstatechange: null,
  sysexEnabled: false
})

// Mock navigator.requestMIDIAccess
Object.defineProperty(navigator, 'requestMIDIAccess', {
  writable: true,
  value: vi.fn()
})

// Mock navigator.mediaDevices
Object.defineProperty(navigator, 'mediaDevices', {
  writable: true,
  value: {
    getUserMedia: vi.fn(() => Promise.resolve({
      getTracks: () => []
    }))
  }
})

// JSZip mock removed to allow real implementation for testing

// Mock File API methods
global.URL.createObjectURL = vi.fn(() => 'mock-url')
global.URL.revokeObjectURL = vi.fn()

// Mock localStorage and sessionStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn()
}
global.localStorage = localStorageMock as unknown as Storage
global.sessionStorage = localStorageMock as unknown as Storage

// Patch AudioParam and GainNode to support setValueCurveAtTime for ADSR tests
class MockAudioParam {
  value = 1;
  setValueCurveAtTime = vi.fn();
  setValueAtTime = vi.fn();
  linearRampToValueAtTime = vi.fn();
}
global.AudioParam = MockAudioParam as unknown as typeof AudioParam;
// Patch createGain to return a gain node with a writable gain property
const origCreateGain = global.AudioContext.prototype?.createGain;
if (origCreateGain) {
  global.AudioContext.prototype.createGain = function () {
    const gainNode = origCreateGain.call(this);
    // Overwrite gain with a writable property
    Object.defineProperty(gainNode, 'gain', {
      value: new MockAudioParam(),
      writable: true,
      configurable: true,
      enumerable: true
    });
    return gainNode;
  };
}
// Patch canvas context for setLineDash and basic 2D methods
try {
  const origGetContext = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (...args) {
    if (args[0] === '2d') {
      // Return a persistent mock object for each canvas
      const ctx = {
        setLineDash: vi.fn(),
        beginPath: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        stroke: vi.fn(),
        arc: vi.fn(),
        fill: vi.fn(),
        clearRect: vi.fn(),
        fillRect: vi.fn(),
        strokeRect: vi.fn(),
        drawImage: vi.fn(),
        save: vi.fn(),
        restore: vi.fn(),
        translate: vi.fn(),
        scale: vi.fn(),
        rotate: vi.fn(),
        // Add any other needed 2d context methods here
      };
      return ctx as unknown as CanvasRenderingContext2D;
    }
    return origGetContext ? origGetContext.apply(this, args) : null;
  };
} catch {
  // If we can't mock, ignore and let tests skip or fail gracefully
}

// Export mock utilities for tests
export { createMockMidiPort, createMockMidiAccess }
