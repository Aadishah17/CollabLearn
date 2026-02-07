package com.collablearn.app.model

data class GenerateRoadmapRequest(
    val skill: String,
    val learnerLevel: String,
    val weeklyHours: Int,
    val targetWeeks: Int,
    val focusAreas: List<String>,
    val savePlan: Boolean = false
)

data class GenerateRoadmapResponse(
    val success: Boolean? = null,
    val roadmap: Roadmap? = null,
    val source: String? = null,
    val provider: String? = null,
    val model: String? = null,
    val videoGuidance: VideoGuidance? = null,
    val savedPlanId: String? = null,
    val message: String? = null
)

data class Roadmap(
    val summary: String? = null,
    val steps: List<RoadmapStep> = emptyList(),
    val milestones: List<Milestone> = emptyList(),
    val resources: List<ResourceItem> = emptyList(),
    val habits: List<String> = emptyList(),
    val checkpoints: List<String> = emptyList()
)

data class RoadmapStep(
    val title: String? = null,
    val description: String? = null,
    val goals: List<String> = emptyList(),
    val practiceTask: String? = null,
    val estimatedHours: Int? = null
)

data class Milestone(
    val week: Int? = null,
    val title: String? = null,
    val successCriteria: String? = null
)

data class ResourceItem(
    val type: String? = null,
    val title: String? = null,
    val url: String? = null,
    val reason: String? = null,
    val level: String? = null
)

data class VideoGuidance(
    val videoId: String? = null,
    val title: String? = null,
    val channelTitle: String? = null,
    val likeCount: Long? = null,
    val viewCount: Long? = null,
    val url: String? = null
)

data class StudySessionRequest(
    val skill: String,
    val learnerLevel: String,
    val weeklyHours: Int,
    val availableMinutes: Int,
    val focusAreas: List<String>,
    val progressPercentage: Int,
    val roadmap: StudyRoadmapContext
)

data class StudyRoadmapContext(
    val summary: String,
    val currentStepTitle: String,
    val currentStepDescription: String,
    val currentStepGoals: List<String>
)

data class StudySessionResponse(
    val success: Boolean? = null,
    val session: StudySession? = null,
    val source: String? = null,
    val provider: String? = null,
    val model: String? = null,
    val message: String? = null
)

data class StudySession(
    val summary: String? = null,
    val tasks: List<StudyTask> = emptyList(),
    val reflectionQuestions: List<String> = emptyList(),
    val pitfalls: List<String> = emptyList()
)

data class StudyTask(
    val title: String? = null,
    val minutes: Int? = null,
    val instructions: String? = null,
    val output: String? = null
)
