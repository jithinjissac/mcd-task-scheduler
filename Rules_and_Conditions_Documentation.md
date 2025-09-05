# McDonald's Task Scheduler - Flutter Mobile App Rules and Conditions

## 📋 Overview

This document outlines all the business rules, validation conditions, and operational constraints that govern the McDonald's Task Scheduler Flutter mobile application. These rules ensure proper employee assignment, regulatory compliance, and efficient restaurant operations across iOS and Android devices.

## 🏗️ System Architecture Rules

### Data Storage Rules
- **SQLite Local Database**: Primary storage using SQLite for offline-first functionality
- **Cloud Synchronization**: Background sync with Firebase/server when network available
- **Offline-First Design**: App functions fully without internet connection
- **Date-Based Organization**: All data is organized by date (YYYY-MM-DD format)
- **Cross-Platform Sync**: Changes synchronize across iOS and Android devices

### Session Management
- **Persistent Local Storage**: User selections (date, day part) stored in SharedPreferences
- **Conflict Resolution**: Local data preserved during sync conflicts with user confirmation
- **Background Sync**: Automatic synchronization when app resumes from background
- **Network State Monitoring**: App monitors connectivity and adapts behavior accordingly

## 👤 Employee Management Rules

### Employee Data Validation

#### **Required Fields**
```dart
class Employee {
  final String id;
  final String name;          // Required, non-empty, trimmed
  final String shiftStart;    // Required, valid time format (HH:MM)
  final String shiftEnd;      // Required, valid time format (HH:MM)
  final bool isMinor;         // Required boolean flag
  final String? task;         // Optional pre-assignment
  final DateTime createdAt;
  final DateTime updatedAt;
  
  // SQLite table constraints
  static const String tableName = 'employees';
  static const String createTable = '''
    CREATE TABLE employees (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      shift_start TEXT NOT NULL,
      shift_end TEXT NOT NULL,
      is_minor INTEGER NOT NULL,
      task TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  ''';
}
```

#### **Name Validation Rules**
- **Uniqueness**: No duplicate employee names within the same schedule
- **Format**: Must be non-empty after trimming whitespace
- **Character Limit**: Reasonable length for display purposes
- **Case Sensitivity**: Names are case-insensitive for uniqueness checks

#### **Time Format Rules**
- **Format**: Must follow HH:MM format (24-hour or 12-hour accepted)
- **Validation**: Times must be valid (00:00 to 23:59)
- **Logical Order**: Shift end time should be after start time
- **Cross-Midnight**: Shifts crossing midnight are supported

#### **Minor Employee Rules**
- **Definition**: Employees under 18 years of age
- **Visual Indicators**: 
  - Yellow background color for employee cards
  - "M" badge displayed prominently
  - "Minor" text label in detailed views
- **Special Handling**: Subject to additional assignment restrictions

### Import/Export Rules

#### **CSV Import Validation**
```dart
// Flutter CSV model
class EmployeeCSVModel {
  final String minor;        // "Yes"/"No" or "true"/"false"
  final String employeeName; // Required field
  final String shiftStart;   // HH:MM format
  final String shiftEnd;     // HH:MM format
  final String? task;        // Optional
  
  // CSV headers mapping
  static const Map<String, List<String>> headerMappings = {
    'minor': ['Minor', 'minor', 'Minor Employee', 'is_minor'],
    'name': ['Employee Name', 'Name', 'employee_name', 'full_name'],
    'shiftStart': ['Shift Start Time', 'Shift Start', 'shift_start', 'start_time'],
    'shiftEnd': ['Shift End Time', 'Shift End', 'shift_end', 'end_time'],
    'task': ['Task', 'task', 'Assignment', 'Position']
  };
}

#### **File Format Rules**
- **Supported Formats**: CSV (.csv), Excel (.xlsx) using flutter packages
  - `csv: ^5.0.0` for CSV parsing
  - `excel: ^2.0.0` for Excel file handling
  - `file_picker: ^5.0.0` for file selection
- **File Size Limits**: Maximum 10MB for mobile performance
- **Storage Location**: Files processed and stored in app's documents directory
- **Validation**: Real-time validation during import with progress indicators

#### **Boolean Value Parsing**
```dart
// Flutter boolean parsing utility
class BooleanParser {
  static bool parseMinorStatus(String value) {
    final normalized = value.toLowerCase().trim();
    const trueValues = {'true', 'yes', '1', 'y'};
    const falseValues = {'false', 'no', '0', 'n', ''};
    
    if (trueValues.contains(normalized)) return true;
    if (falseValues.contains(normalized)) return false;
    
    throw FormatException('Invalid boolean value: $value');
  }
}
```

## 🏪 Station Assignment Rules

### Assignment Validation

#### **Basic Assignment Rules**
1. **Single Employee, Multiple Stations**: One employee can be assigned to multiple stations
2. **Multiple Employees, Single Station**: Multiple employees can work the same station
3. **Duplicate Prevention**: Same employee cannot be assigned to the same station-task combination twice
4. **Real-Time Validation**: All assignments are validated before confirmation

#### **Assignment Conflict Resolution**
```dart
// Flutter assignment conflict model
class AssignmentConflict {
  final ConflictType type;
  final Employee employee;
  final List<Assignment> currentAssignments;
  final Assignment targetAssignment;
  final ConflictResolution resolution;
  
  // Conflict resolution options
  enum ConflictType {
    breakAssignment,
    multipleAssignment,
    timeConflict,
    stationCapacity
  }
  
  enum ConflictResolution {
    moveOnly,
    addToCurrent,
    sendToBreak,
    cancel
  }
}
```

### Break Assignment Rules

#### **Break Station Special Rules**
- **Exclusive Assignment**: When assigned to breaks, employee is removed from ALL other stations
- **Confirmation Required**: System always prompts for confirmation before break assignment
- **Clear Intent**: Break assignments indicate the employee is not working other stations

#### **Break Assignment Flow**
1. User drags employee to "Breaks" station
2. System detects current assignments (if any)
3. Confirmation dialog appears:
   ```
   "Employee is currently working at X stations. 
   Assigning to break will remove them from all current assignments. 
   Are you sure?"
   ```
4. Upon confirmation: Remove from all stations → Add to breaks

### Multiple Assignment Rules

#### **Multi-Station Assignment Options**
When assigning an employee who is already working:

1. **Move Only** (Default for Breaks)
   - Remove from all current assignments
   - Assign only to new station
   - Used for: Breaks, position changes

2. **Add to Current** (Default for Regular Stations)
   - Keep all existing assignments
   - Add new assignment
   - Used for: Multiple position coverage

#### **Assignment Confirmation Dialog**
```dart
// Flutter dialog for assignment confirmation
class AssignmentConfirmationDialog extends StatelessWidget {
  final Employee employee;
  final List<Assignment> currentAssignments;
  final Assignment newAssignment;
  
  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Text('Assignment Conflict'),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text('${employee.name} is currently working at:'),
          ...currentAssignments.map((a) => Text('• ${a.stationName}')),
          SizedBox(height: 16),
          Text('Choose how to handle the new assignment:'),
        ],
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context, ConflictResolution.cancel),
          child: Text('Cancel'),
          style: TextButton.styleFrom(foregroundColor: Colors.grey),
        ),
        ElevatedButton(
          onPressed: () => Navigator.pop(context, ConflictResolution.moveOnly),
          child: Text('Move Only'),
          style: ElevatedButton.styleFrom(backgroundColor: Colors.blue),
        ),
        ElevatedButton(
          onPressed: () => Navigator.pop(context, ConflictResolution.addToCurrent),
          child: Text('Add to Current (${currentAssignments.length + 1} total)'),
          style: ElevatedButton.styleFrom(backgroundColor: Colors.green),
        ),
      ],
    );
  }
}
```

## 📅 Day Part Management Rules

### Day Part Types
```dart
// Flutter enum for day parts
enum DayPart { breakfast, lunch, dinner }

class DayPartConfig {
  final DayPart type;
  final String displayName;
  final TimeOfDay startTime;
  final TimeOfDay endTime;
  final List<Station> stations;
  final List<String> diveSchedule;
  final Map<String, String> dfsSchedule;
  
  static const Map<DayPart, DayPartConfig> configurations = {
    DayPart.breakfast: DayPartConfig(
      type: DayPart.breakfast,
      displayName: "Breakfast",
      startTime: TimeOfDay(hour: 4, minute: 0),
      endTime: TimeOfDay(hour: 11, minute: 0),
      stations: BreakfastStations.all,
      diveSchedule: ["09:00", "11:00"],
      dfsSchedule: DFSSchedule.dailyTasks,
    ),
    DayPart.lunch: DayPartConfig(
      type: DayPart.lunch,
      displayName: "Lunch",
      startTime: TimeOfDay(hour: 11, minute: 0),
      endTime: TimeOfDay(hour: 23, minute: 59),
      stations: LunchStations.all,
      diveSchedule: ["11:00", "15:00", "19:00", "CLOSE"],
      dfsSchedule: {},
    ),
  };
}
```

### Layout-Specific Rules

#### **Breakfast Layout Rules**
- **Simplified Stations**: Fewer stations than lunch/dinner
- **Hash Browns Station**: Breakfast-specific station
- **Batch Cooking**: Muffins, Sausage, Eggs
- **Limited DIVE Times**: Only 09:00 and 11:00
- **DFS Schedule**: Daily/weekly calibration tasks displayed

#### **Lunch/Dinner Layout Rules**
- **Full Operations**: Complete station layout
- **Initiator/Assembler/Finisher**: Detailed workflow roles
- **Extended DIVE**: Four time slots including close
- **Delivery Operations**: Additional delivery-specific roles

## 🔄 Touch and Gesture Rules

### Mobile Interaction Rules

#### **Touch Interactions**
- **Long Press to Drag**: 500ms long press on employee card initiates drag
- **Haptic Feedback**: Vibration feedback on drag start and successful drop
- **Visual Feedback**: Employee card follows finger with shadow and scaling
- **Auto-Scroll**: Lists auto-scroll when dragging near edges
- **Touch Zones**: Larger touch targets for mobile (minimum 44dp)

#### **Gesture Handling**
```dart
// Flutter drag and drop implementation
class EmployeeDragTarget extends StatefulWidget {
  final Station station;
  final Function(Employee, Station) onEmployeeAssigned;
  
  @override
  Widget build(BuildContext context) {
    return DragTarget<Employee>(
      onWillAccept: (employee) {
        // Validate if assignment is allowed
        return ValidationService.canAssignToStation(employee, station);
      },
      onAccept: (employee) {
        // Trigger haptic feedback
        HapticFeedback.mediumImpact();
        // Handle assignment
        onEmployeeAssigned(employee, station);
      },
      builder: (context, candidateData, rejectedData) {
        return AnimatedContainer(
          duration: Duration(milliseconds: 200),
          decoration: BoxDecoration(
            border: candidateData.isNotEmpty 
              ? Border.all(color: Colors.green, width: 2)
              : null,
            borderRadius: BorderRadius.circular(8),
            color: candidateData.isNotEmpty 
              ? Colors.green.withOpacity(0.1)
              : null,
          ),
          child: StationWidget(station: station),
        );
      },
    );
  }
}

#### **Visual Feedback Rules**
```dart
// Flutter visual feedback implementation
class DragVisualFeedback {
  static const Duration animationDuration = Duration(milliseconds: 200);
  
  static Widget buildDraggedItem(Employee employee) {
    return Transform.scale(
      scale: 1.1,
      child: Container(
        decoration: BoxDecoration(
          boxShadow: [
            BoxShadow(
              color: Colors.black26,
              blurRadius: 8,
              offset: Offset(0, 4),
            ),
          ],
        ),
        child: EmployeeCard(
          employee: employee,
          opacity: 0.9,
        ),
      ),
    );
  }
  
  static BoxDecoration getDropZoneDecoration(bool isAccepting) {
    return BoxDecoration(
      border: Border.all(
        color: isAccepting ? Colors.green : Colors.transparent,
        width: 2,
      ),
      borderRadius: BorderRadius.circular(8),
      color: isAccepting 
        ? Colors.green.withOpacity(0.1)
        : Colors.transparent,
    );
  }
}
```

## 🚫 Business Rule Restrictions

### Minor Employee Restrictions

#### **Currently Implemented**
- **Visual Distinction**: Yellow highlighting and "M" badge
- **Tracking**: Minor status preserved through all operations
- **Export Labels**: Minor status included in all exports

#### **Potential Safety Restrictions** (Framework for Future Implementation)
```dart
// Flutter restriction framework
class MinorRestrictions {
  static const List<String> prohibitedStations = [
    'fryer',              // Hot oil operations
    'grill',              // High temperature equipment  
    'oven',               // Baking equipment
    'equipment_cleaning', // Chemical handling
    'maintenance',        // Heavy machinery
  ];
  
  static const Map<String, TimeRange> restrictedHours = {
    'school_days': TimeRange(
      start: TimeOfDay(hour: 6, minute: 0),
      end: TimeOfDay(hour: 22, minute: 0),
    ),
    'non_school_days': TimeRange(
      start: TimeOfDay(hour: 6, minute: 0),
      end: TimeOfDay(hour: 24, minute: 0),
    ),
  };
  
  static const int maxHoursPerDay = 8;
  static const int maxHoursPerWeek = 40;
  
  static const List<String> requiredSupervision = [
    'cash_handling',   // Money transactions
    'drive_thru',      // Customer interaction
    'food_prep',       // Food safety
  ];
  
  // Validation method
  static ValidationResult validateAssignment(Employee employee, Station station) {
    if (!employee.isMinor) return ValidationResult.valid();
    
    if (prohibitedStations.contains(station.id)) {
      return ValidationResult.error('Minors cannot be assigned to ${station.name}');
    }
    
    if (requiredSupervision.contains(station.id)) {
      return ValidationResult.warning('Minor requires supervision at ${station.name}');
    }
    
    return ValidationResult.valid();
  }
}
```

### Station Capacity Rules

#### **No Hard Limits Currently**
- Stations can accommodate unlimited employees
- Multiple employees per task column supported
- Visual indicators show current assignment count

#### **Soft Capacity Guidelines**
```dart
// Flutter capacity management
class StationCapacity {
  static const Map<String, int> recommendedLimits = {
    'window': 1,          // One per window station
    'handheld': 1,        // One handheld device operator
    'kitchen_leader': 1,  // One supervisor per shift
    'order_assembly': 2,  // Up to two assemblers
    'grill': 2,          // Two grill operators maximum
    'fries': 1,          // One fries station operator
  };
  
  static const Map<String, int> maximumLimits = {
    'window': 2,
    'handheld': 2,
    'kitchen_leader': 1,  // Hard limit
    'order_assembly': 3,
    'grill': 3,
    'fries': 2,
  };
  
  // Visual indicators for capacity
  static Color getCapacityColor(String stationId, int currentCount) {
    final recommended = recommendedLimits[stationId] ?? 99;
    final maximum = maximumLimits[stationId] ?? 99;
    
    if (currentCount > maximum) return Colors.red;
    if (currentCount > recommended) return Colors.orange;
    return Colors.green;
  }
  
  static Widget buildCapacityIndicator(String stationId, int currentCount) {
    final color = getCapacityColor(stationId, currentCount);
    return Container(
      padding: EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.2),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color),
      ),
      child: Text(
        '$currentCount',
        style: TextStyle(color: color, fontWeight: FontWeight.bold),
      ),
    );
  }
}
```

## 📋 Special Station Rules

### DFS (Daily Food Safety) Station

#### **Information-Only Station**
- **No Employee Assignment**: Cannot drag employees to DFS station
- **Display Only**: Shows scheduled calibration and discard tasks
- **Weekly Schedule**: Fixed schedule displayed for reference

#### **DFS Schedule Display**
```dart
// Flutter DFS schedule widget
class DFSScheduleWidget extends StatelessWidget {
  final Map<String, String> dfsSchedule = {
    'Monday': 'Milk and hot chocolate discard',
    'Tuesday': 'Shakes, sundae and topping discard',
    'Wednesday': 'Oil drop temperatures recorded',
    'Thursday': 'Equipment maintenance check',
    'Friday': 'Muffin, Toaster calibration',
    'Saturday': 'Deep cleaning protocols',
    'Sunday': 'Egg cookers calibrations',
  };
  
  @override
  Widget build(BuildContext context) {
    final today = DateFormat('EEEE').format(DateTime.now());
    
    return Card(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          ListTile(
            leading: Icon(Icons.schedule, color: Colors.red),
            title: Text('Daily Food Safety Tasks'),
            subtitle: Text('Information Only - No Employee Assignment'),
          ),
          Divider(),
          ...dfsSchedule.entries.map((entry) => ListTile(
            leading: Container(
              width: 12,
              height: 12,
              decoration: BoxDecoration(
                color: entry.key == today ? Colors.red : Colors.grey,
                shape: BoxShape.circle,
              ),
            ),
            title: Text(
              entry.key,
              style: TextStyle(
                fontWeight: entry.key == today ? FontWeight.bold : FontWeight.normal,
              ),
            ),
            subtitle: Text(entry.value),
            dense: true,
          )),
        ],
      ),
    );
  }
}
```

### Break Station Rules

#### **Special Behavior**
- **Exclusive Assignment**: Removes employee from all other stations
- **Single Assignment**: Employee can only be on breaks OR working, not both
- **No Capacity Limit**: Any number of employees can be on break
- **Priority Handling**: Break assignments take precedence over work assignments

### Shift Manager Rules

#### **Leadership Assignment**
- **Single Assignment Preferred**: Usually one shift manager per day part
- **Override Allowed**: Can assign multiple if needed (coverage, training)
- **Visual Emphasis**: Distinct styling for shift manager station
- **Responsibility Indicator**: Clear visual indication of management role

## 💾 Data Persistence Rules

### Auto-Save Behavior

#### **Automatic Triggers**
```dart
// Flutter auto-save service
class AutoSaveService {
  static const Duration debounceDuration = Duration(milliseconds: 500);
  Timer? _debounceTimer;
  
  final List<AutoSaveTrigger> triggers = [
    AutoSaveTrigger.employeeAssignment,
    AutoSaveTrigger.dayPartChange,
    AutoSaveTrigger.employeeAddition,
    AutoSaveTrigger.employeeRemoval,
    AutoSaveTrigger.dateChange,
  ];
  
  void triggerAutoSave(AutoSaveTrigger trigger, {Map<String, dynamic>? data}) {
    _debounceTimer?.cancel();
    _debounceTimer = Timer(debounceDuration, () async {
      try {
        await _performSave(trigger, data);
        _showSaveIndicator(SaveStatus.success);
      } catch (e) {
        _showSaveIndicator(SaveStatus.error);
        _handleSaveError(e);
      }
    });
  }
  
  Future<void> _performSave(AutoSaveTrigger trigger, Map<String, dynamic>? data) async {
    // Save to SQLite first (always succeeds)
    await DatabaseService.saveLocalData(data);
    
    // Attempt cloud sync if network available
    if (await NetworkService.isConnected()) {
      await CloudSyncService.syncToServer(data);
    } else {
      // Mark for sync when connection restored
      await SyncQueueService.queueForSync(data);
    }
  }
  
  void _showSaveIndicator(SaveStatus status) {
    // Show non-intrusive save status indicator
    NotificationService.showSaveStatus(status);
  }
}

enum AutoSaveTrigger {
  employeeAssignment,
  dayPartChange,
  employeeAddition,
  employeeRemoval,
  dateChange,
}

enum SaveStatus { success, error, syncing, offline }
```

#### **Storage Priority**
1. **SQLite Local Database**: Primary storage for immediate access and offline capability
2. **Shared Preferences**: User settings and app configuration
3. **File System Cache**: Temporary files and import/export data
4. **Cloud Storage**: Remote backup and multi-device synchronization
5. **Memory State**: Runtime data using Provider/Riverpod state management

### Import Conflict Rules

#### **Existing Assignment Detection**
When importing a schedule with existing assignments:

```dart
// Flutter import conflict handling
class ImportConflictHandler {
  static Future<ImportAction?> showConflictDialog(
    BuildContext context,
    int existingAssignments,
  ) async {
    return showDialog<ImportAction>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Import Conflict Detected'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.warning, color: Colors.orange, size: 48),
            SizedBox(height: 16),
            Text(
              'Found $existingAssignments existing assignments for this date.',
              textAlign: TextAlign.center,
            ),
            SizedBox(height: 16),
            Text(
              'How would you like to proceed?',
              style: TextStyle(fontWeight: FontWeight.bold),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, ImportAction.cancel),
            child: Text('Cancel'),
            style: TextButton.styleFrom(foregroundColor: Colors.grey),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, ImportAction.updatePoolOnly),
            child: Text('Update Pool Only'),
            style: ElevatedButton.styleFrom(backgroundColor: Colors.green),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, ImportAction.replaceEverything),
            child: Text('Replace Everything'),
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
          ),
        ],
      ),
    );
  }
}

enum ImportAction {
  replaceEverything,  // Clear all assignments, import new schedule
  updatePoolOnly,     // Update employee list, preserve assignments
  cancel,            // Cancel import operation
}
```

## 🔍 Validation and Error Handling

### Real-Time Validation

#### **Input Validation**
- **Name Fields**: Non-empty, trimmed, unique within schedule
- **Time Fields**: Valid time format, logical start/end relationship
- **File Uploads**: Proper format, required columns present
- **Assignment Operations**: Valid employee-station combinations

#### **Input Validation**
- **Name Fields**: Non-empty, trimmed, unique within schedule
- **Time Fields**: Valid time format using Flutter's TimeOfDay, logical start/end relationship
- **File Uploads**: Proper format validation using mime types, required columns present
- **Assignment Operations**: Valid employee-station combinations with business rule validation

#### **Error Recovery**
```dart
// Flutter error handling and recovery
class ErrorHandler {
  static void handleValidationError(ValidationError error) {
    // Show inline error with red styling
    NotificationService.showInlineError(error.message);
    
    // Prevent form submission
    FormValidationService.blockSubmission(error.fieldName);
    
    // Clear error when field is corrected
    FormValidationService.clearErrorOnChange(error.fieldName);
  }
  
  static Future<void> handleNetworkError(NetworkError error) async {
    // Attempt retry up to 3 times
    for (int attempt = 1; attempt <= 3; attempt++) {
      await Future.delayed(Duration(seconds: attempt * 2));
      
      try {
        await error.retryOperation();
        return; // Success, exit retry loop
      } catch (e) {
        if (attempt == 3) {
          // Final attempt failed, fallback to local storage
          await LocalStorageService.saveOffline(error.data);
          NotificationService.showOfflineMode();
        }
      }
    }
  }
  
  static Future<void> handleFileImportError(FileImportError error) async {
    // Validate before processing to prevent partial imports
    final validation = await FileValidationService.validate(error.file);
    
    if (!validation.isValid) {
      DialogService.showDetailedErrors(validation.errors);
      return;
    }
    
    // Allow partial import only with user confirmation
    if (error.hasPartialData) {
      final confirmed = await DialogService.confirmPartialImport();
      if (!confirmed) return;
    }
    
    // Process valid data
    await ImportService.processValidData(validation.validData);
  }
}
```

### User Feedback Rules

#### **Success Indicators**
- **Assignment Success**: Green material design snackbar with checkmark icon
- **Save Success**: Subtle status indicator in app bar with auto-hide
- **Import Success**: Progress dialog showing count of imported employees
- **Export Success**: Toast notification with file location and share option

#### **Warning Indicators**
- **Assignment Conflicts**: Material design dialog with yellow warning icon
- **Minor Employees**: Yellow card background with warning badge
- **Capacity Concerns**: Orange capacity indicators on station headers
- **Network Issues**: Connection status chip in app bar

#### **Error Indicators**
- **Validation Errors**: Red text below form fields with error icon
- **Import Failures**: Detailed error dialog with specific line numbers and issues
- **Network Failures**: Red snackbar with retry action button
- **Assignment Failures**: Error dialog with rollback to previous state option

## 🚀 Performance Rules

### Optimization Guidelines

#### **Large Dataset Handling**
```dart
// Flutter performance optimization for large datasets
class PerformanceOptimizer {
  static const int recommendedEmployeeLimit = 50;
  static const int maximumEmployeeLimit = 100;
  static const Duration debounceDuration = Duration(milliseconds: 100);
  static const int maxFileSizeBytes = 10 * 1024 * 1024; // 10MB
  
  // ListView optimization for large employee lists
  static Widget buildOptimizedEmployeeList(List<Employee> employees) {
    return ListView.builder(
      itemCount: employees.length,
      itemExtent: 80.0, // Fixed height for better performance
      itemBuilder: (context, index) {
        return EmployeeListItem(
          key: ValueKey(employees[index].id),
          employee: employees[index],
        );
      },
    );
  }
  
  // Batch assignment operations to prevent UI freezing
  static Future<void> batchUpdateAssignments(
    List<Assignment> assignments,
    Function(double) onProgress,
  ) async {
    const batchSize = 10;
    
    for (int i = 0; i < assignments.length; i += batchSize) {
      final batch = assignments.skip(i).take(batchSize).toList();
      
      await AssignmentService.processBatch(batch);
      
      // Update progress and yield to UI thread
      onProgress((i + batch.length) / assignments.length);
      await Future.delayed(Duration(milliseconds: 1));
    }
  }
  
  // Memory management for file imports
  static Future<void> processLargeFile(File file) async {
    final fileSize = await file.length();
    
    if (fileSize > maxFileSizeBytes) {
      throw FileToLargeException('File exceeds 10MB limit');
    }
    
    if (fileSize > 1024 * 1024) { // 1MB
      // Show progress indicator for large files
      await FileProcessor.processWithProgress(file);
    } else {
      await FileProcessor.processDirectly(file);
    }
  }
}

// Memory management rules
class MemoryManager {
  static void optimizeForLowMemory() {
    // Clear image cache
    imageCache.clear();
    
    // Dispose unused controllers
    ControllerRegistry.disposeUnused();
    
    // Clear temporary file cache
    TemporaryFileService.clearCache();
  }
  
  static void setupMemoryPressureListener() {
    // Listen for memory pressure and respond accordingly
    WidgetsBinding.instance.addObserver(MemoryPressureObserver());
  }
}
```

#### **Memory Management**
- **Widget Disposal**: Properly dispose controllers and streams on widget unmount
- **Image Caching**: Use cached_network_image with size limits for employee photos
- **Storage Cleanup**: Clear temporary data after operations using path_provider
- **Background Processing**: Use Isolates for heavy computations to prevent UI blocking

## 🔐 Security and Compliance Rules

### Data Protection

#### **Employee Privacy**
- **Minimal Data Collection**: Only collect necessary scheduling information
- **No Sensitive Data**: No SSN, addresses, or personal details stored locally
- **Secure Local Storage**: Use flutter_secure_storage for sensitive data
- **Biometric Authentication**: Optional fingerprint/face ID for app access
- **Data Encryption**: SQLite database encryption using sqlcipher_flutter

#### **Mobile Security**
```dart
// Flutter security implementation
class SecurityService {
  static Future<void> initializeSecurity() async {
    // Initialize secure storage
    await SecureStorageService.initialize();
    
    // Set up biometric authentication
    await BiometricService.initialize();
    
    // Configure certificate pinning for API calls
    await NetworkSecurity.configureCertificatePinning();
    
    // Enable database encryption
    await DatabaseService.enableEncryption();
  }
  
  static Future<bool> authenticateUser() async {
    final hasFingerprint = await BiometricService.hasFingerprint();
    final hasFaceID = await BiometricService.hasFaceID();
    
    if (hasFingerprint || hasFaceID) {
      return await BiometricService.authenticate(
        reason: 'Authenticate to access employee schedules',
      );
    }
    
    // Fallback to PIN/password
    return await PinAuthService.authenticate();
  }
  
  static Future<void> handleBackgroundMode() async {
    // Clear sensitive data when app goes to background
    await MemoryService.clearSensitiveData();
    
    // Show privacy screen overlay
    await PrivacyScreen.show();
  }
}

#### **Audit Trail**
```dart
// Flutter audit trail implementation
class AuditService {
  static const int retentionDays = 30;
  
  static Future<void> logAction(AuditAction action) async {
    final entry = AuditEntry(
      id: Uuid().v4(),
      timestamp: DateTime.now(),
      action: action.type,
      userId: await UserService.getCurrentUserId(),
      details: action.details,
      deviceInfo: await DeviceInfoService.getDeviceInfo(),
    );
    
    await DatabaseService.insertAuditEntry(entry);
    await _cleanupOldEntries();
  }
  
  static Future<void> _cleanupOldEntries() async {
    final cutoffDate = DateTime.now().subtract(Duration(days: retentionDays));
    await DatabaseService.deleteAuditEntriesBefore(cutoffDate);
  }
  
  static Future<List<AuditEntry>> getAuditTrail({
    DateTime? startDate,
    DateTime? endDate,
  }) async {
    return await DatabaseService.getAuditEntries(
      startDate: startDate,
      endDate: endDate,
    );
  }
}

class AuditEntry {
  final String id;
  final DateTime timestamp;
  final String action;
  final String userId;
  final Map<String, dynamic> details;
  final Map<String, String> deviceInfo;
  
  const AuditEntry({
    required this.id,
    required this.timestamp,
    required this.action,
    required this.userId,
    required this.details,
    required this.deviceInfo,
  });
}

enum AuditActionType {
  employeeAssignment,
  scheduleImport,
  dataExport,
  userLogin,
  settingsChange,
}
```

### Regulatory Compliance Framework

#### **Labor Law Compliance Support**
```typescript
interface ComplianceSupport {
  minorEmployees: {
    visualIdentification: "implemented";
    restrictionFramework: "ready for customization";
    reportingSupport: "export includes minor status";
  };
  scheduleDocumentation: {
    pdfExport: "formatted for posting requirements";
    csvExport: "detailed records for compliance";
    dateTracking: "all schedules timestamped";
  };
}
```

## 📊 Reporting and Analytics Rules

### Export Format Rules

#### **PDF Export Specifications**
```dart
// Flutter PDF generation using pdf package
class PDFExporter {
  static Future<File> generateSchedulePDF(Schedule schedule) async {
    final pdf = pw.Document();
    
    pdf.addPage(
      pw.MultiPage(
        pageFormat: PdfPageFormat.a4.landscape,
        margin: pw.EdgeInsets.all(20),
        build: (context) => [
          _buildHeader(schedule),
          pw.SizedBox(height: 20),
          _buildEmployeeGrid(schedule),
          pw.Spacer(),
          _buildFooter(),
        ],
      ),
    );
    
    final output = await getTemporaryDirectory();
    final file = File('${output.path}/schedule_${schedule.date}.pdf');
    await file.writeAsBytes(await pdf.save());
    
    return file;
  }
  
  static pw.Widget _buildHeader(Schedule schedule) {
    return pw.Column(
      crossAxisAlignment: pw.CrossAxisAlignment.start,
      children: [
        pw.Row(
          mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
          children: [
            pw.Text(
              'McDonald\'s Task Scheduler',
              style: pw.TextStyle(fontSize: 24, fontWeight: pw.FontWeight.bold),
            ),
            pw.Text(
              DateFormat('EEEE, MMMM d, yyyy').format(schedule.date),
              style: pw.TextStyle(fontSize: 18),
            ),
          ],
        ),
        pw.SizedBox(height: 10),
        pw.Text(
          'Day Part: ${schedule.dayPart.name}',
          style: pw.TextStyle(fontSize: 16),
        ),
      ],
    );
  }
  
  static pw.Widget _buildEmployeeGrid(Schedule schedule) {
    return pw.Table(
      border: pw.TableBorder.all(),
      children: [
        // Header row
        pw.TableRow(
          decoration: pw.BoxDecoration(color: PdfColors.grey300),
          children: [
            _buildCell('Employee'),
            _buildCell('Shift'),
            _buildCell('Minor'),
            _buildCell('Assignments'),
          ],
        ),
        // Employee rows
        ...schedule.employees.map((employee) => pw.TableRow(
          decoration: employee.isMinor 
            ? pw.BoxDecoration(color: PdfColors.yellow100)
            : null,
          children: [
            _buildCell(employee.name),
            _buildCell('${employee.shiftStart} - ${employee.shiftEnd}'),
            _buildCell(employee.isMinor ? 'Yes' : 'No'),
            _buildCell(employee.assignments.join(', ')),
          ],
        )),
      ],
    );
  }
  
  static pw.Widget _buildCell(String text) {
    return pw.Padding(
      padding: pw.EdgeInsets.all(8),
      child: pw.Text(text),
    );
  }
  
  static pw.Widget _buildFooter() {
    return pw.Text(
      'Generated: ${DateFormat('yyyy-MM-dd HH:mm:ss').format(DateTime.now())}',
      style: pw.TextStyle(fontSize: 10, color: PdfColors.grey),
    );
  }
}
```

#### **CSV Export Specifications**
```dart
// Flutter CSV export using csv package
class CSVExporter {
  static Future<File> generateScheduleCSV(Schedule schedule) async {
    final List<List<String>> csvData = [
      // Header row
      [
        'minor',
        'employeeName', 
        'shiftStartTime',
        'shiftEndTime',
        'task',
        'dayPart',
        'table',
        'column',
        'assignmentTime',
      ],
      // Data rows
      ...schedule.employees.expand((employee) {
        if (employee.assignments.isEmpty) {
          return [[
            employee.isMinor.toString(),
            employee.name,
            employee.shiftStart,
            employee.shiftEnd,
            '',
            schedule.dayPart.name,
            '',
            '',
            '',
          ]];
        }
        
        return employee.assignments.map((assignment) => [
          employee.isMinor.toString(),
          employee.name,
          employee.shiftStart,
          employee.shiftEnd,
          assignment.taskName,
          schedule.dayPart.name,
          assignment.stationId,
          assignment.columnId,
          assignment.assignedAt.toIso8601String(),
        ]);
      }),
    ];
    
    final csvString = const ListToCsvConverter().convert(csvData);
    
    final output = await getTemporaryDirectory();
    final file = File('${output.path}/schedule_${schedule.date}.csv');
    await file.writeAsString(csvString, encoding: utf8);
    
    return file;
  }
  
  static const Map<String, String> csvHeaders = {
    'minor': 'Employee minor status (true/false)',
    'employeeName': 'Full employee name',
    'shiftStartTime': 'Shift start time (HH:MM format)',
    'shiftEndTime': 'Shift end time (HH:MM format)', 
    'task': 'Station-column assignment',
    'dayPart': 'Breakfast/Lunch designation',
    'table': 'Station identifier',
    'column': 'Specific task within station',
    'assignmentTime': 'ISO 8601 timestamp of assignment',
  };
}
```

## 🔧 Configuration Rules

### Customization Capabilities

#### **Layout Customization** (Future Enhancement)
```dart
// Flutter layout customization framework
class LayoutCustomizer {
  static Future<void> customizeStations(List<StationConfig> stations) async {
    final customLayout = CustomLayout(
      stations: stations,
      lastModified: DateTime.now(),
    );
    
    await DatabaseService.saveCustomLayout(customLayout);
    await LayoutService.applyCustomLayout(customLayout);
  }
  
  static Widget buildCustomizationScreen() {
    return Scaffold(
      appBar: AppBar(title: Text('Customize Layout')),
      body: Column(
        children: [
          _buildStationCustomizer(),
          _buildDayPartCustomizer(),
          _buildValidationCustomizer(),
        ],
      ),
    );
  }
  
  static Widget _buildStationCustomizer() {
    return ExpansionTile(
      title: Text('Station Configuration'),
      children: [
        ListTile(
          title: Text('Add Custom Station'),
          trailing: Icon(Icons.add),
          onTap: () => _showAddStationDialog(),
        ),
        ListTile(
          title: Text('Hide Unused Stations'),
          trailing: Switch(value: false, onChanged: (v) {}),
        ),
        ListTile(
          title: Text('Rename Stations'),
          trailing: Icon(Icons.edit),
          onTap: () => _showRenameStationsDialog(),
        ),
        ReorderableListView(
          shrinkWrap: true,
          children: StationService.getAllStations()
            .map((station) => ListTile(
              key: ValueKey(station.id),
              title: Text(station.name),
              trailing: Icon(Icons.drag_handle),
            ))
            .toList(),
          onReorder: (oldIndex, newIndex) {
            StationService.reorderStations(oldIndex, newIndex);
          },
        ),
      ],
    );
  }
}

class CustomLayout {
  final List<StationConfig> stations;
  final Map<DayPart, TimeRange> dayPartTimes;
  final Map<String, ValidationRule> customRules;
  final DateTime lastModified;
  
  const CustomLayout({
    required this.stations,
    this.dayPartTimes = const {},
    this.customRules = const {},
    required this.lastModified,
  });
}
```

#### **Current Configurability**
- **Date Selection**: Calendar picker with any date selection for scheduling
- **Day Part Toggle**: Seamless switching between Breakfast and Lunch layouts with animation
- **Employee Pool**: Dynamic addition/removal using floating action button and swipe-to-delete
- **Assignment Flexibility**: No hard restrictions on assignments, full drag-and-drop freedom
- **Theme Customization**: McDonald's brand colors with light/dark mode support
- **Offline Mode**: Full functionality without internet connection
- **Multi-Language Support**: Localization framework for international restaurants

## 📱 Platform-Specific Rules

### iOS-Specific Features
```dart
// iOS-specific implementations
class IOSFeatures {
  static Future<void> setupIOSFeatures() async {
    // Configure iOS-specific UI elements
    await _setupCupertinoNavigation();
    await _setupIOSPermissions();
    await _setupAppleSignIn();
  }
  
  static Future<void> _setupCupertinoNavigation() async {
    // Use Cupertino navigation patterns on iOS
    NavigationService.useCupertinoStyle = Platform.isIOS;
  }
  
  static Future<void> _setupIOSPermissions() async {
    // Request iOS-specific permissions
    await Permission.camera.request(); // For QR code scanning
    await Permission.storage.request(); // For file exports
  }
  
  // iOS share sheet integration
  static Future<void> shareSchedule(File file) async {
    if (Platform.isIOS) {
      await Share.shareFiles([file.path], text: 'Employee Schedule');
    }
  }
}
```

### Android-Specific Features  
```dart
// Android-specific implementations
class AndroidFeatures {
  static Future<void> setupAndroidFeatures() async {
    await _setupMaterialDesign();
    await _setupAndroidPermissions();
    await _setupFileProvider();
  }
  
  static Future<void> _setupMaterialDesign() async {
    // Configure Material Design 3 theming
    ThemeService.useMaterial3 = true;
    await ThemeService.configureDynamicColors();
  }
  
  static Future<void> _setupAndroidPermissions() async {
    // Request Android-specific permissions
    await Permission.manageExternalStorage.request();
    await Permission.notification.request();
  }
  
  // Android file provider for sharing
  static Future<void> shareSchedule(File file) async {
    if (Platform.isAndroid) {
      final uri = await FileProvider.getUriForFile(file);
      await Share.shareFiles([uri], text: 'Employee Schedule');
    }
  }
}

## 📋 Summary of Key Rules

### ✅ What IS Allowed
- Multiple employees per station with visual capacity indicators
- Single employee at multiple stations with clear assignment tracking
- Flexible assignment changes with undo/redo functionality
- Unlimited break assignments with automatic station removal
- Mixed shifts and time formats with intelligent parsing
- Offline-first operation with background synchronization
- Cross-platform data sharing (iOS/Android)
- Biometric authentication for security
- Custom station layouts and naming
- Multi-language support

### ❌ What IS NOT Allowed
- Duplicate employee names within same schedule (enforced by SQLite constraints)
- Empty required fields (name, shift times) with real-time validation
- Assignment to DFS station (information display only)
- Invalid time formats (validated using TimeOfDay picker)
- Unsupported file formats for import (mime type validation)
- Assignments violating minor safety restrictions (when enabled)
- Database operations without proper error handling
- Network operations without offline fallback

### ⚠️ What REQUIRES Confirmation
- Break assignments (removes from all other stations) with haptic feedback
- Assignment conflicts (employee already working) with detailed dialog
- Import operations (potential data loss) with preview option
- Large file imports (performance warning) with progress indicator
- Biometric authentication failure (fallback to PIN)
- Data export with sensitive information warning
- App data clearing or reset operations

### 🔄 What IS Automatically Handled
- Data synchronization between local SQLite and cloud storage
- Assignment conflict detection with real-time validation
- File format validation during import process
- Auto-save operations with debouncing (500ms)
- Visual feedback for all touch interactions with haptic response
- Memory management and background task cleanup
- Network connectivity monitoring and offline mode switching
- Cross-platform UI adaptation (Material/Cupertino)

---

## 🚀 Flutter-Specific Future Enhancements

This documentation establishes the foundation for Flutter-native enhancements:

1. **Advanced Biometric Security**: Face ID, Touch ID, and Android fingerprint integration
2. **Offline-First Architecture**: Complete functionality without internet with sync resolution
3. **Platform Integration**: iOS Shortcuts, Android App Shortcuts, and widget support
4. **Advanced Notifications**: Local notifications for shift reminders and schedule changes
5. **QR Code Integration**: Employee check-in/out via QR code scanning
6. **Wearable Support**: Apple Watch and Wear OS companion apps
7. **Voice Commands**: Siri Shortcuts and Google Assistant integration
8. **Real-time Collaboration**: Live multi-manager editing with conflict resolution
9. **Analytics Dashboard**: Employee performance and scheduling efficiency metrics
10. **Multi-Restaurant Chain Support**: Franchise-wide scheduling coordination

The current Flutter implementation provides a robust, mobile-first foundation that leverages platform-specific capabilities while maintaining cross-platform consistency and offline-first reliability.
