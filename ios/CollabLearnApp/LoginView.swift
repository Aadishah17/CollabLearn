import SwiftUI

struct LoginView: View {
    @State private var email = ""
    @State private var password = ""
    @State private var role = "user"
    @State private var isLoading = false
    @State private var statusMessage = ""
    @State private var isError = false

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                Text("Welcome back")
                    .font(.largeTitle.bold())
                Text("Sign in to continue learning.")
                    .foregroundStyle(.secondary)

                Picker("Role", selection: $role) {
                    Text("Student").tag("user")
                    Text("Admin").tag("admin")
                }
                .pickerStyle(.segmented)

                TextField("Email", text: $email)
                    .textInputAutocapitalization(.never)
                    .keyboardType(.emailAddress)
                    .textFieldStyle(.roundedBorder)

                SecureField("Password", text: $password)
                    .textFieldStyle(.roundedBorder)

                Button(isLoading ? "Signing in..." : "Sign in") {
                    Task { await performLogin() }
                }
                .buttonStyle(.borderedProminent)
                .disabled(isLoading)

                if !statusMessage.isEmpty {
                    Text(statusMessage)
                        .font(.footnote)
                        .foregroundStyle(isError ? .red : .green)
                }
            }
            .padding(20)
        }
        .navigationTitle("Login")
        .navigationBarTitleDisplayMode(.inline)
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
                let userName = response.user?.name ?? "Learner"
                statusMessage = "Logged in as \(userName)."
            } else {
                isError = true
                statusMessage = response.message ?? "Login failed."
            }
        } catch {
            isError = true
            statusMessage = error.localizedDescription
        }
    }
}

private struct LoginRequestPayload: Codable {
    let email: String
    let password: String
    let role: String
}

private struct LoginResponsePayload: Codable {
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
    func login(email: String, password: String, role: String) async throws -> LoginResponsePayload {
        let endpoint = APIConfig.baseURL.appendingPathComponent("api/auth/login")
        var request = URLRequest(url: endpoint)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONEncoder().encode(LoginRequestPayload(email: email, password: password, role: role))

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }
        guard (200...299).contains(http.statusCode) else {
            if let payload = try? JSONDecoder().decode(LoginResponsePayload.self, from: data) {
                throw APIError.serverMessage(payload.message ?? "Login failed")
            }
            throw APIError.requestFailed
        }

        return try JSONDecoder().decode(LoginResponsePayload.self, from: data)
    }
}
