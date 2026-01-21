declare function Application(name: string): Application;
declare function Application(name: "currentApplication"): CurrentApplication;

interface Application {
  includeStandardAdditions: boolean;
}

interface CurrentApplication extends Application {
  doShellScript(script: string): string;
}

declare namespace Application {
  function currentApplication(): CurrentApplication;
}

// ObjC bridge for JXA
declare const ObjC: {
  import(framework: string): void;
};

// Cocoa framework bridge object
// In JXA, $ is both a function (returns nil) and an object with framework classes
interface ObjCBridge {
  (): null;

  // NSBitmapImageRep
  NSBitmapImageRep: {
    alloc: {
      initWithBitmapDataPlanesPixelsWidePixelsHighBitsPerSampleSamplesPerPixelHasAlphaIsPlanarColorSpaceNameBytesPerRowBitsPerPixel(
        planes: null,
        pixelsWide: number,
        pixelsHigh: number,
        bitsPerSample: number,
        samplesPerPixel: number,
        hasAlpha: boolean,
        isPlanar: boolean,
        colorSpaceName: NSColorSpace,
        bytesPerRow: number,
        bitsPerPixel: number,
      ): NSBitmapImageRep;
    };
  };

  // NSGraphicsContext
  NSGraphicsContext: {
    graphicsContextWithBitmapImageRep(
      bitmap: NSBitmapImageRep,
    ): NSGraphicsContext;
    setCurrentContext(ctx: NSGraphicsContext): void;
  };

  // NSColor
  NSColor: {
    colorWithCalibratedRedGreenBlueAlpha(
      r: number,
      g: number,
      b: number,
      a: number,
    ): NSColor;
  };

  // NSFileManager
  NSFileManager: {
    defaultManager: NSFileManager;
  };

  // Color space constants
  NSCalibratedRGBColorSpace: NSColorSpace;

  // PNG export type
  NSBitmapImageFileTypePNG: NSBitmapImageFileType;

  // Geometry helpers
  NSMakeRect(x: number, y: number, width: number, height: number): NSRect;
  NSRectFill(rect: NSRect): void;
}

declare const $: ObjCBridge;

// Opaque types for type safety
declare interface NSBitmapImageRep {
  representationUsingTypeProperties(
    type: NSBitmapImageFileType,
    properties: null,
  ): NSData;
}

declare interface NSGraphicsContext {
  flushGraphics: void;
}

declare interface NSColor {
  setFill: void;
}

declare interface NSFileManager {
  fileExistsAtPath(path: string): boolean;
}

declare interface NSData {
  writeToFileAtomically(path: string, atomically: boolean): boolean;
}

declare interface NSRect {}
declare interface NSColorSpace {}
declare interface NSBitmapImageFileType {}
