package com.collablearn.app.model

data class LoginRequest(
    val email: String,
    val password: String,
    val role: String
)

data class LoginResponse(
    val token: String,
    val user: UserDto,
    val message: String?
)

data class UserDto(
    val id: String,
    val name: String,
    val email: String,
    val role: String
)
