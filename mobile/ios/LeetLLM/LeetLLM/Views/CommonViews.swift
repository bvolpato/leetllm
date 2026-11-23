import ImageIO
import QuickLook
import SwiftUI
import UIKit
import WebKit

struct ContentTitle: View {
    let title: String
    @Environment(\.horizontalSizeClass) private var horizontalSizeClass

    init(_ title: String) {
        self.title = title
    }

    var body: some View {
        Text(title)
            .font(horizontalSizeClass == .regular ? .title.bold() : .title2.bold())
            .fixedSize(horizontal: false, vertical: true)
            .accessibilityAddTraits(.isHeader)
    }
}

struct StatusPill: View {
    let text: String
    let systemImage: String?
    let tint: Color

    init(_ text: String, systemImage: String? = nil, tint: Color = .indigo) {
        self.text = text
        self.systemImage = systemImage
        self.tint = tint
    }

    var body: some View {
        HStack(spacing: 5) {
            if let systemImage {
                Image(systemName: systemImage)
                    .font(.caption2.weight(.semibold))
            }
            Text(text)
                .font(.caption.weight(.semibold))
                .foregroundStyle(tint == .white ? Color.white : Color.primary)
        }
        .foregroundStyle(tint)
        .padding(.horizontal, 9)
        .padding(.vertical, 5)
        .background(tint.opacity(0.12), in: Capsule())
    }
}

struct EmptyStateView: View {
    let title: String
    let message: String
    let systemImage: String

    var body: some View {
        ContentUnavailableView(title, systemImage: systemImage, description: Text(message))
    }
}

struct ThemedBundleImage: View {
    let image: CoverImageProviding
    @Environment(\.colorScheme) private var colorScheme
    @ObservedObject private var readerSettings = ReaderSettings.shared

    var body: some View {
        if let path = selectedPath {
            BundleImage(path: path, alt: nil)
        }
    }

    private var isEffectiveDarkMode: Bool {
        if readerSettings.readerColorScheme == "light" { return false }
        if readerSettings.readerColorScheme == "dark" { return true }
        return colorScheme == .dark
    }

    private var selectedPath: String? {
        if isEffectiveDarkMode {
            return image.coverImageDark ?? image.coverImage ?? image.coverImageLight
        }
        return image.coverImageLight ?? image.coverImage ?? image.coverImageDark
    }
}

@MainActor
private final class BundledImageLoader {
    static let shared = BundledImageLoader()

    private let cache = NSCache<NSString, UIImage>()
    private var inFlight: [String: Task<UIImage?, Never>] = [:]

    private init() {
        cache.countLimit = 48
        cache.totalCostLimit = 96 * 1_024 * 1_024
    }

    func image(for path: String) async -> UIImage? {
        let cleanPath = path.components(separatedBy: "?").first ?? path
        let cacheKey = cleanPath as NSString
        if let image = cache.object(forKey: cacheKey) {
            return image
        }
        if let existing = inFlight[cleanPath] {
            return await existing.value
        }
        guard let url = Bundle.main.resourceURL?
            .appendingPathComponent("data", isDirectory: true)
            .appendingPathComponent(cleanPath) else {
            return nil
        }

        let task = Task.detached(priority: .userInitiated) { () -> UIImage? in
            autoreleasepool {
                let sourceOptions = [kCGImageSourceShouldCache: false] as CFDictionary
                guard let source = CGImageSourceCreateWithURL(url as CFURL, sourceOptions) else {
                    return nil
                }
                let options: [CFString: Any] = [
                    kCGImageSourceCreateThumbnailFromImageAlways: true,
                    kCGImageSourceCreateThumbnailWithTransform: true,
                    kCGImageSourceShouldCacheImmediately: true,
                    kCGImageSourceThumbnailMaxPixelSize: 2_560,
                ]
                guard let image = CGImageSourceCreateThumbnailAtIndex(source, 0, options as CFDictionary) else {
                    return nil
                }
                return UIImage(cgImage: image)
            }
        }
        inFlight[cleanPath] = task
        let image = await task.value
        inFlight[cleanPath] = nil
        if let image {
            let bytes = image.cgImage.map { $0.bytesPerRow * $0.height } ?? 1
            cache.setObject(image, forKey: cacheKey, cost: bytes)
        }
        return image
    }
}

struct BundleImageKey: Equatable {
    let path: String
    let privateContentVersion: Int?

    init(path: String, privateContentVersion: Int? = nil) {
        self.path = path
        self.privateContentVersion = privateContentVersion
    }
}

@MainActor
final class BundleImageLoadState: ObservableObject {
    @Published private(set) var image: UIImage?
    @Published private(set) var failedToLoad = false
    private(set) var loadedKey: BundleImageKey?

    func image(for key: BundleImageKey) -> UIImage? {
        loadedKey == key ? image : nil
    }

    func load(key: BundleImageKey, using loadImage: () async -> UIImage?) async {
        // SwiftUI can restart this task when a lazy view reappears.
        guard !Task.isCancelled, image(for: key) == nil else { return }
        loadedKey = nil
        image = nil
        failedToLoad = false
        let loaded = await loadImage()
        guard !Task.isCancelled else { return }
        loadedKey = key
        if let loaded {
            image = loaded
        } else {
            failedToLoad = true
        }
    }
}

struct BundleImage: View {
    let path: String
    let alt: String?
    @ObservedObject private var dataService = DataService.shared

    @State private var isViewerPresented = false
    @StateObject private var loadState = BundleImageLoadState()

    var body: some View {
        let key = BundleImageKey(
            path: path,
            privateContentVersion: path.hasPrefix("private-blog-images/") ? dataService.privateContentVersion : nil
        )
        Group {
            if let image = loadState.image(for: key) {
                Button {
                    isViewerPresented = true
                } label: {
                    Image(uiImage: image)
                        .resizable()
                        .scaledToFit()
                        .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
                        .overlay {
                            RoundedRectangle(cornerRadius: 10, style: .continuous)
                                .stroke(.quaternary, lineWidth: 1)
                        }
                }
                .buttonStyle(.plain)
                .accessibilityLabel(alt ?? "Illustration")
                .accessibilityHint("Opens a full-screen, zoomable image")
                .fullScreenCover(isPresented: $isViewerPresented) {
                    FullScreenImageViewer(uiImage: image, alt: alt)
                }
            } else {
                RoundedRectangle(cornerRadius: 10, style: .continuous)
                    .fill(.quaternary)
                    .frame(minHeight: 120)
                    .overlay {
                        if loadState.loadedKey == key && loadState.failedToLoad {
                            Label("Image unavailable", systemImage: "photo")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        } else {
                            ProgressView()
                                .accessibilityLabel("Loading illustration")
                        }
                    }
            }
        }
        .task(id: key) {
            await loadState.load(key: key) {
                if path.hasPrefix("private-blog-images/") {
                    return dataService.privateImageData(path: path).flatMap { UIImage(data: $0) }
                }
                return await BundledImageLoader.shared.image(for: path)
            }
        }
    }
}

@MainActor
final class MarkdownBlockCache {
    static let shared = MarkdownBlockCache()

    private final class Entry {
        let blocks: [MarkdownBlock]

        init(_ blocks: [MarkdownBlock]) {
            self.blocks = blocks
        }
    }

    private let cache = NSCache<NSString, Entry>()

    init() {
        cache.countLimit = 48
        cache.totalCostLimit = 8 * 1_024 * 1_024
    }

    func clear() {
        cache.removeAllObjects()
    }

    func blocks(for markdown: String) -> [MarkdownBlock] {
        let key = markdown as NSString
        if let cached = cache.object(forKey: key) {
            return cached.blocks
        }
        let blocks = parseBlocks(markdown)
        cache.setObject(Entry(blocks), forKey: key, cost: markdown.utf8.count)
        return blocks
    }
}

struct MarkdownContentView: View {
    let markdown: String
    let excludePaths: [String]
    let scrollPrefix: String
    let font: Font?
    let foregroundColor: Color?
    @Environment(\.colorScheme) private var colorScheme
    @Environment(\.dynamicTypeSize) private var dynamicTypeSize
    @ObservedObject private var readerSettings = ReaderSettings.shared

    private var isEffectiveDarkMode: Bool {
        if readerSettings.readerColorScheme == "light" { return false }
        if readerSettings.readerColorScheme == "dark" { return true }
        return colorScheme == .dark
    }

    init(markdown: String, excludePaths: [String] = [], scrollPrefix: String = "markdown", font: Font? = nil, foregroundColor: Color? = nil) {
        self.markdown = markdown
        self.excludePaths = excludePaths
        self.scrollPrefix = scrollPrefix
        self.font = font
        self.foregroundColor = foregroundColor
    }

    var body: some View {
        let blocks = MarkdownBlockCache.shared.blocks(for: markdown)
        ForEach(0..<blocks.count, id: \.self) { index in
            blockView(blocks[index])
                .id("\(scrollPrefix)_block_\(index)")
        }
    }

    private func isExcluded(path: String) -> Bool {
        guard !excludePaths.isEmpty else { return false }
        let cleanPath = normalizedImagePath(path)
        return excludePaths.contains { excludePath in
            cleanPath == normalizedImagePath(excludePath)
        }
    }

    private func normalizedImagePath(_ path: String) -> String {
        let cleanPath = path.components(separatedBy: "?").first ?? path
        return cleanPath.replacingOccurrences(
            of: #"_(light|dark)(?=\.[^.]+$)"#,
            with: "",
            options: .regularExpression
        )
    }

    @ViewBuilder
    private func blockView(_ block: MarkdownBlock) -> some View {
        switch block.kind {
        case .heading(let level, let text):
            let scale: CGFloat = level == 1 ? 1.45 : level == 2 ? 1.25 : 1.12
            let fontSize = scaledReaderFontSize(readerSettings.fontSize) * scale
            InlineMarkdownContent(
                text: text,
                font: .system(size: fontSize, weight: .bold),
                fontScale: scale,
                isBold: true
            )
            .padding(.top, level == 1 ? 2 : 12)
            .accessibilityAddTraits(.isHeader)
        case .paragraph(let text):
            InlineMarkdownContent(
                text: text,
                font: font,
                foregroundColor: foregroundColor,
                fontScale: font == nil ? 1 : 1.15
            )
        case .list(let items):
            VStack(alignment: .leading, spacing: 8) {
                ForEach(items.indices, id: \.self) { index in
                    let item = items[index]
                    HStack(alignment: .top, spacing: 8) {
                        Text(item.marker)
                            .foregroundStyle(.indigo)
                            .font(readerSettings.fontTheme == "serif" ? .custom("Georgia", fixedSize: scaledReaderFontSize(readerSettings.fontSize)) : .system(size: scaledReaderFontSize(readerSettings.fontSize)))
                            .frame(minWidth: item.isOrdered ? 22 : 10, alignment: .trailing)
                        InlineMarkdownContent(
                            text: item.text,
                            font: font,
                            foregroundColor: foregroundColor,
                            fontScale: font == nil ? 1 : 1.15
                        )
                    }
                    .padding(.leading, CGFloat(item.level) * 18)
                }
            }
        case .quote(let text):
            HStack(alignment: .top, spacing: 12) {
                RoundedRectangle(cornerRadius: 2)
                    .fill(Color.indigo.opacity(0.65))
                    .frame(width: 4)
                InlineMarkdownContent(
                    text: text,
                    font: font,
                    foregroundColor: foregroundColor,
                    fontScale: font == nil ? 1 : 1.15
                )
                .padding(.vertical, 4)
            }
            .padding(.vertical, 6)
            .padding(.trailing, 12)
            .background(Color.indigo.opacity(0.07), in: RoundedRectangle(cornerRadius: 10, style: .continuous))
        case .divider:
            Divider()
                .padding(.vertical, 8)
        case .code(let language, let source):
            if language == "checkpoint" {
                CheckpointAccordionView(source: source)
            } else {
                CodeBlockView(rawLanguage: language, source: source, isDarkMode: isEffectiveDarkMode)
            }
        case .table(let rows):
            TableViewWrapper(rows: rows)
        case .image(let path, let darkPath, let lightPath, let alt, let theme):
            let selectedPath = resolvedThemedImagePath(
                defaultPath: path,
                darkPath: darkPath,
                lightPath: lightPath,
                isDarkMode: isEffectiveDarkMode
            )
            if isExcluded(path: selectedPath) {
                EmptyView()
            } else if shouldShow(theme: theme) {
                BundleImage(path: selectedPath, alt: alt)
                    .padding(.vertical, 4)
            }
        case .math(let content, let isBlock):
            LaTeXView(latex: content, isBlock: isBlock)
        case .disclosure(let title, let content):
            MarkdownDisclosureView(title: title, markdown: content)
        }
    }

    private func shouldShow(theme: String?) -> Bool {
        guard let theme else { return true }
        if theme == "dark" { return isEffectiveDarkMode }
        if theme == "light" { return !isEffectiveDarkMode }
        return true
    }
}

struct InlineMarkdownContent: View {
    let text: String
    var font: Font? = nil
    var foregroundColor: Color? = nil
    var fontScale: CGFloat = 1
    var isBold = false
    var allowsTextSelection = true

    var body: some View {
        if containsInlineMath(text) {
            LaTeXView(
                latex: text,
                isBlock: false,
                fontScale: fontScale,
                isBold: isBold,
                usesSecondaryColor: foregroundColor != nil,
                allowsTextSelection: allowsTextSelection
            )
        } else {
            MarkdownText(
                text: cleanInline(text),
                font: font,
                fontScale: fontScale,
                isBold: isBold,
                usesSecondaryColor: foregroundColor != nil,
                allowsTextSelection: allowsTextSelection
            )
                .foregroundStyle(foregroundColor ?? .primary)
        }
    }
}

struct MarkdownText: View {
    let text: String
    var font: Font? = nil
    var fontScale: CGFloat = 1
    var isBold = false
    var usesSecondaryColor = false
    var allowsTextSelection = true
    @ObservedObject private var readerSettings = ReaderSettings.shared
    @ObservedObject private var dataService = DataService.shared
    @Environment(\.colorScheme) private var colorScheme
    @Environment(\.dynamicTypeSize) private var dynamicTypeSize
    @State private var selectedEntry: GlossaryEntry? = nil
    @State private var selectedResource: BundledResource?

    private var processedAttributedString: AttributedString {
        guard var attributed = try? AttributedString(markdown: text) else {
            return AttributedString(text)
        }
        let runs = attributed.runs
        var glossaryRanges: [Range<AttributedString.Index>] = []
        var citationRanges: [Range<AttributedString.Index>] = []
        var codeRanges: [Range<AttributedString.Index>] = []
        for run in runs {
            if let intent = run.inlinePresentationIntent, intent.contains(.code) {
                codeRanges.append(run.range)
            }
            guard let url = run.link else { continue }
            if url.scheme == "glossary" {
                glossaryRanges.append(run.range)
            } else if isReferenceCitationLabel(String(attributed[run.range].characters)) {
                citationRanges.append(run.range)
            }
        }
        for range in glossaryRanges {
            let substring = attributed[range]
            let stringVal = String(substring.characters)
            if stringVal.hasSuffix(" ?") {
                let startIndex = attributed.index(range.upperBound, offsetByCharacters: -2)
                let qAttrRange = startIndex..<range.upperBound
                attributed[qAttrRange].font = .system(size: (readerSettings.fontSize * 0.75), weight: .medium)
                attributed[qAttrRange].baselineOffset = readerSettings.fontSize * 0.2
                attributed[qAttrRange].foregroundColor = .secondary.opacity(0.7)
            }
        }
        let citationFontSize = scaledReaderFontSize(readerSettings.fontSize) * fontScale * 0.72
        for range in citationRanges {
            attributed[range].font = readerSettings.fontTheme == "serif"
                ? .custom("Georgia-Bold", fixedSize: citationFontSize)
                : .system(size: citationFontSize, weight: .semibold)
            attributed[range].baselineOffset = citationFontSize * 0.35
        }
        let inlineCodeFontSize = scaledReaderFontSize(readerSettings.fontSize) * fontScale * 0.92
        for range in codeRanges {
            attributed[range].font = .system(size: inlineCodeFontSize, weight: .regular, design: .monospaced)
            attributed[range].backgroundColor = Color.secondary.opacity(0.12)
        }
        return attributed
    }

    private func glossaryEntries(in attributed: AttributedString) -> [String: GlossaryEntry] {
        var entries: [String: GlossaryEntry] = [:]
        for run in attributed.runs {
            guard
                let url = run.link,
                let entryID = glossaryEntryID(for: url),
                let entry = dataService.glossaryEntry(id: entryID)
            else { continue }
            entries[entryID] = entry
        }
        return entries
    }

    private var uiFont: UIFont {
        let size = scaledReaderFontSize(readerSettings.fontSize) * fontScale
        if readerSettings.fontTheme == "serif" {
            return UIFont(name: isBold ? "Georgia-Bold" : "Georgia", size: size)
                ?? .systemFont(ofSize: size, weight: isBold ? .bold : .regular)
        }
        return .systemFont(ofSize: size, weight: isBold ? .bold : .regular)
    }

    private var isEffectiveDarkMode: Bool {
        if readerSettings.readerColorScheme == "light" { return false }
        if readerSettings.readerColorScheme == "dark" { return true }
        return colorScheme == .dark
    }

    private var textColor: UIColor {
        if usesSecondaryColor {
            return isEffectiveDarkMode ? UIColor(white: 0.65, alpha: 1.0) : UIColor(white: 0.45, alpha: 1.0)
        }
        return isEffectiveDarkMode ? UIColor(white: 0.95, alpha: 1.0) : UIColor(white: 0.1, alpha: 1.0)
    }

    private func open(_ url: URL) -> OpenURLAction.Result {
        if let resource = bundledAssetURL(for: url, dataService: dataService) {
            selectedResource = BundledResource(url: resource)
            return .handled
        }
        if let entryId = glossaryEntryID(for: url) {
            Task { @MainActor in
                if let entry = dataService.glossaryEntry(id: entryId) {
                    selectedEntry = entry
                }
            }
            return .handled
        }
        if let route = learnRoute(for: url) {
            NotificationCenter.default.post(name: Notification.Name("NavigateToRoute"), object: route)
            return .handled
        }
        if let externalURL = externalContentURL(for: url) {
            UIApplication.shared.open(externalURL)
            return .handled
        }
        return .systemAction
    }

    var body: some View {
        let scaledFontSize = scaledReaderFontSize(readerSettings.fontSize)
        let attributed = processedAttributedString
        let glossaryEntries = glossaryEntries(in: attributed)
        Group {
            if glossaryEntries.isEmpty || !allowsTextSelection {
                Text(attributed)
                    .font(font ?? (readerSettings.fontTheme == "serif" ? .custom("Georgia", fixedSize: scaledFontSize) : .system(size: scaledFontSize)))
                    .lineSpacing(readerSettings.fontTheme == "serif" ? 6 : 4)
                    .modifier(ReaderTextSelection(enabled: allowsTextSelection))
                    .environment(\.openURL, OpenURLAction { url in
                        open(url)
                    })
            } else {
                GlossaryInteractiveText(
                    attributedText: interactiveMarkdownText(
                        attributed,
                        baseFont: uiFont,
                        textColor: textColor,
                        lineSpacing: readerSettings.fontTheme == "serif" ? 6 : 4
                    ),
                    entries: glossaryEntries,
                    onOpenURL: { url in
                        let opensInApp = glossaryEntryID(for: url) != nil
                            || learnRoute(for: url) != nil
                            || externalContentURL(for: url) != nil
                            || bundledAssetURL(for: url, dataService: dataService) != nil
                        _ = open(url)
                        if !opensInApp {
                            UIApplication.shared.open(url)
                        }
                    }
                )
                .frame(maxWidth: .infinity, alignment: .leading)
            }
        }
        .sheet(item: $selectedEntry) { entry in
            NavigationStack {
                GlossaryDetailView(entry: entry)
                    .toolbar {
                        ToolbarItem(placement: .cancellationAction) {
                            Button {
                                selectedEntry = nil
                            } label: {
                                #if targetEnvironment(macCatalyst)
                                Image(systemName: "xmark.circle.fill")
                                    .symbolRenderingMode(.hierarchical)
                                    .font(.title3)
                                    .foregroundStyle(.secondary)
                                #else
                                Text("Close")
                                #endif
                            }
                            .accessibilityLabel("Close")
                        }
                    }
            }
        }
        .sheet(item: $selectedResource) { resource in
            BundledResourceView(resource: resource)
        }
    }
}

private struct ReaderTextSelection: ViewModifier {
    let enabled: Bool

    @ViewBuilder
    func body(content: Content) -> some View {
        if enabled {
            content.textSelection(.enabled)
        } else {
            content.textSelection(.disabled)
        }
    }
}

func interactiveMarkdownText(
    _ attributed: AttributedString,
    baseFont: UIFont,
    textColor: UIColor,
    lineSpacing: CGFloat
) -> NSAttributedString {
    let result = NSMutableAttributedString(attributedString: NSAttributedString(attributed))
    let fullRange = NSRange(location: 0, length: result.length)
    guard fullRange.length > 0 else { return result }

    let paragraphStyle = NSMutableParagraphStyle()
    paragraphStyle.lineSpacing = lineSpacing
    result.addAttributes([
        .font: baseFont,
        .foregroundColor: textColor,
        .paragraphStyle: paragraphStyle,
    ], range: fullRange)

    result.enumerateAttribute(.inlinePresentationIntent, in: fullRange) { value, range, _ in
        guard let value else { return }
        let intent: InlinePresentationIntent
        if let number = value as? NSNumber {
            intent = InlinePresentationIntent(rawValue: number.uintValue)
        } else if let typedIntent = value as? InlinePresentationIntent {
            intent = typedIntent
        } else {
            return
        }

        var font = baseFont
        if intent.contains(.code) {
            font = .monospacedSystemFont(
                ofSize: baseFont.pointSize * 0.92,
                weight: intent.contains(.stronglyEmphasized) ? .bold : .regular
            )
            result.addAttribute(.backgroundColor, value: UIColor.tertiarySystemFill, range: range)
        } else {
            var traits = baseFont.fontDescriptor.symbolicTraits
            if intent.contains(.stronglyEmphasized) {
                traits.insert(.traitBold)
            }
            if intent.contains(.emphasized) {
                traits.insert(.traitItalic)
            }
            if let descriptor = baseFont.fontDescriptor.withSymbolicTraits(traits) {
                font = UIFont(descriptor: descriptor, size: baseFont.pointSize)
            }
        }
        result.addAttribute(.font, value: font, range: range)
        if intent.contains(.strikethrough) {
            result.addAttribute(.strikethroughStyle, value: NSUnderlineStyle.single.rawValue, range: range)
        }
    }
    result.removeAttribute(.inlinePresentationIntent, range: fullRange)

    result.enumerateAttribute(.link, in: fullRange) { value, range, _ in
        let label = (result.string as NSString).substring(with: range)
        if attributedLinkURL(value) != nil, isReferenceCitationLabel(label) {
            let citationFontSize = baseFont.pointSize * 0.72
            let citationFont: UIFont
            if baseFont.familyName == "Georgia" {
                citationFont = UIFont(name: "Georgia-Bold", size: citationFontSize)
                    ?? .systemFont(ofSize: citationFontSize, weight: .semibold)
            } else {
                citationFont = .systemFont(ofSize: citationFontSize, weight: .semibold)
            }
            result.addAttributes([
                .font: citationFont,
                .baselineOffset: citationFontSize * 0.35,
            ], range: range)
            return
        }
        guard
            let url = attributedLinkURL(value),
            glossaryEntryID(for: url) != nil,
            range.length >= 2,
            label.hasSuffix(" ?")
        else { return }
        let questionMarkRange = NSRange(location: NSMaxRange(range) - 2, length: 2)
        result.addAttributes([
            .font: UIFont.systemFont(ofSize: baseFont.pointSize * 0.75, weight: .medium),
            .baselineOffset: baseFont.pointSize * 0.2,
            .foregroundColor: UIColor.secondaryLabel.withAlphaComponent(0.7),
        ], range: questionMarkRange)
    }

    return result
}

private struct GlossaryInteractiveText: UIViewRepresentable {
    let attributedText: NSAttributedString
    let entries: [String: GlossaryEntry]
    let onOpenURL: (URL) -> Void

    func makeCoordinator() -> Coordinator {
        Coordinator(entries: entries, onOpenURL: onOpenURL)
    }

    func makeUIView(context: Context) -> UITextView {
        let textView = UITextView()
        textView.backgroundColor = .clear
        textView.isEditable = false
        textView.isSelectable = true
        textView.isScrollEnabled = false
        textView.textContainerInset = .zero
        textView.textContainer.lineFragmentPadding = 0
        textView.adjustsFontForContentSizeCategory = false
        textView.delegate = context.coordinator
        textView.linkTextAttributes = [
            .foregroundColor: UIColor.systemIndigo,
            .underlineColor: UIColor.systemIndigo,
            .underlineStyle: NSUnderlineStyle.single.rawValue,
        ]
        textView.setContentCompressionResistancePriority(.defaultLow, for: .horizontal)
        textView.setContentHuggingPriority(.defaultLow, for: .horizontal)
        textView.addGestureRecognizer(
            UIHoverGestureRecognizer(target: context.coordinator, action: #selector(Coordinator.handleHover(_:)))
        )
        context.coordinator.textView = textView
        return textView
    }

    func updateUIView(_ uiView: UITextView, context: Context) {
        context.coordinator.entries = entries
        context.coordinator.onOpenURL = onOpenURL
        if !uiView.attributedText.isEqual(to: attributedText) {
            uiView.attributedText = attributedText
            uiView.invalidateIntrinsicContentSize()
        }
    }

    func sizeThatFits(_ proposal: ProposedViewSize, uiView: UITextView, context: Context) -> CGSize? {
        guard let width = proposal.width, width > 0 else { return nil }
        let size = uiView.sizeThatFits(
            CGSize(width: width, height: CGFloat.greatestFiniteMagnitude)
        )
        return CGSize(width: width, height: ceil(size.height))
    }

    static func dismantleUIView(_ uiView: UITextView, coordinator: Coordinator) {
        coordinator.hideTooltip()
    }

    final class Coordinator: NSObject, UITextViewDelegate {
        var entries: [String: GlossaryEntry]
        var onOpenURL: (URL) -> Void
        weak var textView: UITextView?

        private let tooltipPresenter = GlossaryHoverTooltipPresenter()

        init(entries: [String: GlossaryEntry], onOpenURL: @escaping (URL) -> Void) {
            self.entries = entries
            self.onOpenURL = onOpenURL
        }

        func textView(
            _ textView: UITextView,
            primaryActionFor textItem: UITextItem,
            defaultAction: UIAction
        ) -> UIAction? {
            guard case .link(let url) = textItem.content else { return defaultAction }
            return UIAction { [weak self] _ in
                self?.hideTooltip()
                self?.onOpenURL(url)
            }
        }

        @objc func handleHover(_ recognizer: UIHoverGestureRecognizer) {
            guard let textView else { return }
            switch recognizer.state {
            case .began, .changed:
                let point = recognizer.location(in: textView)
                guard let target = glossaryTarget(at: point, in: textView) else {
                    hideTooltip()
                    return
                }
                showTooltip(for: target.entry, anchor: target.anchor, in: textView)
            case .ended, .cancelled, .failed:
                hideTooltip()
            default:
                break
            }
        }

        private func glossaryTarget(
            at point: CGPoint,
            in textView: UITextView
        ) -> (entry: GlossaryEntry, anchor: CGRect)? {
            var containerPoint = point
            containerPoint.x -= textView.textContainerInset.left
            containerPoint.y -= textView.textContainerInset.top

            let layoutManager = textView.layoutManager
            let glyphIndex = layoutManager.glyphIndex(
                for: containerPoint,
                in: textView.textContainer,
                fractionOfDistanceThroughGlyph: nil
            )
            guard glyphIndex < layoutManager.numberOfGlyphs else { return nil }

            var glyphRect = layoutManager.boundingRect(
                forGlyphRange: NSRange(location: glyphIndex, length: 1),
                in: textView.textContainer
            )
            glyphRect.origin.x += textView.textContainerInset.left
            glyphRect.origin.y += textView.textContainerInset.top
            guard glyphRect.insetBy(dx: -3, dy: -4).contains(point) else { return nil }

            let characterIndex = layoutManager.characterIndexForGlyph(at: glyphIndex)
            guard characterIndex < textView.textStorage.length else { return nil }
            var linkRange = NSRange()
            let linkValue = textView.textStorage.attribute(
                .link,
                at: characterIndex,
                effectiveRange: &linkRange
            )
            guard
                let url = attributedLinkURL(linkValue),
                let entryID = glossaryEntryID(for: url),
                let entry = entries[entryID]
            else { return nil }

            let linkGlyphRange = layoutManager.glyphRange(
                forCharacterRange: linkRange,
                actualCharacterRange: nil
            )
            var anchor = layoutManager.boundingRect(
                forGlyphRange: linkGlyphRange,
                in: textView.textContainer
            )
            anchor.origin.x += textView.textContainerInset.left
            anchor.origin.y += textView.textContainerInset.top
            return (entry, anchor)
        }

        private func showTooltip(for entry: GlossaryEntry, anchor: CGRect, in textView: UITextView) {
            tooltipPresenter.show(entry: entry, anchor: anchor, from: textView)
        }

        func hideTooltip() {
            tooltipPresenter.hide()
        }
    }
}

private func attributedLinkURL(_ value: Any?) -> URL? {
    if let url = value as? URL {
        return url
    }
    if let value = value as? String {
        return URL(string: value)
    }
    return nil
}

func isReferenceCitationLabel(_ value: String) -> Bool {
    guard value.first == "[", value.last == "]", value.count > 2 else { return false }
    return value.dropFirst().dropLast().allSatisfy { $0.wholeNumberValue != nil }
}

private final class GlossaryHoverTooltipPresenter {
    private var tooltipView: GlossaryHoverTooltipView?
    private var hoveredEntryID: String?

    func show(entry: GlossaryEntry, anchor: CGRect, from sourceView: UIView) {
        guard hoveredEntryID != entry.id, let window = sourceView.window else { return }
        hide()

        let tooltip = GlossaryHoverTooltipView(entry: entry)
        let safeFrame = window.bounds
            .inset(by: window.safeAreaInsets)
            .insetBy(dx: 8, dy: 8)
        let width = min(340, safeFrame.width)
        let fittingSize = tooltip.systemLayoutSizeFitting(
            CGSize(width: width, height: UIView.layoutFittingCompressedSize.height),
            withHorizontalFittingPriority: .required,
            verticalFittingPriority: .fittingSizeLevel
        )
        let anchorInWindow = sourceView.convert(anchor, to: window)
        var x = anchorInWindow.midX - width / 2
        x = min(max(x, safeFrame.minX), safeFrame.maxX - width)
        var y = anchorInWindow.minY - fittingSize.height - 10
        if y < safeFrame.minY {
            y = anchorInWindow.maxY + 10
        }
        y = min(y, safeFrame.maxY - fittingSize.height)
        tooltip.frame = CGRect(x: x, y: y, width: width, height: fittingSize.height)
        window.addSubview(tooltip)

        tooltipView = tooltip
        hoveredEntryID = entry.id
    }

    func hide() {
        tooltipView?.removeFromSuperview()
        tooltipView = nil
        hoveredEntryID = nil
    }
}

private final class GlossaryHoverTooltipView: UIView {
    init(entry: GlossaryEntry) {
        super.init(frame: .zero)
        isUserInteractionEnabled = false
        isAccessibilityElement = false
        accessibilityElementsHidden = true
        backgroundColor = .secondarySystemBackground
        layer.cornerRadius = 12
        layer.cornerCurve = .continuous
        layer.borderWidth = 1
        layer.borderColor = UIColor.separator.cgColor
        layer.shadowColor = UIColor.black.cgColor
        layer.shadowOpacity = 0.16
        layer.shadowRadius = 14
        layer.shadowOffset = CGSize(width: 0, height: 6)

        let titleLabel = UILabel()
        titleLabel.font = .preferredFont(forTextStyle: .headline)
        titleLabel.textColor = .label
        titleLabel.numberOfLines = 0
        titleLabel.text = entry.title

        let summaryLabel = UILabel()
        summaryLabel.font = .preferredFont(forTextStyle: .subheadline)
        summaryLabel.textColor = .label
        summaryLabel.numberOfLines = 0
        summaryLabel.text = entry.summary

        let hintLabel = UILabel()
        hintLabel.font = .preferredFont(forTextStyle: .caption1)
        hintLabel.textColor = .secondaryLabel
        hintLabel.numberOfLines = 0
        hintLabel.text = "Click for deeper explanation, examples, code, and where it appears."

        let stack = UIStackView(arrangedSubviews: [titleLabel, summaryLabel, hintLabel])
        stack.axis = .vertical
        stack.spacing = 8
        stack.isLayoutMarginsRelativeArrangement = true
        stack.layoutMargins = UIEdgeInsets(top: 14, left: 16, bottom: 14, right: 16)
        stack.translatesAutoresizingMaskIntoConstraints = false
        addSubview(stack)
        NSLayoutConstraint.activate([
            stack.topAnchor.constraint(equalTo: topAnchor),
            stack.leadingAnchor.constraint(equalTo: leadingAnchor),
            stack.trailingAnchor.constraint(equalTo: trailingAnchor),
            stack.bottomAnchor.constraint(equalTo: bottomAnchor),
        ])
    }

    @available(*, unavailable)
    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
}

struct MarkdownBlock: Identifiable {
    let id: Int
    let kind: MarkdownBlockKind
}

enum MarkdownBlockKind {
    case heading(level: Int, text: String)
    case paragraph(String)
    case list([MarkdownListItem])
    case quote(String)
    case divider
    case code(language: String, source: String)
    case table([String])
    case image(path: String, darkPath: String?, lightPath: String?, alt: String?, theme: String?)
    case math(String, isBlock: Bool)
    case disclosure(title: String, content: String)
}

struct MarkdownListItem: Hashable {
    let text: String
    let marker: String
    let level: Int
    let isOrdered: Bool
}

func parseBlocks(_ markdown: String) -> [MarkdownBlock] {
    let extracted = extractDisclosureBlocks(markdown)
    let lines = extracted.markdown.replacingOccurrences(of: "\r\n", with: "\n").components(separatedBy: "\n")
    var blocks: [MarkdownBlockKind] = []
    var paragraph: [String] = []
    var listItems: [MarkdownListItem] = []
    var quoteLines: [String] = []
    var tableRows: [String] = []
    var codeLanguage = ""
    var codeLines: [String] = []
    var inCode = false

    func flushParagraph() {
        if !paragraph.isEmpty {
            blocks.append(.paragraph(paragraph.joined(separator: " ")))
            paragraph.removeAll()
        }
    }

    func flushList() {
        if !listItems.isEmpty {
            blocks.append(.list(listItems))
            listItems.removeAll()
        }
    }

    func flushQuote() {
        if !quoteLines.isEmpty {
            blocks.append(.quote(quoteLines.joined(separator: " ")))
            quoteLines.removeAll()
        }
    }

    func flushTable() {
        if !tableRows.isEmpty {
            blocks.append(.table(tableRows))
            tableRows.removeAll()
        }
    }

    var inMath = false
    var mathLines: [String] = []

    for rawLine in lines {
        let line = rawLine.trimmingCharacters(in: .whitespaces)

        if line.hasPrefix("```") {
            if inCode {
                blocks.append(.code(language: codeLanguage, source: codeLines.joined(separator: "\n")))
                codeLines.removeAll()
                codeLanguage = ""
                inCode = false
            } else {
                flushParagraph()
                flushList()
                flushQuote()
                flushTable()
                inCode = true
                codeLanguage = String(line.dropFirst(3)).trimmingCharacters(in: .whitespaces)
            }
            continue
        }

        if inCode {
            codeLines.append(rawLine)
            continue
        }

        if line.hasPrefix("<!--") {
            continue
        }

        if line.hasPrefix("\u{E100}"), line.hasSuffix("\u{E101}"),
           let index = Int(line.dropFirst().dropLast()), index < extracted.disclosures.count {
            flushParagraph()
            flushList()
            flushQuote()
            flushTable()
            let disclosure = extracted.disclosures[index]
            blocks.append(.disclosure(title: cleanInline(disclosure.title), content: disclosure.content))
            continue
        }

        if line.hasPrefix("$$") {
            if inMath {
                let content = mathLines.joined(separator: "\n")
                blocks.append(.math(content, isBlock: true))
                mathLines.removeAll()
                inMath = false
            } else {
                flushParagraph()
                flushList()
                flushQuote()
                flushTable()
                inMath = true
                let content = line.dropFirst(2).trimmingCharacters(in: .whitespaces)
                if content.hasSuffix("$$") {
                    let cleanContent = content.dropLast(2).trimmingCharacters(in: .whitespaces)
                    blocks.append(.math(String(cleanContent), isBlock: true))
                    inMath = false
                }
            }
            continue
        }

        if inMath {
            mathLines.append(rawLine)
            continue
        }

        if let image = parseImage(line) {
            flushParagraph()
            flushList()
            flushQuote()
            flushTable()
            blocks.append(image)
            continue
        }

        // Skip figure wrappers; individual <img> lines are handled above.
        // Keep figcaption text as a short caption paragraph.
        if line.hasPrefix("<figure") || line == "</figure>" || line.hasPrefix("</figure") {
            continue
        }
        if line.hasPrefix("<figcaption") {
            flushParagraph()
            flushList()
            flushQuote()
            flushTable()
            let caption = cleanInline(line)
            if !caption.isEmpty {
                blocks.append(.paragraph(caption))
            }
            continue
        }

        if line.isEmpty {
            flushParagraph()
            flushList()
            flushQuote()
            flushTable()
            continue
        }

        if line.range(of: #"^(---+|___+|\*\*\*+)$"#, options: .regularExpression) != nil {
            flushParagraph()
            flushList()
            flushQuote()
            flushTable()
            blocks.append(.divider)
            continue
        }

        if line.hasPrefix("> ") {
            flushParagraph()
            flushList()
            flushTable()
            quoteLines.append(String(line.dropFirst(2)))
            continue
        }

        if line.hasPrefix("|") && line.hasSuffix("|") {
            flushParagraph()
            flushList()
            flushQuote()
            tableRows.append(rawLine)
            continue
        }

        if line.hasPrefix("#") {
            flushParagraph()
            flushList()
            flushQuote()
            flushTable()
            let level = line.prefix { $0 == "#" }.count
            let text = String(line.dropFirst(level)).trimmingCharacters(in: .whitespaces)
            blocks.append(.heading(level: max(1, min(level, 3)), text: text))
            continue
        }

        let unorderedRange = rawLine.range(of: #"^\s*[-*+]\s+"#, options: .regularExpression)
        let orderedRange = rawLine.range(of: #"^\s*([0-9]+)\.\s+"#, options: .regularExpression)
        if let markerRange = unorderedRange ?? orderedRange {
            flushParagraph()
            flushQuote()
            flushTable()
            let leadingWhitespace = rawLine.prefix { $0 == " " || $0 == "\t" }
            let level = leadingWhitespace.reduce(0) { count, character in count + (character == "\t" ? 2 : 1) } / 2
            let markerText = String(rawLine[markerRange])
            let isOrdered = orderedRange != nil
            let marker = isOrdered
                ? markerText.trimmingCharacters(in: .whitespacesAndNewlines)
                : "•"
            listItems.append(
                MarkdownListItem(
                    text: String(rawLine[markerRange.upperBound...]),
                    marker: marker,
                    level: level,
                    isOrdered: isOrdered
                )
            )
            continue
        }

        flushList()
        flushQuote()
        paragraph.append(rawLine.trimmingCharacters(in: .whitespaces))
    }

    if inCode {
        blocks.append(.code(language: codeLanguage, source: codeLines.joined(separator: "\n")))
    }
    flushParagraph()
    flushList()
    flushQuote()
    flushTable()
    if !mathLines.isEmpty {
        blocks.append(.math(mathLines.joined(separator: "\n"), isBlock: true))
    }

    return blocks.enumerated().map { MarkdownBlock(id: $0.offset, kind: $0.element) }
}

private struct ExtractedDisclosure {
    let title: String
    let content: String
}

private func extractDisclosureBlocks(_ markdown: String) -> (markdown: String, disclosures: [ExtractedDisclosure]) {
    let pattern = #"<details\b[^>]*>\s*<summary\b[^>]*>(.*?)</summary>\s*(.*?)\s*</details>"#
    guard let regex = try? NSRegularExpression(pattern: pattern, options: [.caseInsensitive, .dotMatchesLineSeparators]) else {
        return (markdown, [])
    }

    let source = markdown as NSString
    let codePatterns = [
        #"(?ms)^ {0,3}`{3,}[^\n]*\n.*?^ {0,3}`{3,}[ \t]*$"#,
        #"(?ms)^ {0,3}~{3,}[^\n]*\n.*?^ {0,3}~{3,}[ \t]*$"#,
        #"(?<!`)(`+)[^\n]*?\1(?!`)"#,
    ]
    let codeRanges = codePatterns.flatMap { pattern in
        (try? NSRegularExpression(pattern: pattern))?.matches(
            in: markdown,
            range: NSRange(location: 0, length: source.length)
        ).map(\.range) ?? []
    }
    let matches = regex.matches(in: markdown, range: NSRange(location: 0, length: source.length)).filter { match in
        !codeRanges.contains { NSLocationInRange(match.range.location, $0) }
    }
    let disclosures = matches.map { match in
        ExtractedDisclosure(
            title: match.range(at: 1).location == NSNotFound ? "Details" : source.substring(with: match.range(at: 1)),
            content: match.range(at: 2).location == NSNotFound ? "" : source.substring(with: match.range(at: 2))
        )
    }
    let rewritten = NSMutableString(string: markdown)
    for (index, match) in matches.enumerated().reversed() {
        rewritten.replaceCharacters(in: match.range, with: "\n\u{E100}\(index)\u{E101}\n")
    }
    return (rewritten as String, disclosures)
}

private func parseImage(_ line: String) -> MarkdownBlockKind? {
    if line.contains("<img"), let path = htmlAttribute("src", in: line),
       path.hasPrefix("images/") || path.hasPrefix("private-blog-images/") {
        let className = htmlAttribute("class", in: line) ?? ""
        let theme = className.contains("dark:block") ? "dark" : className.contains("dark:hidden") ? "light" : nil
        return .image(
            path: path,
            darkPath: htmlAttribute("data-dark-src", in: line),
            lightPath: htmlAttribute("data-light-src", in: line),
            alt: htmlAttribute("alt", in: line),
            theme: theme
        )
    }

    guard line.hasPrefix("!["),
          let altEnd = line.firstIndex(of: "]"),
          let start = line[altEnd...].firstIndex(of: "("),
          let end = line[start...].firstIndex(of: ")") else {
        return nil
    }

    let alt = String(line[line.index(line.startIndex, offsetBy: 2)..<altEnd])
    let path = String(line[line.index(after: start)..<end])
    guard path.hasPrefix("images/") || path.hasPrefix("private-blog-images/") else { return nil }
    return .image(path: path, darkPath: nil, lightPath: nil, alt: alt, theme: nil)
}

func resolvedThemedImagePath(
    defaultPath: String,
    darkPath: String?,
    lightPath: String?,
    isDarkMode: Bool
) -> String {
    isDarkMode ? darkPath ?? defaultPath : lightPath ?? defaultPath
}

private func htmlAttribute(_ name: String, in text: String) -> String? {
    let token = "\(name)=\""
    guard let startRange = text.range(of: token) else { return nil }
    let valueStart = startRange.upperBound
    guard let end = text[valueStart...].firstIndex(of: "\"") else { return nil }
    return String(text[valueStart..<end])
}

private let inlineMathPattern = #"\$\$[\s\S]*?\$\$|(?<!\\)\$(?!\$)(?:\\\$|[^\n$])+?(?<!\\)\$"#

private func cleanInline(_ text: String) -> String {
    normalizedInlineMarkdown(text)
        .trimmingCharacters(in: .whitespacesAndNewlines)
}

private func scaledReaderFontSize(_ baseSize: Double) -> CGFloat {
    UIFontMetrics(forTextStyle: .body).scaledValue(for: baseSize)
}

func learnRoute(for url: URL) -> LearnRoute? {
    guard url.scheme == nil || ["http", "https"].contains(url.scheme?.lowercased() ?? ""),
          url.host == nil || ["leetllm.com", "www.leetllm.com"].contains(url.host?.lowercased() ?? "") else { return nil }
    let components = url.pathComponents.filter { $0 != "/" }
    guard components.count == 2 else { return nil }
    if components[0] == "learn" {
        return .lesson(components.last!)
    }
    return nil
}

private func glossaryEntryID(for url: URL) -> String? {
    if url.scheme == "glossary" {
        return url.host?.removingPercentEncoding ?? url.host
    }
    guard url.scheme == nil || ["http", "https"].contains(url.scheme?.lowercased() ?? ""),
          url.host == nil || ["leetllm.com", "www.leetllm.com"].contains(url.host?.lowercased() ?? ""),
          url.path == "/glossary", let fragment = url.fragment, !fragment.isEmpty else {
        return nil
    }
    return fragment.removingPercentEncoding ?? fragment
}

func externalContentURL(for url: URL) -> URL? {
    guard url.scheme == nil, url.host == nil, url.path.hasPrefix("/") else { return nil }
    return URL(string: url.relativeString, relativeTo: URL(string: "https://leetllm.com")!)?.absoluteURL
}

@MainActor
func bundledAssetURL(for url: URL, dataService: DataService) -> URL? {
    if url.isFileURL, let root = dataService.resourceURL(path: "") {
        let resource = url.standardizedFileURL
        guard resource.path.hasPrefix(root.standardizedFileURL.path + "/assets/"),
              FileManager.default.fileExists(atPath: resource.path) else { return nil }
        return resource
    }
    guard url.scheme == nil, url.host == nil, url.path.hasPrefix("assets/"),
          !url.pathComponents.contains(".."),
          let resource = dataService.resourceURL(path: url.path),
          FileManager.default.fileExists(atPath: resource.path) else { return nil }
    return resource
}

struct BundledResource: Identifiable {
    let url: URL
    var id: URL { url }
}

private struct BundledResourceView: View {
    let resource: BundledResource
    @Environment(\.dismiss) private var dismiss
    @State private var fileText: String?

    var body: some View {
        NavigationStack {
            Group {
                if let fileText {
                    BundledTextPreview(text: fileText)
                } else {
                    BundledResourcePreview(url: resource.url)
                }
            }
                .navigationTitle(resource.url.lastPathComponent)
                .navigationBarTitleDisplayMode(.inline)
                .toolbar {
                    ToolbarItem(placement: .confirmationAction) {
                        Button {
                            dismiss()
                        } label: {
                            #if targetEnvironment(macCatalyst)
                            Image(systemName: "xmark.circle.fill")
                                .symbolRenderingMode(.hierarchical)
                                .font(.title3)
                                .foregroundStyle(.secondary)
                            #else
                            Text("Done")
                            #endif
                        }
                        .accessibilityLabel("Done")
                    }
                    ToolbarItem(placement: .primaryAction) {
                        ShareLink(item: resource.url)
                            .accessibilityLabel("Share practice file")
                    }
                }
        }
        .task {
            let url = resource.url
            fileText = await Task.detached(priority: .userInitiated) {
                try? String(contentsOf: url, encoding: .utf8)
            }.value
        }
    }
}

private struct BundledTextPreview: UIViewRepresentable {
    let text: String

    func makeUIView(context: Context) -> UITextView {
        let view = UITextView(usingTextLayoutManager: true)
        view.isEditable = false
        view.isSelectable = true
        view.adjustsFontForContentSizeCategory = true
        view.textContainerInset = UIEdgeInsets(top: 16, left: 12, bottom: 16, right: 12)
        view.accessibilityIdentifier = "practice-file-content"
        view.accessibilityLabel = "Practice file contents"
        return view
    }

    func updateUIView(_ view: UITextView, context: Context) {
        if view.text != text { view.text = text }
        view.font = UIFontMetrics.default.scaledFont(for: .monospacedSystemFont(ofSize: 17, weight: .regular))
        view.textColor = .label
        view.backgroundColor = .systemBackground
    }
}

private struct BundledResourcePreview: UIViewControllerRepresentable {
    let url: URL

    func makeCoordinator() -> Coordinator { Coordinator(url: url) }
    func makeUIViewController(context: Context) -> QLPreviewController {
        let controller = QLPreviewController()
        controller.dataSource = context.coordinator
        return controller
    }
    func updateUIViewController(_ controller: QLPreviewController, context: Context) {}

    final class Coordinator: NSObject, QLPreviewControllerDataSource {
        let url: URL
        init(url: URL) { self.url = url }
        func numberOfPreviewItems(in controller: QLPreviewController) -> Int { 1 }
        func previewController(_ controller: QLPreviewController, previewItemAt index: Int) -> QLPreviewItem {
            url as NSURL
        }
    }
}

func normalizedInlineMarkdown(_ text: String) -> String {
    var result = text
    var fragments: [String] = []

    func protect(pattern: String) {
        result = replacingRegexMatches(in: result, pattern: pattern) { match, source in
            let token = "\u{E000}\(fragments.count)\u{E001}"
            fragments.append(regexCapture(match, index: 0, source: source) ?? "")
            return token
        }
    }

    protect(pattern: #"`[^`\n]+`"#)
    protect(pattern: inlineMathPattern)

    result = result.replacingOccurrences(
        of: #"<span\s+[^>]*data-glossary="([^"]+)"[^>]*>(.*?)</span>"#,
        with: "[$2 ?](glossary://$1)",
        options: .regularExpression
    )
    // Escape the visible brackets and wrap the destination in angle brackets so
    // Foundation's Markdown parser handles citation labels and URLs containing parentheses.
    let citationPattern = #"<sup><a\s+[^>]*href="([^"]+)"[^>]*>\[(\d+)\]</a></sup>"#
    result = replacingRegexMatches(in: result, pattern: citationPattern) { match, source in
        let token = "\u{E000}\(fragments.count)\u{E001}"
        let url = (regexCapture(match, index: 1, source: source) ?? "")
            .replacingOccurrences(of: "&amp;", with: "&")
        let number = regexCapture(match, index: 2, source: source) ?? ""
        fragments.append("[\\[\(number)\\]](<\(url)>)")
        return token
    }
    result = result.replacingOccurrences(of: #"<sup>.*?</sup>"#, with: "", options: .regularExpression)
    result = result.replacingOccurrences(of: #"<figcaption>(.*?)</figcaption>"#, with: "$1", options: .regularExpression)
    result = result.replacingOccurrences(of: #"<br\s*/?>"#, with: "\n", options: .regularExpression)
    result = result.replacingOccurrences(of: #"<[^>]+>"#, with: " ", options: .regularExpression)
    result = result.replacingOccurrences(of: "&quot;", with: "\"")
    result = result.replacingOccurrences(of: "&#39;", with: "'")
    result = result.replacingOccurrences(of: "&amp;", with: "&")
    result = result.replacingOccurrences(of: "&lt;", with: "<")
    result = result.replacingOccurrences(of: "&gt;", with: ">")
    for index in fragments.indices.reversed() {
        result = result.replacingOccurrences(of: "\u{E000}\(index)\u{E001}", with: fragments[index])
    }
    return result
}

func containsInlineMath(_ text: String) -> Bool {
    guard let regex = try? NSRegularExpression(pattern: inlineMathPattern) else { return false }
    let withoutCode = text.replacingOccurrences(of: #"`[^`\n]+`"#, with: "", options: .regularExpression)
    return regex.firstMatch(in: withoutCode, range: NSRange(withoutCode.startIndex..<withoutCode.endIndex, in: withoutCode)) != nil
}

private func escapeHTML(_ text: String) -> String {
    text
        .replacingOccurrences(of: "&", with: "&amp;")
        .replacingOccurrences(of: "<", with: "&lt;")
        .replacingOccurrences(of: ">", with: "&gt;")
        .replacingOccurrences(of: "\"", with: "&quot;")
        .replacingOccurrences(of: "'", with: "&#39;")
}

private func regexCapture(_ match: NSTextCheckingResult, index: Int, source: String) -> String? {
    guard index < match.numberOfRanges, match.range(at: index).location != NSNotFound,
          let range = Range(match.range(at: index), in: source) else {
        return nil
    }
    return String(source[range])
}

private func replacingRegexMatches(
    in source: String,
    pattern: String,
    transform: (NSTextCheckingResult, String) -> String
) -> String {
    guard let regex = try? NSRegularExpression(pattern: pattern) else { return source }
    let matches = regex.matches(in: source, range: NSRange(source.startIndex..<source.endIndex, in: source))
    var result = source
    for match in matches.reversed() {
        guard let range = Range(match.range, in: result) else { continue }
        result.replaceSubrange(range, with: transform(match, source))
    }
    return result
}

private func renderEmphasisHTML(_ escapedText: String) -> String {
    var result = replacingRegexMatches(in: escapedText, pattern: #"\*\*([^*\n]+)\*\*|__([^_\n]+)__"#) { match, source in
        let content = regexCapture(match, index: 1, source: source) ?? regexCapture(match, index: 2, source: source) ?? ""
        return "<strong>\(content)</strong>"
    }
    result = replacingRegexMatches(in: result, pattern: #"(?<!\*)\*([^*\n]+)\*(?!\*)|(?<!_)_([^_\n]+)_(?!_)"#) { match, source in
        let content = regexCapture(match, index: 1, source: source) ?? regexCapture(match, index: 2, source: source) ?? ""
        return "<em>\(content)</em>"
    }
    result = replacingRegexMatches(in: result, pattern: #"~~([^~\n]+)~~"#) { match, source in
        "<s>\(regexCapture(match, index: 1, source: source) ?? "")</s>"
    }
    return result
}

func renderInlineMarkdownHTML(_ markdown: String) -> String {
    var fragments: [String] = []
    var source = normalizedInlineMarkdown(markdown)

    func protect(pattern: String, render: (NSTextCheckingResult, String) -> String) {
        source = replacingRegexMatches(in: source, pattern: pattern) { match, currentSource in
            let token = "\u{E000}\(fragments.count)\u{E001}"
            fragments.append(render(match, currentSource))
            return token
        }
    }

    protect(pattern: #"`([^`\n]+)`"#) { match, currentSource in
        let code = regexCapture(match, index: 1, source: currentSource) ?? ""
        return "<code>\(escapeHTML(code))</code>"
    }
    protect(pattern: inlineMathPattern) { match, currentSource in
        escapeHTML(regexCapture(match, index: 0, source: currentSource) ?? "")
    }
    protect(pattern: #"\[\\\[(\d+)\\\]\]\(<([^>\n]+)>\)"#) { match, currentSource in
        let number = regexCapture(match, index: 1, source: currentSource) ?? ""
        let url = regexCapture(match, index: 2, source: currentSource) ?? ""
        return "<sup class=\"reference-citation\"><a href=\"\(escapeHTML(url))\">[\(number)]</a></sup>"
    }
    // Preserve compatibility with content normalized by older app builds.
    protect(pattern: #"\[\[(\d+)\]\]\(([^)\s]+)\)"#) { match, currentSource in
        let number = regexCapture(match, index: 1, source: currentSource) ?? ""
        let url = regexCapture(match, index: 2, source: currentSource) ?? ""
        return "<sup class=\"reference-citation\"><a href=\"\(escapeHTML(url))\">[\(number)]</a></sup>"
    }
    protect(pattern: #"\[([^\]\n]+)]\(([^)\s]+)\)"#) { match, currentSource in
        var label = regexCapture(match, index: 1, source: currentSource) ?? ""
        let rawURL = regexCapture(match, index: 2, source: currentSource) ?? ""
        let url = URL(string: rawURL).flatMap { externalContentURL(for: $0) }?.absoluteString ?? rawURL
        if let parsedURL = URL(string: url), let entryID = glossaryEntryID(for: parsedURL) {
            if label.hasSuffix(" ?") {
                label.removeLast(2)
            }
            let escapedEntryID = escapeHTML(entryID)
            return "<a href=\"glossary://\(escapedEntryID)\" data-glossary=\"\(escapedEntryID)\">\(renderEmphasisHTML(escapeHTML(label)))</a>"
        }
        if isReferenceCitationLabel(label) {
            return "<sup class=\"reference-citation\"><a href=\"\(escapeHTML(url))\">\(escapeHTML(label))</a></sup>"
        }
        return "<a href=\"\(escapeHTML(url))\">\(renderEmphasisHTML(escapeHTML(label)))</a>"
    }

    var html = renderEmphasisHTML(escapeHTML(source))
        .replacingOccurrences(of: "\n", with: "<br>")
    for index in fragments.indices.reversed() {
        html = html.replacingOccurrences(of: "\u{E000}\(index)\u{E001}", with: fragments[index])
    }
    return html.trimmingCharacters(in: .whitespacesAndNewlines)
}

struct ZoomableImageView: UIViewRepresentable {
    let uiImage: UIImage

    func makeUIView(context: Context) -> UIScrollView {
        let scrollView = UIScrollView()
        scrollView.minimumZoomScale = 1.0
        scrollView.maximumZoomScale = 5.0
        scrollView.showsHorizontalScrollIndicator = false
        scrollView.showsVerticalScrollIndicator = false
        scrollView.delegate = context.coordinator
        scrollView.contentInsetAdjustmentBehavior = .never
        
        let imageView = UIImageView(image: uiImage)
        imageView.contentMode = .scaleAspectFit
        imageView.translatesAutoresizingMaskIntoConstraints = false
        scrollView.addSubview(imageView)
        
        NSLayoutConstraint.activate([
            imageView.leadingAnchor.constraint(equalTo: scrollView.contentLayoutGuide.leadingAnchor),
            imageView.trailingAnchor.constraint(equalTo: scrollView.contentLayoutGuide.trailingAnchor),
            imageView.topAnchor.constraint(equalTo: scrollView.contentLayoutGuide.topAnchor),
            imageView.bottomAnchor.constraint(equalTo: scrollView.contentLayoutGuide.bottomAnchor),
            
            imageView.widthAnchor.constraint(equalTo: scrollView.frameLayoutGuide.widthAnchor),
            imageView.heightAnchor.constraint(equalTo: scrollView.frameLayoutGuide.heightAnchor)
        ])
        
        context.coordinator.imageView = imageView
        
        let doubleTap = UITapGestureRecognizer(target: context.coordinator, action: #selector(Coordinator.handleDoubleTap(_:)))
        doubleTap.numberOfTapsRequired = 2
        scrollView.addGestureRecognizer(doubleTap)
        
        return scrollView
    }

    func updateUIView(_ uiView: UIScrollView, context: Context) {
        context.coordinator.imageView?.image = uiImage
    }

    func makeCoordinator() -> Coordinator {
        Coordinator()
    }

    class Coordinator: NSObject, UIScrollViewDelegate {
        var imageView: UIImageView?
        
        func viewForZooming(in scrollView: UIScrollView) -> UIView? {
            return imageView
        }
        
        func scrollViewDidZoom(_ scrollView: UIScrollView) {
            centerImage(scrollView)
        }
        
        @objc func handleDoubleTap(_ gesture: UITapGestureRecognizer) {
            guard let scrollView = gesture.view as? UIScrollView else { return }
            if scrollView.zoomScale > scrollView.minimumZoomScale {
                scrollView.setZoomScale(scrollView.minimumZoomScale, animated: true)
            } else {
                let point = gesture.location(in: imageView)
                let zoomRect = zoomRectForScale(scrollView.maximumZoomScale / 2.0, withCenter: point, in: scrollView)
                scrollView.zoom(to: zoomRect, animated: true)
            }
        }
        
        private func centerImage(_ scrollView: UIScrollView) {
            guard let imageView = imageView else { return }
            let boundsSize = scrollView.bounds.size
            var contentsFrame = imageView.frame
            
            if contentsFrame.size.width < boundsSize.width {
                contentsFrame.origin.x = (boundsSize.width - contentsFrame.size.width) / 2.0
            } else {
                contentsFrame.origin.x = 0.0
            }
            
            if contentsFrame.size.height < boundsSize.height {
                contentsFrame.origin.y = (boundsSize.height - contentsFrame.size.height) / 2.0
            } else {
                contentsFrame.origin.y = 0.0
            }
            
            imageView.frame = contentsFrame
        }
        
        private func zoomRectForScale(_ scale: CGFloat, withCenter center: CGPoint, in scrollView: UIScrollView) -> CGRect {
            var zoomRect = CGRect.zero
            zoomRect.size.height = scrollView.frame.size.height / scale
            zoomRect.size.width  = scrollView.frame.size.width  / scale
            zoomRect.origin.x    = center.x - (zoomRect.size.width  / 2.0)
            zoomRect.origin.y    = center.y - (zoomRect.size.height / 2.0)
            return zoomRect
        }
    }
}

struct FullScreenImageViewer: View {
    let uiImage: UIImage
    let alt: String?
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        ZStack(alignment: .topTrailing) {
            Color.black.ignoresSafeArea()
            
            ZoomableImageView(uiImage: uiImage)
                .ignoresSafeArea()
            
            Button(action: { dismiss() }) {
                Image(systemName: "xmark.circle.fill")
                    .symbolRenderingMode(.palette)
                    .foregroundStyle(.white, .black.opacity(0.6))
                    .font(.system(size: 28))
                    .padding()
                    .contentShape(Rectangle())
            }
            .buttonStyle(.plain)
            .accessibilityLabel("Close illustration")
            .frame(minWidth: 44, minHeight: 44)
            .padding(.top, 10)
        }
    }
}

func highlightCode(_ code: String, language: String, isDarkMode: Bool, fontSize: CGFloat) -> AttributedString {
    var attributed = AttributedString(code)
    attributed.font = .system(size: fontSize, weight: .regular, design: .monospaced)
    attributed.foregroundColor = isDarkMode ? .white : .black
    
    let range = NSRange(code.startIndex..<code.endIndex, in: code)
    var patterns: [(pattern: String, color: Color)] = []
    
    // Comments
    patterns.append((#"//.*$|/\*[\s\S]*?\*/|#.*$"#, isDarkMode ? Color(red: 0.5, green: 0.6, blue: 0.5) : Color(red: 0.4, green: 0.5, blue: 0.4)))
    
    // Strings
    patterns.append((#""[^"\\]*(?:\\.[^"\\]*)*"|'[^'\\]*(?:\\.[^'\\]*)*'|"""[\s\S]*?""""#, isDarkMode ? Color(red: 0.85, green: 0.65, blue: 0.45) : Color(red: 0.7, green: 0.45, blue: 0.2)))
    
    // Numbers
    patterns.append((#"\b\d+(\.\d+)?\b"#, isDarkMode ? Color(red: 0.6, green: 0.8, blue: 0.6) : Color(red: 0.3, green: 0.6, blue: 0.3)))
    
    // Keywords
    let keywords: [String]
    if language.lowercased() == "python" {
        keywords = ["def", "class", "return", "import", "from", "as", "if", "else", "elif", "for", "while", "in", "is", "not", "and", "or", "try", "except", "finally", "with", "assert", "lambda", "global", "nonlocal", "pass", "break", "continue", "yield", "None", "True", "False"]
    } else {
        keywords = ["function", "const", "let", "var", "class", "return", "import", "export", "from", "default", "if", "else", "for", "while", "in", "of", "try", "catch", "finally", "async", "await", "null", "undefined", "true", "false", "interface", "type", "public", "private", "readonly"]
    }
    
    let keywordPattern = "\\b(" + keywords.joined(separator: "|") + ")\\b"
    patterns.append((keywordPattern, isDarkMode ? Color(red: 0.85, green: 0.45, blue: 0.65) : Color(red: 0.7, green: 0.2, blue: 0.5)))
    
    // Builtin Types
    let types = ["int", "float", "str", "bool", "list", "dict", "set", "tuple", "number", "string", "boolean", "any", "void", "object", "self"]
    let typePattern = "\\b(" + types.joined(separator: "|") + ")\\b"
    patterns.append((typePattern, isDarkMode ? Color(red: 0.4, green: 0.7, blue: 0.9) : Color(red: 0.1, green: 0.4, blue: 0.7)))
    
    // Function names / decorators
    patterns.append((#"\b[a-zA-Z_][a-zA-Z0-9_]*(?=\()"#, isDarkMode ? Color(red: 0.3, green: 0.7, blue: 0.9) : Color(red: 0.1, green: 0.5, blue: 0.7)))
    
    for (pattern, color) in patterns {
        if let regex = try? NSRegularExpression(pattern: pattern, options: [.anchorsMatchLines]) {
            let matches = regex.matches(in: code, options: [], range: range)
            for match in matches {
                if let stringRange = Range(match.range, in: code) {
                    if let start = AttributedString.Index(stringRange.lowerBound, within: attributed),
                       let end = AttributedString.Index(stringRange.upperBound, within: attributed) {
                        attributed[start..<end].foregroundColor = color
                    }
                }
            }
        }
    }
    
    return attributed
}

enum MarkdownTableAlignment: Equatable {
    case leading
    case center
    case trailing

    var frameAlignment: Alignment {
        switch self {
        case .leading: return .leading
        case .center: return .center
        case .trailing: return .trailing
        }
    }

    var textAlignment: TextAlignment {
        switch self {
        case .leading: return .leading
        case .center: return .center
        case .trailing: return .trailing
        }
    }
}

struct ParsedTable {
    let headers: [String]
    let rows: [[String]]
    let alignments: [MarkdownTableAlignment]

    init(
        headers: [String],
        rows: [[String]],
        alignments: [MarkdownTableAlignment] = []
    ) {
        self.headers = headers
        self.rows = rows
        self.alignments = headers.indices.map { index in
            index < alignments.count ? alignments[index] : .leading
        }
    }
}

private struct TableColumnProfile {
    let minimumWidth: CGFloat
    let idealWidth: CGFloat
    let isCompact: Bool
    let isDescriptive: Bool
}

func adaptiveTableColumnWidths(
    for table: ParsedTable,
    availableWidth: CGFloat,
    horizontalSpacing: CGFloat = 12,
    horizontalPadding: CGFloat = 24
) -> [CGFloat] {
    guard !table.headers.isEmpty else { return [] }
    let profiles = table.headers.indices.map { columnIndex in
        tableColumnProfile(for: table, columnIndex: columnIndex)
    }
    let spacingWidth = horizontalSpacing * CGFloat(max(0, profiles.count - 1))
    let availableCellWidth = max(0, availableWidth - horizontalPadding - spacingWidth)
    let minimumTotal = profiles.reduce(0) { $0 + $1.minimumWidth }
    let targetCellWidth = max(availableCellWidth, minimumTotal)
    var widths = profiles.map(\.idealWidth)
    let idealTotal = widths.reduce(0, +)

    if idealTotal > targetCellWidth {
        var deficit = idealTotal - targetCellWidth
        let shrinkOrder = profiles.indices.sorted { lhs, rhs in
            let lhsScore = (profiles[lhs].isDescriptive ? 2.0 : 0.0)
                + Double(lhs) / Double(max(1, profiles.count))
                - (profiles[lhs].isCompact ? 1.0 : 0.0)
            let rhsScore = (profiles[rhs].isDescriptive ? 2.0 : 0.0)
                + Double(rhs) / Double(max(1, profiles.count))
                - (profiles[rhs].isCompact ? 1.0 : 0.0)
            return lhsScore > rhsScore
        }
        for index in shrinkOrder where deficit > 0 {
            let shrink = min(deficit, widths[index] - profiles[index].minimumWidth)
            widths[index] -= shrink
            deficit -= shrink
        }
    } else if idealTotal < targetCellWidth {
        let extra = targetCellWidth - idealTotal
        let weights = profiles.indices.map { index -> CGFloat in
            let base: CGFloat = profiles[index].isDescriptive ? 2.2 : profiles[index].isCompact ? 0.55 : 1
            return index == profiles.count - 1 ? base + 0.6 : base
        }
        let weightTotal = weights.reduce(0, +)
        for index in widths.indices {
            widths[index] += extra * weights[index] / weightTotal
        }
    }

    return widths
}

private func tableColumnProfile(for table: ParsedTable, columnIndex: Int) -> TableColumnProfile {
    let rawValues = [table.headers[columnIndex]] + table.rows.map { row in
        columnIndex < row.count ? row[columnIndex] : ""
    }
    let values = rawValues.map(tableSizingText)
    let lengths = values.map(\.count)
    let maxLength = lengths.max() ?? 0
    let averageLength = lengths.isEmpty ? 0 : lengths.reduce(0, +) / lengths.count
    let maxWordLength = values
        .flatMap { $0.split(whereSeparator: \.isWhitespace) }
        .map(\.count)
        .max() ?? 0
    let header = values.first?.lowercased() ?? ""
    let alignment = table.alignments[columnIndex]
    let descriptiveHeaders = [
        "action", "decision", "description", "example", "explanation", "failure",
        "fix", "meaning", "notes", "reason", "risk", "signal", "tradeoff", "when", "why",
    ]
    let isCompact = (maxLength <= 18 && averageLength <= 12)
        || (alignment == .trailing && maxLength <= 24)
    let isDescriptive = !isCompact && (
        maxLength >= 38
            || averageLength >= 26
            || descriptiveHeaders.contains { header.contains($0) }
    )
    let wordFloor = CGFloat(min(maxWordLength, 20)) * 6.5 + 20

    if isCompact {
        let minimum = min(96, max(64, wordFloor))
        let ideal = min(120, max(minimum, CGFloat(maxLength) * 6.2 + 24))
        return TableColumnProfile(
            minimumWidth: minimum,
            idealWidth: ideal,
            isCompact: true,
            isDescriptive: false
        )
    }
    if isDescriptive {
        let minimum = min(160, max(112, wordFloor))
        let ideal = min(340, max(minimum, CGFloat(min(maxLength, 52)) * 5.8 + 32))
        return TableColumnProfile(
            minimumWidth: minimum,
            idealWidth: ideal,
            isCompact: false,
            isDescriptive: true
        )
    }
    let minimum = min(128, max(88, wordFloor))
    let ideal = min(220, max(minimum, CGFloat(min(maxLength, 30)) * 5.8 + 28))
    return TableColumnProfile(
        minimumWidth: minimum,
        idealWidth: ideal,
        isCompact: false,
        isDescriptive: false
    )
}

private func tableSizingText(_ value: String) -> String {
    cleanInline(value)
        .replacingOccurrences(of: #"[*_`~<>\[\]()]"#, with: "", options: .regularExpression)
        .trimmingCharacters(in: .whitespacesAndNewlines)
}

func parseTable(_ rawRows: [String]) -> ParsedTable? {
    guard rawRows.count >= 2 else { return nil }
    
    func splitRow(_ row: String) -> [String] {
        var parts: [String] = []
        var current = ""
        var escaped = false
        for character in row {
            if escaped {
                if character == "|" {
                    current.append(character)
                } else {
                    current.append("\\")
                    current.append(character)
                }
                escaped = false
            } else if character == "\\" {
                escaped = true
            } else if character == "|" {
                parts.append(current)
                current = ""
            } else {
                current.append(character)
            }
        }
        if escaped { current.append("\\") }
        parts.append(current)
        var columns = parts.map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
        if columns.first?.isEmpty == true { columns.removeFirst() }
        if columns.last?.isEmpty == true { columns.removeLast() }
        return columns
    }
    
    let headers = splitRow(rawRows[0])
    let separatorParts = splitRow(rawRows[1])
    guard !separatorParts.isEmpty && separatorParts.allSatisfy({ $0.allSatisfy({ $0 == "-" || $0 == ":" }) }) else {
        return nil
    }
    let alignments = separatorParts.map { separator -> MarkdownTableAlignment in
        if separator.hasPrefix(":"), separator.hasSuffix(":") {
            return .center
        }
        if separator.hasSuffix(":") {
            return .trailing
        }
        return .leading
    }
    
    var rows: [[String]] = []
    for i in 2..<rawRows.count {
        let cols = splitRow(rawRows[i])
        var normalizedCols = cols
        while normalizedCols.count < headers.count {
            normalizedCols.append("")
        }
        if normalizedCols.count > headers.count {
            normalizedCols = Array(normalizedCols.prefix(headers.count))
        }
        rows.append(normalizedCols)
    }
    
    return ParsedTable(headers: headers, rows: rows, alignments: alignments)
}

struct TableViewWrapper: View {
    let rows: [String]
    @State private var measuredHeight: CGFloat = 120

    var body: some View {
        if let table = parseTable(rows) {
            GeometryReader { geometry in
                ScrollView(.horizontal, showsIndicators: true) {
                    TableView(table: table, availableWidth: geometry.size.width)
                        .fixedSize(horizontal: false, vertical: true)
                        .background {
                            GeometryReader { tableGeometry in
                                Color.clear.preference(
                                    key: TableHeightPreferenceKey.self,
                                    value: tableGeometry.size.height
                                )
                            }
                        }
                }
                .scrollBounceBehavior(.basedOnSize, axes: .horizontal)
            }
            .frame(height: measuredHeight)
            .onPreferenceChange(TableHeightPreferenceKey.self) { height in
                guard height > 0, abs(measuredHeight - height) > 0.5 else { return }
                measuredHeight = ceil(height)
            }
        } else {
            ScrollView(.horizontal, showsIndicators: true) {
                Text(rows.joined(separator: "\n"))
                    .font(.system(.caption, design: .monospaced))
                    .padding(12)
            }
            .background(.thinMaterial, in: RoundedRectangle(cornerRadius: 10, style: .continuous))
        }
    }
}

private struct TableHeightPreferenceKey: PreferenceKey {
    static var defaultValue: CGFloat = 0

    static func reduce(value: inout CGFloat, nextValue: () -> CGFloat) {
        value = max(value, nextValue())
    }
}

struct TableView: View {
    let table: ParsedTable
    let availableWidth: CGFloat

    var body: some View {
        let horizontalSpacing: CGFloat = 12
        let horizontalPadding: CGFloat = 24
        let columnWidths = adaptiveTableColumnWidths(
            for: table,
            availableWidth: availableWidth,
            horizontalSpacing: horizontalSpacing,
            horizontalPadding: horizontalPadding
        )
        let gridWidth = columnWidths.reduce(0, +)
            + horizontalSpacing * CGFloat(max(0, columnWidths.count - 1))

        Grid(alignment: .leading, horizontalSpacing: horizontalSpacing, verticalSpacing: 8) {
            GridRow(alignment: .top) {
                ForEach(table.headers.indices, id: \.self) { columnIndex in
                    let alignment = table.alignments[columnIndex]
                    InlineMarkdownContent(
                        text: table.headers[columnIndex],
                        font: .subheadline.bold(),
                        fontScale: 0.9,
                        isBold: true
                    )
                        .frame(width: columnWidths[columnIndex], alignment: alignment.frameAlignment)
                        .fixedSize(horizontal: false, vertical: true)
                        .multilineTextAlignment(alignment.textAlignment)
                        .padding(.vertical, 8)
                }
            }
            
            Divider()
                .gridCellUnsizedAxes(.horizontal)
            
            ForEach(0..<table.rows.count, id: \.self) { rowIndex in
                let row = table.rows[rowIndex]
                GridRow(alignment: .top) {
                    ForEach(0..<row.count, id: \.self) { colIndex in
                        let alignment = table.alignments[colIndex]
                        InlineMarkdownContent(
                            text: row[colIndex],
                            font: .subheadline,
                            fontScale: 0.9
                        )
                            .frame(width: columnWidths[colIndex], alignment: alignment.frameAlignment)
                            .fixedSize(horizontal: false, vertical: true)
                            .multilineTextAlignment(alignment.textAlignment)
                            .padding(.vertical, 4)
                    }
                }
                if rowIndex < table.rows.count - 1 {
                    Divider()
                        .gridCellUnsizedAxes(.horizontal)
                }
            }
        }
        .frame(width: gridWidth, alignment: .leading)
        .padding(12)
        .background(.thinMaterial, in: RoundedRectangle(cornerRadius: 8, style: .continuous))
        .overlay {
            RoundedRectangle(cornerRadius: 8, style: .continuous)
                .stroke(.quaternary, lineWidth: 1)
        }
    }
}

struct LaTeXView: View {
    let latex: String
    let isBlock: Bool
    let fontScale: CGFloat
    let isBold: Bool
    let usesSecondaryColor: Bool
    let allowsTextSelection: Bool
    @State private var height: CGFloat
    @State private var isReady = false
    @State private var selectedEntry: GlossaryEntry? = nil
    @State private var selectedResource: BundledResource?

    init(
        latex: String,
        isBlock: Bool,
        fontScale: CGFloat = 1,
        isBold: Bool = false,
        usesSecondaryColor: Bool = false,
        allowsTextSelection: Bool = true
    ) {
        self.latex = latex
        self.isBlock = isBlock
        self.fontScale = fontScale
        self.isBold = isBold
        self.usesSecondaryColor = usesSecondaryColor
        self.allowsTextSelection = allowsTextSelection
        // Estimate initial height based on content length to prevent layout jumps
        let estimatedHeight: CGFloat
        if isBlock {
            let lineCount = max(1, CGFloat(latex.components(separatedBy: "\n").count))
            estimatedHeight = 28 + lineCount * 30
        } else {
            // Inline: estimate based on text length, roughly 20px per line at ~80 chars
            let charCount = CGFloat(latex.count)
            let estimatedLines = max(1, ceil(charCount / 70))
            estimatedHeight = estimatedLines * 26
        }
        _height = State(initialValue: estimatedHeight)
    }

    var body: some View {
        LaTeXWebView(
            latex: latex,
            isBlock: isBlock,
            fontScale: fontScale,
            isBold: isBold,
            usesSecondaryColor: usesSecondaryColor,
            allowsTextSelection: allowsTextSelection,
            height: $height,
            isReady: $isReady,
            selectedEntry: $selectedEntry,
            selectedResource: $selectedResource
        )
            .frame(height: height)
            .opacity(isReady ? 1 : 0)
            .animation(.easeIn(duration: 0.15), value: isReady)
            .sheet(item: $selectedEntry) { entry in
                NavigationStack {
                    GlossaryDetailView(entry: entry)
                        .toolbar {
                            ToolbarItem(placement: .cancellationAction) {
                                Button {
                                    selectedEntry = nil
                                } label: {
                                    #if targetEnvironment(macCatalyst)
                                    Image(systemName: "xmark.circle.fill")
                                        .symbolRenderingMode(.hierarchical)
                                        .font(.title3)
                                        .foregroundStyle(.secondary)
                                    #else
                                    Text("Close")
                                    #endif
                                }
                                .accessibilityLabel("Close")
                            }
                        }
                }
            }
            .sheet(item: $selectedResource) { resource in
                BundledResourceView(resource: resource)
            }
    }
}

struct LaTeXWebView: UIViewRepresentable {
    let latex: String
    let isBlock: Bool
    let fontScale: CGFloat
    let isBold: Bool
    let usesSecondaryColor: Bool
    let allowsTextSelection: Bool
    @Binding var height: CGFloat
    @Binding var isReady: Bool
    @Binding var selectedEntry: GlossaryEntry?
    @Binding var selectedResource: BundledResource?
    @ObservedObject private var readerSettings = ReaderSettings.shared
    @Environment(\.colorScheme) private var colorScheme
    @Environment(\.dynamicTypeSize) private var dynamicTypeSize

    func makeUIView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        config.userContentController.add(context.coordinator, name: "layout")
        config.userContentController.add(context.coordinator, name: "glossaryHover")
        let webView = WKWebView(frame: .zero, configuration: config)
        webView.isUserInteractionEnabled = allowsTextSelection
        webView.navigationDelegate = context.coordinator
        webView.scrollView.isScrollEnabled = false
        webView.scrollView.showsHorizontalScrollIndicator = false
        webView.scrollView.showsVerticalScrollIndicator = false
        webView.isOpaque = false
        webView.backgroundColor = .clear
        webView.scrollView.backgroundColor = .clear
        return webView
    }

    func updateUIView(_ uiView: WKWebView, context: Context) {
        uiView.isUserInteractionEnabled = allowsTextSelection
        let html = generateHTML()
        if context.coordinator.lastLoadedHTML != html {
            let isInitialLoad = context.coordinator.lastLoadedHTML == nil
            context.coordinator.lastLoadedHTML = html
            if isInitialLoad {
                DispatchQueue.main.async {
                    isReady = false
                }
            }
            if let dataFolder = Bundle.main.resourceURL?.appendingPathComponent("data", isDirectory: true) {
                uiView.loadHTMLString(html, baseURL: dataFolder)
            } else {
                uiView.loadHTMLString(html, baseURL: nil)
            }
        }
    }

    func makeCoordinator() -> Coordinator {
        Coordinator(height: $height, isReady: $isReady, selectedEntry: $selectedEntry, selectedResource: $selectedResource)
    }

    static func dismantleUIView(_ uiView: WKWebView, coordinator: Coordinator) {
        uiView.configuration.userContentController.removeScriptMessageHandler(forName: "layout")
        uiView.configuration.userContentController.removeScriptMessageHandler(forName: "glossaryHover")
        coordinator.hideTooltip()
    }

    class Coordinator: NSObject, WKNavigationDelegate, WKScriptMessageHandler {
        var height: Binding<CGFloat>
        var isReady: Binding<Bool>
        var selectedEntry: Binding<GlossaryEntry?>
        var selectedResource: Binding<BundledResource?>
        var lastLoadedHTML: String? = nil
        private let tooltipPresenter = GlossaryHoverTooltipPresenter()
        private var hoverRequestID = 0

        init(height: Binding<CGFloat>, isReady: Binding<Bool>, selectedEntry: Binding<GlossaryEntry?>, selectedResource: Binding<BundledResource?>) {
            self.height = height
            self.isReady = isReady
            self.selectedEntry = selectedEntry
            self.selectedResource = selectedResource
        }

        func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
            if let url = navigationAction.request.url {
                if url.isFileURL, navigationAction.navigationType == .linkActivated {
                    Task { @MainActor in
                        if let resource = bundledAssetURL(for: url, dataService: DataService.shared) {
                            self.selectedResource.wrappedValue = BundledResource(url: resource)
                        }
                    }
                    decisionHandler(.cancel)
                    return
                }
                if let entryId = glossaryEntryID(for: url) {
                    hideTooltip()
                    Task { @MainActor in
                        if let entry = DataService.shared.glossaryEntry(id: entryId) {
                            self.selectedEntry.wrappedValue = entry
                        }
                    }
                    decisionHandler(.cancel)
                    return
                } else if let route = learnRoute(for: url) {
                    Task { @MainActor in
                        NotificationCenter.default.post(name: Notification.Name("NavigateToRoute"), object: route)
                    }
                    decisionHandler(.cancel)
                    return
                } else if let externalURL = externalContentURL(for: url) {
                    Task { @MainActor in
                        UIApplication.shared.open(externalURL)
                    }
                    decisionHandler(.cancel)
                    return
                } else if url.scheme == "http" || url.scheme == "https" {
                    Task { @MainActor in
                        UIApplication.shared.open(url)
                    }
                    decisionHandler(.cancel)
                    return
                }
            }
            decisionHandler(.allow)
        }

        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
            webView.evaluateJavaScript("window.reportLayout && window.reportLayout()")
        }

        func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
            if message.name == "layout", let heightValue = message.body as? NSNumber {
                DispatchQueue.main.async {
                    self.height.wrappedValue = max(24, CGFloat(heightValue.doubleValue) + 4)
                    self.isReady.wrappedValue = true
                }
                return
            }

            guard
                message.name == "glossaryHover",
                let payload = message.body as? [String: Any],
                let action = payload["action"] as? String
            else { return }
            if action == "hide" {
                hideTooltip()
                return
            }
            guard
                action == "show",
                let entryID = payload["id"] as? String,
                let webView = message.webView,
                let left = payload["left"] as? NSNumber,
                let top = payload["top"] as? NSNumber,
                let width = payload["width"] as? NSNumber,
                let height = payload["height"] as? NSNumber
            else { return }
            let anchor = CGRect(
                x: CGFloat(left.doubleValue),
                y: CGFloat(top.doubleValue),
                width: CGFloat(width.doubleValue),
                height: CGFloat(height.doubleValue)
            )
            hoverRequestID &+= 1
            let requestID = hoverRequestID
            Task { @MainActor in
                guard
                    self.hoverRequestID == requestID,
                    let entry = DataService.shared.glossaryEntry(id: entryID)
                else { return }
                self.tooltipPresenter.show(entry: entry, anchor: anchor, from: webView)
            }
        }

        func hideTooltip() {
            hoverRequestID &+= 1
            tooltipPresenter.hide()
        }
    }

    private func generateHTML() -> String {
        let renderedContent = isBlock ? escapeHTML("$$\(latex)$$") : renderInlineMarkdownHTML(latex)
        
        let fontFamily = readerSettings.fontTheme == "serif" 
            ? "Georgia, Cambria, 'Times New Roman', serif" 
            : "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
            
        let fontSize = scaledReaderFontSize(readerSettings.fontSize) * fontScale
        
        let isDark = readerSettings.readerColorScheme == "dark" ||
            (readerSettings.readerColorScheme == "system" && colorScheme == .dark)
            
        let textColor = usesSecondaryColor
            ? (isDark ? "#aeaeb2" : "#6e6e73")
            : (isDark ? "#f5f5f7" : "#1d1d1f")
        let fontWeight = isBold ? "700" : "400"
        
        return """
        <!DOCTYPE html>
        <html>
        <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link rel="stylesheet" href="katex/katex.min.css">
            <script defer src="katex/katex.min.js"></script>
            <script defer src="katex/auto-render.min.js"></script>
            <style>
                * { box-sizing: border-box; }
                body {
                    margin: 0;
                    padding: 0;
                    font-family: \(fontFamily);
                    font-size: \(fontSize)px;
                    font-weight: \(fontWeight);
                    line-height: 1.5;
                    background-color: transparent;
                    color: \(textColor);
                    overflow-wrap: anywhere;
                    -webkit-user-select: text;
                    user-select: text;
                }
                .katex-display {
                    margin: 0.3em 0;
                    overflow-x: auto;
                    overflow-y: hidden;
                    padding-bottom: 2px;
                }
                [data-glossary] {
                    color: #4f46e5;
                    border-bottom: 1px dotted #4f46e5;
                    cursor: pointer;
                    font-weight: 500;
                    text-decoration: none;
                    -webkit-tap-highlight-color: transparent;
                }
                [data-glossary]::after {
                    content: " ?";
                    font-size: 0.72em;
                    vertical-align: super;
                    opacity: 0.65;
                }
                sup.reference-citation {
                    font-size: 0.72em;
                    line-height: 0;
                    vertical-align: super;
                }
                sup.reference-citation a {
                    border-bottom: 1px dotted #4f46e5;
                    font-size: 1em;
                    font-weight: 600;
                    padding: 0 0.08em;
                    text-decoration: none;
                }
                a {
                    color: #4f46e5;
                    text-decoration: underline;
                    text-decoration-thickness: 1px;
                    text-underline-offset: 2px;
                }
                code {
                    border: 1px solid rgba(127, 127, 127, 0.2);
                    border-radius: 5px;
                    background: rgba(127, 127, 127, 0.12);
                    padding: 0.08em 0.3em;
                    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
                    font-size: 0.88em;
                }
                @media (prefers-color-scheme: dark) {
                    [data-glossary] {
                        color: #818cf8;
                        border-bottom: 1px dotted #818cf8;
                    }
                    a {
                        color: #818cf8;
                    }
                }
            </style>
        </head>
        <body>
            \(renderedContent)
            <script>
                window.contentReady = false;
                window.reportLayout = function() {
                    if (window.contentReady && window.webkit && window.webkit.messageHandlers.layout) {
                        window.webkit.messageHandlers.layout.postMessage(Math.ceil(document.documentElement.scrollHeight));
                    }
                };

                window.addEventListener("load", function() {
                    try {
                        if (typeof renderMathInElement === "function") {
                            renderMathInElement(document.body, {
                                delimiters: [
                                    {left: "$$", right: "$$", display: true},
                                    {left: "$", right: "$", display: false}
                                ],
                                throwOnError: false
                            });
                        }
                    } finally {
                        window.contentReady = true;
                    }
                    document.querySelectorAll("[data-glossary]").forEach(function(el) {
                        el.addEventListener("pointerenter", function(e) {
                            if (e.pointerType !== "mouse" || !window.webkit || !window.webkit.messageHandlers.glossaryHover) {
                                return;
                            }
                            const rect = el.getBoundingClientRect();
                            window.webkit.messageHandlers.glossaryHover.postMessage({
                                action: "show",
                                id: el.getAttribute("data-glossary"),
                                left: rect.left,
                                top: rect.top,
                                width: rect.width,
                                height: rect.height
                            });
                        });
                        el.addEventListener("pointerleave", function(e) {
                            if (e.pointerType === "mouse" && window.webkit && window.webkit.messageHandlers.glossaryHover) {
                                window.webkit.messageHandlers.glossaryHover.postMessage({action: "hide"});
                            }
                        });
                        el.addEventListener("click", function(e) {
                            e.preventDefault();
                            window.location.href = "glossary://" + el.getAttribute("data-glossary");
                        });
                    });
                    requestAnimationFrame(function() {
                        requestAnimationFrame(window.reportLayout);
                    });
                });
                new ResizeObserver(window.reportLayout).observe(document.body);
            </script>
        </body>
        </html>
        """
    }
}

struct CodeBlockMeta {
    let language: String
    var title: String? = nil
    var isOutput: Bool = false
    var isBare: Bool = false
    var isCompact: Bool = false
}

func parseCodeMeta(_ rawLine: String) -> CodeBlockMeta {
    let trimmed = rawLine.trimmingCharacters(in: .whitespacesAndNewlines)
    let components = trimmed.components(separatedBy: .whitespaces)
    let language = components.first?.lowercased() ?? ""
    
    var meta = CodeBlockMeta(language: language)
    if language == "text" || language == "terminal" {
        meta.isOutput = true
    }
    
    let pattern = #"([A-Za-z][A-Za-z0-9_-]*)(?:=(?:"([^"]*)"|'([^']*)'|([^\s]+)))?"#
    if let regex = try? NSRegularExpression(pattern: pattern, options: []) {
        let nsString = trimmed as NSString
        let matches = regex.matches(in: trimmed, options: [], range: NSRange(location: 0, length: nsString.length))
        
        for match in matches {
            guard match.numberOfRanges > 1 else { continue }
            let key = nsString.substring(with: match.range(at: 1)).lowercased()
            
            var value: String? = nil
            if match.range(at: 1).location == 0 {
                continue // skip the language word itself
            }
            
            if match.numberOfRanges > 2, match.range(at: 2).location != NSNotFound {
                value = nsString.substring(with: match.range(at: 2))
            } else if match.numberOfRanges > 3, match.range(at: 3).location != NSNotFound {
                value = nsString.substring(with: match.range(at: 3))
            } else if match.numberOfRanges > 4, match.range(at: 4).location != NSNotFound {
                value = nsString.substring(with: match.range(at: 4))
            }
            
            if key == "bare" || key == "noheader" {
                meta.isBare = true
            } else if key == "compact" {
                meta.isCompact = true
            } else if key == "output" {
                meta.isOutput = true
                meta.isCompact = true
            } else if key == "title" || key == "filename" {
                meta.title = value
            }
        }
    }
    
    return meta
}

struct CodeBlockView: View {
    let rawLanguage: String
    let source: String
    let isDarkMode: Bool
    @ObservedObject private var readerSettings = ReaderSettings.shared
    
    var body: some View {
        let meta = parseCodeMeta(rawLanguage)
        let codeFontSize = max(11, scaledReaderFontSize(readerSettings.fontSize) - 3)
        
        VStack(alignment: .leading, spacing: 0) {
            if !meta.isBare {
                HStack(spacing: 8) {
                    HStack(spacing: 6) {
                        Circle().fill(Color.red.opacity(0.8)).frame(width: 9, height: 9)
                        Circle().fill(Color.yellow.opacity(0.8)).frame(width: 9, height: 9)
                        Circle().fill(Color.green.opacity(0.8)).frame(width: 9, height: 9)
                    }
                    .padding(.leading, 12)
                    .accessibilityHidden(true)
                    
                    Spacer()
                    
                    if let title = meta.title {
                        Text(title)
                            .font(.system(.caption2, design: .monospaced))
                            .fontWeight(.medium)
                            .foregroundStyle(.secondary)
                            .accessibilityLabel("Code sample: \(title)")
                    } else if meta.isOutput {
                        Text("Output")
                            .font(.system(.caption2, design: .monospaced))
                            .fontWeight(.medium)
                            .foregroundStyle(.secondary)
                    }
                    
                    Spacer()
                    
                    Text(meta.language.uppercased())
                        .font(.system(.caption2, design: .default).bold())
                        .foregroundStyle(.secondary)
                        .padding(.trailing, 12)
                        .accessibilityLabel("Language: \(meta.language)")
                }
                .padding(.vertical, 6)
                .frame(minHeight: 32)
                .background(Color.secondary.opacity(0.08))
                
                Divider()
            }
            
            ScrollView(.horizontal, showsIndicators: true) {
                Text(highlightCode(source, language: meta.language, isDarkMode: isDarkMode, fontSize: codeFontSize))
                    .font(.system(size: codeFontSize, design: .monospaced))
                    .textSelection(.enabled)
                    .padding(meta.isCompact ? 10 : 14)
                    .frame(maxWidth: .infinity, alignment: .leading)
            }
        }
        .id("code_\(codeFontSize)_\(isDarkMode)")
        .background(meta.isOutput ? Color.secondary.opacity(0.02) : Color.primary.opacity(0.01))
        .background(.thinMaterial, in: RoundedRectangle(cornerRadius: 10, style: .continuous))
        .overlay {
            RoundedRectangle(cornerRadius: 10, style: .continuous)
                .stroke(.quaternary, lineWidth: 1)
        }
    }
}

struct CheckpointAccordionView: View {
    let source: String
    @State private var isExpanded = false
    @Environment(\.colorScheme) private var colorScheme
    @ObservedObject private var readerSettings = ReaderSettings.shared

    var body: some View {
        let cleanSource = source.trimmingCharacters(in: .whitespacesAndNewlines)
        let parts = cleanSource.components(separatedBy: "\n---")
        let question = parts.first?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        let answer = parts.count > 1 ? parts.dropFirst().joined(separator: "\n---").trimmingCharacters(in: .whitespacesAndNewlines) : ""
        let amberColor = Color(red: 245/255, green: 158/255, blue: 11/255)

        let isEffectiveDarkMode = readerSettings.readerColorScheme == "light" ? false : (readerSettings.readerColorScheme == "dark" ? true : colorScheme == .dark)

        return VStack(alignment: .leading, spacing: 0) {
            Button(action: {
                withAnimation(.easeInOut(duration: 0.2)) {
                    isExpanded.toggle()
                }
            }) {
                HStack(alignment: .top, spacing: 12) {
                    ZStack {
                        Circle()
                            .fill(amberColor.opacity(0.1))
                            .frame(width: 28, height: 28)
                        Image(systemName: "questionmark.circle.fill")
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundStyle(amberColor)
                    }
                    .padding(.top, 2)
                    
                    InlineMarkdownContent(text: question)
                        .multilineTextAlignment(.leading)
                        .allowsHitTesting(false)
                    
                    Spacer()
                    
                    Image(systemName: "chevron.right")
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundStyle(.secondary)
                        .rotationEffect(.degrees(isExpanded ? 90 : 0))
                        .padding(.top, 8)
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 14)
                .contentShape(Rectangle())
            }
            .buttonStyle(.plain)
            
            if isExpanded {
                VStack(alignment: .leading, spacing: 8) {
                    Divider()
                        .background(Color.primary.opacity(0.1))
                        .padding(.vertical, 8)
                    
                    Text("ANSWER")
                        .font(.system(size: 10, weight: .bold))
                        .foregroundStyle(.secondary)
                        .tracking(1)
                    
                    MarkdownContentView(markdown: answer, scrollPrefix: "checkpoint-answer")
                }
                .padding(.horizontal, 16)
                .padding(.bottom, 16)
            }
        }
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(Color.indigo.opacity(isEffectiveDarkMode ? 0.05 : 0.03))
        )
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(Color.indigo.opacity(isEffectiveDarkMode ? 0.2 : 0.1), lineWidth: 1)
        )
        .padding(.vertical, 8)
    }
}

private struct MarkdownDisclosureView: View {
    let title: String
    let markdown: String
    @State private var isExpanded = false

    var body: some View {
        DisclosureGroup(isExpanded: $isExpanded) {
            MarkdownContentView(markdown: markdown, scrollPrefix: "disclosure")
                .padding(.top, 12)
        } label: {
            InlineMarkdownContent(text: title, font: .headline, fontScale: 0.95, isBold: true)
                .allowsHitTesting(false)
        }
        .padding(16)
        .background(.thinMaterial, in: RoundedRectangle(cornerRadius: 12, style: .continuous))
        .overlay {
            RoundedRectangle(cornerRadius: 12, style: .continuous)
                .stroke(.quaternary, lineWidth: 1)
        }
        .padding(.vertical, 8)
    }
}

struct ReaderSettingsView: View {
    @ObservedObject private var readerSettings = ReaderSettings.shared
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
            HStack {
                Text("Text Options")
                    .font(.headline)
                Spacer()
                Button {
                    dismiss()
                } label: {
                    #if targetEnvironment(macCatalyst)
                    Image(systemName: "xmark.circle.fill")
                        .symbolRenderingMode(.hierarchical)
                        .font(.title3)
                        .foregroundStyle(.secondary)
                    #else
                    Text("Done")
                        .fontWeight(.semibold)
                    #endif
                }
                .buttonStyle(.plain)
                .accessibilityLabel("Done")
            }
            .padding(.bottom, 4)
            
            Divider()

            // Font Style Selection
            VStack(alignment: .leading, spacing: 10) {
                Text("FONT STYLE")
                    .font(.caption2.weight(.bold))
                    .foregroundStyle(.secondary)
                
                Picker("Font Style", selection: $readerSettings.fontTheme) {
                    Text("Serif").tag("serif")
                    Text("Sans-Serif").tag("sans")
                }
                .pickerStyle(.segmented)
            }

            // Font Size Selection
            VStack(alignment: .leading, spacing: 10) {
                Text("FONT SIZE")
                    .font(.caption2.weight(.bold))
                    .foregroundStyle(.secondary)
                
                HStack(spacing: 16) {
                    Button(action: {
                        if readerSettings.fontSize > 14 {
                            readerSettings.fontSize -= 1
                        }
                    }) {
                        Image(systemName: "textformat.size.smaller")
                            .font(.body.weight(.semibold))
                            .padding(.vertical, 10)
                            .frame(maxWidth: .infinity)
                            .background(Color.primary.opacity(0.08), in: RoundedRectangle(cornerRadius: 8, style: .continuous))
                    }
                    .buttonStyle(.plain)
                    .disabled(readerSettings.fontSize <= 14)
                    .foregroundStyle(readerSettings.fontSize <= 14 ? .tertiary : .primary)
                    .accessibilityLabel("Decrease text size")

                    Text("\(Int(readerSettings.fontSize)) pt")
                        .font(.headline.monospacedDigit())
                        .frame(width: 60)
                    
                    Button(action: {
                        if readerSettings.fontSize < 30 {
                            readerSettings.fontSize += 1
                        }
                    }) {
                        Image(systemName: "textformat.size.larger")
                            .font(.body.weight(.semibold))
                            .padding(.vertical, 10)
                            .frame(maxWidth: .infinity)
                            .background(Color.primary.opacity(0.08), in: RoundedRectangle(cornerRadius: 8, style: .continuous))
                    }
                    .buttonStyle(.plain)
                    .disabled(readerSettings.fontSize >= 30)
                    .foregroundStyle(readerSettings.fontSize >= 30 ? .tertiary : .primary)
                    .accessibilityLabel("Increase text size")
                }
            }

            // Theme/Color Scheme Selection
            VStack(alignment: .leading, spacing: 10) {
                Text("THEME")
                    .font(.caption2.weight(.bold))
                    .foregroundStyle(.secondary)
                
                Picker("Theme", selection: $readerSettings.readerColorScheme) {
                    Text("System").tag("system")
                    Text("Light").tag("light")
                    Text("Dark").tag("dark")
                }
                .pickerStyle(.segmented)
            }
            }
            .padding(24)
            .frame(maxWidth: 450)
            .frame(maxWidth: .infinity)
        }
    }
}

struct ReaderContentsView: View {
    let markdown: String
    let prefix: String
    let onSelect: (String) -> Void
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            List {
                Button("Introduction") { select("header") }
                ForEach(MarkdownBlockCache.shared.blocks(for: markdown)) { block in
                    if case .heading(let level, let text) = block.kind {
                        Button {
                            select("\(prefix)_block_\(block.id)")
                        } label: {
                            Text((try? AttributedString(markdown: text)) ?? AttributedString(text))
                                .foregroundStyle(.primary)
                                .padding(.leading, CGFloat(max(level - 2, 0)) * 14)
                                .frame(minHeight: 32, alignment: .leading)
                        }
                    }
                }
            }
            .navigationTitle("Contents")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button {
                        dismiss()
                    } label: {
                        #if targetEnvironment(macCatalyst)
                        Image(systemName: "xmark.circle.fill")
                            .symbolRenderingMode(.hierarchical)
                            .font(.title3)
                            .foregroundStyle(.secondary)
                        #else
                        Text("Done")
                        #endif
                    }
                    .accessibilityLabel("Done")
                }
            }
        }
        .presentationDetents([.medium, .large])
        .presentationDragIndicator(.visible)
    }

    private func select(_ anchor: String) {
        dismiss()
        onSelect(anchor)
    }
}
