import 'package:flutter/material.dart';
import 'package:collablearn_flutter/theme.dart';
import 'package:collablearn_flutter/screens/ai_learning_page.dart';
import 'package:collablearn_flutter/screens/community_tab.dart';
import 'package:collablearn_flutter/screens/profile_tab.dart';
import 'package:provider/provider.dart';
import 'package:collablearn_flutter/providers/user_provider.dart';

class DashboardPage extends StatefulWidget {
  const DashboardPage({super.key});

  @override
  State<DashboardPage> createState() => _DashboardPageState();
}

class _DashboardPageState extends State<DashboardPage> {
  int _selectedIndex = 0;

  final List<Widget> _pages = [
    const HomeTab(),
    const AiLearningPage(),
    const CommunityTab(),
    const ProfileTab(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.zinc950,
      body: _pages[_selectedIndex],
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: AppColors.zinc900.withOpacity(0.8),
          border:
              Border(top: BorderSide(color: Colors.white.withOpacity(0.05))),
        ),
        child: BottomNavigationBar(
          currentIndex: _selectedIndex,
          onTap: (index) => setState(() => _selectedIndex = index),
          backgroundColor: Colors.transparent,
          elevation: 0,
          type: BottomNavigationBarType.fixed,
          selectedItemColor: AppColors.brandRed,
          unselectedItemColor: Colors.white.withOpacity(0.4),
          selectedLabelStyle:
              const TextStyle(fontWeight: FontWeight.bold, fontSize: 11),
          unselectedLabelStyle: const TextStyle(fontSize: 11),
          items: const [
            BottomNavigationBarItem(
                icon: Icon(Icons.house_rounded), label: 'Home'),
            BottomNavigationBarItem(
                icon: Icon(Icons.auto_awesome_rounded), label: 'AI Learn'),
            BottomNavigationBarItem(
                icon: Icon(Icons.people_alt_rounded), label: 'Community'),
            BottomNavigationBarItem(
                icon: Icon(Icons.account_circle_rounded), label: 'Profile'),
          ],
        ),
      ),
    );
  }
}

class HomeTab extends StatelessWidget {
  const HomeTab({super.key});

  @override
  Widget build(BuildContext context) {
    final userProvider = Provider.of<UserProvider>(context);
    final userName = userProvider.user?['name'] ?? 'Learner';

    return SafeArea(
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Welcome back,',
                    style: TextStyle(
                        color: Colors.white.withOpacity(0.5), fontSize: 14)),
                Text(userName,
                    style: const TextStyle(
                        color: Colors.white,
                        fontSize: 24,
                        fontWeight: FontWeight.bold)),
              ],
            ),
            const SizedBox(height: 32),
            _buildStatsGrid(),
            const SizedBox(height: 40),
            const Text('Quick Actions',
                style: TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.bold)),
            const SizedBox(height: 20),
            _buildQuickActions(context),
          ],
        ),
      ),
    );
  }

  Widget _buildStatsGrid() {
    return GridView.count(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisCount: 2,
      crossAxisSpacing: 16,
      mainAxisSpacing: 16,
      childAspectRatio: 1.4,
      children: const [
        StatCard(
            title: 'Skills Learnt',
            value: '12',
            icon: Icons.check_circle_rounded),
        StatCard(
            title: 'Study Hours',
            value: '48h',
            icon: Icons.access_time_filled_rounded),
        StatCard(
            title: 'Day Streak',
            value: '5',
            icon: Icons.local_fire_department_rounded),
        StatCard(
            title: 'AI Credits',
            value: '850',
            icon: Icons.auto_awesome_rounded),
      ],
    );
  }

  Widget _buildQuickActions(BuildContext context) {
    return Column(
      children: [
        const ActionRow(
                title: 'Generate New Roadmap',
                subtitle: 'Start learning a new skill',
                icon: Icons.map_rounded)
            .onTap(() => DefaultTabController.of(context).animateTo(
                1)), // Would need a controller for this, for now just ui
        const SizedBox(height: 12),
        const ActionRow(
                title: 'Next Study Session',
                subtitle: 'Resume your progress',
                icon: Icons.play_arrow_rounded)
            .onTap(() => Navigator.pushNamed(context, '/bookings')),
        const SizedBox(height: 12),
        const ActionRow(
                title: 'Browse Community',
                subtitle: 'Learn with others',
                icon: Icons.people_alt_rounded)
            .onTap(() => Navigator.pushNamed(context,
                '/community')), // Need to add to routes or handle tab change
      ],
    );
  }
}

class StatCard extends StatelessWidget {
  final String title;
  final String value;
  final IconData icon;

  const StatCard(
      {super.key,
      required this.title,
      required this.value,
      required this.icon});

  @override
  Widget build(BuildContext context) {
    return GlassContainer(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: AppColors.brandRed, size: 20),
          const Spacer(),
          Text(value,
              style: const TextStyle(
                  color: Colors.white,
                  fontSize: 20,
                  fontWeight: FontWeight.bold)),
          Text(title,
              style: TextStyle(
                  color: Colors.white.withOpacity(0.5), fontSize: 11)),
        ],
      ),
    );
  }
}

class ActionRow extends StatelessWidget {
  final String title;
  final String subtitle;
  final IconData icon;

  const ActionRow(
      {super.key,
      required this.title,
      required this.subtitle,
      required this.icon});

  @override
  Widget build(BuildContext context) {
    return GlassContainer(
      padding: const EdgeInsets.all(12),
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: AppColors.brandRed.withOpacity(0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: Colors.white, size: 20),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title,
                    style: const TextStyle(
                        color: Colors.white,
                        fontSize: 13,
                        fontWeight: FontWeight.bold)),
                Text(subtitle,
                    style: TextStyle(
                        color: Colors.white.withOpacity(0.5), fontSize: 11)),
              ],
            ),
          ),
          Icon(Icons.chevron_right,
              color: Colors.white.withOpacity(0.3), size: 16),
        ],
      ),
    );
  }
}
