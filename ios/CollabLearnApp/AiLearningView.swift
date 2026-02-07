import SwiftUI

struct AiLearningView: View {
    @State private var skill = ""
    @State private var learnerLevel = "Beginner"
    @State private var weeklyHours = "6"
    @State private var targetWeeks = "8"
    @State private var focusAreas = ""

    @State private var roadmap: RoadmapData?
    @State private var videoGuidanceURL: String?
    @State private var studySession: StudySessionData?
    @State private var loadingRoadmap = false
    @State private var loadingSession = false
    @State private var errorMessage = ""

    private let service = AIService()
    private let levels = ["Beginner", "Intermediate", "Advanced"]

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                Text("AI Learning Studio")
                    .font(.title2.bold())

                Group {
                    TextField("Skill (e.g. React, Data Analysis)", text: $skill)
                    Picker("Level", selection: $learnerLevel) {
                        ForEach(levels, id: \.self) { level in
                            Text(level).tag(level)
                        }
                    }
                    .pickerStyle(.segmented)

                    TextField("Weekly hours", text: $weeklyHours)
                        .keyboardType(.numberPad)
                    TextField("Target weeks", text: $targetWeeks)
                        .keyboardType(.numberPad)
                    TextField("Focus areas (comma separated)", text: $focusAreas)
                }
                .textFieldStyle(.roundedBorder)

                HStack(spacing: 12) {
                    Button(loadingRoadmap ? "Generating..." : "Generate Roadmap") {
                        Task { await generateRoadmap() }
                    }
                    .buttonStyle(.borderedProminent)
                    .disabled(loadingRoadmap)

                    Button(loadingSession ? "Building..." : "Study Session") {
                        Task { await generateStudySession() }
                    }
                    .buttonStyle(.bordered)
                    .disabled(loadingSession || roadmap == nil)
                }

                if !errorMessage.isEmpty {
                    Text(errorMessage)
                        .font(.footnote)
                        .foregroundStyle(.red)
                }

                if let roadmap {
                    roadmapSection(roadmap)
                }

                if let studySession {
                    studySessionSection(studySession)
                }
            }
            .padding(16)
        }
        .navigationTitle("AI Learning")
        .navigationBarTitleDisplayMode(.inline)
    }

    @ViewBuilder
    private func roadmapSection(_ roadmap: RoadmapData) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Roadmap Summary")
                .font(.headline)
            Text(roadmap.summary ?? "No summary available")
                .font(.subheadline)
                .foregroundStyle(.secondary)

            if let videoGuidanceURL, let url = URL(string: videoGuidanceURL) {
                Link("Open Top Video Guidance", destination: url)
                    .font(.subheadline.weight(.semibold))
            }

            Text("Steps")
                .font(.headline)
                .padding(.top, 6)

            ForEach(Array(roadmap.steps.enumerated()), id: \.offset) { index, step in
                VStack(alignment: .leading, spacing: 4) {
                    Text("\(index + 1). \(step.title ?? "Step")")
                        .font(.subheadline.weight(.semibold))
                    Text(step.description ?? "")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                }
                .padding(10)
                .background(Color.gray.opacity(0.08))
                .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
            }
        }
    }

    @ViewBuilder
    private func studySessionSection(_ session: StudySessionData) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Study Session")
                .font(.headline)
            Text(session.summary ?? "No session summary available")
                .font(.subheadline)
                .foregroundStyle(.secondary)

            ForEach(Array(session.tasks.enumerated()), id: \.offset) { index, task in
                VStack(alignment: .leading, spacing: 4) {
                    Text("\(index + 1). \(task.title ?? "Task") (\(task.minutes ?? 0) min)")
                        .font(.subheadline.weight(.semibold))
                    Text(task.instructions ?? "")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                    if let output = task.output, !output.isEmpty {
                        Text("Output: \(output)")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }
                .padding(10)
                .background(Color.gray.opacity(0.08))
                .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
            }
        }
    }

    private func parseInt(_ value: String, fallback: Int, minValue: Int, maxValue: Int) -> Int {
        let parsed = Int(value) ?? fallback
        return min(maxValue, max(minValue, parsed))
    }

    private func parseFocusAreas() -> [String] {
        focusAreas
            .split(separator: ",")
            .map { String($0).trimmingCharacters(in: .whitespacesAndNewlines) }
            .filter { !$0.isEmpty }
            .prefix(8)
            .map { $0 }
    }

    private func generateRoadmap() async {
        let trimmedSkill = skill.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmedSkill.isEmpty else {
            errorMessage = "Enter a skill first."
            return
        }

        loadingRoadmap = true
        errorMessage = ""
        studySession = nil

        let request = RoadmapRequest(
            skill: trimmedSkill,
            learnerLevel: learnerLevel,
            weeklyHours: parseInt(weeklyHours, fallback: 6, minValue: 1, maxValue: 40),
            targetWeeks: parseInt(targetWeeks, fallback: 8, minValue: 2, maxValue: 52),
            focusAreas: parseFocusAreas(),
            savePlan: false
        )

        do {
            let response = try await service.generateRoadmap(request: request)
            guard response.success, let roadmapData = response.roadmap else {
                errorMessage = response.message ?? "Could not generate roadmap."
                loadingRoadmap = false
                return
            }

            roadmap = roadmapData
            if let topURL = response.videoGuidance?.url, !topURL.isEmpty {
                videoGuidanceURL = topURL
            } else {
                videoGuidanceURL = roadmapData.resources.first(where: { ($0.type ?? "").lowercased() == "video" })?.url
            }
        } catch {
            errorMessage = error.localizedDescription
        }

        loadingRoadmap = false
    }

    private func generateStudySession() async {
        guard let roadmap else {
            errorMessage = "Generate roadmap first."
            return
        }

        let trimmedSkill = skill.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmedSkill.isEmpty else {
            errorMessage = "Enter a skill first."
            return
        }

        loadingSession = true
        errorMessage = ""

        let step = roadmap.steps.first
        let request = StudySessionRequest(
            skill: trimmedSkill,
            learnerLevel: learnerLevel,
            weeklyHours: parseInt(weeklyHours, fallback: 6, minValue: 1, maxValue: 40),
            availableMinutes: min(180, max(45, parseInt(weeklyHours, fallback: 6, minValue: 1, maxValue: 40) * 10)),
            focusAreas: parseFocusAreas(),
            progressPercentage: 0,
            roadmap: StudyRoadmapContext(
                summary: roadmap.summary ?? "",
                currentStepTitle: step?.title ?? "",
                currentStepDescription: step?.description ?? "",
                currentStepGoals: step?.goals ?? []
            )
        )

        do {
            let response = try await service.generateStudySession(request: request)
            guard response.success, let session = response.session else {
                errorMessage = response.message ?? "Could not generate study session."
                loadingSession = false
                return
            }
            studySession = session
        } catch {
            errorMessage = error.localizedDescription
        }

        loadingSession = false
    }
}
