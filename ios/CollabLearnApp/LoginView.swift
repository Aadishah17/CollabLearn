import SwiftUI

struct LoginView: View {
    @State private var email = ""
    @State private var password = ""
    @State private var name = ""
    @State private var role = "user"
    @State private var isSignup = false
    @State private var isLoading = false
    @State private var statusMessage = ""
    @State private var isError = false
    
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        ZStack {
            Color.zinc950.ignoresSafeArea()
            
            ScrollView {
                VStack(spacing: 24) {
                    VStack(spacing: 8) {
                        Image(systemName: "bolt.fill")
                            .font(.largeTitle)
                            .foregroundStyle(Color.brandRed)
                        Text(isSignup ? "Create Account" : "Welcome back")
                            .font(.title.bold())
                            .foregroundStyle(.white)
                        Text(isSignup ? "Join the community to start learning." : "Sign in to continue your journey.")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                    }
                    .padding(.top, 40)

                    VStack(alignment: .leading, spacing: 20) {
                        Picker("Role", selection: $role) {
                            Text("Student").tag("user")
                            Text("Admin").tag("admin")
                        }
                        .pickerStyle(.segmented)
                        .padding(.bottom, 8)

                        if isSignup {
                            VStack(alignment: .leading, spacing: 8) {
                                Text("Full Name")
                                    .font(.caption.bold())
                                    .foregroundStyle(.secondary)
                                TextField("John Doe", text: $name)
                                    .textFieldStyle(GlassTextFieldStyle())
                            }
                        }

                        VStack(alignment: .leading, spacing: 8) {
                            Text("Email Address")
                                .font(.caption.bold())
                                .foregroundStyle(.secondary)
                            TextField("email@example.com", text: $email)
                                .textInputAutocapitalization(.never)
                                .keyboardType(.emailAddress)
                                .textFieldStyle(GlassTextFieldStyle())
                        }

                        VStack(alignment: .leading, spacing: 8) {
                            Text("Password")
                                .font(.caption.bold())
                                .foregroundStyle(.secondary)
                            SecureField("••••••••", text: $password)
                                .textFieldStyle(GlassTextFieldStyle())
                        }

                        Button(isLoading ? (isSignup ? "Creating..." : "Signing in...") : (isSignup ? "Sign Up" : "Sign In")) {
                            Task {
                                if isSignup {
                                    await performSignup()
                                } else {
                                    await performLogin()
                                }
                            }
                        }
                        .brandButtonStyle()
                        .disabled(isLoading)

                        if !statusMessage.isEmpty {
                            Text(statusMessage)
                                .font(.footnote)
                                .foregroundStyle(isError ? .brandRed : .green)
                                .frame(maxWidth: .infinity, alignment: .center)
                        }

                        Button(isSignup ? "Already have an account? Sign In" : "Don't have an account? Sign Up") {
                            withAnimation {
                                isSignup.toggle()
                                statusMessage = ""
                            }
                        }
                        .font(.footnote)
                        .foregroundStyle(Color.brandRed)
                        .frame(maxWidth: .infinity, alignment: .center)
                    }
                    .padding(24)
                    .glassCard()
                }
                .padding(20)
            }
        }
        .navigationBarBackButtonHidden(true)
        .toolbar {
            ToolbarItem(placement: .navigationBarLeading) {
                Button {
                    dismiss()
                } label: {
                    Image(systemName: "chevron.left")
                        .foregroundStyle(.white)
                }
            }
        }
    }

    private func performLogin() async {
        let safeEmail = email.trimmingCharacters(in: .whitespacesAndNewlines)
        let safePassword = password.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !safeEmail.isEmpty, !safePassword.isEmpty else {
            isError = true
            statusMessage = "Email and password are required."
            return
        }

        isLoading = true
        defer { isLoading = false }

        do {
            let response = try await AuthService().login(
                email: safeEmail,
                password: safePassword,
                role: role
            )

            if response.success {
                isError = false
                statusMessage = "Logged in successfully!"
                // TODO: Save token and navigate to Dashboard
            } else {
                isError = true
                statusMessage = response.message ?? "Login failed."
            }
        } catch {
            isError = true
            statusMessage = error.localizedDescription
        }
    }

    private func performSignup() async {
        let safeEmail = email.trimmingCharacters(in: .whitespacesAndNewlines)
        let safePassword = password.trimmingCharacters(in: .whitespacesAndNewlines)
        let safeName = name.trimmingCharacters(in: .whitespacesAndNewlines)
        
        guard !safeEmail.isEmpty, !safePassword.isEmpty, !safeName.isEmpty else {
            isError = true
            statusMessage = "All fields are required."
            return
        }

        isLoading = true
        defer { isLoading = false }

        do {
            let response = try await AuthService().signup(
                name: safeName,
                email: safeEmail,
                password: safePassword,
                role: role
            )

            if response.success {
                isError = false
                statusMessage = "Account created! You can now sign in."
                withAnimation { isSignup = false }
            } else {
                isError = true
                statusMessage = response.message ?? "Signup failed."
            }
        } catch {
            isError = true
            statusMessage = error.localizedDescription
        }
    }
}

struct GlassTextFieldStyle: TextFieldStyle {
    func _body(configuration: TextField<Self._Label>) -> some View {
        configuration
            .padding(12)
            .background(Color.zinc800.opacity(0.5))
            .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 10, style: .continuous)
                    .stroke(Color.white.opacity(0.1), lineWidth: 1)
            )
            .foregroundStyle(.white)
    }
}

private struct LoginRequestPayload: Codable {
    let email: String
    let password: String
    let role: String
}

private struct SignupRequestPayload: Codable {
    let name: String
    let email: String
    let password: String
    let role: String
}

private struct AuthResponsePayload: Codable {
    let success: Bool
    let message: String?
    let token: String?
    let user: UserPayload?
}

private struct UserPayload: Codable {
    let id: String?
    let name: String?
    let email: String?
    let role: String?
}

private final class AuthService {
    func login(email: String, password: String, role: String) async throws -> AuthResponsePayload {
        let endpoint = APIConfig.baseURL.appendingPathComponent("api/auth/login")
        var request = URLRequest(url: endpoint)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONEncoder().encode(LoginRequestPayload(email: email, password: password, role: role))

        return try await perform(request)
    }

    func signup(name: String, email: String, password: String, role: String) async throws -> AuthResponsePayload {
        let endpoint = APIConfig.baseURL.appendingPathComponent("api/auth/signup")
        var request = URLRequest(url: endpoint)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONEncoder().encode(SignupRequestPayload(name: name, email: email, password: password, role: role))

        return try await perform(request)
    }

    private func perform(_ request: URLRequest) async throws -> AuthResponsePayload {
        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }
        guard (200...299).contains(http.statusCode) else {
            if let payload = try? JSONDecoder().decode(AuthResponsePayload.self, from: data) {
                throw APIError.serverMessage(payload.message ?? "Request failed")
            }
            throw APIError.requestFailed
        }

        return try JSONDecoder().decode(AuthResponsePayload.self, from: data)
    }
}

enum APIError: Error, LocalizedError {
    case invalidResponse
    case requestFailed
    case serverMessage(String)
    
    var errorDescription: String? {
        switch self {
        case .invalidResponse: return "Invalid server response."
        case .requestFailed: return "Request failed."
        case .serverMessage(let msg): return msg
        }
    }
}
