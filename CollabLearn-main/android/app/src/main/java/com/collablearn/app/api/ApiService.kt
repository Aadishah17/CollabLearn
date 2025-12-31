package com.collablearn.app.api

import com.collablearn.app.model.LoginRequest
import com.collablearn.app.model.LoginResponse
import retrofit2.Call
import retrofit2.http.Body
import retrofit2.http.POST

interface ApiService {
    @POST("api/auth/login")
    fun login(@Body request: LoginRequest): Call<LoginResponse>
}
