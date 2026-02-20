import SwiftUI

struct DashboardView: View {
    @State private var selectedTab = 0
    
    var body: some View {
        TabView(selection: $selectedTab) {
            HomeTab()
                .tabItem {
                    Label("Home", systemImage: "house.fill")
                }
                .tag(0)
            
            AiLearningView()
                .tabItem {
                    Label("AI Learn", systemImage: "sparkles")
                }
                .tag(1)
            
            Text("Community coming soon")
                .tabItem {
                    Label("Community", systemImage: "person.2.fill")
                }
                .tag(2)
            
            ProfileTab()
                .tabItem {
                    Label("Profile", systemImage: "person.crop.circle.fill")
                }
                .tag(3)
        }
        .accentColor(.brandRed)
        .preferredColorScheme(.dark)
    }
}

struct HomeTab: View {
    var body: some View {
        ZStack {
            Color.zinc950.ignoresSafeArea()
            
            ScrollView {
                VStack(alignment: .leading, spacing: 24) {
                    // Welcome Header
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Welcome back,")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                        Text("Learner")
                            .font(.title.bold())
                            .foregroundStyle(.white)
                    }
                    .padding(.top, 20)
                    
                    // Stats Grid
                    LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 16) {
                        StatCard(title: "Skills Learnt", value: "12", icon: "checkmark.circle.fill")
                        StatCard(title: "Study Hours", value: "48h", icon: "clock.fill")
                        StatCard(title: "Day Streak", value: "5", icon: "flame.fill")
                        StatCard(title: "AI Credits", value: "850", icon: "sparkles")
                    }
                    
                    // Quick Actions
                    VStack(alignment: .leading, spacing: 16) {
                        Text("Quick Actions")
                            .font(.headline)
                            .foregroundStyle(.white)
                        
                        VStack(spacing: 12) {
                            ActionRow(title: "Generate New Roadmap", subtitle: "Start learning a new skill", icon: "map.fill")
                            ActionRow(title: "Next Study Session", subtitle: "Resume your progress", icon: "play.fill")
                            ActionRow(title: "Browse Community", subtitle: "Learn with others", icon: "person.2.fill")
                        }
                    }
                }
                .padding(20)
            }
        }
    }
}

struct StatCard: View {
    let title: String
    let value: String
    let icon: String
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: icon)
                    .foregroundStyle(.brandRed)
                Spacer()
            }
            
            VStack(alignment: .leading, spacing: 2) {
                Text(value)
                    .font(.title2.bold())
                    .foregroundStyle(.white)
                Text(title)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
        .padding(16)
        .glassCard()
    }
}

struct ActionRow: View {
    let title: String
    let subtitle: String
    let icon: String
    
    var body: some View {
        HStack(spacing: 16) {
            Image(systemName: icon)
                .font(.title2)
                .foregroundStyle(.white)
                .frame(width: 48, height: 48)
                .background(Color.brandRed.opacity(0.1))
                .clipShape(Circle())
            
            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.subheadline.bold())
                    .foregroundStyle(.white)
                Text(subtitle)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            
            Spacer()
            
            Image(systemName: "chevron.right")
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .padding(12)
        .glassCard()
    }
}

struct ProfileTab: View {
    var body: some View {
        ZStack {
            Color.zinc950.ignoresSafeArea()
            Text("Profile View")
                .foregroundStyle(.white)
        }
    }
}

struct DashboardView_Previews: PreviewProvider {
    static var previews: some View {
        DashboardView()
    }
}
