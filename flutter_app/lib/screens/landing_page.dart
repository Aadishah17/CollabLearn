import 'package:flutter/material.dart';
import 'package:collablearn_flutter/theme.dart';
import 'package:google_fonts/google_fonts.dart';

class LandingPage extends StatelessWidget {
  const LandingPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          color: AppColors.zinc950,
        ),
        child: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildHeader(context),
                const SizedBox(height: 48),
                _buildHero(),
                const SizedBox(height: 40),
                _buildActions(context),
                const SizedBox(height: 48),
                _buildCategoryGrid(),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildHeader(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Row(
          children: [
            const Icon(Icons.bolt, color: AppColors.brandRed, size: 28),
            const SizedBox(width: 8),
            Text(
              'CollabLearn',
              style: GoogleFonts.outfit(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
            ),
          ],
        ),
        TextButton(
          onPressed: () => Navigator.pushNamed(context, '/login'),
          child: const Text(
            'Log in',
            style: TextStyle(
                color: AppColors.brandRed, fontWeight: FontWeight.w600),
          ),
        ),
      ],
    );
  }

  Widget _buildHero() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          decoration: BoxDecoration(
            color: AppColors.brandRed.withOpacity(0.1),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: AppColors.brandRed.withOpacity(0.2)),
          ),
          child: const Text(
            'NEW: AI PATHWAYS 2.0',
            style: TextStyle(
              color: AppColors.brandRed,
              fontSize: 10,
              fontWeight: FontWeight.bold,
              letterSpacing: 1,
            ),
          ),
        ),
        const SizedBox(height: 20),
        RichText(
          text: TextSpan(
            style: GoogleFonts.outfit(
              fontSize: 42,
              fontWeight: FontWeight.w800,
              height: 1.1,
              color: Colors.white,
            ),
            children: const [
              TextSpan(text: 'Master any skill\n'),
              TextSpan(
                text: 'with AI.',
                style: TextStyle(color: AppColors.brandRed),
              ),
            ],
          ),
        ),
        const SizedBox(height: 20),
        Text(
          'Join the next generation of learners. Get personalized roadmaps, real-time collaboration, and AI-powered study sessions.',
          style: TextStyle(
            color: Colors.white.withOpacity(0.6),
            fontSize: 16,
            height: 1.5,
          ),
        ),
      ],
    );
  }

  Widget _buildActions(BuildContext context) {
    return Column(
      children: [
        const Text('Get Started')
            .brandButtonStyle()
            .onTap(() => Navigator.pushNamed(context, '/login')),
        const SizedBox(height: 16),
        const Text(
          'View all tracks',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
        ).brandButtonStyle(isPrimary: false),
      ],
    );
  }

  Widget _buildCategoryGrid() {
    final categories = [
      {'name': 'Programming', 'count': '1.2k tracks', 'icon': Icons.code},
      {'name': 'Design', 'count': '850 tracks', 'icon': Icons.palette},
      {
        'name': 'Business',
        'count': '420 tracks',
        'icon': Icons.business_center
      },
      {'name': 'Marketing', 'count': '310 tracks', 'icon': Icons.trending_up},
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              'Popular Tracks',
              style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Colors.white),
            ),
            Text(
              'See all',
              style:
                  TextStyle(color: Colors.white.withOpacity(0.5), fontSize: 13),
            ),
          ],
        ),
        const SizedBox(height: 20),
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            crossAxisSpacing: 16,
            mainAxisSpacing: 16,
            childAspectRatio: 1.3,
          ),
          itemCount: categories.length,
          itemBuilder: (context, index) {
            final cat = categories[index];
            return GlassContainer(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Icon(cat['icon'] as IconData,
                      color: AppColors.brandRed, size: 24),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        cat['name'] as String,
                        style: const TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 14,
                            color: Colors.white),
                      ),
                      Text(
                        cat['count'] as String,
                        style: TextStyle(
                            color: Colors.white.withOpacity(0.5), fontSize: 11),
                      ),
                    ],
                  ),
                ],
              ),
            );
          },
        ),
      ],
    );
  }
}
