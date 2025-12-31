import SwiftUI

struct LoginView: View {
    @State private var email = ""
    @State private var password = ""
    @State private var role = "user"
    @State private var isLoading = false
    @State private var showPassword = false
    @Environment(\.presentationMode) var presentationMode
    @Environment(\.colorScheme) var colorScheme

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 24) {
                // Header
                HStack {
                    Image(systemName: "person.2.circle.fill") // Logo placeholder
                        .resizable()
                        .frame(width: 32, height: 32)
                        .foregroundColor(.sky600)
                    Text("CollabLearn")
                        .font(.headline)
                        .fontWeight(.bold)
                }
                .padding(.top, 20)
                
                VStack(alignment: .leading, spacing: 8) {
                    Text("Welcome back")
                        .font(.largeTitle)
                        .fontWeight(.bold)
                    
                    Text("Please enter your details to sign in.")
                        .font(.body)
                        .foregroundColor(.gray)
                }
                .padding(.vertical, 20)
                
                // Role Toggle
                HStack(spacing: 0) {
                    RoleButton(title: "Student", isSelected: role == "user") {
                        role = "user"
                    }
                    RoleButton(title: "Admin", isSelected: role == "admin") {
                        role = "admin"
                    }
                }
                .background(Color.gray.opacity(0.1))
                .cornerRadius(12)
                .padding(.bottom, 10)
                
                // Form
                VStack(spacing: 20) {
                    VStack(alignment: .leading) {
                        Text("Email")
                            .font(.subheadline)
                            .fontWeight(.medium)
                            .foregroundColor(.gray)
                        
                        TextField("Enter your email", text: $email)
                            .padding()
                            .background(colorScheme == .dark ? Color.zinc900 : Color.white)
                            .cornerRadius(12)
                            .overlay(
                                RoundedRectangle(cornerRadius: 12)
                                    .stroke(Color.gray.opacity(0.2), lineWidth: 1)
                            )
                            .textInputAutocapitalization(.never)
                            .keyboardType(.emailAddress)
                    }
                    
                    VStack(alignment: .leading) {
                        Text("Password")
                            .font(.subheadline)
                            .fontWeight(.medium)
                            .foregroundColor(.gray)
                        
                        HStack {
                            if showPassword {
                                TextField("••••••••", text: $password)
                            } else {
                                SecureField("••••••••", text: $password)
                            }
                            
                            Button(action: { showPassword.toggle() }) {
                                Image(systemName: showPassword ? "eye.slash" : "eye")
                                    .foregroundColor(.gray)
                            }
                        }
                        .padding()
                        .background(colorScheme == .dark ? Color.zinc900 : Color.white)
                        .cornerRadius(12)
                        .overlay(
                            RoundedRectangle(cornerRadius: 12)
                                    .stroke(Color.gray.opacity(0.2), lineWidth: 1)
                        )
                    }
                    
                    HStack {
                        // Remember me (simplified)
                        Toggle("Remember me", isOn: .constant(true))
                            .labelsHidden()
                            .toggleStyle(SwitchToggleStyle(tint: .sky600))
                        Text("Remember me")
                            .font(.subheadline)
                            .foregroundColor(.gray)
                        
                        Spacer()
                        
                        Button("Forgot password?") {
                            // Action
                        }
                        .font(.subheadline)
                        .foregroundColor(.sky600)
                    }
                    
                    Button(action: performLogin) {
                        HStack {
                            if isLoading {
                                ProgressView()
                                    .progressViewStyle(CircularProgressViewStyle(tint: .white))
                            } else {
                                Text("Sign in")
                                    .fontWeight(.bold)
                                Image(systemName: "arrow.right")
                            }
                        }
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(LinearGradient(gradient: Gradient(colors: [Color.sky600, Color.purple600]), startPoint: .leading, endPoint: .trailing))
                        .foregroundColor(.white)
                        .cornerRadius(12)
                        .shadow(color: .sky600.opacity(0.3), radius: 5, x: 0, y: 3)
                    }
                    .disabled(isLoading)
                    
                    HStack {
                        VStack { Divider() }
                        Text("Or continue with")
                            .font(.caption)
                            .foregroundColor(.gray)
                        VStack { Divider() }
                    }
                    .padding(.vertical)
                    
                    Button(action: {}) {
                        HStack {
                            Image(systemName: "g.circle.fill") // Google placeholder
                            Text("Sign in with Google")
                        }
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(colorScheme == .dark ? Color.zinc800 : Color.white)
                        .foregroundColor(.primary)
                        .cornerRadius(12)
                        .overlay(
                            RoundedRectangle(cornerRadius: 12)
                                .stroke(Color.gray.opacity(0.2), lineWidth: 1)
                        )
                    }
                }
                
                Spacer()
                
                HStack {
                    Text("Don't have an account?")
                        .foregroundColor(.gray)
                    Button("Create free account") {
                        // Navigate to Signup
                    }
                    .foregroundColor(.sky600)
                    .fontWeight(.semibold)
                }
                .frame(maxWidth: .infinity)
            }
            .padding(24)
        }
        .background(colorScheme == .dark ? Color.black : Color.white)
        .navigationBarHidden(true)
    }
    
    func performLogin() {
        isLoading = true
        // Simulate network request
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
            isLoading = false
            // Handle success/failure
            print("Login for \(email) with role \(role)")
        }
    }
}

struct RoleButton: View {
    let title: String
    let isSelected: Bool
    let action: () -> Void
    @Environment(\.colorScheme) var colorScheme
    
    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.subheadline)
                .fontWeight(.semibold)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 8)
                .background(isSelected ? (colorScheme == .dark ? Color.zinc800 : Color.white) : Color.clear)
                .foregroundColor(isSelected ? .sky600 : .gray)
                .cornerRadius(10)
                .shadow(color: isSelected ? Color.black.opacity(0.1) : Color.clear, radius: 2, x: 0, y: 1)
        }
        .padding(4)
    }
}
