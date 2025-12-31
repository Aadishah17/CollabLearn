package com.collablearn.app

import android.content.Intent
import android.os.Bundle
import android.widget.Button
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        val btnJoinFree = findViewById<Button>(R.id.btnJoinFree)
        val btnNavLogin = findViewById<Button>(R.id.btnNavLogin)

        btnJoinFree.setOnClickListener {
            // Navigate to Login (using as Signup for flow demo)
            startActivity(Intent(this, LoginActivity::class.java))
        }

        btnNavLogin.setOnClickListener {
            startActivity(Intent(this, LoginActivity::class.java))
        }
    }
}
