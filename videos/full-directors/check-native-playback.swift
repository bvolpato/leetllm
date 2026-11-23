import AVFoundation
import CoreVideo
import CryptoKit
import Foundation

let usage = "Usage: xcrun swift videos/full-directors/check-native-playback.swift <movie.mp4> --frames <total-frames>"
let arguments = Array(CommandLine.arguments.dropFirst())
if arguments == ["--help"] {
    print(usage)
    exit(0)
}

let sampleRate = 48_000
let samplesPerPicture = sampleRate / 30
let aacFrameSamples = 1_024
guard arguments.count == 3, arguments[1] == "--frames",
      let expectedFrames = Int(arguments[2]), expectedFrames > 0,
      expectedFrames <= Int.max / samplesPerPicture else {
    FileHandle.standardError.write(Data((usage + "\n").utf8))
    exit(2)
}
let url = URL(fileURLWithPath: arguments[0]).standardizedFileURL
let expectedAudioFrames = expectedFrames * samplesPerPicture

func statusName(_ status: AVAssetReader.Status) -> String {
    switch status {
    case .unknown: return "unknown"
    case .reading: return "reading"
    case .completed: return "completed"
    case .failed: return "failed"
    case .cancelled: return "cancelled"
    @unknown default: return "status-\(status.rawValue)"
    }
}

func failure(_ message: String) -> NSError {
    NSError(domain: "NativeMoviePlayback", code: 1, userInfo: [NSLocalizedDescriptionKey: message])
}

struct TrackResult: Encodable {
    var status = "notStarted"
    var samples = 0
    var sampleRate: Double?
    var channels: UInt32?
    var error: String?
}

func decode(_ asset: AVURLAsset, _ kind: AVMediaType) async -> TrackResult {
    var result = TrackResult()
    var reader: AVAssetReader?
    do {
        let tracks = try await asset.loadTracks(withMediaType: kind)
        guard tracks.count == 1 else { throw failure("Expected one \(kind.rawValue) track, found \(tracks.count)") }
        let active = try AVAssetReader(asset: asset)
        reader = active
        let settings: [String: Any] = kind == .video
            ? [kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_420YpCbCr8BiPlanarVideoRange]
            : [AVFormatIDKey: kAudioFormatLinearPCM]
        let output = AVAssetReaderTrackOutput(track: tracks[0], outputSettings: settings)
        output.alwaysCopiesSampleData = false
        guard active.canAdd(output) else { throw failure("Cannot add \(kind.rawValue) output") }
        active.add(output)
        guard active.startReading() else { throw active.error ?? failure("Cannot start \(kind.rawValue) reader") }
        while try autoreleasepool(invoking: {
            guard let buffer = output.copyNextSampleBuffer() else { return false }
            let count = CMSampleBufferGetNumSamples(buffer)
            // AVFoundation can return a marker after the final sample.
            if count == 0 { return true }
            if kind == .video {
                guard count == 1, CMSampleBufferGetImageBuffer(buffer) != nil else {
                    throw failure("Missing decoded picture")
                }
            } else {
                guard let format = CMSampleBufferGetFormatDescription(buffer),
                      let pcm = CMAudioFormatDescriptionGetStreamBasicDescription(format)?.pointee,
                      pcm.mFormatID == kAudioFormatLinearPCM, CMSampleBufferGetTotalSampleSize(buffer) > 0 else {
                    throw failure("Missing decoded PCM audio")
                }
                result.sampleRate = pcm.mSampleRate
                result.channels = pcm.mChannelsPerFrame
                guard pcm.mSampleRate == Double(sampleRate), pcm.mChannelsPerFrame == 2 else {
                    throw failure("Expected 48 kHz stereo PCM, decoded \(pcm.mSampleRate) Hz with \(pcm.mChannelsPerFrame) channel(s)")
                }
            }
            result.samples += count
            return true
        }) {}
        guard active.status == .completed else {
            throw active.error ?? failure("Reader ended with \(statusName(active.status))")
        }
    } catch {
        result.error = String(describing: error as NSError)
        if reader?.status == .reading { reader?.cancelReading() }
    }
    if let reader { result.status = statusName(reader.status) }
    return result
}

func fileStamp(_ url: URL) throws -> stat {
    var stamp = stat()
    guard stat(url.path, &stamp) == 0 else { throw NSError(domain: NSPOSIXErrorDomain, code: Int(errno)) }
    guard stamp.st_mode & S_IFMT == S_IFREG else { throw failure("Expected a regular file") }
    return stamp
}

func matches(_ left: stat, _ right: stat) -> Bool {
    left.st_dev == right.st_dev && left.st_ino == right.st_ino && left.st_size == right.st_size &&
        left.st_ctimespec.tv_sec == right.st_ctimespec.tv_sec && left.st_ctimespec.tv_nsec == right.st_ctimespec.tv_nsec
}

func sha256(_ url: URL) throws -> String {
    let file = try FileHandle(forReadingFrom: url)
    defer { try? file.close() }
    var digest = SHA256()
    while let chunk = try file.read(upToCount: 1 << 20), !chunk.isEmpty {
        digest.update(data: chunk)
    }
    return digest.finalize().map { String(format: "%02x", $0) }.joined()
}

struct Report: Encodable {
    let file: String
    let expectedFrames: Int
    let expectedAudioFrames: Int
    var sha256: String?
    var picture = TrackResult()
    var audio = TrackResult()
    var errors: [String] = []
    var passed = false
}

alarm(3600)
var report = Report(file: url.path, expectedFrames: expectedFrames, expectedAudioFrames: expectedAudioFrames)
do {
    let stamp = try fileStamp(url)
    let hash = try sha256(url)
    let asset = AVURLAsset(url: url, options: [
        AVURLAssetReferenceRestrictionsKey: AVAssetReferenceRestrictions.forbidAll.rawValue
    ])
    report.picture = await decode(asset, .video)
    report.audio = await decode(asset, .audio)
    guard matches(stamp, try fileStamp(url)) else { throw failure("File changed during the check") }
    report.sha256 = hash
    if report.picture.status == "completed", report.picture.samples != expectedFrames {
        report.errors.append("Decoded \(report.picture.samples) pictures. Expected \(expectedFrames).")
    }
    if report.audio.status == "completed", abs(report.audio.samples - expectedAudioFrames) > aacFrameSamples {
        report.errors.append("Decoded \(report.audio.samples) PCM frames. Expected \(expectedAudioFrames) within \(aacFrameSamples).")
    }
    report.passed = report.errors.isEmpty && report.picture.error == nil && report.audio.error == nil &&
        report.picture.status == "completed" && report.audio.status == "completed"
} catch {
    report.errors.append(String(describing: error as NSError))
}
let encoder = JSONEncoder()
encoder.outputFormatting = [.sortedKeys, .withoutEscapingSlashes]
print(String(decoding: try encoder.encode(report), as: UTF8.self))
exit(report.passed ? 0 : 1)
