package com.collablearn.app.model

data class LoginRequest(
    val email: String,
    val password: String,
    val role: String
)

data class LoginResponse(
    val success: Boolean? = null,
    val token: String? = null,
    val user: UserDto? = null,
    val message: String?
)

data class SignupRequest(
    val name: String,
    val email: String,
    val password: String,
    val role: String
)

data class SignupResponse(
    val success: Boolean? = null,
    val token: String? = null,
    val user: UserDto? = null,
    val message: String?
)

data class UserDto(
    val id: String,
    val name: String,
    val email: String,
    val role: String
)
