import 'package:flutter/material.dart';

class AppColors {
  static const Color brandRed = Color(0xFFE11D48);
  static const Color zinc950 = Color(0xFF0A0A0A);
  static const Color zinc900 = Color(0xFF18181B);
  static const Color zinc800 = Color(0xFF27272A);
  static const Color zinc700 = Color(0xFF3F3F46);
}

class AppTheme {
  static ThemeData darkTheme = ThemeData(
    brightness: Brightness.dark,
    primaryColor: AppColors.brandRed,
    scaffoldBackgroundColor: AppColors.zinc950,
    fontFamily: 'Inter',
    colorScheme: const ColorScheme.dark(
      primary: AppColors.brandRed,
      secondary: AppColors.brandRed,
      surface: AppColors.zinc900,
    ),
  );
}

class GlassContainer extends StatelessWidget {
  final Widget child;
  final double borderRadius;
  final EdgeInsetsGeometry? padding;
  final double blur;
  final double opacity;

  const GlassContainer({
    super.key,
    required this.child,
    this.borderRadius = 16,
    this.padding,
    this.blur = 10,
    this.opacity = 0.05,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: padding,
      decoration: BoxDecoration(
        color: const Color(0xFF121214).withOpacity(0.95),
        borderRadius: BorderRadius.circular(borderRadius),
        border: Border.all(
          color: Colors.white.withOpacity(opacity > 0.05 ? opacity : 0.08),
          width: 1,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.4),
            blurRadius: 16,
            offset: const Offset(0, 8),
          ),
          BoxShadow(
            color: AppColors.brandRed.withOpacity(0.08),
            blurRadius: 24,
            spreadRadius: -4,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: child,
    );
  }
}

extension BrandButton on Widget {
  Widget brandButtonStyle({bool isPrimary = true}) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 16),
      decoration: BoxDecoration(
        color: isPrimary ? AppColors.brandRed : Colors.transparent,
        borderRadius: BorderRadius.circular(12),
        border:
            isPrimary ? null : Border.all(color: Colors.white.withOpacity(0.2)),
        boxShadow: isPrimary
            ? [
                BoxShadow(
                  color: AppColors.brandRed.withOpacity(0.4),
                  blurRadius: 16,
                  offset: const Offset(0, 6),
                )
              ]
            : null,
      ),
      child: Center(
        child: DefaultTextStyle.merge(
          style: const TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.bold,
            fontSize: 16,
            letterSpacing: 0.5,
          ),
          child: this,
        ),
      ),
    );
  }
}

extension OnTapExtension on Widget {
  Widget onTap(VoidCallback? action) {
    return _BouncingTapWrapper(
      onTap: action,
      child: this,
    );
  }
}

class _BouncingTapWrapper extends StatefulWidget {
  final VoidCallback? onTap;
  final Widget child;

  const _BouncingTapWrapper({required this.onTap, required this.child});

  @override
  State<_BouncingTapWrapper> createState() => _BouncingTapWrapperState();
}

class _BouncingTapWrapperState extends State<_BouncingTapWrapper>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 100),
      reverseDuration: const Duration(milliseconds: 150),
    );
    _scaleAnimation = Tween<double>(begin: 1.0, end: 0.95).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: (_) => _controller.forward(),
      onTapUp: (_) {
        _controller.reverse();
        if (widget.onTap != null) widget.onTap!();
      },
      onTapCancel: () => _controller.reverse(),
      behavior: HitTestBehavior.opaque,
      child: ScaleTransition(
        scale: _scaleAnimation,
        child: widget.child,
      ),
    );
  }
}
