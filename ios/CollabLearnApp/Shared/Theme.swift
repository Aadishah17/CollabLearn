import SwiftUI

extension Color {
    static let brandRed = Color(hex: "E11D48")
    static let brandRedLight = Color(hex: "FF2D55")
    static let brandRedDark = Color(hex: "BE123C")
    static let zinc950 = Color(hex: "0A0A0A")
    static let zinc900 = Color(hex: "18181B")
    static let zinc800 = Color(hex: "27272A")
    static let zinc700 = Color(hex: "3F3F46")
}

extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3: // RGB (12-bit)
            (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6: // RGB (24-bit)
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8: // ARGB (32-bit)
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (1, 1, 1, 0)
        }

        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue:  Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}

struct GlassModifier: ViewModifier {
    var opacity: Double = 0.7
    
    func body(content: Content) -> some View {
        content
            .background(.ultraThinMaterial)
            .background(Color.zinc900.opacity(opacity))
            .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 16, style: .continuous)
                    .stroke(Color.brandRed.opacity(0.2), lineWidth: 1)
            )
    }
}

extension View {
    func glassCard(opacity: Double = 0.7) -> some View {
        self.modifier(GlassModifier(opacity: opacity))
    }
    
    func brandButtonStyle(isPrimary: Bool = true) -> some View {
        self
            .frame(maxWidth: .infinity)
            .padding(.vertical, 14)
            .background(isPrimary ? Color.brandRed : Color.zinc800)
            .foregroundStyle(.white)
            .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 12, style: .continuous)
                    .stroke(isPrimary ? Color.brandRedLight.opacity(0.5) : Color.white.opacity(0.1), lineWidth: 1)
            )
    }
}
