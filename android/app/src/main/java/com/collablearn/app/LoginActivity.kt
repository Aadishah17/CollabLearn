package com.collablearn.app

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.Button
import android.widget.EditText
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.collablearn.app.api.RetrofitClient
import com.collablearn.app.model.LoginRequest
import com.collablearn.app.model.LoginResponse
import com.collablearn.app.model.SignupRequest
import com.collablearn.app.model.SignupResponse
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response

class LoginActivity : AppCompatActivity() {
    private var isSignupMode = false
    private var selectedRole = "user"

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_login)

        val btnLogin = findViewById<Button>(R.id.btnLogin)
        val etEmail = findViewById<EditText>(R.id.etEmail)
        val etPassword = findViewById<EditText>(R.id.etPassword)
        val etName = findViewById<EditText>(R.id.etName)
        val tvNameLabel = findViewById<TextView>(R.id.tvNameLabel)
        val btnRoleUser = findViewById<Button>(R.id.btnRoleUser)
        val btnRoleAdmin = findViewById<Button>(R.id.btnRoleAdmin)
        val btnModeLogin = findViewById<Button>(R.id.btnModeLogin)
        val btnModeSignup = findViewById<Button>(R.id.btnModeSignup)
        val tvAuthTitle = findViewById<TextView>(R.id.tvAuthTitle)
        val tvAuthSubtitle = findViewById<TextView>(R.id.tvAuthSubtitle)
        val tvSwitchMode = findViewById<TextView>(R.id.tvSwitchMode)

        fun updateMode() {
            if (isSignupMode) {
                tvAuthTitle.text = "Create Account"
                tvAuthSubtitle.text = "Start your learning journey today"
                btnLogin.text = "Sign Up →"
                tvSwitchMode.text = "Already have an account? Sign in"
                etName.visibility = View.VISIBLE
                tvNameLabel.visibility = View.VISIBLE
                btnModeSignup.setBackgroundResource(R.drawable.bg_red_button)
                btnModeSignup.setTextColor(getColor(R.color.white))
                btnModeLogin.setBackgroundColor(0x00000000)
                btnModeLogin.setTextColor(getColor(R.color.colorTextSecondary))
            } else {
                tvAuthTitle.text = "Welcome back"
                tvAuthSubtitle.text = "Sign in to continue learning"
                btnLogin.text = "Sign In →"
                tvSwitchMode.text = "Don't have an account? Sign up"
                etName.visibility = View.GONE
                tvNameLabel.visibility = View.GONE
                btnModeLogin.setBackgroundResource(R.drawable.bg_red_button)
                btnModeLogin.setTextColor(getColor(R.color.white))
                btnModeSignup.setBackgroundColor(0x00000000)
                btnModeSignup.setTextColor(getColor(R.color.colorTextSecondary))
            }
        }

        btnModeLogin.setOnClickListener { isSignupMode = false; updateMode() }
        btnModeSignup.setOnClickListener { isSignupMode = true; updateMode() }
        tvSwitchMode.setOnClickListener { isSignupMode = !isSignupMode; updateMode() }

        btnRoleUser.setOnClickListener {
            selectedRole = "user"
            btnRoleUser.setBackgroundResource(R.drawable.bg_red_button)
            btnRoleUser.setTextColor(getColor(R.color.white))
            btnRoleAdmin.setBackgroundColor(0x00000000)
            btnRoleAdmin.setTextColor(getColor(R.color.colorTextSecondary))
        }

        btnRoleAdmin.setOnClickListener {
            selectedRole = "admin"
            btnRoleAdmin.setBackgroundResource(R.drawable.bg_red_button)
            btnRoleAdmin.setTextColor(getColor(R.color.white))
            btnRoleUser.setBackgroundColor(0x00000000)
            btnRoleUser.setTextColor(getColor(R.color.colorTextSecondary))
        }

        btnLogin.setOnClickListener {
            val email = etEmail.text.toString().trim()
            val password = etPassword.text.toString().trim()

            if (email.isEmpty() || password.isEmpty()) {
                Toast.makeText(this, "Please fill in all fields", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }

            btnLogin.isEnabled = false
            btnLogin.text = if (isSignupMode) "Creating account..." else "Signing in..."

            if (isSignupMode) {
                val name = etName.text.toString().trim()
                if (name.isEmpty()) {
                    Toast.makeText(this, "Please enter your name", Toast.LENGTH_SHORT).show()
                    btnLogin.isEnabled = true
                    btnLogin.text = "Sign Up →"
                    return@setOnClickListener
                }
                doSignup(name, email, password)
            } else {
                doLogin(email, password)
            }
        }
    }

    private fun doLogin(email: String, password: String) {
        val request = LoginRequest(email, password, selectedRole)
        RetrofitClient.instance.login(request).enqueue(object : Callback<LoginResponse> {
            override fun onResponse(call: Call<LoginResponse>, response: Response<LoginResponse>) {
                val btnLogin = findViewById<Button>(R.id.btnLogin)
                btnLogin.isEnabled = true
                btnLogin.text = "Sign In →"

                if (response.isSuccessful && response.body()?.success == true && response.body()?.user != null) {
                    val body = response.body()!!
                    saveAuth(body.token, body.user!!.name, body.user.email, body.user.role)
                    Toast.makeText(this@LoginActivity, "Welcome ${body.user.name}!", Toast.LENGTH_SHORT).show()
                    startActivity(Intent(this@LoginActivity, DashboardActivity::class.java))
                    finish()
                } else {
                    Toast.makeText(this@LoginActivity, response.body()?.message ?: "Login failed", Toast.LENGTH_SHORT).show()
                }
            }

            override fun onFailure(call: Call<LoginResponse>, t: Throwable) {
                val btnLogin = findViewById<Button>(R.id.btnLogin)
                btnLogin.isEnabled = true
                btnLogin.text = "Sign In →"
                Toast.makeText(this@LoginActivity, "Error: ${t.message}", Toast.LENGTH_SHORT).show()
            }
        })
    }

    private fun doSignup(name: String, email: String, password: String) {
        val request = SignupRequest(name, email, password, selectedRole)
        RetrofitClient.instance.signup(request).enqueue(object : Callback<SignupResponse> {
            override fun onResponse(call: Call<SignupResponse>, response: Response<SignupResponse>) {
                val btnLogin = findViewById<Button>(R.id.btnLogin)
                btnLogin.isEnabled = true
                btnLogin.text = "Sign Up →"

                if (response.isSuccessful && response.body()?.success == true && response.body()?.user != null) {
                    val body = response.body()!!
                    saveAuth(body.token, body.user!!.name, body.user.email, body.user.role)
                    Toast.makeText(this@LoginActivity, "Welcome ${body.user.name}!", Toast.LENGTH_SHORT).show()
                    startActivity(Intent(this@LoginActivity, DashboardActivity::class.java))
                    finish()
                } else {
                    Toast.makeText(this@LoginActivity, response.body()?.message ?: "Signup failed", Toast.LENGTH_SHORT).show()
                }
            }

            override fun onFailure(call: Call<SignupResponse>, t: Throwable) {
                val btnLogin = findViewById<Button>(R.id.btnLogin)
                btnLogin.isEnabled = true
                btnLogin.text = "Sign Up →"
                Toast.makeText(this@LoginActivity, "Error: ${t.message}", Toast.LENGTH_SHORT).show()
            }
        })
    }

    private fun saveAuth(token: String?, name: String, email: String, role: String) {
        getSharedPreferences("collablearn", MODE_PRIVATE).edit().apply {
            putString("auth_token", token)
            putString("user_name", name)
            putString("user_email", email)
            putString("user_role", role)
            apply()
        }
    }
}
