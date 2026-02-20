import 'package:flutter/material.dart';
import 'package:collablearn_flutter/services/api_service.dart';

class UserProvider extends ChangeNotifier {
  Map<String, dynamic>? _user;
  bool _isLoading = false;
  final ApiService _apiService = ApiService();

  Map<String, dynamic>? get user => _user;
  bool get isLoading => _isLoading;
  bool get isAuthenticated => _user != null;

  void setUser(Map<String, dynamic>? user) {
    _user = user;
    notifyListeners();
  }

  Future<void> loadProfile() async {
    final userId = await _apiService.getSavedUserId();
    if (userId == null) return;

    _isLoading = true;
    notifyListeners();

    try {
      final response = await _apiService.getProfile(userId);
      if (response['success'] == true) {
        _user = response['user'];
      }
    } catch (e) {
      debugPrint('Error loading profile: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> logout() async {
    await _apiService.logout();
    _user = null;
    notifyListeners();
  }
}
