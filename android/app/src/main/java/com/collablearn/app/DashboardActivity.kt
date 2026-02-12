package com.collablearn.app

import android.content.Intent
import android.os.Bundle
import android.widget.LinearLayout
import android.widget.Button
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity

class DashboardActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_dashboard)

        val prefs = getSharedPreferences("collablearn", MODE_PRIVATE)
        val userName = prefs.getString("user_name", "Learner")

        val tvWelcome = findViewById<TextView>(R.id.tvWelcome)
        tvWelcome.text = "Welcome, $userName! 👋"

        // Logout
        findViewById<Button>(R.id.btnLogout).setOnClickListener {
            prefs.edit().clear().apply()
            startActivity(Intent(this, LoginActivity::class.java))
            finishAffinity()
        }

        // Quick Actions
        findViewById<LinearLayout>(R.id.cardAiLearning).setOnClickListener {
            startActivity(Intent(this, AiLearningActivity::class.java))
        }

        findViewById<LinearLayout>(R.id.cardBrowseSkills).setOnClickListener {
            Toast.makeText(this, "Browse Skills — coming soon!", Toast.LENGTH_SHORT).show()
        }

        findViewById<LinearLayout>(R.id.cardCommunity).setOnClickListener {
            Toast.makeText(this, "Community — coming soon!", Toast.LENGTH_SHORT).show()
        }

        findViewById<LinearLayout>(R.id.cardCourses).setOnClickListener {
            Toast.makeText(this, "Courses — coming soon!", Toast.LENGTH_SHORT).show()
        }

        // Bottom Nav
        findViewById<LinearLayout>(R.id.navAiLearn).setOnClickListener {
            startActivity(Intent(this, AiLearningActivity::class.java))
        }

        findViewById<LinearLayout>(R.id.navCommunity).setOnClickListener {
            Toast.makeText(this, "Community — coming soon!", Toast.LENGTH_SHORT).show()
        }

        findViewById<LinearLayout>(R.id.navProfile).setOnClickListener {
            Toast.makeText(this, "Profile — coming soon!", Toast.LENGTH_SHORT).show()
        }
    }
}
