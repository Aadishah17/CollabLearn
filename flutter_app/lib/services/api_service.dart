import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class ApiService {
  // Override for physical devices or alternate environments:
  // flutter run --dart-define=COLLABLEARN_API_URL=http://192.168.x.x:5001
  static const String baseUrl = String.fromEnvironment(
    'COLLABLEARN_API_URL',
    defaultValue: 'http://10.0.2.2:5001',
  );

  Map<String, String> _jsonHeaders({String? token}) {
    final headers = <String, String>{'Content-Type': 'application/json'};

    if (token != null && token.isNotEmpty) {
      headers['Authorization'] = 'Bearer $token';
    }

    return headers;
  }

  Map<String, dynamic> _decodeBody(http.Response response) {
    try {
      final decoded = jsonDecode(response.body);
      if (decoded is Map<String, dynamic>) {
        return decoded;
      }
    } catch (error) {
      // Fall through to a shaped error payload.
    }

    return {
      'success': false,
      'message': 'Invalid server response',
    };
  }

  String? _extractUserId(dynamic user) {
    if (user is Map<String, dynamic>) {
      final id = user['id'] ?? user['_id'];
      if (id is String && id.isNotEmpty) {
        return id;
      }
    }

    return null;
  }

  Future<AuthResponse> login(String email, String password,
      {String role = 'user'}) async {
    final response = await http.post(
      Uri.parse('$baseUrl/api/auth/login'),
      headers: _jsonHeaders(),
      body: jsonEncode({
        'email': email,
        'password': password,
        'role': role,
      }),
    );

    final data = _decodeBody(response);
    if (response.statusCode == 200 && data['success'] == true) {
      if (data['token'] != null) {
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('token', data['token']);
        final userId = _extractUserId(data['user']);
        if (userId != null) {
          await prefs.setString('userId', userId);
        }
      }
      return AuthResponse(
          success: true, message: data['message'], user: data['user']);
    } else {
      return AuthResponse(
          success: false, message: data['message'] ?? 'Login failed');
    }
  }

  Future<AuthResponse> signup(String name, String email, String password) async {
    final response = await http.post(
      Uri.parse('$baseUrl/api/auth/register'),
      headers: _jsonHeaders(),
      body: jsonEncode({
        'name': name,
        'email': email,
        'password': password,
      }),
    );

    final data = _decodeBody(response);
    if (response.statusCode == 201 ||
        (response.statusCode == 200 && data['success'] == true)) {
      return AuthResponse(
          success: true,
          message: data['message'] ?? 'Account created',
          user: data['user']);
    } else {
      return AuthResponse(
          success: false, message: data['message'] ?? 'Signup failed');
    }
  }

  Future<Map<String, dynamic>> generateRoadmap(
      Map<String, dynamic> payload) async {
    final response = await http.post(
      Uri.parse('$baseUrl/api/ai/roadmap'),
      headers: _jsonHeaders(),
      body: jsonEncode(payload),
    );
    return _decodeBody(response);
  }

  Future<Map<String, dynamic>> generateStudySession(
      Map<String, dynamic> payload) async {
    final response = await http.post(
      Uri.parse('$baseUrl/api/ai/study-session'),
      headers: _jsonHeaders(),
      body: jsonEncode(payload),
    );
    return _decodeBody(response);
  }

  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('token');
    await prefs.remove('userId');
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
    final token = await getToken();
    final endpoint = (token != null && token.isNotEmpty)
        ? '$baseUrl/api/auth/me'
        : '$baseUrl/api/auth/user/$userId';

    final response = await http.get(
      Uri.parse(endpoint),
      headers: _jsonHeaders(token: token),
    );
    return _decodeBody(response);
  }

  // --- Booking Endpoints ---

  Future<Map<String, dynamic>> getBookings(String userId,
      {bool isInstructor = false}) async {
    final type = isInstructor ? 'instructor' : 'student';
    final response = await http.get(
      Uri.parse('$baseUrl/api/booking/$type/$userId'),
      headers: _jsonHeaders(),
    );
    return _decodeBody(response);
  }

  Future<Map<String, dynamic>> createBooking(
      Map<String, dynamic> payload) async {
    final response = await http.post(
      Uri.parse('$baseUrl/api/booking'),
      headers: _jsonHeaders(),
      body: jsonEncode(payload),
    );
    return _decodeBody(response);
  }

  // --- Community Endpoints ---

  Future<Map<String, dynamic>> getPosts() async {
    final response = await http.get(
      Uri.parse('$baseUrl/api/posts'),
      headers: _jsonHeaders(),
    );
    return _decodeBody(response);
  }

  Future<Map<String, dynamic>> createPost(Map<String, dynamic> payload) async {
    final response = await http.post(
      Uri.parse('$baseUrl/api/posts'),
      headers: _jsonHeaders(),
      body: jsonEncode(payload),
    );
    return _decodeBody(response);
  }

  Future<Map<String, dynamic>> likePost(String postId) async {
    final response = await http.post(
      Uri.parse('$baseUrl/api/posts/$postId/like'),
      headers: _jsonHeaders(),
    );
    return _decodeBody(response);
  }

  Future<Map<String, dynamic>> addComment(
      String postId, Map<String, dynamic> payload) async {
    final response = await http.post(
      Uri.parse('$baseUrl/api/posts/$postId/comment'),
      headers: _jsonHeaders(),
      body: jsonEncode(payload),
    );
    return _decodeBody(response);
  }
}

class AuthResponse {
  final bool success;
  final String? message;
  final dynamic user;

  AuthResponse({required this.success, this.message, this.user});
}
