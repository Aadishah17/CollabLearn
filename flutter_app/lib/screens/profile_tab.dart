import 'package:flutter/material.dart';
import 'package:collablearn_flutter/theme.dart';
import 'package:collablearn_flutter/services/api_service.dart';

class ProfileTab extends StatelessWidget {
  const ProfileTab({super.key});

  void _handleLogout(BuildContext context) async {
    final apiService = ApiService();
    await apiService.logout();
    Navigator.pushNamedAndRemoveUntil(context, '/login', (route) => false);
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          children: [
            const CircleAvatar(
              radius: 50,
              backgroundColor: AppColors.brandRed,
              child: Icon(Icons.person, size: 60, color: Colors.white),
            ),
            const SizedBox(height: 16),
            const Text('Learner Name',
                style: TextStyle(
                    color: Colors.white,
                    fontSize: 22,
                    fontWeight: FontWeight.bold)),
            Text('Premium Member',
                style: TextStyle(
                    color: AppColors.brandRed.withOpacity(0.8), fontSize: 14)),
            const SizedBox(height: 32),
            _buildProfileOption(Icons.settings, 'Account Settings'),
            const SizedBox(height: 12),
            _buildProfileOption(Icons.notifications, 'Notifications'),
            const SizedBox(height: 12),
            _buildProfileOption(Icons.security, 'Privacy & Policy'),
            const SizedBox(height: 32),
            const Text('Log Out')
                .brandButtonStyle(isPrimary: false)
                .onTap(() => _handleLogout(context)),
          ],
        ),
      ),
    );
  }

  Widget _buildProfileOption(IconData icon, String title) {
    return GlassContainer(
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          Icon(icon, color: AppColors.brandRed, size: 20),
          const SizedBox(width: 16),
          Text(title,
              style: const TextStyle(
                  color: Colors.white,
                  fontSize: 14,
                  fontWeight: FontWeight.bold)),
          const Spacer(),
          Icon(Icons.chevron_right,
              color: Colors.white.withOpacity(0.2), size: 16),
        ],
      ),
    );
  }
}
