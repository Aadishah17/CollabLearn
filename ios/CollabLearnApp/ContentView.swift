import SwiftUI

struct ContentView: View {
    @Environment(\.colorScheme) private var colorScheme

    var body: some View {
        NavigationStack {
            ZStack {
                Color.zinc950.ignoresSafeArea()
                
                ScrollView {
                    VStack(alignment: .leading, spacing: 32) {
                        header
                        hero
                        actions
                        categoryGrid
                    }
                    .padding(20)
                }
            }
            .navigationTitle("")
            .navigationBarHidden(true)
        }
        .preferredColorScheme(.dark)
    }

    private var header: some View {
        HStack {
            HStack(spacing: 8) {
                Image(systemName: "bolt.fill")
                    .foregroundStyle(Color.brandRed)
                Text("CollabLearn")
                    .font(.headline)
                    .foregroundStyle(.white)
            }
            Spacer()
            NavigationLink {
                LoginView()
            } label: {
                Text("Log in")
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(Color.brandRed)
            }
        }
    }

    private var hero: some View {
        VStack(alignment: .leading, spacing: 16) {
            VStack(alignment: .leading, spacing: 4) {
                Text("Learn Any Skill")
                    .font(.system(size: 36, weight: .black))
                Text("Get AI Guidance")
                    .font(.system(size: 36, weight: .black))
                    .foregroundStyle(Color.brandRed)
                Text("Build Consistency")
                    .font(.system(size: 36, weight: .black))
            }
            .foregroundStyle(.white)
            
            Text("Generate personalized roadmaps, get top video guidance, and plan your next study session.")
                .font(.body)
                .foregroundStyle(.secondary)
                .padding(.top, 4)
        }
        .padding(24)
        .glassCard()
    }

    private var actions: some View {
        VStack(spacing: 16) {
            NavigationLink {
                LoginView() // In Android, "Join Free" goes to Signup
            } label: {
                Text("Join for Free")
                    .brandButtonStyle(isPrimary: true)
            }

            NavigationLink {
                AiLearningView()
            } label: {
                Text("Explore AI Studio")
                    .brandButtonStyle(isPrimary: false)
            }
        }
    }

    private var categoryGrid: some View {
        VStack(alignment: .leading, spacing: 18) {
            Text("Popular Tracks")
                .font(.title3.bold())
                .foregroundStyle(.white)

            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 16) {
                CategoryCard(icon: "laptopcomputer", title: "Programming", count: "2.5k+ skills")
                CategoryCard(icon: "paintpalette", title: "Design", count: "1.2k+ skills")
                CategoryCard(icon: "waveform.path.ecg", title: "Data", count: "900+ skills")
                CategoryCard(icon: "mic", title: "Communication", count: "1.0k+ skills")
            }
        }
    }
}

private struct CategoryCard: View {
    let icon: String
    let title: String
    let count: String

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Image(systemName: icon)
                .foregroundStyle(Color.brandRed)
                .font(.title2)
            
            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.headline)
                    .foregroundStyle(.white)
                Text(count)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
        .frame(maxWidth: .infinity, minHeight: 100, alignment: .leading)
        .padding(16)
        .glassCard()
    }
}
