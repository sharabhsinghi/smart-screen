import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.smartscreen.app",
  appName: "Smart Display",
  webDir: "out",
  server: {
    androidScheme: "https",
  },
  android: {
    // Keep the screen on while the app is running (tablet on charge)
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
  plugins: {
    StatusBar: {
      // Start with status bar hidden; we also call StatusBar.hide() at runtime
      style: "DARK",
      backgroundColor: "#00000000",
      overlaysWebView: true,
    },
    // Prevents the screen from sleeping while the app is open
    // Configure this via the AndroidManifest: android:keepScreenOn="true"
    // or use @capacitor-community/keep-awake plugin
  },
};

export default config;
