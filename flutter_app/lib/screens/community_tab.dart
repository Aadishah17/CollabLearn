import 'package:flutter/material.dart';
import 'package:collablearn_flutter/theme.dart';
import 'package:collablearn_flutter/services/api_service.dart';
import 'package:provider/provider.dart';
import 'package:collablearn_flutter/providers/user_provider.dart';

class CommunityTab extends StatefulWidget {
  const CommunityTab({super.key});

  @override
  State<CommunityTab> createState() => _CommunityTabState();
}

class _CommunityTabState extends State<CommunityTab> {
  final _apiService = ApiService();
  List<dynamic> _posts = [];
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _fetchPosts();
  }

  Future<void> _fetchPosts() async {
    setState(() => _isLoading = true);
    try {
      final response = await _apiService.getPosts();
      if (response['success'] == true) {
        setState(() => _posts = response['posts'] ?? []);
      }
    } catch (e) {
      debugPrint('Error fetching posts: $e');
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _createPost() async {
    final userProvider = Provider.of<UserProvider>(context, listen: false);
    if (!userProvider.isAuthenticated) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please sign in to post.')),
      );
      return;
    }

    final controller = TextEditingController();
    final result = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppColors.zinc900,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Share something',
            style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        content: TextField(
          controller: controller,
          maxLines: 4,
          autofocus: true,
          style: const TextStyle(color: Colors.white),
          decoration: InputDecoration(
            hintText: "What's on your mind?",
            hintStyle: TextStyle(color: Colors.white.withOpacity(0.2)),
            filled: true,
            fillColor: AppColors.zinc800,
            border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide.none),
          ),
        ),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: const Text('Cancel',
                  style: TextStyle(color: Colors.white60))),
          ElevatedButton(
            style:
                ElevatedButton.styleFrom(backgroundColor: AppColors.brandRed),
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Post', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );

    if (result == true && controller.text.isNotEmpty) {
      final payload = {
        'userId': userProvider.user?['id'] ?? userProvider.user?['_id'],
        'content': controller.text,
      };

      final response = await _apiService.createPost(payload);
      if (response['success'] == true) {
        _fetchPosts();
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.transparent,
      body: Column(
        children: [
          Padding(
            padding:
                const EdgeInsets.symmetric(horizontal: 24.0, vertical: 16.0),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Community',
                    style: TextStyle(
                        color: Colors.white,
                        fontSize: 24,
                        fontWeight: FontWeight.bold)),
                IconButton(
                    onPressed: _fetchPosts,
                    icon: const Icon(Icons.refresh, color: AppColors.brandRed)),
              ],
            ),
          ),
          Expanded(
            child: _isLoading && _posts.isEmpty
                ? const Center(
                    child: CircularProgressIndicator(color: AppColors.brandRed))
                : ListView.builder(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
                    itemCount: _posts.isEmpty ? 3 : _posts.length,
                    itemBuilder: (context, index) {
                      if (_posts.isEmpty) return _buildPlaceholderPost();
                      final post = _posts[index];
                      return _buildPostCard(post);
                    },
                  ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _createPost,
        backgroundColor: AppColors.brandRed,
        child: const Icon(Icons.add, color: Colors.white),
      ),
    );
  }

  Widget _buildPostCard(Map<String, dynamic> post) {
    // author can be null or userInfo
    final authorInfo = post['userInfo'] ?? post['author'];
    final author = authorInfo?['name'] ?? 'CollabLearner';
    final content = post['content'] ?? '';
    final likes = post['likes']?.length ?? 0;
    final comments = post['comments']?.length ?? 0;

    return Padding(
      padding: const EdgeInsets.only(bottom: 20),
      child: GlassContainer(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                CircleAvatar(
                  radius: 18,
                  backgroundColor: AppColors.brandRed.withOpacity(0.2),
                  child: Text(author[0].toUpperCase(),
                      style: const TextStyle(
                          color: AppColors.brandRed,
                          fontSize: 14,
                          fontWeight: FontWeight.bold)),
                ),
                const SizedBox(width: 12),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(author,
                        style: const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                            fontSize: 14)),
                    const Text('Just now',
                        style: TextStyle(color: Colors.white38, fontSize: 11)),
                  ],
                ),
                const Spacer(),
                const Icon(Icons.more_vert, color: Colors.white38, size: 20),
              ],
            ),
            const SizedBox(height: 16),
            Text(
              content,
              style: const TextStyle(
                  color: Colors.white, fontSize: 14, height: 1.5),
            ),
            const SizedBox(height: 20),
            Row(
              children: [
                _buildInteraction(Icons.favorite_border, '$likes'),
                const SizedBox(width: 24),
                _buildInteraction(Icons.chat_bubble_outline, '$comments'),
                const Spacer(),
                const Icon(Icons.share_outlined,
                    color: Colors.white38, size: 20),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInteraction(IconData icon, String count) {
    return Row(
      children: [
        Icon(icon, color: AppColors.brandRed, size: 18),
        const SizedBox(width: 6),
        Text(count,
            style: const TextStyle(color: Colors.white60, fontSize: 12)),
      ],
    );
  }

  Widget _buildPlaceholderPost() {
    return Padding(
      padding: const EdgeInsets.only(bottom: 20),
      child: GlassContainer(
        padding: const EdgeInsets.all(20),
        opacity: 0.3,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                CircleAvatar(
                    radius: 18,
                    backgroundColor: Colors.white.withOpacity(0.05)),
                const SizedBox(width: 12),
                Container(
                    width: 80,
                    height: 12,
                    decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.05),
                        borderRadius: BorderRadius.circular(6))),
              ],
            ),
            const SizedBox(height: 16),
            Container(
                width: double.infinity,
                height: 12,
                decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.05),
                    borderRadius: BorderRadius.circular(6))),
            const SizedBox(height: 8),
            Container(
                width: 200,
                height: 12,
                decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.05),
                    borderRadius: BorderRadius.circular(6))),
          ],
        ),
      ),
    );
  }
}
