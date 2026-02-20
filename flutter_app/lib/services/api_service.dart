import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class ApiService {
  static const String baseUrl = 'http://10.217.22.87:5001';

  Future<AuthResponse> login(String email, String password, String role) async {
    final response = await http.post(
      Uri.parse('$baseUrl/api/auth/login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'email': email,
        'password': password,
        'role': role,
      }),
    );

    final data = jsonDecode(response.body);
    if (response.statusCode == 200 && data['success'] == true) {
      if (data['token'] != null) {
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('token', data['token']);
        if (data['user'] != null && data['user']['id'] != null) {
          await prefs.setString('userId', data['user']['id']);
        }
      }
      return AuthResponse(
          success: true, message: data['message'], user: data['user']);
    } else {
      return AuthResponse(
          success: false, message: data['message'] ?? 'Login failed');
    }
  }

  Future<AuthResponse> signup(
      String name, String email, String password, String role) async {
    final response = await http.post(
      Uri.parse('$baseUrl/api/auth/signup'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'name': name,
        'email': email,
        'password': password,
        'role': role,
      }),
    );

    final data = jsonDecode(response.body);
    if (response.statusCode == 201 ||
        (response.statusCode == 200 && data['success'] == true)) {
      return AuthResponse(
          success: true, message: data['message'] ?? 'Account created');
    } else {
      return AuthResponse(
          success: false, message: data['message'] ?? 'Signup failed');
    }
  }

  Future<Map<String, dynamic>> generateRoadmap(
      Map<String, dynamic> payload) async {
    final response = await http.post(
      Uri.parse('$baseUrl/api/ai/roadmap'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode(payload),
    );
    return jsonDecode(response.body);
  }

  Future<Map<String, dynamic>> generateStudySession(
      Map<String, dynamic> payload) async {
    final response = await http.post(
      Uri.parse('$baseUrl/api/ai/study-session'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode(payload),
    );
    return jsonDecode(response.body);
  }

  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('token');
  }

  Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('token');
  }

  Future<String?> getSavedUserId() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('userId');
  }

  Future<Map<String, dynamic>> getProfile(String userId) async {
    final response = await http.get(
      Uri.parse(
          '$baseUrl/api/auth/profile/$userId'), // Assuming this exists or using a generic one
      headers: {'Content-Type': 'application/json'},
    );
    return jsonDecode(response.body);
  }

  // --- Booking Endpoints ---

  Future<Map<String, dynamic>> getBookings(String userId,
      {bool isInstructor = false}) async {
    final type = isInstructor ? 'instructor' : 'student';
    final response = await http.get(
      Uri.parse('$baseUrl/api/booking/$type/$userId'),
      headers: {'Content-Type': 'application/json'},
    );
    return jsonDecode(response.body);
  }

  Future<Map<String, dynamic>> createBooking(
      Map<String, dynamic> payload) async {
    final response = await http.post(
      Uri.parse('$baseUrl/api/booking'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode(payload),
    );
    return jsonDecode(response.body);
  }

  // --- Community Endpoints ---

  Future<Map<String, dynamic>> getPosts() async {
    final response = await http.get(
      Uri.parse('$baseUrl/api/posts'),
      headers: {'Content-Type': 'application/json'},
    );
    return jsonDecode(response.body);
  }

  Future<Map<String, dynamic>> createPost(Map<String, dynamic> payload) async {
    final response = await http.post(
      Uri.parse('$baseUrl/api/posts'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode(payload),
    );
    return jsonDecode(response.body);
  }

  Future<Map<String, dynamic>> likePost(String postId) async {
    final response = await http.post(
      Uri.parse('$baseUrl/api/posts/$postId/like'),
      headers: {'Content-Type': 'application/json'},
    );
    return jsonDecode(response.body);
  }

  Future<Map<String, dynamic>> addComment(
      String postId, Map<String, dynamic> payload) async {
    final response = await http.post(
      Uri.parse('$baseUrl/api/posts/$postId/comment'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode(payload),
    );
    return jsonDecode(response.body);
  }
}

class AuthResponse {
  final bool success;
  final String? message;
  final dynamic user;

  AuthResponse({required this.success, this.message, this.user});
}
