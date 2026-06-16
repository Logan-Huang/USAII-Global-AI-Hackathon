import Foundation

/// A block of rendered markdown. SwiftUI lays these out; the parsing itself is pure
/// Foundation so it's unit-testable.
enum MarkdownBlock: Equatable {
    case heading(AttributedString)
    case paragraph(AttributedString)
    case orderedList([AttributedString])
    case unorderedList([AttributedString])
}

/// Safe, minimal markdown — a faithful port of the web client's `renderMarkdown`.
/// Supports: `## H2`, ordered (`1.`) and unordered (`-`/`*`) lists, `**bold**`, and
/// `[text](http(s)://url)` links. Everything else is plain text. No HTML is produced,
/// so there's no injection surface; link URLs are restricted to http/https.
///
/// Critically, blank lines *inside* a list of the same type do NOT break the list —
/// otherwise an ordered list would restart numbering at "1." after every gap.
enum MarkdownRenderer {

    static func render(_ raw: String) -> [MarkdownBlock] {
        let lines = raw.components(separatedBy: "\n")
        var blocks: [MarkdownBlock] = []

        enum ListType { case ordered, unordered }
        var listType: ListType?
        var listItems: [AttributedString] = []

        func closeList() {
            guard let lt = listType else { return }
            blocks.append(lt == .ordered ? .orderedList(listItems) : .unorderedList(listItems))
            listItems = []
            listType = nil
        }

        var i = 0
        while i < lines.count {
            let line = lines[i]

            // ## Heading (H2)
            if let captured = firstCapture(line, "^##\\s+(.+)$") {
                closeList()
                blocks.append(.heading(renderInline(captured)))
                i += 1; continue
            }

            // Numbered list item
            if let captured = firstCapture(line, "^\\s*\\d+\\.\\s+(.+)$") {
                if listType != .ordered { closeList(); listType = .ordered }
                listItems.append(renderInline(captured))
                i += 1; continue
            }

            // Bulleted list item
            if let captured = firstCapture(line, "^\\s*[-*]\\s+(.+)$") {
                if listType != .unordered { closeList(); listType = .unordered }
                listItems.append(renderInline(captured))
                i += 1; continue
            }

            // Blank line: keep the list open if it resumes after the blank(s).
            if line.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                if let lt = listType {
                    var j = i + 1
                    while j < lines.count,
                          lines[j].trimmingCharacters(in: .whitespacesAndNewlines).isEmpty { j += 1 }
                    if j < lines.count,
                       (lt == .ordered && isOrdered(lines[j])) || (lt == .unordered && isUnordered(lines[j])) {
                        i += 1; continue // same list continues — do not close it
                    }
                    closeList()
                }
                i += 1; continue
            }

            // Normal text line
            closeList()
            blocks.append(.paragraph(renderInline(line)))
            i += 1
        }
        closeList()
        return blocks
    }

    // MARK: - Inline (links + bold)

    /// Parse links first, then bold within the surrounding text (mirrors web order).
    static func renderInline(_ text: String) -> AttributedString {
        var out = AttributedString("")
        let ns = text as NSString
        guard let re = try? NSRegularExpression(pattern: "\\[([^\\]]+)\\]\\(([^)]+)\\)") else {
            return renderBold(text)
        }
        var last = 0
        for m in re.matches(in: text, range: NSRange(location: 0, length: ns.length)) {
            if m.range.location > last {
                out.append(renderBold(ns.substring(with: NSRange(location: last, length: m.range.location - last))))
            }
            let label = ns.substring(with: m.range(at: 1))
            let urlStr = ns.substring(with: m.range(at: 2))
            if isHTTP(urlStr), let url = URL(string: urlStr) {
                var link = renderBold(label)
                link.link = url
                out.append(link)
            } else {
                // Non-http link: drop the URL, keep the visible text (matches web).
                out.append(renderBold(label))
            }
            last = m.range.location + m.range.length
        }
        if last < ns.length {
            out.append(renderBold(ns.substring(from: last)))
        }
        return out
    }

    static func renderBold(_ text: String) -> AttributedString {
        var out = AttributedString("")
        let ns = text as NSString
        guard let re = try? NSRegularExpression(pattern: "\\*\\*([^*\\n]+)\\*\\*") else {
            return AttributedString(text)
        }
        var last = 0
        for m in re.matches(in: text, range: NSRange(location: 0, length: ns.length)) {
            if m.range.location > last {
                out.append(AttributedString(ns.substring(with: NSRange(location: last, length: m.range.location - last))))
            }
            var bold = AttributedString(ns.substring(with: m.range(at: 1)))
            bold.inlinePresentationIntent = .stronglyEmphasized
            out.append(bold)
            last = m.range.location + m.range.length
        }
        if last < ns.length {
            out.append(AttributedString(ns.substring(from: last)))
        }
        return out
    }

    // MARK: - helpers

    private static func isHTTP(_ s: String) -> Bool {
        s.range(of: "^https?://", options: [.regularExpression, .caseInsensitive]) != nil
    }
    private static func isOrdered(_ s: String) -> Bool {
        s.range(of: "^\\s*\\d+\\.\\s+", options: .regularExpression) != nil
    }
    private static func isUnordered(_ s: String) -> Bool {
        s.range(of: "^\\s*[-*]\\s+", options: .regularExpression) != nil
    }
    private static func firstCapture(_ s: String, _ pattern: String) -> String? {
        guard let re = try? NSRegularExpression(pattern: pattern) else { return nil }
        let ns = s as NSString
        guard let m = re.firstMatch(in: s, range: NSRange(location: 0, length: ns.length)),
              m.numberOfRanges > 1 else { return nil }
        let r = m.range(at: 1)
        return r.location == NSNotFound ? nil : ns.substring(with: r)
    }
}
