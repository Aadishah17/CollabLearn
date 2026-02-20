import 'package:flutter/material.dart';
import 'package:collablearn_flutter/theme.dart';
import 'package:collablearn_flutter/screens/splash_screen.dart';
import 'package:collablearn_flutter/screens/landing_page.dart';
import 'package:collablearn_flutter/screens/login_page.dart';
import 'package:collablearn_flutter/screens/dashboard_page.dart';
import 'package:collablearn_flutter/screens/booking_page.dart';
import 'package:provider/provider.dart';
import 'package:collablearn_flutter/providers/user_provider.dart';

void main() {
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => UserProvider()),
      ],
      child: const CollabLearnApp(),
    ),
  );
}

class CollabLearnApp extends StatelessWidget {
  const CollabLearnApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'CollabLearn',
      theme: AppTheme.darkTheme,
      debugShowCheckedModeBanner: false,
      home: const SplashScreen(),
      routes: {
        '/landing': (context) => const LandingPage(),
        '/login': (context) => const LoginPage(),
        '/dashboard': (context) => const DashboardPage(),
        '/bookings': (context) => const BookingPage(),
      },
    );
  }
}

class PlaceholderPage extends StatelessWidget {
  final String title;
  const PlaceholderPage({super.key, required this.title});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.bolt, color: AppColors.brandRed, size: 64),
            const SizedBox(height: 16),
            Text(
              title,
              style: const TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  color: Colors.white),
            ),
            const SizedBox(height: 8),
            const Text(
              'Redesigning for Flutter...',
              style: TextStyle(color: Colors.white70),
            ),
          ],
        ),
      ),
    );
  }
}
