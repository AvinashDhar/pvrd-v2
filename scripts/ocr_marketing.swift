import AppKit
import Foundation
import Vision

let directory = CommandLine.arguments[1]
let files = try FileManager.default.contentsOfDirectory(atPath: directory)
    .filter { $0.lowercased().hasSuffix(".jpeg") || $0.lowercased().hasSuffix(".jpg") }
    .sorted()

for file in files {
    let path = (directory as NSString).appendingPathComponent(file)
    guard let image = NSImage(contentsOfFile: path),
          let tiff = image.tiffRepresentation,
          let rep = NSBitmapImageRep(data: tiff),
          let cg = rep.cgImage else {
        print(file + "\t")
        continue
    }
    let request = VNRecognizeTextRequest()
    request.recognitionLevel = .fast
    let handler = VNImageRequestHandler(cgImage: cg, options: [:])
    try? handler.perform([request])
    let lines = (request.results ?? []).compactMap { $0.topCandidates(1).first?.string }
    print(file + "\t" + lines.joined(separator: " | "))
}
