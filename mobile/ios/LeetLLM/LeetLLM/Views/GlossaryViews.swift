import SwiftUI

struct GlossaryView: View {
    @ObservedObject private var dataService = DataService.shared
    @ObservedObject private var navigation = AppNavigation.shared
    @Environment(\.horizontalSizeClass) private var horizontalSizeClass
    @State private var query = ""
    @AppStorage("glossarySortMode") private var sortMode: GlossarySortMode = .alphabetical
    @State private var selectedID: String?

    var body: some View {
        Group {
            if horizontalSizeClass == .regular {
                #if targetEnvironment(macCatalyst)
                MacSplitView(sidebarWidth: 300) {
                    VStack(spacing: 0) {
                        MacSidebarSearchBar(text: $query, placeholder: "Search terms and definitions")
                        glossaryList
                    }
                } detail: {
                    if let entry = selectedVisibleEntry ?? visibleEntries.first {
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
                    glossaryList
                        .navigationTitle("Glossary")
                        .navigationBarTitleDisplayMode(.inline)
                        .navigationSplitViewColumnWidth(min: 240, ideal: 285, max: 340)
                } detail: {
                    if let entry = selectedVisibleEntry ?? visibleEntries.first {
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
                    glossaryList
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
                selectedID = navigation.selectedGlossaryID ?? visibleEntries.first?.id
            }
        }
        .onChange(of: selectedID) { _, id in
            if let id { navigation.selectedGlossaryID = id }
        }
        .onChange(of: query) { _, _ in
            if selectedVisibleEntry == nil {
                selectedID = visibleEntries.first?.id
            }
        }
    }

    private var selectedVisibleEntry: GlossaryEntry? {
        guard let selectedID else { return nil }
        return visibleEntries.first { $0.id == selectedID }
    }

    private var visibleEntries: [GlossaryEntry] {
        let normalized = query.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        let matches = normalized.isEmpty ? dataService.glossary : dataService.glossary.filter { entry in
            dataService.glossaryMatches(entry, normalizedQuery: normalized)
        }
        if normalized.isEmpty {
            return sortMode.sort(matches)
        } else {
            return matches.sorted { left, right in
                let pLeft = searchPriority(for: left, query: normalized)
                let pRight = searchPriority(for: right, query: normalized)
                if pLeft != pRight {
                    return pLeft < pRight
                }
                return sortMode.compare(left, right)
            }
        }
    }

    private func searchPriority(for entry: GlossaryEntry, query: String) -> Int {
        let titleLower = entry.title.lowercased()
        let aliases = (entry.aliases ?? []).map { $0.lowercased() }
        if titleLower == query || aliases.contains(query) {
            return 1
        } else if titleLower.hasPrefix(query) || aliases.contains(where: { $0.hasPrefix(query) }) {
            return 2
        } else if titleLower.contains(query) {
            return 3
        } else {
            return 4
        }
    }

    private var visibleEntryGroups: [GlossaryEntryGroup] {
        visibleEntries.reduce(into: [GlossaryEntryGroup]()) { groups, entry in
            if let index = groups.indices.last, groups[index].title == entry.importanceLevelTitle {
                groups[index].entries.append(entry)
            } else {
                groups.append(GlossaryEntryGroup(title: entry.importanceLevelTitle, entries: [entry]))
            }
        }
    }

    private var alphabeticalEntryGroups: [GlossaryEntryGroup] {
        visibleEntries.reduce(into: [GlossaryEntryGroup]()) { groups, entry in
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
    private var glossaryList: some View {
        if horizontalSizeClass == .regular {
            #if targetEnvironment(macCatalyst)
            List {
                glossaryListContent(withSimultaneousGesture: true)
            }
            .listStyle(.sidebar)
            .scrollContentBackground(.hidden)
            #else
            List(selection: $selectedID) {
                glossaryListContent(withSimultaneousGesture: true)
            }
            .listStyle(.sidebar)
            .searchable(text: $query, placement: .navigationBarDrawer(displayMode: .always), prompt: "Search terms and definitions")
            #endif
        } else {
            List {
                glossaryListContent(withSimultaneousGesture: false)
            }
            .listStyle(.insetGrouped)
            .searchable(text: $query, prompt: "Search terms and definitions")
        }
    }

    @ViewBuilder
    private func glossaryListContent(withSimultaneousGesture: Bool) -> some View {
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
                Label("\(visibleEntries.count) terms", systemImage: "text.book.closed")
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

        if visibleEntries.isEmpty {
            ContentUnavailableView.search(text: query)
                .listRowBackground(Color.clear)
        } else if !query.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            Section("Results") {
                glossaryRows(for: visibleEntries, withSimultaneousGesture: withSimultaneousGesture, showImportance: true)
            }
        } else if sortMode == .relevance {
            ForEach(visibleEntryGroups) { group in
                Section("\(group.title) (\(group.entries.count))") {
                    glossaryRows(for: group.entries, withSimultaneousGesture: withSimultaneousGesture, showImportance: false)
                }
            }
        } else {
            ForEach(alphabeticalEntryGroups) { group in
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
                    StatusPill("code", tint: .orange)
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
        case 90...:
            return .red
        case 80..<90:
            return .blue
        case 70..<80:
            return .orange
        case 60..<70:
            return .teal
        case 50..<60:
            return .green
        case 40..<50:
            return .cyan
        case 30..<40:
            return .mint
        case 20..<30:
            return .brown
        case 10..<20:
            return .gray
        default:
            return .secondary
        }
    }
}

struct GlossaryDetailView: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(\.horizontalSizeClass) private var horizontalSizeClass
    let entry: GlossaryEntry
    var isSplitDetail: Bool = false
    var onSelectRelatedTerm: ((GlossaryEntry) -> Void)? = nil
    @State private var scrollPositionID: String? = nil

    var body: some View {
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
        .scrollPosition(id: $scrollPositionID)
        .navigationTitle(isSplitDetail ? "" : (scrollPositionID == nil || scrollPositionID == "header" ? "" : entry.title))
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
