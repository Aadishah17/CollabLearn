import Foundation

struct RoadmapRequest: Codable {
    let skill: String
    let learnerLevel: String
    let weeklyHours: Int
    let targetWeeks: Int
    let focusAreas: [String]
    let savePlan: Bool
}

struct RoadmapResponse: Codable {
    let success: Bool
    let roadmap: RoadmapData?
    let source: String?
    let provider: String?
    let model: String?
    let videoGuidance: VideoGuidanceData?
    let message: String?
}

struct RoadmapData: Codable {
    let summary: String?
    let steps: [RoadmapStepData]
    let resources: [RoadmapResourceData]
}

struct RoadmapStepData: Codable {
    let title: String?
    let description: String?
    let goals: [String]?
    let practiceTask: String?
    let estimatedHours: Int?
}

struct RoadmapResourceData: Codable {
    let type: String?
    let title: String?
    let url: String?
    let reason: String?
}

struct VideoGuidanceData: Codable {
    let videoId: String?
    let title: String?
    let channelTitle: String?
    let likeCount: Int?
    let viewCount: Int?
    let url: String?
}

struct StudySessionRequest: Codable {
    let skill: String
    let learnerLevel: String
    let weeklyHours: Int
    let availableMinutes: Int
    let focusAreas: [String]
    let progressPercentage: Int
    let roadmap: StudyRoadmapContext
}

struct StudyRoadmapContext: Codable {
    let summary: String
    let currentStepTitle: String
    let currentStepDescription: String
    let currentStepGoals: [String]
}

struct StudySessionResponse: Codable {
    let success: Bool
    let session: StudySessionData?
    let message: String?
}

struct StudySessionData: Codable {
    let summary: String?
    let tasks: [StudyTaskData]
    let reflectionQuestions: [String]
    let pitfalls: [String]
}

struct StudyTaskData: Codable {
    let title: String?
    let minutes: Int?
    let instructions: String?
    let output: String?
}
