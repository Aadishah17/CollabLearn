import 'package:flutter/material.dart';
import 'package:collablearn_flutter/theme.dart';
import 'package:collablearn_flutter/services/api_service.dart';

class AiLearningPage extends StatefulWidget {
  const AiLearningPage({super.key});

  @override
  State<AiLearningPage> createState() => _AiLearningPageState();
}

class _AiLearningPageState extends State<AiLearningPage> {
  final _skillController = TextEditingController();
  final _hoursController = TextEditingController(text: '6');
  final _weeksController = TextEditingController(text: '8');
  final _focusController = TextEditingController();
  String _learnerLevel = 'Beginner';

  final _apiService = ApiService();
  bool _isLoadingRoadmap = false;
  bool _isLoadingSession = false;
  String _errorMessage = '';

  Map<String, dynamic>? _roadmap;
  Map<String, dynamic>? _studySession;

  final List<String> _levels = ['Beginner', 'Intermediate', 'Advanced'];

  Future<void> _generateRoadmap() async {
    final skill = _skillController.text.trim();
    if (skill.isEmpty) {
      setState(() => _errorMessage = 'Enter a skill first.');
      return;
    }

    setState(() {
      _isLoadingRoadmap = true;
      _errorMessage = '';
      _studySession = null;
    });

    try {
      final payload = {
        'skill': skill,
        'learnerLevel': _learnerLevel,
        'weeklyHours': int.tryParse(_hoursController.text) ?? 6,
        'targetWeeks': int.tryParse(_weeksController.text) ?? 8,
        'focusAreas': _focusController.text
            .split(',')
            .map((e) => e.trim())
            .where((e) => e.isNotEmpty)
            .toList(),
        'savePlan': false,
      };

      final response = await _apiService.generateRoadmap(payload);
      if (response['success'] == true) {
        setState(() => _roadmap = response['roadmap']);
      } else {
        setState(() => _errorMessage =
            response['message'] ?? 'Failed to generate roadmap');
      }
    } catch (e) {
      setState(() => _errorMessage = e.toString());
    } finally {
      setState(() => _isLoadingRoadmap = false);
    }
  }

  Future<void> _generateStudySession() async {
    if (_roadmap == null) return;

    setState(() {
      _isLoadingSession = true;
      _errorMessage = '';
    });

    try {
      final step = (_roadmap!['steps'] as List).first;
      final payload = {
        'skill': _skillController.text.trim(),
        'learnerLevel': _learnerLevel,
        'weeklyHours': int.tryParse(_hoursController.text) ?? 6,
        'availableMinutes': 60,
        'focusAreas': _focusController.text
            .split(',')
            .map((e) => e.trim())
            .where((e) => e.isNotEmpty)
            .toList(),
        'progressPercentage': 0,
        'roadmap': {
          'summary': _roadmap!['summary'] ?? '',
          'currentStepTitle': step['title'] ?? '',
          'currentStepDescription': step['description'] ?? '',
          'currentStepGoals': step['goals'] ?? [],
        }
      };

      final response = await _apiService.generateStudySession(payload);
      if (response['success'] == true) {
        setState(() => _studySession = response['session']);
      } else {
        setState(() => _errorMessage =
            response['message'] ?? 'Failed to generate study session');
      }
    } catch (e) {
      setState(() => _errorMessage = e.toString());
    } finally {
      setState(() => _isLoadingSession = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Expanded(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('AI Learning Studio',
                    style: TextStyle(
                        color: Colors.white,
                        fontSize: 24,
                        fontWeight: FontWeight.bold)),
                const SizedBox(height: 24),
                _buildInputForm(),
                if (_errorMessage.isNotEmpty) ...[
                  const SizedBox(height: 16),
                  Text(_errorMessage,
                      style: const TextStyle(
                          color: AppColors.brandRed, fontSize: 13)),
                ],
                if (_roadmap != null) _buildRoadmapSection(),
                if (_studySession != null) _buildStudySessionSection(),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildInputForm() {
    return GlassContainer(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildTextField(
              'Learning Goal', _skillController, 'e.g. React, Data Analysis'),
          const SizedBox(height: 20),
          _buildLevelPicker(),
          const SizedBox(height: 20),
          Row(
            children: [
              Expanded(
                  child: _buildTextField('Weekly Hours', _hoursController, '6',
                      keyboardType: TextInputType.number)),
              const SizedBox(width: 16),
              Expanded(
                  child: _buildTextField('Target Weeks', _weeksController, '8',
                      keyboardType: TextInputType.number)),
            ],
          ),
          const SizedBox(height: 24),
          Row(
            children: [
              Expanded(
                child: Text(_isLoadingRoadmap
                        ? 'Generating...'
                        : 'Generate Roadmap')
                    .brandButtonStyle()
                    .onTap(_isLoadingRoadmap ? null : _generateRoadmap),
              ),
              if (_roadmap != null) ...[
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                          _isLoadingSession ? 'Building...' : 'Study Session')
                      .brandButtonStyle(isPrimary: false)
                      .onTap(_isLoadingSession ? null : _generateStudySession),
                ),
              ],
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildLevelPicker() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Current Level',
            style: TextStyle(
                color: Colors.white60,
                fontSize: 12,
                fontWeight: FontWeight.bold)),
        const SizedBox(height: 8),
        Container(
          height: 40,
          decoration: BoxDecoration(
              color: AppColors.zinc800.withOpacity(0.5),
              borderRadius: BorderRadius.circular(10)),
          child: Row(
            children: _levels.map((level) {
              final isSelected = _learnerLevel == level;
              return Expanded(
                child: GestureDetector(
                  onTap: () => setState(() => _learnerLevel = level),
                  child: Container(
                    decoration: BoxDecoration(
                      color:
                          isSelected ? AppColors.brandRed : Colors.transparent,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Center(
                      child: Text(
                        level,
                        style: TextStyle(
                          color: isSelected ? Colors.white : Colors.white60,
                          fontSize: 12,
                          fontWeight:
                              isSelected ? FontWeight.bold : FontWeight.normal,
                        ),
                      ),
                    ),
                  ),
                ),
              );
            }).toList(),
          ),
        ),
      ],
    );
  }

  Widget _buildTextField(
      String label, TextEditingController controller, String hint,
      {TextInputType keyboardType = TextInputType.text}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label,
            style: const TextStyle(
                color: Colors.white60,
                fontSize: 12,
                fontWeight: FontWeight.bold)),
        const SizedBox(height: 8),
        TextField(
          controller: controller,
          keyboardType: keyboardType,
          style: const TextStyle(color: Colors.white, fontSize: 14),
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: TextStyle(color: Colors.white.withOpacity(0.2)),
            filled: true,
            fillColor: AppColors.zinc800.withOpacity(0.5),
            contentPadding:
                const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: BorderSide.none),
          ),
        ),
      ],
    );
  }

  Widget _buildRoadmapSection() {
    final steps = _roadmap!['steps'] as List;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(height: 40),
        const Text('Curated Roadmap',
            style: TextStyle(
                color: Colors.white,
                fontSize: 18,
                fontWeight: FontWeight.bold)),
        const SizedBox(height: 16),
        GlassContainer(
          padding: const EdgeInsets.all(16),
          opacity: 0.4,
          child: Text(_roadmap!['summary'] ?? '',
              style: const TextStyle(
                  color: Colors.white70, fontSize: 13, height: 1.5)),
        ),
        const SizedBox(height: 20),
        ...steps.asMap().entries.map((entry) {
          final idx = entry.key;
          final step = entry.value;
          return Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: GlassContainer(
              padding: const EdgeInsets.all(16),
              opacity: 0.3,
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  CircleAvatar(
                      radius: 12,
                      backgroundColor: AppColors.brandRed,
                      child: Text('${idx + 1}',
                          style: const TextStyle(
                              color: Colors.white,
                              fontSize: 12,
                              fontWeight: FontWeight.bold))),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(step['title'] ?? '',
                            style: const TextStyle(
                                color: Colors.white,
                                fontSize: 14,
                                fontWeight: FontWeight.bold)),
                        const SizedBox(height: 4),
                        Text(step['description'] ?? '',
                            style: const TextStyle(
                                color: Colors.white60, fontSize: 12)),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          );
        }).toList(),
      ],
    );
  }

  Widget _buildStudySessionSection() {
    final tasks = _studySession!['tasks'] as List;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(height: 40),
        const Text('Study Session',
            style: TextStyle(
                color: AppColors.brandRed,
                fontSize: 18,
                fontWeight: FontWeight.bold)),
        const SizedBox(height: 16),
        ...tasks.map((task) {
          return Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: GlassContainer(
              padding: const EdgeInsets.all(16),
              opacity: 0.3,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                            color: AppColors.brandRed.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(12)),
                        child: Text('${task['minutes']} min',
                            style: const TextStyle(
                                color: AppColors.brandRed,
                                fontSize: 10,
                                fontWeight: FontWeight.bold)),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(task['title'] ?? '',
                      style: const TextStyle(
                          color: Colors.white,
                          fontSize: 14,
                          fontWeight: FontWeight.bold)),
                  const SizedBox(height: 4),
                  Text(task['instructions'] ?? '',
                      style:
                          const TextStyle(color: Colors.white60, fontSize: 12)),
                ],
              ),
            ),
          );
        }).toList(),
      ],
    );
  }
}
