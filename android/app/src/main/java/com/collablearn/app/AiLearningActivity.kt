package com.collablearn.app

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.view.View
import android.widget.ArrayAdapter
import android.widget.Button
import android.widget.EditText
import android.widget.ProgressBar
import android.widget.Spinner
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.collablearn.app.api.RetrofitClient
import com.collablearn.app.model.GenerateRoadmapRequest
import com.collablearn.app.model.GenerateRoadmapResponse
import com.collablearn.app.model.Roadmap
import com.collablearn.app.model.RoadmapStep
import com.collablearn.app.model.StudyRoadmapContext
import com.collablearn.app.model.StudySession
import com.collablearn.app.model.StudySessionRequest
import com.collablearn.app.model.StudySessionResponse
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response
import kotlin.math.max
import kotlin.math.min

class AiLearningActivity : AppCompatActivity() {
    private lateinit var etSkill: EditText
    private lateinit var spinnerLevel: Spinner
    private lateinit var etWeeklyHours: EditText
    private lateinit var etTargetWeeks: EditText
    private lateinit var etFocusAreas: EditText
    private lateinit var btnGenerateRoadmap: Button
    private lateinit var btnGenerateSession: Button
    private lateinit var btnOpenVideo: Button
    private lateinit var progressBar: ProgressBar
    private lateinit var tvRoadmapSummary: TextView
    private lateinit var tvRoadmapSteps: TextView
    private lateinit var tvVideoGuidance: TextView
    private lateinit var tvStudySession: TextView

    private var currentRoadmap: Roadmap? = null
    private var currentVideoUrl: String? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_ai_learning)

        bindViews()
        setupLevelSpinner()

        btnGenerateRoadmap.setOnClickListener { generateRoadmap() }
        btnGenerateSession.setOnClickListener { generateStudySession() }
        btnOpenVideo.setOnClickListener { openVideoGuidance() }
    }

    private fun bindViews() {
        etSkill = findViewById(R.id.etSkill)
        spinnerLevel = findViewById(R.id.spinnerLevel)
        etWeeklyHours = findViewById(R.id.etWeeklyHours)
        etTargetWeeks = findViewById(R.id.etTargetWeeks)
        etFocusAreas = findViewById(R.id.etFocusAreas)
        btnGenerateRoadmap = findViewById(R.id.btnGenerateRoadmap)
        btnGenerateSession = findViewById(R.id.btnGenerateSession)
        btnOpenVideo = findViewById(R.id.btnOpenVideo)
        progressBar = findViewById(R.id.progressAi)
        tvRoadmapSummary = findViewById(R.id.tvRoadmapSummary)
        tvRoadmapSteps = findViewById(R.id.tvRoadmapSteps)
        tvVideoGuidance = findViewById(R.id.tvVideoGuidance)
        tvStudySession = findViewById(R.id.tvStudySession)

        btnOpenVideo.isEnabled = false
    }

    private fun setupLevelSpinner() {
        val levels = listOf("Beginner", "Intermediate", "Advanced")
        val adapter = ArrayAdapter(this, R.layout.spinner_item_light_text, levels)
        adapter.setDropDownViewResource(R.layout.spinner_dropdown_item_dark_text)
        spinnerLevel.adapter = adapter
    }

    private fun parseIntValue(value: String, fallback: Int, min: Int, max: Int): Int {
        val parsed = value.toIntOrNull() ?: fallback
        return min(max, max(min, parsed))
    }

    private fun parseFocusAreas(raw: String): List<String> {
        return raw.split(",")
            .map { it.trim() }
            .filter { it.isNotEmpty() }
            .take(8)
    }

    private fun setLoading(isLoading: Boolean) {
        progressBar.visibility = if (isLoading) View.VISIBLE else View.GONE
        btnGenerateRoadmap.isEnabled = !isLoading
        btnGenerateSession.isEnabled = !isLoading
    }

    private fun generateRoadmap() {
        val skill = etSkill.text.toString().trim()
        if (skill.isEmpty()) {
            Toast.makeText(this, "Enter a skill first", Toast.LENGTH_SHORT).show()
            return
        }

        val learnerLevel = spinnerLevel.selectedItem?.toString() ?: "Beginner"
        val weeklyHours = parseIntValue(etWeeklyHours.text.toString(), 6, 1, 40)
        val targetWeeks = parseIntValue(etTargetWeeks.text.toString(), 8, 2, 52)
        val focusAreas = parseFocusAreas(etFocusAreas.text.toString())

        val request = GenerateRoadmapRequest(
            skill = skill,
            learnerLevel = learnerLevel,
            weeklyHours = weeklyHours,
            targetWeeks = targetWeeks,
            focusAreas = focusAreas,
            savePlan = false
        )

        setLoading(true)
        RetrofitClient.instance.generateRoadmap(request).enqueue(object : Callback<GenerateRoadmapResponse> {
            override fun onResponse(
                call: Call<GenerateRoadmapResponse>,
                response: Response<GenerateRoadmapResponse>
            ) {
                setLoading(false)

                if (!response.isSuccessful || response.body()?.success != true) {
                    val message = response.body()?.message ?: "Failed to generate roadmap"
                    Toast.makeText(this@AiLearningActivity, message, Toast.LENGTH_SHORT).show()
                    return
                }

                val payload = response.body() ?: return
                val roadmap = payload.roadmap
                if (roadmap == null) {
                    Toast.makeText(this@AiLearningActivity, "No roadmap returned", Toast.LENGTH_SHORT).show()
                    return
                }

                currentRoadmap = roadmap
                currentVideoUrl = payload.videoGuidance?.url ?: roadmap.resources
                    .firstOrNull { it.type.equals("Video", ignoreCase = true) }
                    ?.url

                renderRoadmap(roadmap, payload.source, payload.model, payload.videoGuidance?.title)
                btnOpenVideo.isEnabled = !currentVideoUrl.isNullOrBlank()
                Toast.makeText(this@AiLearningActivity, "Roadmap generated", Toast.LENGTH_SHORT).show()
            }

            override fun onFailure(call: Call<GenerateRoadmapResponse>, t: Throwable) {
                setLoading(false)
                Toast.makeText(this@AiLearningActivity, "Network error: ${t.message}", Toast.LENGTH_SHORT).show()
            }
        })
    }

    private fun pickCurrentStep(roadmap: Roadmap?): RoadmapStep? {
        val steps = roadmap?.steps ?: emptyList()
        if (steps.isEmpty()) return null
        return steps.firstOrNull()
    }

    private fun generateStudySession() {
        val roadmap = currentRoadmap
        val skill = etSkill.text.toString().trim()
        if (roadmap == null || skill.isEmpty()) {
            Toast.makeText(this, "Generate roadmap first", Toast.LENGTH_SHORT).show()
            return
        }

        val learnerLevel = spinnerLevel.selectedItem?.toString() ?: "Beginner"
        val weeklyHours = parseIntValue(etWeeklyHours.text.toString(), 6, 1, 40)
        val focusAreas = parseFocusAreas(etFocusAreas.text.toString())
        val availableMinutes = min(180, max(45, weeklyHours * 10))
        val currentStep = pickCurrentStep(roadmap)

        val request = StudySessionRequest(
            skill = skill,
            learnerLevel = learnerLevel,
            weeklyHours = weeklyHours,
            availableMinutes = availableMinutes,
            focusAreas = focusAreas,
            progressPercentage = 0,
            roadmap = StudyRoadmapContext(
                summary = roadmap.summary.orEmpty(),
                currentStepTitle = currentStep?.title.orEmpty(),
                currentStepDescription = currentStep?.description.orEmpty(),
                currentStepGoals = currentStep?.goals ?: emptyList()
            )
        )

        setLoading(true)
        RetrofitClient.instance.generateStudySession(request)
            .enqueue(object : Callback<StudySessionResponse> {
                override fun onResponse(
                    call: Call<StudySessionResponse>,
                    response: Response<StudySessionResponse>
                ) {
                    setLoading(false)
                    if (!response.isSuccessful || response.body()?.success != true) {
                        val message = response.body()?.message ?: "Failed to generate study session"
                        Toast.makeText(this@AiLearningActivity, message, Toast.LENGTH_SHORT).show()
                        return
                    }

                    val session = response.body()?.session
                    if (session == null) {
                        Toast.makeText(this@AiLearningActivity, "No study session returned", Toast.LENGTH_SHORT).show()
                        return
                    }

                    renderStudySession(session)
                    Toast.makeText(this@AiLearningActivity, "Study session generated", Toast.LENGTH_SHORT).show()
                }

                override fun onFailure(call: Call<StudySessionResponse>, t: Throwable) {
                    setLoading(false)
                    Toast.makeText(this@AiLearningActivity, "Network error: ${t.message}", Toast.LENGTH_SHORT).show()
                }
            })
    }

    private fun renderRoadmap(roadmap: Roadmap, source: String?, model: String?, videoTitle: String?) {
        val summary = roadmap.summary?.trim().orEmpty()
        val header = buildString {
            append(summary)
            if (!source.isNullOrBlank()) append("\n\nSource: $source")
            if (!model.isNullOrBlank()) append(" ($model)")
        }
        tvRoadmapSummary.text = if (header.isBlank()) "No summary available" else header

        val stepsText = roadmap.steps.mapIndexed { index, step ->
            val title = step.title ?: "Step ${index + 1}"
            val description = step.description ?: ""
            val practiceTask = step.practiceTask ?: ""
            "${index + 1}. $title\n$description\nPractice: $practiceTask"
        }.joinToString("\n\n")
        tvRoadmapSteps.text = if (stepsText.isBlank()) "No roadmap steps available" else stepsText

        val likeVideoTitle = videoTitle ?: roadmap.resources
            .firstOrNull { it.type.equals("Video", ignoreCase = true) }
            ?.title
        tvVideoGuidance.text = likeVideoTitle ?: "No video guidance available"
    }

    private fun renderStudySession(session: StudySession) {
        val tasksText = session.tasks.mapIndexed { index, task ->
            val title = task.title ?: "Task ${index + 1}"
            val minutes = task.minutes ?: 0
            val instructions = task.instructions.orEmpty()
            val output = task.output.orEmpty()
            "${index + 1}. $title (${minutes} min)\n$instructions\nOutput: $output"
        }.joinToString("\n\n")

        val reflection = session.reflectionQuestions.joinToString("\n") { "- $it" }
        val pitfalls = session.pitfalls.joinToString("\n") { "- $it" }

        tvStudySession.text = buildString {
            append(session.summary.orEmpty())
            append("\n\nTasks\n")
            append(if (tasksText.isBlank()) "No tasks" else tasksText)
            if (reflection.isNotBlank()) {
                append("\n\nReflection\n")
                append(reflection)
            }
            if (pitfalls.isNotBlank()) {
                append("\n\nPitfalls\n")
                append(pitfalls)
            }
        }
    }

    private fun openVideoGuidance() {
        val url = currentVideoUrl
        if (url.isNullOrBlank()) {
            Toast.makeText(this, "No video guidance link available", Toast.LENGTH_SHORT).show()
            return
        }

        startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url)))
    }
}
