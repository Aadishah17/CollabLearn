import SwiftUI

extension Color {
    static let purple50 = Color(red: 0.98, green: 0.98, blue: 1.0)
    static let sky600 = Color(red: 2/255, green: 132/255, blue: 199/255)
    static let sky500 = Color(red: 14/255, green: 165/255, blue: 233/255)
    static let zinc950 = Color(red: 9/255, green: 9/255, blue: 11/255)
    static let zinc900 = Color(red: 24/255, green: 24/255, blue: 27/255)
    static let zinc800 = Color(red: 39/255, green: 39/255, blue: 42/255)
    static let purple600 = Color(red: 147/255, green: 51/255, blue: 234/255)
    static let cyan500 = Color(red: 6/255, green: 182/255, blue: 212/255)
    
    // Semantic colors
    static let backgroundLight = LinearGradient(
        gradient: Gradient(colors: [Color.purple50, Color.white]),
        startPoint: .top,
        endPoint: .bottom
    )
    
    static let backgroundDark = LinearGradient(
        gradient: Gradient(colors: [Color.black, Color.zinc950]),
        startPoint: .top,
        endPoint: .bottom
    )
    
    static let primaryAction = sky600
}

struct AppTheme {
    static let gradientText = LinearGradient(
        gradient: Gradient(colors: [Color.sky600, Color.blue, Color.cyan500]),
        startPoint: .leading,
        endPoint: .trailing
    )
}
