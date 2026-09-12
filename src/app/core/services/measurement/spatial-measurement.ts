import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';

export interface SpatialPoint {
  x: number;
  y: number;
  z: number;
}

export interface SpatialMeasurementCallbacks {
  onCameraStatus: (status: CameraStatus) => void;
  onTrackingStatus: (status: TrackingStatus) => void;
}

export type CameraStatus = 'requesting' | 'ready' | 'failed';
export type TrackingStatus = 'initializing' | 'limited' | 'normal';

interface XrHitTestResult {
  type: 'FEATURE_POINT' | 'ESTIMATED_SURFACE' | 'DETECTED_SURFACE' | 'UNSPECIFIED';
  position: SpatialPoint;
  distance: number;
}

interface XrPipelineModule {
  name: string;
  onCameraStatusChange?: (event: { status: string }) => void;
  onUpdate?: (event: {
    processCpuResult?: {
      reality?: {
        trackingStatus?: string;
        trackingReason?: string;
      };
    };
  }) => void;
}

interface XrEngine {
  GlTextureRenderer: {
    pipelineModule: () => XrPipelineModule;
  };
  XrConfig: {
    camera: () => { BACK: string };
    device: () => { MOBILE: string };
  };
  XrController: {
    configure: (options: {
      disableWorldTracking: boolean;
      enableWorldPoints: boolean;
      scale: 'absolute';
    }) => void;
    pipelineModule: () => XrPipelineModule;
    hitTest: (x: number, y: number, includedTypes?: string[]) => XrHitTestResult[];
  };
  XrDevice: {
    isDeviceBrowserCompatible: (options: { allowedDevices: string }) => boolean;
  };
  addCameraPipelineModules: (modules: XrPipelineModule[]) => void;
  clearCameraPipelineModules: () => void;
  run: (options: {
    canvas: HTMLCanvasElement;
    allowedDevices: string;
    cameraConfig: { direction: string };
    glContextConfig: WebGLContextAttributes;
  }) => void;
  stop: () => void;
}

type XrWindow = Window & typeof globalThis & { XR8?: XrEngine };

const ENGINE_SCRIPT_ID = 'muvia-spatial-measurement-engine';
const ENGINE_SCRIPT_PATH = 'external/xr/xr.js';
const ENGINE_LOAD_TIMEOUT_MS = 30000;
const TRACKING_MODULE_NAME = 'muvia-spatial-tracking';

@Injectable({ providedIn: 'root' })
export class SpatialMeasurementService {
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);

  private enginePromise?: Promise<XrEngine>;
  private engine?: XrEngine;
  private isRunning = false;
  private resizeObserver?: ResizeObserver;

  private prepare(): Promise<XrEngine> {
    if (!isPlatformBrowser(this.platformId)) {
      return Promise.reject(new Error('La medición con cámara solo está disponible en el navegador.'));
    }

    this.enginePromise ??= this.loadEngine().catch((error: unknown) => {
      this.enginePromise = undefined;
      throw error;
    });
    return this.enginePromise;
  }

  async start(
    canvas: HTMLCanvasElement,
    callbacks: SpatialMeasurementCallbacks,
  ): Promise<void> {
    if (!this.document.defaultView?.isSecureContext) {
      throw new Error('La cámara necesita una conexión HTTPS segura.');
    }

    const engine = await this.prepare();
    const mobileDevice = engine.XrConfig.device().MOBILE;
    if (!engine.XrDevice.isDeviceBrowserCompatible({ allowedDevices: mobileDevice })) {
      throw new Error('Este dispositivo no admite la medición espacial con cámara.');
    }

    this.stop();
    this.configureCanvas(canvas);
    this.observeCanvas(canvas);

    engine.XrController.configure({
      disableWorldTracking: false,
      enableWorldPoints: false,
      scale: 'absolute',
    });

    const statusModule: XrPipelineModule = {
      name: TRACKING_MODULE_NAME,
      onCameraStatusChange: ({ status }) => {
        if (status === 'requesting') callbacks.onCameraStatus('requesting');
        if (status === 'hasVideo') callbacks.onCameraStatus('ready');
        if (status === 'failed') callbacks.onCameraStatus('failed');
      },
      onUpdate: ({ processCpuResult }) => {
        const trackingStatus = processCpuResult?.reality?.trackingStatus;
        const trackingReason = processCpuResult?.reality?.trackingReason;

        if (trackingReason === 'INITIALIZING') {
          callbacks.onTrackingStatus('initializing');
        } else if (trackingStatus === 'NORMAL') {
          callbacks.onTrackingStatus('normal');
        } else if (trackingStatus === 'LIMITED') {
          callbacks.onTrackingStatus('limited');
        }
      },
    };

    this.engine = engine;
    try {
      engine.addCameraPipelineModules([
        engine.GlTextureRenderer.pipelineModule(),
        engine.XrController.pipelineModule(),
        statusModule,
      ]);

      engine.run({
        canvas,
        allowedDevices: mobileDevice,
        cameraConfig: { direction: engine.XrConfig.camera().BACK },
        glContextConfig: {
          alpha: false,
          antialias: false,
          preserveDrawingBuffer: false,
        },
      });

      this.isRunning = true;
    } catch (error: unknown) {
      this.stop();
      throw error;
    }
  }

  captureCenterPoint(): SpatialPoint | null {
    if (!this.engine || !this.isRunning) return null;

    const hitResults = this.engine.XrController.hitTest(0.5, 0.5, ['FEATURE_POINT']);
    const preferredResult = hitResults.find(({ type }) => type === 'DETECTED_SURFACE')
      ?? hitResults.find(({ type }) => type === 'ESTIMATED_SURFACE')
      ?? hitResults.find(({ type }) => type === 'FEATURE_POINT');

    return preferredResult?.position ?? null;
  }

  distanceInCentimeters(start: SpatialPoint, end: SpatialPoint): number {
    const x = end.x - start.x;
    const y = end.y - start.y;
    const z = end.z - start.z;
    return Math.sqrt((x * x) + (y * y) + (z * z)) * 100;
  }

  stop(): void {
    this.resizeObserver?.disconnect();
    this.resizeObserver = undefined;
    if (!this.engine) return;

    if (this.isRunning) this.engine.stop();
    this.engine.clearCameraPipelineModules();
    this.isRunning = false;
  }

  private loadEngine(): Promise<XrEngine> {
    const windowRef = this.document.defaultView as XrWindow | null;
    if (!windowRef) {
      return Promise.reject(new Error('No se pudo acceder al navegador.'));
    }

    if (windowRef.XR8) return Promise.resolve(windowRef.XR8);

    return new Promise<XrEngine>((resolve, reject) => {
      const script = this.document.getElementById(ENGINE_SCRIPT_ID) as HTMLScriptElement | null
        ?? this.document.createElement('script');

      const timeoutId = windowRef.setTimeout(() => {
        cleanup();
        reject(new Error('El motor de medición tardó demasiado en cargar.'));
      }, ENGINE_LOAD_TIMEOUT_MS);

      const onLoaded = () => {
        if (!windowRef.XR8) return;
        cleanup();
        resolve(windowRef.XR8);
      };

      const onError = () => {
        cleanup();
        reject(new Error('No se pudo cargar el motor de medición.'));
      };

      const cleanup = () => {
        windowRef.clearTimeout(timeoutId);
        windowRef.removeEventListener('xrloaded', onLoaded);
        script.removeEventListener('load', onLoaded);
        script.removeEventListener('error', onError);
      };

      windowRef.addEventListener('xrloaded', onLoaded);
      script.addEventListener('load', onLoaded);
      script.addEventListener('error', onError);

      if (!script.id) {
        script.id = ENGINE_SCRIPT_ID;
        script.src = new URL(ENGINE_SCRIPT_PATH, this.document.baseURI).toString();
        script.async = true;
        script.crossOrigin = 'anonymous';
        script.dataset['preloadChunks'] = 'slam';
        this.document.head.appendChild(script);
      }
    });
  }

  private configureCanvas(canvas: HTMLCanvasElement): void {
    const bounds = canvas.getBoundingClientRect();
    const pixelRatio = Math.min(this.document.defaultView?.devicePixelRatio ?? 1, 2);
    const width = Math.max(1, Math.round(bounds.width * pixelRatio));
    const height = Math.max(1, Math.round(bounds.height * pixelRatio));

    if (canvas.width !== width) canvas.width = width;
    if (canvas.height !== height) canvas.height = height;
  }

  private observeCanvas(canvas: HTMLCanvasElement): void {
    const ResizeObserverClass = this.document.defaultView?.ResizeObserver;
    if (!ResizeObserverClass) return;

    this.resizeObserver = new ResizeObserverClass(() => this.configureCanvas(canvas));
    this.resizeObserver.observe(canvas);
  }
}
