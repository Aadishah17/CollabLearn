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
        ZStack {
            Color.zinc950.ignoresSafeArea()
            
            ScrollView {
                VStack(alignment: .leading, spacing: 24) {
                    Text("AI Learning Studio")
                        .font(.title2.bold())
                        .foregroundStyle(.white)

                    VStack(alignment: .leading, spacing: 20) {
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Learning Goal")
                                .font(.caption.bold())
                                .foregroundStyle(.secondary)
                            TextField("e.g. React, Data Analysis", text: $skill)
                                .textFieldStyle(GlassTextFieldStyle())
                        }
                        
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Current Level")
                                .font(.caption.bold())
                                .foregroundStyle(.secondary)
                            Picker("Level", selection: $learnerLevel) {
                                ForEach(levels, id: \.self) { level in
                                    Text(level).tag(level)
                                }
                            }
                            .pickerStyle(.segmented)
                        }

                        HStack(spacing: 16) {
                            VStack(alignment: .leading, spacing: 8) {
                                Text("Weekly Hours")
                                    .font(.caption.bold())
                                    .foregroundStyle(.secondary)
                                TextField("6", text: $weeklyHours)
                                    .keyboardType(.numberPad)
                                    .textFieldStyle(GlassTextFieldStyle())
                            }
                            
                            VStack(alignment: .leading, spacing: 8) {
                                Text("Target Weeks")
                                    .font(.caption.bold())
                                    .foregroundStyle(.secondary)
                                TextField("8", text: $targetWeeks)
                                    .keyboardType(.numberPad)
                                    .textFieldStyle(GlassTextFieldStyle())
                            }
                        }
                        
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Focus Areas")
                                .font(.caption.bold())
                                .foregroundStyle(.secondary)
                            TextField("e.g. Basics, Projects", text: $focusAreas)
                                .textFieldStyle(GlassTextFieldStyle())
                        }

                        HStack(spacing: 12) {
                            Button {
                                Task { await generateRoadmap() }
                            } label: {
                                Text(loadingRoadmap ? "Generating..." : "Generate Roadmap")
                                    .brandButtonStyle(isPrimary: true)
                            }
                            .disabled(loadingRoadmap)

                            Button {
                                Task { await generateStudySession() }
                            } label: {
                                Text(loadingSession ? "Building..." : "Study Session")
                                    .brandButtonStyle(isPrimary: false)
                            }
                            .disabled(loadingSession || roadmap == nil)
                        }
                    }
                    .padding(20)
                    .glassCard()

                    if !errorMessage.isEmpty {
                        Text(errorMessage)
                            .font(.footnote)
                            .foregroundStyle(.brandRed)
                            .padding(.horizontal)
                    }

                    if let roadmap {
                        roadmapSection(roadmap)
                    }

                    if let studySession {
                        studySessionSection(studySession)
                    }
                }
                .padding(20)
            }
        }
        .navigationTitle("AI Learning")
        .navigationBarTitleDisplayMode(.inline)
    }

    @ViewBuilder
    private func roadmapSection(_ roadmap: RoadmapData) -> some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Roadmap Summary")
                .font(.headline)
                .foregroundStyle(.white)
            
            Text(roadmap.summary ?? "No summary available")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .padding(16)
                .frame(maxWidth: .infinity, alignment: .leading)
                .glassCard(opacity: 0.4)

            if let videoGuidanceURL, let url = URL(string: videoGuidanceURL) {
                Link(destination: url) {
                    HStack {
                        Image(systemName: "play.rectangle.fill")
                        Text("Open Top Video Guidance")
                    }
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(.white)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 12)
                    .background(Color.zinc800)
                    .clipShape(RoundedRectangle(cornerRadius: 10))
                }
            }

            Text("Curated Steps")
                .font(.headline)
                .foregroundStyle(.white)
                .padding(.top, 8)

            VStack(spacing: 12) {
                ForEach(Array(roadmap.steps.enumerated()), id: \.offset) { index, step in
                    VStack(alignment: .leading, spacing: 8) {
                        HStack {
                            Text("\(index + 1)")
                                .font(.caption.bold())
                                .foregroundStyle(.white)
                                .frame(width: 24, height: 24)
                                .background(Color.brandRed)
                                .clipShape(Circle())
                            
                            Text(step.title ?? "Step")
                                .font(.subheadline.weight(.bold))
                                .foregroundStyle(.white)
                        }
                        
                        Text(step.description ?? "")
                            .font(.footnote)
                            .foregroundStyle(.secondary)
                    }
                    .padding(16)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .glassCard(opacity: 0.3)
                }
            }
        }
    }

    @ViewBuilder
    private func studySessionSection(_ session: StudySessionData) -> some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Study Session")
                .font(.headline)
                .foregroundStyle(.brandRed)
                .padding(.top, 16)
            
            Text(session.summary ?? "No session summary available")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .padding(16)
                .glassCard(opacity: 0.4)

            ForEach(Array(session.tasks.enumerated()), id: \.offset) { index, task in
                VStack(alignment: .leading, spacing: 8) {
                    HStack {
                        Text("\(task.minutes ?? 0) min")
                            .font(.system(size: 10, weight: .bold))
                            .foregroundStyle(.brandRed)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 4)
                            .background(Color.brandRed.opacity(0.1))
                            .clipShape(Capsule())
                        
                        Spacer()
                    }
                    
                    Text(task.title ?? "Task")
                        .font(.subheadline.weight(.bold))
                        .foregroundStyle(.white)
                    
                    Text(task.instructions ?? "")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                    
                    if let output = task.output, !output.isEmpty {
                        Divider().background(Color.white.opacity(0.1))
                        Text("Output: \(output)")
                            .font(.caption)
                            .foregroundStyle(.brandRedLight)
                    }
                }
                .padding(16)
                .frame(maxWidth: .infinity, alignment: .leading)
                .glassCard(opacity: 0.3)
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
