import 'package:flutter/material.dart';
import 'package:collablearn_flutter/theme.dart';
import 'package:collablearn_flutter/services/api_service.dart';
import 'package:provider/provider.dart';
import 'package:collablearn_flutter/providers/user_provider.dart';

class BookingPage extends StatefulWidget {
  const BookingPage({super.key});

  @override
  State<BookingPage> createState() => _BookingPageState();
}

class _BookingPageState extends State<BookingPage> {
  final _apiService = ApiService();
  final _skillController = TextEditingController();
  final _instructorController =
      TextEditingController(); // Placeholder for real selection
  final _dateController = TextEditingController();

  List<dynamic> _bookings = [];
  bool _isLoading = false;
  bool _isCreating = false;

  @override
  void initState() {
    super.initState();
    _fetchBookings();
  }

  Future<void> _fetchBookings() async {
    final userProvider = Provider.of<UserProvider>(context, listen: false);
    final userId = userProvider.user?['id'] ?? userProvider.user?['_id'];

    if (userId == null) {
      debugPrint('No userId found in UserProvider');
      return;
    }

    setState(() => _isLoading = true);
    try {
      final response = await _apiService.getBookings(userId);
      if (response['success'] == true) {
        setState(() => _bookings = response['bookings'] ?? []);
      }
    } catch (e) {
      debugPrint('Error fetching bookings: $e');
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _createBooking() async {
    final userProvider = Provider.of<UserProvider>(context, listen: false);
    final userId = userProvider.user?['id'] ?? userProvider.user?['_id'];

    if (userId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('User information not found.')),
      );
      return;
    }

    setState(() => _isCreating = true);
    try {
      final payload = {
        'student': userId,
        'instructor':
            '67a840003006660f64be77ba', // Keep one mock instructor for now
        'skill': _skillController.text,
        'date': _dateController.text,
        'duration': 60,
        'notes': 'Looking for 1v1 help with this skill.'
      };

      final response = await _apiService.createBooking(payload);
      if (response['success'] == true) {
        _fetchBookings();
        _skillController.clear();
        _dateController.clear();
        Navigator.pop(context);
      }
    } catch (e) {
      debugPrint('Error creating booking: $e');
    } finally {
      setState(() => _isCreating = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.zinc950,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: const Text('1v1 Sessions',
            style: TextStyle(
                color: Colors.white,
                fontSize: 18,
                fontWeight: FontWeight.bold)),
        leading: IconButton(
            icon: const Icon(Icons.chevron_left, color: Colors.white),
            onPressed: () => Navigator.pop(context)),
      ),
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: _isLoading && _bookings.isEmpty
                  ? const Center(
                      child:
                          CircularProgressIndicator(color: AppColors.brandRed))
                  : ListView.builder(
                      padding: const EdgeInsets.all(24),
                      itemCount: _bookings.isEmpty ? 1 : _bookings.length,
                      itemBuilder: (context, index) {
                        if (_bookings.isEmpty) return _buildNoBookings();
                        final val = _bookings[index];
                        return _buildBookingCard(val);
                      },
                    ),
            ),
            Padding(
              padding: const EdgeInsets.all(24.0),
              child: const Text('Schedule New Session')
                  .brandButtonStyle()
                  .onTap(() => _showBookingSheet(context)),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBookingCard(Map<String, dynamic> booking) {
    final instructor = booking['instructor']?['name'] ?? 'Instructor';
    final skill = booking['skill']?['name'] ?? 'Skill';
    final dateStr = booking['date'] ?? '';
    final status = booking['status'] ?? 'pending';

    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: GlassContainer(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            Container(
              width: 50,
              height: 50,
              decoration: BoxDecoration(
                  color: AppColors.brandRed.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12)),
              child: const Icon(Icons.person, color: Colors.white),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(instructor,
                      style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                          fontSize: 14)),
                  Text(skill,
                      style: TextStyle(
                          color: Colors.white.withOpacity(0.5), fontSize: 12)),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      const Icon(Icons.calendar_today,
                          size: 10, color: AppColors.brandRed),
                      const SizedBox(width: 4),
                      Text(dateStr,
                          style: const TextStyle(
                              color: Colors.white38, fontSize: 10)),
                    ],
                  ),
                ],
              ),
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                  color: status == 'confirmed'
                      ? Colors.green.withOpacity(0.1)
                      : AppColors.brandRed.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8)),
              child: Text(status.toUpperCase(),
                  style: TextStyle(
                      color: status == 'confirmed'
                          ? Colors.green
                          : AppColors.brandRed,
                      fontSize: 8,
                      fontWeight: FontWeight.bold)),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildNoBookings() {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.calendar_month,
              size: 48, color: Colors.white.withOpacity(0.1)),
          const SizedBox(height: 16),
          Text('No upcoming sessions',
              style: TextStyle(color: Colors.white.withOpacity(0.3))),
        ],
      ),
    );
  }

  void _showBookingSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (context) => Padding(
        padding:
            EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
        child: Container(
          decoration: const BoxDecoration(
              color: AppColors.zinc900,
              borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Request 1v1 Session',
                  style: TextStyle(
                      color: Colors.white,
                      fontSize: 20,
                      fontWeight: FontWeight.bold)),
              const SizedBox(height: 24),
              _buildField(
                  'Skill required', _skillController, 'e.g. Flutter Mastery'),
              const SizedBox(height: 16),
              _buildField('Preferred Date', _dateController, 'e.g. 2024-03-25'),
              const SizedBox(height: 32),
              Text(_isCreating ? 'Processing...' : 'Confirm Request')
                  .brandButtonStyle()
                  .onTap(_isCreating ? null : _createBooking),
              const SizedBox(height: 16),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildField(
      String label, TextEditingController controller, String hint) {
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
}
