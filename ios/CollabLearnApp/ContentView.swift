import SwiftUI

struct ContentView: View {
    @Environment(\.colorScheme) private var colorScheme

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 24) {
                    header
                    hero
                    actions
                    categoryGrid
                }
                .padding(20)
            }
            .background(colorScheme == .dark ? Color.zinc950 : Color.purple50)
            .navigationTitle("CollabLearn")
            .navigationBarTitleDisplayMode(.inline)
        }
    }

    private var header: some View {
        HStack {
            Label("CollabLearn", systemImage: "bolt.fill")
                .foregroundStyle(.sky600)
                .font(.headline)
            Spacer()
            NavigationLink("Log in") {
                LoginView()
            }
            .font(.subheadline.weight(.semibold))
            .foregroundStyle(.sky600)
        }
    }

    private var hero: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Learn Any Skill")
                .font(.system(size: 32, weight: .bold))
            Text("Get AI Guidance")
                .font(.system(size: 32, weight: .bold))
                .foregroundStyle(.sky600)
            Text("Build Consistency")
                .font(.system(size: 32, weight: .bold))
            Text("Generate personalized roadmaps, get top video guidance, and plan your next study session.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .padding(.top, 4)
        }
    }

    private var actions: some View {
        VStack(spacing: 12) {
            NavigationLink {
                AiLearningView()
            } label: {
                Text("Open AI Learning Studio")
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 14)
                    .background(.sky600)
                    .foregroundStyle(.white)
                    .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
            }

            NavigationLink {
                LoginView()
            } label: {
                Text("Open Login")
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 14)
                    .background(colorScheme == .dark ? Color.zinc800 : Color.white)
                    .foregroundStyle(colorScheme == .dark ? Color.white : Color.zinc900)
                    .overlay(
                        RoundedRectangle(cornerRadius: 12, style: .continuous)
                            .stroke(Color.gray.opacity(0.2), lineWidth: 1)
                    )
                    .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
            }
        }
    }

    private var categoryGrid: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text("Popular Tracks")
                .font(.title3.bold())

            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
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
    @Environment(\.colorScheme) private var colorScheme

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Image(systemName: icon)
                .foregroundStyle(.sky600)
                .font(.title3)
            Text(title)
                .font(.headline)
            Text(count)
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity, minHeight: 90, alignment: .leading)
        .padding(12)
        .background(colorScheme == .dark ? Color.zinc800 : Color.white)
        .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
    }
}
