import AppKit

// Generates the 1024×1024 app icon (brand-blue background + white shelter glyph).
// Run with the macOS Swift toolchain — placeholder art; replace before submission.
//   swift ios/CoreTests/make-icon.swift <output.png>

let size = 1024
let outPath = CommandLine.arguments.count > 1
    ? CommandLine.arguments[1]
    : "ios/AsylumAid/Resources/Assets.xcassets/AppIcon.appiconset/icon-1024.png"

let blue = NSColor(srgbRed: 0x1d/255.0, green: 0x5f/255.0, blue: 0xa6/255.0, alpha: 1)

guard let rep = NSBitmapImageRep(
    bitmapDataPlanes: nil, pixelsWide: size, pixelsHigh: size,
    bitsPerSample: 8, samplesPerPixel: 4, hasAlpha: true, isPlanar: false,
    colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0) else {
    fatalError("could not create bitmap")
}

NSGraphicsContext.saveGraphicsState()
NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: rep)
let ctx = NSGraphicsContext.current!.cgContext

// Background
ctx.setFillColor(blue.cgColor)
ctx.fill(CGRect(x: 0, y: 0, width: size, height: size))

// White house body (origin is bottom-left)
ctx.setFillColor(NSColor.white.cgColor)
ctx.fill(CGRect(x: 322, y: 250, width: 380, height: 320))

// White roof triangle
ctx.beginPath()
ctx.move(to: CGPoint(x: 280, y: 545))
ctx.addLine(to: CGPoint(x: 512, y: 800))
ctx.addLine(to: CGPoint(x: 744, y: 545))
ctx.closePath()
ctx.fillPath()

// Blue doorway cut out of the body
ctx.setFillColor(blue.cgColor)
ctx.fill(CGRect(x: 462, y: 250, width: 100, height: 165))

NSGraphicsContext.restoreGraphicsState()

guard let data = rep.representation(using: .png, properties: [:]) else {
    fatalError("could not encode PNG")
}
try! data.write(to: URL(fileURLWithPath: outPath))
print("wrote \(outPath)")
