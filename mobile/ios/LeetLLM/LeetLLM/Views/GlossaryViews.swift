import SwiftUI

struct GlossaryView: View {
    @ObservedObject private var dataService = DataService.shared
    @ObservedObject private var navigation = AppNavigation.shared
    @Environment(\.horizontalSizeClass) private var horizontalSizeClass
    @State private var query = ""
    @AppStorage("glossarySortMode") private var sortMode: GlossarySortMode = .alphabetical
    @State private var selectedID: String?

    var body: some View {
        let entries = visibleEntries
        let activeEntry = selectedEntry(in: entries) ?? entries.first
        Group {
            if horizontalSizeClass == .regular {
                #if targetEnvironment(macCatalyst)
                MacSplitView(sidebarWidth: 300) {
                    VStack(spacing: 0) {
                        MacSidebarSearchBar(text: $query, placeholder: "Search terms and definitions")
                        glossaryList(entries: entries)
                    }
                } detail: {
                    if let entry = activeEntry {
                        GlossaryDetailView(
                            entry: entry,
                            isSplitDetail: true,
                            onSelectRelatedTerm: { related in
                                selectedID = related.id
                            }
                        )
                        .id(entry.id)
                    } else {
                        EmptyStateView(title: "No Terms", message: "Bundled glossary is unavailable.", systemImage: "text.book.closed")
                    }
                }
                #else
                NavigationSplitView {
                    glossaryList(entries: entries)
                        .navigationTitle("Glossary")
                        .navigationBarTitleDisplayMode(.inline)
                        .navigationSplitViewColumnWidth(min: 240, ideal: 285, max: 340)
                } detail: {
                    if let entry = activeEntry {
                        GlossaryDetailView(
                            entry: entry,
                            isSplitDetail: true,
                            onSelectRelatedTerm: { related in
                                selectedID = related.id
                            }
                        )
                        .id(entry.id)
                    } else {
                        EmptyStateView(title: "No Terms", message: "Bundled glossary is unavailable.", systemImage: "text.book.closed")
                    }
                }
                #endif
            } else {
                NavigationStack {
                    glossaryList(entries: entries)
                        .navigationTitle(horizontalSizeClass == .regular ? "Glossary" : "")
                        .navigationBarTitleDisplayMode(.inline)
                        .navigationDestination(for: String.self) { id in
                            if let entry = dataService.glossaryEntry(id: id) {
                                GlossaryDetailView(entry: entry)
                            }
                        }
                }
            }
        }
        .onAppear {
            if horizontalSizeClass == .regular, selectedID == nil {
                selectedID = navigation.selectedGlossaryID ?? entries.first?.id
            }
        }
        .onChange(of: selectedID) { _, id in
            if let id { navigation.selectedGlossaryID = id }
        }
        .onChange(of: query) { _, _ in
            let updatedEntries = visibleEntries
            if selectedEntry(in: updatedEntries) == nil {
                selectedID = updatedEntries.first?.id
            }
        }
    }

    private func selectedEntry(in entries: [GlossaryEntry]) -> GlossaryEntry? {
        guard let selectedID else { return nil }
        return entries.first { $0.id == selectedID }
    }

    private var visibleEntries: [GlossaryEntry] {
        let normalized = query.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        let matches = normalized.isEmpty ? dataService.glossary : dataService.glossary.filter { entry in
            dataService.glossaryMatches(entry, normalizedQuery: normalized)
        }
        if normalized.isEmpty {
            return sortMode.sort(matches)
        } else {
            let prioritized = matches.map { entry in
                (entry, dataService.glossarySearchPriority(entry, normalizedQuery: normalized))
            }
            return prioritized.sorted { left, right in
                if left.1 != right.1 {
                    return left.1 < right.1
                }
                return sortMode.compare(left.0, right.0)
            }.map(\.0)
        }
    }

    private func visibleEntryGroups(from entries: [GlossaryEntry]) -> [GlossaryEntryGroup] {
        entries.reduce(into: [GlossaryEntryGroup]()) { groups, entry in
            if let index = groups.indices.last, groups[index].title == entry.importanceLevelTitle {
                groups[index].entries.append(entry)
            } else {
                groups.append(GlossaryEntryGroup(title: entry.importanceLevelTitle, entries: [entry]))
            }
        }
    }

    private func alphabeticalEntryGroups(from entries: [GlossaryEntry]) -> [GlossaryEntryGroup] {
        entries.reduce(into: [GlossaryEntryGroup]()) { groups, entry in
            let initial = entry.title.first.map { String($0).uppercased() } ?? "#"
            let title = initial.rangeOfCharacter(from: .letters) == nil ? "#" : initial
            if let index = groups.indices.last, groups[index].title == title {
                groups[index].entries.append(entry)
            } else {
                groups.append(GlossaryEntryGroup(title: title, entries: [entry]))
            }
        }
    }

    @ViewBuilder
    private func glossaryList(entries: [GlossaryEntry]) -> some View {
        if horizontalSizeClass == .regular {
            #if targetEnvironment(macCatalyst)
            List {
                glossaryListContent(entries: entries, withSimultaneousGesture: true)
            }
            .listStyle(.sidebar)
            .scrollContentBackground(.hidden)
            #else
            List(selection: $selectedID) {
                glossaryListContent(entries: entries, withSimultaneousGesture: true)
            }
            .listStyle(.sidebar)
            .searchable(text: $query, placement: .navigationBarDrawer(displayMode: .always), prompt: "Search terms and definitions")
            #endif
        } else {
            List {
                glossaryListContent(entries: entries, withSimultaneousGesture: false)
            }
            .listStyle(.insetGrouped)
            .searchable(text: $query, prompt: "Search terms and definitions")
        }
    }

    @ViewBuilder
    private func glossaryListContent(entries: [GlossaryEntry], withSimultaneousGesture: Bool) -> some View {
        Section {
            Picker("Sort glossary terms", selection: $sortMode) {
                ForEach(GlossarySortMode.allCases) { mode in
                    Text(mode.title).tag(mode)
                }
            }
            .pickerStyle(.segmented)
            .accessibilityLabel("Sort glossary terms")
            #if targetEnvironment(macCatalyst)
            .listRowBackground(Color.clear)
            #endif

            HStack {
                Label("\(entries.count) terms", systemImage: "text.book.closed")
                Spacer()
                if !query.isEmpty {
                    Button("Clear") {
                        query = ""
                    }
                    .font(.subheadline.weight(.semibold))
                }
            }
            .font(.subheadline)
            .foregroundStyle(.secondary)
            #if targetEnvironment(macCatalyst)
            .listRowBackground(Color.clear)
            #endif
        }

        if entries.isEmpty {
            ContentUnavailableView.search(text: query)
                .listRowBackground(Color.clear)
        } else if !query.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            Section("Results") {
                glossaryRows(for: entries, withSimultaneousGesture: withSimultaneousGesture, showImportance: true)
            }
        } else if sortMode == .relevance {
            ForEach(visibleEntryGroups(from: entries)) { group in
                Section("\(group.title) (\(group.entries.count))") {
                    glossaryRows(for: group.entries, withSimultaneousGesture: withSimultaneousGesture, showImportance: false)
                }
            }
        } else {
            ForEach(alphabeticalEntryGroups(from: entries)) { group in
                Section(group.title) {
                    glossaryRows(for: group.entries, withSimultaneousGesture: withSimultaneousGesture, showImportance: true)
                }
            }
        }
    }

    @ViewBuilder
    private func glossaryRows(for entries: [GlossaryEntry], withSimultaneousGesture: Bool, showImportance: Bool) -> some View {
        ForEach(entries) { entry in
            if withSimultaneousGesture {
                #if targetEnvironment(macCatalyst)
                Button {
                    selectedID = entry.id
                } label: {
                    glossaryRow(for: entry, showImportance: showImportance, isSelected: selectedID == entry.id)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .contentShape(Rectangle())
                }
                .buttonStyle(.plain)
                .listRowBackground(macSidebarRowBackground(isSelected: selectedID == entry.id))
                #else
                NavigationLink(value: entry.id) {
                    glossaryRow(for: entry, showImportance: showImportance, isSelected: selectedID == entry.id)
                }
                .simultaneousGesture(TapGesture().onEnded {
                    selectedID = entry.id
                })
                #endif
            } else {
                NavigationLink(value: entry.id) {
                    glossaryRow(for: entry, showImportance: showImportance, isSelected: false)
                }
            }
        }
    }

    @ViewBuilder
    private func glossaryRow(for entry: GlossaryEntry, showImportance: Bool, isSelected: Bool) -> some View {
        HStack(spacing: 8) {
            Text(entry.title)
                .font(.subheadline.weight(.medium))
                .foregroundStyle(.primary)
                .lineLimit(1)
            Spacer(minLength: 8)
            glossaryRowPills(for: entry, showImportance: showImportance)
        }
        .padding(.vertical, 5)
        .frame(maxWidth: .infinity, alignment: .leading)
        .contentShape(Rectangle())
    }

    @ViewBuilder
    private func glossaryRowPills(for entry: GlossaryEntry, showImportance: Bool) -> some View {
        if showImportance || entry.kind == "code" {
            HStack(spacing: 6) {
                if showImportance {
                    StatusPill(entry.importanceLevelTitle, tint: entry.importanceTint)
                }
                if entry.kind == "code" {
                    StatusPill("code", tint: .secondary)
                }
            }
        }
    }
}

private struct GlossaryEntryGroup: Identifiable {
    let title: String
    var entries: [GlossaryEntry]

    var id: String { title }
}

enum GlossarySortMode: String, CaseIterable, Identifiable {
    case alphabetical
    case relevance

    var id: String { rawValue }

    var title: String {
        switch self {
        case .alphabetical: return "A-Z"
        case .relevance: return "Relevance"
        }
    }

    func compare(_ left: GlossaryEntry, _ right: GlossaryEntry) -> Bool {
        switch self {
        case .alphabetical:
            return GlossarySortMode.compareByTitle(left, right)
        case .relevance:
            if left.importance != right.importance {
                return left.importance > right.importance
            }
            return GlossarySortMode.compareByTitle(left, right)
        }
    }

    func sort(_ entries: [GlossaryEntry]) -> [GlossaryEntry] {
        entries.sorted(by: compare)
    }

    private static func compareByTitle(_ left: GlossaryEntry, _ right: GlossaryEntry) -> Bool {
        let comparison = left.title.localizedCaseInsensitiveCompare(right.title)
        if comparison != .orderedSame {
            return comparison == .orderedAscending
        }
        return left.id < right.id
    }
}

private extension GlossaryEntry {
    var importanceLevelTitle: String {
        switch importance {
        case 90...:
            return "Essential"
        case 80..<90:
            return "Core"
        case 70..<80:
            return "Important"
        case 60..<70:
            return "Applied"
        case 50..<60:
            return "Supporting"
        case 40..<50:
            return "Background"
        case 30..<40:
            return "Context"
        case 20..<30:
            return "Optional"
        case 10..<20:
            return "Niche"
        default:
            return "Reference"
        }
    }

    var importanceTint: Color {
        switch importance {
        case 80...:
            return .indigo
        default:
            return .secondary
        }
    }
}

private final class GlossaryScrollPositionBox {
    var id: String?
}

struct GlossaryDetailView: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(\.horizontalSizeClass) private var horizontalSizeClass
    let entry: GlossaryEntry
    var isSplitDetail: Bool = false
    var onSelectRelatedTerm: ((GlossaryEntry) -> Void)? = nil
    @State private var scrollPositionBox = GlossaryScrollPositionBox()
    @State private var isScrolledPastHeader = false

    var body: some View {
        let scrollPositionBinding = Binding<String?>(
            get: { scrollPositionBox.id },
            set: { newVal in
                scrollPositionBox.id = newVal
                guard !isSplitDetail else { return }
                let pastHeader = newVal != nil && newVal != "header"
                if isScrolledPastHeader != pastHeader {
                    isScrolledPastHeader = pastHeader
                }
            }
        )
        ScrollView {
            LazyVStack(alignment: .leading, spacing: 20) {
                VStack(alignment: .leading, spacing: 10) {
                    HStack(spacing: 6) {
                        StatusPill(entry.importanceLevelTitle, tint: entry.importanceTint)
                        if let kind = entry.kind {
                            StatusPill(kind, tint: kind == "code" ? .orange : .indigo)
                        }
                    }

                    ContentTitle(entry.title)
                        .textSelection(.enabled)

                    if let aliases = entry.aliases, !aliases.isEmpty {
                        Text("Also known as \(aliases.joined(separator: ", ")).")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                            .textSelection(.enabled)
                    }

                    MarkdownContentView(
                        markdown: entry.definition,
                        scrollPrefix: "glossary-definition",
                        font: .body,
                        foregroundColor: .primary
                    )
                }
                .id("header")

                if let intuition = entry.intuition {
                    GlossarySection(title: "Intuition", text: intuition)
                }
                GlossarySection(title: "Example", text: entry.example)
                if let formula = entry.formula {
                    GlossarySection(title: "Formula", text: formula)
                }
                if let details = entry.details {
                    ForEach(details, id: \.title) { detail in
                        GlossarySection(title: detail.title, text: detail.content)
                    }
                }
                if let decisionRule = entry.decisionRule {
                    GlossarySection(title: "Decision rule", text: decisionRule)
                }
                if let pitfall = entry.pitfall {
                    GlossarySection(title: "Common mistake", text: pitfall)
                }
                GlossarySection(title: "Why it matters", text: entry.relevance)
                if let related = entry.related, !related.isEmpty {
                    GlossaryRelatedTermsSection(terms: related, onSelectRelatedTerm: onSelectRelatedTerm)
                }
                if let code = entry.code, entry.shouldDisplayStandaloneCode {
                    VStack(alignment: .leading, spacing: 8) {
                        Text(code.title)
                            .font(.title3.bold())
                        ScrollView(.horizontal) {
                            Text(code.source)
                                .font(.system(.footnote, design: .monospaced))
                                .textSelection(.enabled)
                                .padding(12)
                        }
                        .background(.thinMaterial, in: RoundedRectangle(cornerRadius: 10, style: .continuous))
                    }
                }
                if let usage = entry.usage, !usage.isEmpty {
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Where it appears")
                            .font(.title3.bold())
                        ForEach(usage) { item in
                            Button {
                                let slug = item.url.split(separator: "/").last.map(String.init) ?? ""
                                if !slug.isEmpty && !item.url.contains("/blog/") {
                                    let route = LearnRoute.lesson(slug)
                                    dismiss()
                                    NotificationCenter.default.post(name: Notification.Name("NavigateToRoute"), object: route)
                                }
                            } label: {
                                HStack {
                                    VStack(alignment: .leading, spacing: 5) {
                                        Text(item.title)
                                            .font(.headline)
                                            .foregroundStyle(.primary)
                                        Text((try? AttributedString(markdown: item.excerpt)) ?? AttributedString(item.excerpt))
                                            .font(.subheadline)
                                            .foregroundStyle(.secondary)
                                            .multilineTextAlignment(.leading)
                                            .lineLimit(3)
                                    }
                                    Spacer()
                                    Image(systemName: "chevron.right")
                                        .font(.subheadline)
                                        .foregroundStyle(.secondary)
                                }
                                .padding(12)
                                .frame(maxWidth: .infinity, alignment: .leading)
                                .background(.thinMaterial, in: RoundedRectangle(cornerRadius: 10, style: .continuous))
                            }
                            .buttonStyle(.plain)
                        }
                    }
                }
            }
            .padding(.horizontal, horizontalSizeClass == .regular ? 24 : 16)
            .padding(.vertical, 16)
            .frame(maxWidth: .infinity, alignment: .leading)
            .scrollTargetLayout()
        }
        .scrollPosition(id: scrollPositionBinding)
        .navigationTitle(isSplitDetail || !isScrolledPastHeader ? "" : entry.title)
        .navigationBarTitleDisplayMode(.inline)
    }
}

private struct GlossarySection: View {
    let title: String
    let text: String

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title)
                .font(.title3.bold())
                .foregroundStyle(.primary)
                .accessibilityAddTraits(.isHeader)
            MarkdownContentView(markdown: text, scrollPrefix: "glossary-\(title)")
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

private struct GlossaryRelatedTermsSection: View {
    let terms: [GlossaryRelatedTerm]
    var onSelectRelatedTerm: ((GlossaryEntry) -> Void)? = nil
    @ObservedObject private var dataService = DataService.shared

    private let columns = [GridItem(.adaptive(minimum: 140), spacing: 10)]

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Label("Related terms", systemImage: "point.3.connected.trianglepath.dotted")
                .font(.headline)

            LazyVGrid(columns: columns, alignment: .leading, spacing: 10) {
                ForEach(terms) { term in
                    if let entry = dataService.glossaryEntry(id: term.id) {
                        if let onSelectRelatedTerm {
                            Button {
                                onSelectRelatedTerm(entry)
                            } label: {
                                relatedTermCard(term)
                            }
                            .buttonStyle(.plain)
                            .accessibilityLabel("Open \(term.title)")
                        } else {
                            NavigationLink {
                                GlossaryDetailView(entry: entry)
                            } label: {
                                relatedTermCard(term)
                            }
                            .buttonStyle(.plain)
                            .accessibilityLabel("Open \(term.title)")
                        }
                    }
                }
            }
        }
        .padding(16)
        .background(Color.indigo.opacity(0.08), in: RoundedRectangle(cornerRadius: 16, style: .continuous))
    }

    private func relatedTermCard(_ term: GlossaryRelatedTerm) -> some View {
        HStack(spacing: 8) {
            Text(term.title)
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(.primary)
                .multilineTextAlignment(.leading)
            Spacer(minLength: 4)
            Image(systemName: "chevron.right")
                .font(.caption.bold())
                .foregroundStyle(.secondary)
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 10)
        .frame(maxWidth: .infinity, minHeight: 44, alignment: .leading)
        .background(.thinMaterial, in: RoundedRectangle(cornerRadius: 12, style: .continuous))
    }
}
