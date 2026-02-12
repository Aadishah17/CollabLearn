package com.collablearn.app.api

import com.collablearn.app.model.GenerateRoadmapRequest
import com.collablearn.app.model.GenerateRoadmapResponse
import com.collablearn.app.model.LoginRequest
import com.collablearn.app.model.LoginResponse
import com.collablearn.app.model.SignupRequest
import com.collablearn.app.model.SignupResponse
import com.collablearn.app.model.StudySessionRequest
import com.collablearn.app.model.StudySessionResponse
import retrofit2.Call
import retrofit2.http.Body
import retrofit2.http.POST

interface ApiService {
    @POST("api/auth/login")
    fun login(@Body request: LoginRequest): Call<LoginResponse>

    @POST("api/auth/signup")
    fun signup(@Body request: SignupRequest): Call<SignupResponse>

    @POST("api/ai/roadmap")
    fun generateRoadmap(@Body request: GenerateRoadmapRequest): Call<GenerateRoadmapResponse>

    @POST("api/ai/study-session")
    fun generateStudySession(@Body request: StudySessionRequest): Call<StudySessionResponse>
}
