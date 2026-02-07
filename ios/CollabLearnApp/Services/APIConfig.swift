import Foundation

enum APIConfig {
    // iOS Simulator can reach local Mac server using 127.0.0.1.
    // For a physical device, replace with your machine's LAN IP.
    static let baseURL = URL(string: "http://127.0.0.1:5001")!
}
