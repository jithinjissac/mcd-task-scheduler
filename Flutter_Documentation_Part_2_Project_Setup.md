# McDonald's Task Scheduler Flutter Documentation - Part 2: Project Structure & Setup

## 📋 Navigation
← [Part 1: Architecture Overview](./Flutter_Documentation_Part_1_Architecture.md) | [Part 3: Data Models & State Management](./Flutter_Documentation_Part_3_Data_Models.md) →

---

## 🏗️ Project Structure & Setup

### **Development Environment Setup**

#### **Required Tools & Versions**
```yaml
# Minimum Requirements
Flutter SDK: ">=3.16.0 <4.0.0"
Dart SDK: ">=3.2.0 <4.0.0"
Android Studio: 2023.1.1+
Xcode: 15.0+ (macOS only)
VS Code: 1.85.0+ (recommended)

# Platform SDKs
Android API Level: 21+ (Android 5.0)
iOS Deployment Target: 12.0+
Web: Chrome 109+, Safari 16+, Firefox 110+
```

#### **Flutter Installation & Setup**
```bash
# Install Flutter (macOS/Linux)
git clone https://github.com/flutter/flutter.git -b stable
export PATH="$PATH:`pwd`/flutter/bin"

# Install Flutter (Windows)
# Download from https://flutter.dev/docs/get-started/install/windows

# Verify installation
flutter doctor

# Enable web and desktop platforms
flutter config --enable-web
flutter config --enable-macos-desktop
flutter config --enable-linux-desktop
flutter config --enable-windows-desktop
```

#### **IDE Setup & Extensions**
```json
// VS Code extensions (recommendations)
{
  "recommendations": [
    "dart-code.flutter",
    "dart-code.dart-code",
    "alexisvt.flutter-snippets",
    "nash.awesome-flutter-snippets",
    "jeroen-meijer.pubspec-assist",
    "felixangelov.bloc",
    "robert-brunhage.flutter-riverpod-snippets"
  ]
}
```

---

## 📁 Project Structure

### **Root Directory Structure**
```
mcd_task_scheduler/
├── android/                    # Android-specific code
├── ios/                       # iOS-specific code
├── web/                       # Web-specific code
├── lib/                       # Main Dart code
│   ├── core/                  # Core utilities and constants
│   ├── data/                  # Data layer implementation
│   ├── domain/                # Business logic and entities
│   ├── presentation/          # UI layer
│   └── main.dart             # Application entry point
├── test/                      # Unit and widget tests
├── integration_test/          # Integration tests
├── assets/                    # Static assets
├── docs/                      # Project documentation
├── scripts/                   # Build and deployment scripts
├── pubspec.yaml              # Dependencies and metadata
└── README.md                 # Project overview
```

### **Detailed lib/ Structure**
```
lib/
├── main.dart                  # App entry point
├── app.dart                   # App widget and configuration
├── core/                      # Core utilities
│   ├── constants/
│   │   ├── app_constants.dart
│   │   ├── api_constants.dart
│   │   ├── database_constants.dart
│   │   └── theme_constants.dart
│   ├── error/
│   │   ├── exceptions.dart
│   │   ├── failures.dart
│   │   └── error_handler.dart
│   ├── network/
│   │   ├── network_info.dart
│   │   ├── network_service.dart
│   │   └── dio_client.dart
│   ├── utils/
│   │   ├── date_utils.dart
│   │   ├── validation_utils.dart
│   │   ├── file_utils.dart
│   │   └── platform_utils.dart
│   └── injection/
│       └── injection_container.dart
├── data/                      # Data layer
│   ├── datasources/
│   │   ├── local/
│   │   │   ├── database/
│   │   │   ├── shared_preferences/
│   │   │   └── secure_storage/
│   │   └── remote/
│   │       ├── api_service.dart
│   │       └── websocket_service.dart
│   ├── models/
│   │   ├── employee_model.dart
│   │   ├── station_model.dart
│   │   ├── assignment_model.dart
│   │   └── schedule_model.dart
│   └── repositories/
│       ├── employee_repository_impl.dart
│       ├── station_repository_impl.dart
│       ├── assignment_repository_impl.dart
│       └── schedule_repository_impl.dart
├── domain/                    # Business logic layer
│   ├── entities/
│   │   ├── employee.dart
│   │   ├── station.dart
│   │   ├── assignment.dart
│   │   └── schedule.dart
│   ├── repositories/
│   │   ├── employee_repository.dart
│   │   ├── station_repository.dart
│   │   ├── assignment_repository.dart
│   │   └── schedule_repository.dart
│   └── usecases/
│       ├── employee/
│       ├── station/
│       ├── assignment/
│       └── schedule/
└── presentation/              # UI layer
    ├── bloc/                  # State management
    │   ├── employee/
    │   ├── station/
    │   ├── assignment/
    │   └── schedule/
    ├── pages/                 # Screen implementations
    │   ├── home/
    │   ├── schedule/
    │   ├── employee/
    │   └── settings/
    ├── widgets/               # Reusable UI components
    │   ├── common/
    │   ├── employee/
    │   ├── station/
    │   └── assignment/
    ├── theme/                 # App theming
    │   ├── app_theme.dart
    │   ├── colors.dart
    │   └── text_styles.dart
    └── routes/                # Navigation
        ├── app_router.dart
        └── route_constants.dart
```

---

## 📦 Dependencies & Package Management

### **pubspec.yaml Configuration**
```yaml
name: mcd_task_scheduler
description: McDonald's Task Scheduler - Flutter Edition
version: 1.0.0+1

environment:
  sdk: '>=3.2.0 <4.0.0'
  flutter: ">=3.16.0"

dependencies:
  flutter:
    sdk: flutter
  
  # State Management
  flutter_bloc: ^8.1.3
  hydrated_bloc: ^9.1.3
  equatable: ^2.0.5
  
  # Dependency Injection
  get_it: ^7.6.4
  injectable: ^2.3.2
  
  # Database & Storage
  floor: ^1.4.2
  hive: ^2.2.3
  hive_flutter: ^1.1.0
  shared_preferences: ^2.2.2
  flutter_secure_storage: ^9.0.0
  
  # Network & API
  dio: ^5.3.2
  connectivity_plus: ^5.0.1
  socket_io_client: ^2.0.3+1
  
  # UI & Theming
  flutter_screenutil: ^5.9.0
  cached_network_image: ^3.3.0
  flutter_svg: ^2.0.9
  google_fonts: ^6.1.0
  
  # File Handling
  file_picker: ^6.1.1
  csv: ^5.0.2
  excel: ^4.0.2
  pdf: ^3.10.7
  path_provider: ^2.1.1
  
  # Platform Integration
  permission_handler: ^11.0.1
  device_info_plus: ^9.1.0
  package_info_plus: ^4.2.0
  url_launcher: ^6.2.1
  
  # Authentication & Security
  local_auth: ^2.1.6
  crypto: ^3.0.3
  
  # Utilities
  intl: ^0.18.1
  uuid: ^4.1.0
  logger: ^2.0.2+1
  
  # Animation & Interaction
  flutter_animate: ^4.2.0+1
  flutter_vibrate: ^1.3.0
  
  # Development Tools (dev_dependencies)
dev_dependencies:
  flutter_test:
    sdk: flutter
  
  # Code Generation
  build_runner: ^2.4.7
  floor_generator: ^1.4.2
  injectable_generator: ^2.4.1
  hive_generator: ^2.0.1
  
  # Testing
  mockito: ^5.4.2
  bloc_test: ^9.1.5
  integration_test:
    sdk: flutter
  
  # Code Quality
  flutter_lints: ^3.0.1
  dart_code_metrics: ^5.7.6
  
  # Assets
flutter:
  uses-material-design: true
  
  assets:
    - assets/images/
    - assets/icons/
    - assets/fonts/
    - assets/data/
  
  fonts:
    - family: McDonald
      fonts:
        - asset: assets/fonts/McDonald-Regular.ttf
        - asset: assets/fonts/McDonald-Bold.ttf
          weight: 700
```

### **Platform-Specific Configurations**

#### **Android Configuration (android/app/build.gradle)**
```gradle
android {
    namespace 'com.mcdonalds.taskscheduler'
    compileSdk 34
    ndkVersion flutter.ndkVersion

    compileOptions {
        sourceCompatibility JavaVersion.VERSION_1_8
        targetCompatibility JavaVersion.VERSION_1_8
    }

    defaultConfig {
        applicationId "com.mcdonalds.taskscheduler"
        minSdkVersion 21
        targetSdkVersion 34
        versionCode flutterVersionCode.toInteger()
        versionName flutterVersionName
        
        // Enable multidex for large app
        multiDexEnabled true
        
        // Database encryption key
        buildConfigField "String", "DB_ENCRYPTION_KEY", '"your_encryption_key_here"'
    }

    buildTypes {
        debug {
            applicationIdSuffix ".debug"
            debuggable true
            minifyEnabled false
            manifestPlaceholders = [appName: "McD Scheduler Debug"]
        }
        
        release {
            minifyEnabled true
            shrinkResources true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
            manifestPlaceholders = [appName: "McDonald's Task Scheduler"]
            
            signingConfig signingConfigs.release
        }
        
        staging {
            applicationIdSuffix ".staging"
            debuggable false
            minifyEnabled true
            manifestPlaceholders = [appName: "McD Scheduler Staging"]
        }
    }
}

dependencies {
    implementation "androidx.multidex:multidex:2.0.1"
    implementation 'androidx.work:work-runtime:2.8.1'
    implementation 'androidx.biometric:biometric:1.1.0'
}
```

#### **iOS Configuration (ios/Runner/Info.plist)**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <!-- App Information -->
    <key>CFBundleDisplayName</key>
    <string>McDonald's Task Scheduler</string>
    <key>CFBundleIdentifier</key>
    <string>com.mcdonalds.taskscheduler</string>
    <key>CFBundleVersion</key>
    <string>$(FLUTTER_BUILD_NUMBER)</string>
    <key>CFBundleShortVersionString</key>
    <string>$(FLUTTER_BUILD_NAME)</string>
    
    <!-- Permissions -->
    <key>NSCameraUsageDescription</key>
    <string>Camera access is needed to scan QR codes for employee check-in</string>
    <key>NSPhotoLibraryUsageDescription</key>
    <string>Photo library access is needed to select employee photos</string>
    <key>NSLocalNetworkUsageDescription</key>
    <string>Local network access is needed to sync with other devices</string>
    
    <!-- Security -->
    <key>NSFaceIDUsageDescription</key>
    <string>Face ID is used to secure access to employee schedules</string>
    
    <!-- File Handling -->
    <key>CFBundleDocumentTypes</key>
    <array>
        <dict>
            <key>CFBundleTypeName</key>
            <string>CSV Files</string>
            <key>CFBundleTypeRole</key>
            <string>Editor</string>
            <key>LSItemContentTypes</key>
            <array>
                <string>public.comma-separated-values-text</string>
            </array>
        </dict>
    </array>
    
    <!-- Background Modes -->
    <key>UIBackgroundModes</key>
    <array>
        <string>background-processing</string>
        <string>background-fetch</string>
    </array>
</dict>
</plist>
```

#### **Web Configuration (web/index.html)**
```html
<!DOCTYPE html>
<html>
<head>
  <base href="$FLUTTER_BASE_HREF">
  <meta charset="UTF-8">
  <meta content="IE=Edge" http-equiv="X-UA-Compatible">
  <meta name="description" content="McDonald's Task Scheduler - Manage employee schedules and assignments">
  
  <!-- PWA Configuration -->
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black">
  <meta name="apple-mobile-web-app-title" content="McD Scheduler">
  <link rel="apple-touch-icon" href="icons/Icon-192.png">
  
  <!-- Favicon -->
  <link rel="icon" type="image/png" href="favicon.png"/>
  <link rel="manifest" href="manifest.json">
  
  <title>McDonald's Task Scheduler</title>
  
  <!-- Viewport for responsive design -->
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  
  <!-- Theme color -->
  <meta name="theme-color" content="#FFB81C">
  
  <!-- Loading styles -->
  <style>
    .loading {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      background-color: #FFB81C;
    }
    .loading-text {
      color: #DA291C;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 18px;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div id="loading" class="loading">
    <div class="loading-text">Loading McDonald's Task Scheduler...</div>
  </div>
  
  <script>
    window.addEventListener('flutter-first-frame', function () {
      document.getElementById('loading').remove();
    });
  </script>
  
  <script src="flutter.js" defer></script>
</body>
</html>
```

---

## 🔧 Development Environment Configuration

### **VS Code Configuration (.vscode/settings.json)**
```json
{
  "dart.flutterSdkPath": "/path/to/flutter",
  "dart.debugExternalLibraries": false,
  "dart.debugSdkLibraries": false,
  "dart.lineLength": 100,
  "dart.showTodos": true,
  "dart.runPubGetOnPubspecChanges": true,
  "dart.warnWhenEditingFilesOutsideWorkspace": true,
  "editor.rulers": [80, 100],
  "editor.codeActionsOnSave": {
    "source.fixAll": true,
    "source.organizeImports": true
  },
  "files.associations": {
    "*.dart": "dart"
  },
  "flutter.experiments": {
    "completeFunctionCalls": true
  }
}
```

### **Launch Configurations (.vscode/launch.json)**
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Flutter (Debug)",
      "request": "launch",
      "type": "dart",
      "program": "lib/main.dart",
      "args": ["--flavor", "debug"]
    },
    {
      "name": "Flutter (Release)",
      "request": "launch",
      "type": "dart",
      "program": "lib/main.dart",
      "flutterMode": "release"
    },
    {
      "name": "Flutter (Web)",
      "request": "launch",
      "type": "dart",
      "program": "lib/main.dart",
      "deviceId": "chrome",
      "args": ["--web-hostname", "localhost", "--web-port", "3000"]
    }
  ]
}
```

### **Git Configuration (.gitignore)**
```gitignore
# Flutter/Dart specific
.dart_tool/
.flutter-plugins
.flutter-plugins-dependencies
.packages
.pub-cache/
.pub/
build/
flutter_*.png

# IDE files
.vscode/
.idea/
*.iml
*.ipr
*.iws

# Platform specific
android/app/upload-keystore.jks
android/key.properties
ios/Runner/GoogleService-Info.plist
ios/Runner/Runner.entitlements

# Generated files
*.g.dart
*.mocks.dart
*.config.dart
*.freezed.dart

# Database files
*.db
*.sqlite
*.sqlite3

# Environment files
.env
.env.local
.env.production

# Test coverage
coverage/
test/coverage_helper_test.dart

# Logs
*.log

# MacOS
.DS_Store

# Windows
Thumbs.db
```

---

## 🚀 Project Initialization Scripts

### **Setup Script (scripts/setup.sh)**
```bash
#!/bin/bash

echo "🏗️ Setting up McDonald's Task Scheduler Flutter Project..."

# Check Flutter installation
if ! command -v flutter &> /dev/null; then
    echo "❌ Flutter is not installed. Please install Flutter first."
    exit 1
fi

# Check Flutter doctor
echo "🔍 Running Flutter doctor..."
flutter doctor

# Get dependencies
echo "📦 Getting Flutter dependencies..."
flutter pub get

# Generate code
echo "🔨 Generating code..."
flutter packages pub run build_runner build --delete-conflicting-outputs

# Enable platforms
echo "🌐 Enabling web platform..."
flutter config --enable-web

echo "🖥️ Enabling desktop platforms..."
flutter config --enable-macos-desktop
flutter config --enable-linux-desktop  
flutter config --enable-windows-desktop

# Create necessary directories
echo "📁 Creating project directories..."
mkdir -p assets/images
mkdir -p assets/icons
mkdir -p assets/fonts
mkdir -p assets/data
mkdir -p docs
mkdir -p test/fixtures

# Copy sample data files
echo "📄 Setting up sample data..."
cp ../test_schedule.csv assets/data/sample_schedule.csv

# Setup pre-commit hooks
echo "🔗 Setting up Git hooks..."
cp scripts/pre-commit.sh .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit

echo "✅ Project setup complete!"
echo "🚀 Run 'flutter run' to start the application"
```

### **Build Script (scripts/build.sh)**
```bash
#!/bin/bash

# Build script for all platforms
echo "🔨 Building McDonald's Task Scheduler for all platforms..."

# Clean previous builds
flutter clean
flutter pub get

# Build for Web
echo "🌐 Building for Web..."
flutter build web --release --web-renderer html

# Build for Android
echo "🤖 Building for Android..."
flutter build apk --release --split-per-abi
flutter build appbundle --release

# Build for iOS (macOS only)
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "🍎 Building for iOS..."
    flutter build ios --release --no-codesign
    flutter build ipa --release
fi

# Build for macOS (macOS only)
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "💻 Building for macOS..."
    flutter build macos --release
fi

# Build for Windows (Windows only)
if [[ "$OSTYPE" == "msys" ]]; then
    echo "🪟 Building for Windows..."
    flutter build windows --release
fi

# Build for Linux (Linux only)
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo "🐧 Building for Linux..."
    flutter build linux --release
fi

echo "✅ Build complete! Check the build/ directory for outputs."
```

### **Pre-commit Hook (scripts/pre-commit.sh)**
```bash
#!/bin/bash

echo "🔍 Running pre-commit checks..."

# Format code
echo "📝 Formatting Dart code..."
dart format --set-exit-if-changed .

# Analyze code
echo "🔍 Analyzing code..."
flutter analyze

# Run tests
echo "🧪 Running tests..."
flutter test

if [ $? -ne 0 ]; then
    echo "❌ Pre-commit checks failed. Please fix the issues before committing."
    exit 1
fi

echo "✅ All pre-commit checks passed!"
```

---

## 📱 Platform-Specific Setup

### **Android Setup Checklist**
- [ ] Android Studio installed with Flutter plugin
- [ ] Android SDK tools and platform-tools updated
- [ ] Android device or emulator configured
- [ ] Keystore created for release builds
- [ ] Google Play Console account setup (for distribution)
- [ ] Firebase project configured for Android

### **iOS Setup Checklist**
- [ ] Xcode installed with command line tools
- [ ] iOS Simulator or physical device configured
- [ ] Apple Developer account enrolled
- [ ] Provisioning profiles created
- [ ] App Store Connect configured
- [ ] Firebase project configured for iOS

### **Web Setup Checklist**
- [ ] Chrome browser installed for debugging
- [ ] Web server configured for hosting
- [ ] PWA manifest and service worker setup
- [ ] Firebase Hosting or similar platform configured
- [ ] SSL certificate configured for production

---

## 🔄 Development Workflow

### **Daily Development Process**
1. **Pull latest changes**: `git pull origin main`
2. **Update dependencies**: `flutter pub get`
3. **Generate code**: `flutter packages pub run build_runner build`
4. **Run tests**: `flutter test`
5. **Start development**: `flutter run`
6. **Make changes and test**
7. **Format code**: `dart format .`
8. **Commit changes**: Follow conventional commit format

### **Feature Development Workflow**
```bash
# Create feature branch
git checkout -b feature/employee-management

# Implement feature with tests
# Run full test suite
flutter test

# Update documentation if needed
# Create pull request with:
# - Clear description
# - Screenshots/videos
# - Test coverage report
# - Breaking changes noted
```

### **Release Workflow**
```bash
# Update version in pubspec.yaml
# Generate changelog
# Create release branch
git checkout -b release/v1.1.0

# Build and test all platforms
./scripts/build.sh

# Tag release
git tag v1.1.0

# Deploy to app stores
# Monitor crash reports and user feedback
```

---

**Next Document**: Part 3 - Data Models & State Management
This will cover entity definitions, repository patterns, BLoC implementation, and data flow architecture with specific code examples and patterns for the McDonald's Task Scheduler application.
