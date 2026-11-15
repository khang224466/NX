import UIKit
import AVFoundation

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Prevent screen dimming / sleeping during VR sessions
        UIApplication.shared.isIdleTimerDisabled = true
        
        // Direct Window Creation to guarantee ViewController launches on any iOS version
        let win = UIWindow(frame: UIScreen.main.bounds)
        let mainVC = ViewController()
        win.rootViewController = mainVC
        self.window = win
        win.makeKeyAndVisible()
        
        return true
    }

    // MARK: UISceneSession Lifecycle
    func application(_ application: UIApplication, configurationForConnecting connectingSceneSession: UISceneSession, options: UIScene.ConnectionOptions) -> UISceneConfiguration {
        return UISceneConfiguration(name: "Default Configuration", sessionRole: connectingSceneSession.role)
    }
}
