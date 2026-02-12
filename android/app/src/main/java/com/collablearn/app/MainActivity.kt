package com.collablearn.app

import android.content.Intent
import android.os.Bundle
import android.widget.Button
import android.widget.EditText
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Auto-redirect if already logged in
        val prefs = getSharedPreferences("collablearn", MODE_PRIVATE)
        val token = prefs.getString("auth_token", null)
        if (!token.isNullOrEmpty()) {
            startActivity(Intent(this, DashboardActivity::class.java))
            finish()
            return
        }

        setContentView(R.layout.activity_main)

        findViewById<Button>(R.id.btnNavLogin).setOnClickListener {
            startActivity(Intent(this, LoginActivity::class.java))
        }

        findViewById<Button>(R.id.btnJoinFree).setOnClickListener {
            val emailInput = findViewById<EditText>(R.id.etEmailSignup)
            val intent = Intent(this, LoginActivity::class.java)
            intent.putExtra("mode", "signup")
            intent.putExtra("email", emailInput.text.toString().trim())
            startActivity(intent)
        }

        findViewById<Button>(R.id.btnAiLearning).setOnClickListener {
            startActivity(Intent(this, AiLearningActivity::class.java))
        }
    }
}
