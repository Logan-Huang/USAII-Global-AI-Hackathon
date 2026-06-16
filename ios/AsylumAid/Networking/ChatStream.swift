import Foundation

enum ChatError: Error {
    case network   // connection failed
    case stream    // server-side / mid-stream failure
}

/// Streams `/api/chat` (newline-delimited JSON) as an ordered sequence of assistant
/// text deltas.
///
/// `URLSession.bytes(for:)` + `.lines` is the NDJSON-native path: it splits on `\n`
/// and decodes multi-byte UTF-8 across chunk boundaries, exactly like the web client's
/// TextDecoder loop. Each line is `{type:"delta",text}` / `{type:"done"}` / `{type:"error",message}`.
///
/// Returning an `AsyncThrowingStream` lets the caller consume deltas on the main actor
/// in arrival order with a simple `for try await` loop.
struct ChatStream {
    var baseURL: URL = AppConfig.baseURL
    var session: URLSession = .shared

    private struct RequestBody: Encodable {
        let language: String
        let profile: Profile
        let messages: [WireMessage]
    }

    func stream(language: String,
                profile: Profile,
                messages: [WireMessage]) -> AsyncThrowingStream<String, Error> {
        AsyncThrowingStream { continuation in
            let task = Task {
                do {
                    var comps = URLComponents(url: baseURL, resolvingAgainstBaseURL: false)!
                    comps.path = "/api/chat"

                    var req = URLRequest(url: comps.url!)
                    req.httpMethod = "POST"
                    req.setValue("application/json", forHTTPHeaderField: "Content-Type")
                    req.setValue("application/x-ndjson", forHTTPHeaderField: "Accept")
                    req.httpBody = try JSONEncoder().encode(
                        RequestBody(language: language, profile: profile, messages: messages))

                    let bytes: URLSession.AsyncBytes
                    let response: URLResponse
                    do {
                        (bytes, response) = try await session.bytes(for: req)
                    } catch {
                        continuation.finish(throwing: ChatError.network); return
                    }

                    let status = (response as? HTTPURLResponse)?.statusCode ?? -1
                    let httpOK = (200..<300).contains(status)

                    for try await line in bytes.lines {
                        let trimmed = line.trimmingCharacters(in: .whitespacesAndNewlines)
                        if trimmed.isEmpty { continue }
                        guard let data = trimmed.data(using: .utf8),
                              let event = try? JSONDecoder().decode(StreamEvent.self, from: data) else {
                            continue // defensive: skip malformed lines
                        }
                        switch event.type {
                        case "delta":
                            if let text = event.text { continuation.yield(text) }
                        case "done":
                            continuation.finish(); return
                        case "error":
                            // Server reports failures (incl. rate-limit) as an error line;
                            // the UI surfaces a localized message, not the raw server text.
                            continuation.finish(throwing: ChatError.stream); return
                        default:
                            continue
                        }
                    }
                    // Stream ended with no explicit `done`; a non-2xx is a failure.
                    continuation.finish(throwing: httpOK ? nil : ChatError.stream)
                } catch is CancellationError {
                    continuation.finish(throwing: CancellationError())
                } catch {
                    continuation.finish(throwing: ChatError.stream)
                }
            }
            continuation.onTermination = { _ in task.cancel() }
        }
    }
}
