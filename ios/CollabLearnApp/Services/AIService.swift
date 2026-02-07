import Foundation

enum APIError: Error, LocalizedError {
    case badURL
    case requestFailed
    case invalidResponse
    case decodingFailed
    case serverMessage(String)

    var errorDescription: String? {
        switch self {
        case .badURL: return "Invalid API URL."
        case .requestFailed: return "Network request failed."
        case .invalidResponse: return "Invalid server response."
        case .decodingFailed: return "Could not parse response."
        case .serverMessage(let message): return message
        }
    }
}

final class AIService {
    private let session: URLSession

    init(session: URLSession = .shared) {
        self.session = session
    }

    func generateRoadmap(request: RoadmapRequest) async throws -> RoadmapResponse {
        let endpoint = APIConfig.baseURL.appendingPathComponent("api/ai/roadmap")
        return try await sendRequest(to: endpoint, payload: request, responseType: RoadmapResponse.self)
    }

    func generateStudySession(request: StudySessionRequest) async throws -> StudySessionResponse {
        let endpoint = APIConfig.baseURL.appendingPathComponent("api/ai/study-session")
        return try await sendRequest(to: endpoint, payload: request, responseType: StudySessionResponse.self)
    }

    private func sendRequest<T: Codable, R: Codable>(
        to url: URL,
        payload: T,
        responseType: R.Type
    ) async throws -> R {
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONEncoder().encode(payload)

        let (data, response): (Data, URLResponse)
        do {
            (data, response) = try await session.data(for: request)
        } catch {
            throw APIError.requestFailed
        }

        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }

        guard (200...299).contains(httpResponse.statusCode) else {
            if let serverPayload = try? JSONDecoder().decode(ServerMessageResponse.self, from: data),
               let message = serverPayload.message,
               !message.isEmpty {
                throw APIError.serverMessage(message)
            }
            throw APIError.invalidResponse
        }

        do {
            return try JSONDecoder().decode(R.self, from: data)
        } catch {
            throw APIError.decodingFailed
        }
    }
}

private struct ServerMessageResponse: Codable {
    let message: String?
}
