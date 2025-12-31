import SwiftUI

struct ContentView: View {
    @UiMode var uiMode // Hypothetical wrapper for color scheme logic if needed, but standard Environment is better
    @Environment(\.colorScheme) var colorScheme
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 0) {
                    // Navbar placeholder
                    HStack {
                        Image(systemName: "person.2.circle.fill") // Logo placeholder
                            .foregroundColor(.sky600)
                            .font(.title)
                        Text("CollabLearn")
                            .font(.title2)
                            .fontWeight(.bold)
                            .foregroundColor(colorScheme == .dark ? .white : .sky600)
                        
                        Spacer()
                        
                        NavigationLink(destination: LoginView()) {
                            Text("Log in")
                                .fontWeight(.semibold)
                                .foregroundColor(colorScheme == .dark ? .gray : .gray)
                        }
                        
                        NavigationLink(destination: LoginView()) { // Reusing Login for signup for now
                            Text("Get Started")
                                .fontWeight(.semibold)
                                .foregroundColor(.white)
                                .padding(.horizontal, 16)
                                .padding(.vertical, 8)
                                .background(Color.sky600)
                                .cornerRadius(8)
                        }
                    }
                    .padding()
                    
                    // Hero Section
                    VStack(spacing: 24) {
                        HStack(spacing: 8) {
                            Text("⚡")
                            Text("Join 10,000+ active learners")
                        }
                        .font(.footnote)
                        .fontWeight(.medium)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 6)
                        .background(Color.purple.opacity(0.1))
                        .foregroundColor(.purple) // Simplified color
                        .cornerRadius(20)
                        
                        Text("Learn Skills, ")
                            .font(.system(size: 40, weight: .bold))
                            .foregroundColor(.primary)
                        + Text("Teach Others")
                            .font(.system(size: 40, weight: .bold))
                            .foregroundColor(.sky600) // Needs gradient text modifier actually
                        + Text(",\nGrow Together")
                            .font(.system(size: 40, weight: .bold))
                            .foregroundColor(.primary)
                        
                        Text("The peer-to-peer learning platform where everyone is both a student and a teacher. Share your expertise, learn new skills, and build meaningful connections.")
                            .font(.body)
                            .multilineTextAlignment(.center)
                            .foregroundColor(.gray)
                            .padding(.horizontal)
                        
                        VStack(spacing: 16) {
                            TextField("Enter your email to get started", text: .constant(""))
                                .padding()
                                .background(colorScheme == .dark ? Color.zinc900 : Color.white)
                                .cornerRadius(10)
                                .overlay(
                                    RoundedRectangle(cornerRadius: 10)
                                        .stroke(Color.gray.opacity(0.3), lineWidth: 1)
                                )
                                .padding(.horizontal)

                            Button(action: {}) {
                                Text("Join Free")
                                    .frame(maxWidth: .infinity)
                                    .padding()
                                    .background(Color.sky600)
                                    .foregroundColor(.white)
                                    .cornerRadius(10)
                                    .font(.headline)
                            }
                            .padding(.horizontal)

                        }
                        .padding(.top, 10)
                        
                        // Features
                        HStack(spacing: 20) {
                            Label("Free to join", systemImage: "heart.fill").foregroundColor(.red)
                            Label("Verified profiles", systemImage: "checkmark.shield.fill").foregroundColor(.teal)
                        }
                        .font(.caption)
                        .padding(.top)
                    }
                    .padding(.vertical, 40)
                    
                    // Categories Section
                    VStack(alignment: .leading, spacing: 20) {
                        Text("Explore Popular Categories")
                            .font(.title2)
                            .fontWeight(.bold)
                        
                        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 16) {
                            CategoryCard(icon: "laptopcomputer", title: "Programming", count: "2.5k+ skills", color: .blue)
                            CategoryCard(icon: "graduationcap.fill", title: "Academics", count: "1.8k+ skills", color: .green)
                            CategoryCard(icon: "music.note", title: "Music", count: "950+ skills", color: .purple)
                            CategoryCard(icon: "paintpalette.fill", title: "Arts & Design", count: "1.2k+ skills", color: .pink)
                        }
                    }
                    .padding()
                    .background(colorScheme == .dark ? Color.black : Color.white)
                    
                    // Why Choose Section
                    VStack(spacing: 30) {
                        Text("Why Choose CollabLearn?")
                            .font(.title2)
                            .fontWeight(.bold)
                            .multilineTextAlignment(.center)
                        
                        VStack(spacing: 24) {
                            FeatureRow(icon: "person.2.fill", title: "Learn from Peers", description: "Connect with passionate learners and expert teachers.")
                            FeatureRow(icon: "calendar", title: "Flexible Scheduling", description: "Book sessions that fit your schedule.")
                            FeatureRow(icon: "trophy.fill", title: "Earn Rewards", description: "Gain badges and build your reputation.")
                        }
                    }
                    .padding()
                    .padding(.vertical, 20)
                    
                    Footer()
                }
            }
            .navigationBarHidden(true)
            .background(colorScheme == .dark ? Color.black : Color.purple50)
        }
    }
}

struct CategoryCard: View {
    let icon: String
    let title: String
    let count: String
    let color: Color
    @Environment(\.colorScheme) var colorScheme
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Image(systemName: icon)
                .font(.title2)
                .foregroundColor(color)
                .padding(12)
                .background(color.opacity(0.1))
                .cornerRadius(12)
            
            Text(title)
                .font(.headline)
            Text(count)
                .font(.caption)
                .foregroundColor(.gray)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
        .background(colorScheme == .dark ? Color.zinc900 : Color.white)
        .cornerRadius(16)
        .shadow(color: Color.black.opacity(0.05), radius: 5, x: 0, y: 2)
    }
}

struct FeatureRow: View {
    let icon: String
    let title: String
    let description: String
    
    var body: some View {
        HStack(alignment: .top, spacing: 16) {
            Image(systemName: icon)
                .font(.title2)
                .foregroundColor(.white)
                .frame(width: 50, height: 50)
                .background(Color.sky600)
                .cornerRadius(12)
            
            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.headline)
                Text(description)
                    .font(.subheadline)
                    .foregroundColor(.gray)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

struct Footer: View {
    var body: some View {
        VStack(spacing: 20) {
            Text("© 2024 CollabLearn. All rights reserved.")
                .font(.caption)
                .foregroundColor(.gray)
        }
        .padding(.vertical, 40)
        .frame(maxWidth: .infinity)
        .background(Color.gray.opacity(0.05))
    }
}
