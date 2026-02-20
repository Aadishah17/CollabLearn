import 'package:flutter/material.dart';
import 'package:collablearn_flutter/theme.dart';
import 'package:collablearn_flutter/services/api_service.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:collablearn_flutter/providers/user_provider.dart';

class LoginPage extends StatefulWidget {
  const LoginPage({super.key});

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _nameController = TextEditingController();
  String _role = 'user';
  bool _isSignup = false;
  bool _isLoading = false;
  String _statusMessage = '';
  bool _isError = false;

  final _apiService = ApiService();

  Future<void> _handleAuth() async {
    final email = _emailController.text.trim();
    final password = _passwordController.text.trim();
    final name = _nameController.text.trim();

    if (email.isEmpty || password.isEmpty || (_isSignup && name.isEmpty)) {
      setState(() {
        _isError = true;
        _statusMessage = 'Please fill in all fields.';
      });
      return;
    }

    setState(() {
      _isLoading = true;
      _statusMessage = '';
    });

    try {
      AuthResponse response;
      if (_isSignup) {
        response = await _apiService.signup(name, email, password, _role);
      } else {
        response = await _apiService.login(email, password, _role);
      }

      setState(() {
        _isError = !response.success;
        _statusMessage =
            response.message ?? (response.success ? 'Success!' : 'Failed');
      });

      if (response.success) {
        if (_isSignup) {
          Future.delayed(const Duration(seconds: 1), () {
            setState(() {
              _isSignup = false;
              _statusMessage = 'Account created. Please sign in.';
            });
          });
        } else {
          // Populate provider
          if (mounted) {
            Provider.of<UserProvider>(context, listen: false)
                .setUser(response.user);
            Navigator.pushReplacementNamed(context, '/dashboard');
          }
        }
      }
    } catch (e) {
      setState(() {
        _isError = true;
        _statusMessage = e.toString();
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.zinc950,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.chevron_left, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            children: [
              const Icon(Icons.bolt, color: AppColors.brandRed, size: 48),
              const SizedBox(height: 16),
              Text(
                _isSignup ? 'Create Account' : 'Welcome back',
                style: GoogleFonts.outfit(
                    fontSize: 28,
                    fontWeight: FontWeight.bold,
                    color: Colors.white),
              ),
              const SizedBox(height: 8),
              Text(
                _isSignup
                    ? 'Join the community to start learning.'
                    : 'Sign in to continue your journey.',
                style: TextStyle(color: Colors.white.withOpacity(0.5)),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 40),
              GlassContainer(
                padding: const EdgeInsets.all(24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildRolePicker(),
                    const SizedBox(height: 24),
                    if (_isSignup) ...[
                      _buildTextField(
                          label: 'Full Name',
                          controller: _nameController,
                          hint: 'John Doe'),
                      const SizedBox(height: 20),
                    ],
                    _buildTextField(
                        label: 'Email Address',
                        controller: _emailController,
                        hint: 'email@example.com',
                        keyboardType: TextInputType.emailAddress),
                    const SizedBox(height: 20),
                    _buildTextField(
                        label: 'Password',
                        controller: _passwordController,
                        hint: '••••••••',
                        isSecure: true),
                    const SizedBox(height: 32),
                    Text(_isLoading
                            ? (_isSignup ? 'Creating...' : 'Signing in...')
                            : (_isSignup ? 'Sign Up' : 'Sign In'))
                        .brandButtonStyle()
                        .onTap(_isLoading ? null : _handleAuth),
                    if (_statusMessage.isNotEmpty) ...[
                      const SizedBox(height: 16),
                      Center(
                        child: Text(
                          _statusMessage,
                          style: TextStyle(
                              color:
                                  _isError ? AppColors.brandRed : Colors.green,
                              fontSize: 13),
                          textAlign: TextAlign.center,
                        ),
                      ),
                    ],
                    const SizedBox(height: 24),
                    Center(
                      child: TextButton(
                        onPressed: () {
                          setState(() {
                            _isSignup = !_isSignup;
                            _statusMessage = '';
                          });
                        },
                        child: Text(
                          _isSignup
                              ? 'Already have an account? Sign In'
                              : "Don't have an account? Sign Up",
                          style: const TextStyle(
                              color: AppColors.brandRed, fontSize: 13),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildRolePicker() {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.zinc800.withOpacity(0.5),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(
        children: [
          Expanded(child: _roleOption('Student', 'user')),
          Expanded(child: _roleOption('Admin', 'admin')),
        ],
      ),
    );
  }

  Widget _roleOption(String label, String value) {
    final isSelected = _role == value;
    return GestureDetector(
      onTap: () => setState(() => _role = value),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.brandRed : Colors.transparent,
          borderRadius: BorderRadius.circular(8),
        ),
        child: Center(
          child: Text(
            label,
            style: TextStyle(
              color: isSelected ? Colors.white : Colors.white.withOpacity(0.5),
              fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
              fontSize: 13,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildTextField({
    required String label,
    required TextEditingController controller,
    required String hint,
    bool isSecure = false,
    TextInputType keyboardType = TextInputType.text,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: TextStyle(
              color: Colors.white.withOpacity(0.5),
              fontSize: 12,
              fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 8),
        TextField(
          controller: controller,
          obscureText: isSecure,
          keyboardType: keyboardType,
          style: const TextStyle(color: Colors.white, fontSize: 14),
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: TextStyle(color: Colors.white.withOpacity(0.2)),
            filled: true,
            fillColor: AppColors.zinc800.withOpacity(0.5),
            contentPadding:
                const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: BorderSide(color: Colors.white.withOpacity(0.1)),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: BorderSide(color: Colors.white.withOpacity(0.1)),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: const BorderSide(color: AppColors.brandRed, width: 1),
            ),
          ),
        ),
      ],
    );
  }
}
