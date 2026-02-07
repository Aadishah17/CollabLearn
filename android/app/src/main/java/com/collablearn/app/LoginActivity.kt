package com.collablearn.app

import android.content.Intent
import android.os.Bundle
import android.widget.Button
import android.widget.EditText
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.collablearn.app.api.RetrofitClient
import com.collablearn.app.model.LoginRequest
import com.collablearn.app.model.LoginResponse
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response

class LoginActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_login)

        val btnLogin = findViewById<Button>(R.id.btnLogin)
        val etEmail = findViewById<EditText>(R.id.etEmail)
        val etPassword = findViewById<EditText>(R.id.etPassword)
        val btnRoleUser = findViewById<Button>(R.id.btnRoleUser)
        val btnRoleAdmin = findViewById<Button>(R.id.btnRoleAdmin)
        var selectedRole = "user"

        btnRoleUser.setOnClickListener {
            selectedRole = "user"
            btnRoleUser.setBackgroundColor(getColor(android.R.color.white))
            btnRoleAdmin.setBackgroundColor(getColor(android.R.color.transparent))
        }

        btnRoleAdmin.setOnClickListener {
            selectedRole = "admin"
            btnRoleAdmin.setBackgroundColor(getColor(android.R.color.white))
            btnRoleUser.setBackgroundColor(getColor(android.R.color.transparent))
        }

        btnLogin.setOnClickListener {
            val email = etEmail.text.toString()
            val password = etPassword.text.toString()

            if (email.isNotEmpty() && password.isNotEmpty()) {
                btnLogin.isEnabled = false
                btnLogin.text = "Logging in..."

                val request = LoginRequest(email, password, selectedRole)
                
                RetrofitClient.instance.login(request).enqueue(object : Callback<LoginResponse> {
                    override fun onResponse(call: Call<LoginResponse>, response: Response<LoginResponse>) {
                        btnLogin.isEnabled = true
                        btnLogin.text = "Sign in"
                        
                        if (response.isSuccessful && response.body()?.success == true && response.body()?.user != null) {
                            val loginResponse = response.body()!!
                            Toast.makeText(this@LoginActivity, "Welcome ${loginResponse.user?.name}!", Toast.LENGTH_SHORT).show()
                            
                            startActivity(Intent(this@LoginActivity, AiLearningActivity::class.java))
                            finish()
                        } else {
                            val errorMessage = response.body()?.message ?: "Login failed"
                            Toast.makeText(this@LoginActivity, errorMessage, Toast.LENGTH_SHORT).show()
                        }
                    }

                    override fun onFailure(call: Call<LoginResponse>, t: Throwable) {
                        btnLogin.isEnabled = true
                        btnLogin.text = "Sign in"
                        Toast.makeText(this@LoginActivity, "Error: ${t.message}", Toast.LENGTH_SHORT).show()
                    }
                })
            } else {
                Toast.makeText(this, "Please fill in all fields", Toast.LENGTH_SHORT).show()
            }
        }
    }
}
