# McDonald's Task Scheduler Flutter Documentation - Part 3: Data Models & State Management

## 📋 Navigation
← [Part 2: Project Structure & Setup](./Flutter_Documentation_Part_2_Project_Setup.md) | [Part 4: UI Components & Widgets](./Flutter_Documentation_Part_4_UI_Components.md) →

---

## 🗄️ Data Models & State Management

### **Data Layer Architecture Overview**

The data layer follows the Repository pattern with multiple data sources, ensuring offline-first functionality while maintaining real-time synchronization capabilities.

```
┌─────────────────────────────────────────────────────────┐
│                    Domain Layer                         │
│  ┌─────────────────┐    ┌─────────────────────────────┐ │
│  │    Entities     │    │      Repositories          │ │
│  │   (Pure Dart)   │    │     (Interfaces)           │ │
│  └─────────────────┘    └─────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│                     Data Layer                          │
│  ┌─────────────────┐    ┌─────────────────────────────┐ │
│  │     Models      │    │  Repository Implementations │ │
│  │  (JSON/SQL)     │    │   (Concrete Classes)        │ │
│  └─────────────────┘    └─────────────────────────────┘ │
│  ┌─────────────────┐    ┌─────────────────────────────┐ │
│  │ Local DataSource│    │   Remote DataSource         │ │
│  │   (SQLite)      │    │      (REST API)             │ │
│  └─────────────────┘    └─────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

---

## 📊 Domain Entities

### **Core Entity Definitions**

#### **Employee Entity**
```dart
// lib/domain/entities/employee.dart
import 'package:equatable/equatable.dart';

class Employee extends Equatable {
  final String id;
  final String name;
  final String shiftStart;
  final String shiftEnd;
  final bool isMinor;
  final String? task;
  final DateTime createdAt;
  final DateTime updatedAt;
  final EmployeeStatus status;
  final List<String> certifications;
  final String? photoUrl;

  const Employee({
    required this.id,
    required this.name,
    required this.shiftStart,
    required this.shiftEnd,
    required this.isMinor,
    this.task,
    required this.createdAt,
    required this.updatedAt,
    this.status = EmployeeStatus.active,
    this.certifications = const [],
    this.photoUrl,
  });

  // Business logic methods
  bool get isAvailable => status == EmployeeStatus.active && task == null;
  
  bool get hasShiftConflict => _checkShiftConflict();
  
  Duration get shiftDuration => _calculateShiftDuration();
  
  bool canWorkStation(String stationId) {
    // Business rule: Minors cannot work at certain stations
    if (isMinor && MinorRestrictions.prohibitedStations.contains(stationId)) {
      return false;
    }
    return true;
  }
  
  bool requiresSupervision(String stationId) {
    return isMinor && MinorRestrictions.supervisionRequired.contains(stationId);
  }
  
  // Private helper methods
  bool _checkShiftConflict() {
    try {
      final start = _parseTime(shiftStart);
      final end = _parseTime(shiftEnd);
      return end.isBefore(start); // Next day shift
    } catch (e) {
      return false;
    }
  }
  
  Duration _calculateShiftDuration() {
    try {
      final start = _parseTime(shiftStart);
      final end = _parseTime(shiftEnd);
      
      if (end.isBefore(start)) {
        // Next day shift
        return Duration(
          hours: 24 - start.hour + end.hour,
          minutes: -start.minute + end.minute,
        );
      }
      
      return Duration(
        hours: end.hour - start.hour,
        minutes: end.minute - start.minute,
      );
    } catch (e) {
      return Duration.zero;
    }
  }
  
  DateTime _parseTime(String timeStr) {
    final parts = timeStr.split(':');
    final hour = int.parse(parts[0]);
    final minute = int.parse(parts[1]);
    final now = DateTime.now();
    return DateTime(now.year, now.month, now.day, hour, minute);
  }

  Employee copyWith({
    String? id,
    String? name,
    String? shiftStart,
    String? shiftEnd,
    bool? isMinor,
    String? task,
    DateTime? createdAt,
    DateTime? updatedAt,
    EmployeeStatus? status,
    List<String>? certifications,
    String? photoUrl,
  }) {
    return Employee(
      id: id ?? this.id,
      name: name ?? this.name,
      shiftStart: shiftStart ?? this.shiftStart,
      shiftEnd: shiftEnd ?? this.shiftEnd,
      isMinor: isMinor ?? this.isMinor,
      task: task ?? this.task,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      status: status ?? this.status,
      certifications: certifications ?? this.certifications,
      photoUrl: photoUrl ?? this.photoUrl,
    );
  }

  @override
  List<Object?> get props => [
        id,
        name,
        shiftStart,
        shiftEnd,
        isMinor,
        task,
        createdAt,
        updatedAt,
        status,
        certifications,
        photoUrl,
      ];
}

enum EmployeeStatus {
  active,
  inactive,
  onBreak,
  onLeave,
}

// Minor restrictions constants
class MinorRestrictions {
  static const List<String> prohibitedStations = [
    'fryer',
    'grill',
    'oven',
    'equipment_cleaning',
    'maintenance',
  ];
  
  static const List<String> supervisionRequired = [
    'cash_handling',
    'drive_thru',
    'food_prep',
  ];
  
  static const Map<String, TimeRange> workingHours = {
    'school_days': TimeRange(start: '06:00', end: '22:00'),
    'non_school_days': TimeRange(start: '06:00', end: '24:00'),
  };
}

class TimeRange {
  final String start;
  final String end;
  
  const TimeRange({required this.start, required this.end});
}
```

#### **Station Entity**
```dart
// lib/domain/entities/station.dart
import 'package:equatable/equatable.dart';

class Station extends Equatable {
  final String id;
  final String name;
  final String category;
  final DayPart dayPart;
  final Position position;
  final int maxCapacity;
  final int currentCount;
  final List<String> requiredCertifications;
  final bool isActive;
  final List<TaskColumn> columns;
  final StationPriority priority;

  const Station({
    required this.id,
    required this.name,
    required this.category,
    required this.dayPart,
    required this.position,
    this.maxCapacity = 999,
    this.currentCount = 0,
    this.requiredCertifications = const [],
    this.isActive = true,
    this.columns = const [],
    this.priority = StationPriority.normal,
  });

  // Business logic methods
  bool get hasCapacity => currentCount < maxCapacity;
  
  bool get isOverCapacity => currentCount > maxCapacity;
  
  double get capacityPercentage => 
      maxCapacity > 0 ? (currentCount / maxCapacity) * 100 : 0;
  
  CapacityStatus get capacityStatus {
    final percentage = capacityPercentage;
    if (percentage >= 100) return CapacityStatus.full;
    if (percentage >= 80) return CapacityStatus.high;
    if (percentage >= 50) return CapacityStatus.medium;
    return CapacityStatus.low;
  }
  
  bool canAcceptEmployee(Employee employee) {
    // Check capacity
    if (!hasCapacity) return false;
    
    // Check if station is active
    if (!isActive) return false;
    
    // Check day part compatibility
    if (!isDayPartCompatible()) return false;
    
    // Check employee restrictions
    if (!employee.canWorkStation(id)) return false;
    
    // Check certifications
    if (requiredCertifications.isNotEmpty) {
      return requiredCertifications.every(
        (cert) => employee.certifications.contains(cert),
      );
    }
    
    return true;
  }
  
  bool isDayPartCompatible() {
    final currentDayPart = DayPartHelper.getCurrentDayPart();
    return dayPart == DayPart.all || dayPart == currentDayPart;
  }
  
  TaskColumn? getColumnById(String columnId) {
    try {
      return columns.firstWhere((col) => col.id == columnId);
    } catch (e) {
      return null;
    }
  }

  Station copyWith({
    String? id,
    String? name,
    String? category,
    DayPart? dayPart,
    Position? position,
    int? maxCapacity,
    int? currentCount,
    List<String>? requiredCertifications,
    bool? isActive,
    List<TaskColumn>? columns,
    StationPriority? priority,
  }) {
    return Station(
      id: id ?? this.id,
      name: name ?? this.name,
      category: category ?? this.category,
      dayPart: dayPart ?? this.dayPart,
      position: position ?? this.position,
      maxCapacity: maxCapacity ?? this.maxCapacity,
      currentCount: currentCount ?? this.currentCount,
      requiredCertifications: requiredCertifications ?? this.requiredCertifications,
      isActive: isActive ?? this.isActive,
      columns: columns ?? this.columns,
      priority: priority ?? this.priority,
    );
  }

  @override
  List<Object?> get props => [
        id,
        name,
        category,
        dayPart,
        position,
        maxCapacity,
        currentCount,
        requiredCertifications,
        isActive,
        columns,
        priority,
      ];
}

class Position extends Equatable {
  final double x;
  final double y;
  final int row;
  final int column;

  const Position({
    required this.x,
    required this.y,
    required this.row,
    required this.column,
  });

  @override
  List<Object> get props => [x, y, row, column];
}

class TaskColumn extends Equatable {
  final String id;
  final String name;
  final String description;
  final int maxEmployees;
  final List<String> assignedEmployeeIds;

  const TaskColumn({
    required this.id,
    required this.name,
    required this.description,
    this.maxEmployees = 999,
    this.assignedEmployeeIds = const [],
  });

  bool get hasCapacity => assignedEmployeeIds.length < maxEmployees;
  
  int get currentCount => assignedEmployeeIds.length;

  @override
  List<Object> get props => [id, name, description, maxEmployees, assignedEmployeeIds];
}

enum DayPart { breakfast, lunch, dinner, all }

enum CapacityStatus { low, medium, high, full }

enum StationPriority { low, normal, high, critical }

// Helper class for day part operations
class DayPartHelper {
  static DayPart getCurrentDayPart() {
    final hour = DateTime.now().hour;
    
    if (hour >= 4 && hour < 11) return DayPart.breakfast;
    if (hour >= 11 && hour < 17) return DayPart.lunch;
    return DayPart.dinner;
  }
  
  static String getDayPartDisplayName(DayPart dayPart) {
    switch (dayPart) {
      case DayPart.breakfast:
        return 'Breakfast';
      case DayPart.lunch:
        return 'Lunch';
      case DayPart.dinner:
        return 'Dinner';
      case DayPart.all:
        return 'All Day';
    }
  }
}
```

#### **Assignment Entity**
```dart
// lib/domain/entities/assignment.dart
import 'package:equatable/equatable.dart';

class Assignment extends Equatable {
  final String id;
  final String employeeId;
  final String stationId;
  final String? columnId;
  final DateTime date;
  final DayPart dayPart;
  final DateTime assignedAt;
  final String? assignedBy;
  final AssignmentType type;
  final AssignmentStatus status;
  final Duration? duration;
  final String? notes;

  const Assignment({
    required this.id,
    required this.employeeId,
    required this.stationId,
    this.columnId,
    required this.date,
    required this.dayPart,
    required this.assignedAt,
    this.assignedBy,
    this.type = AssignmentType.regular,
    this.status = AssignmentStatus.active,
    this.duration,
    this.notes,
  });

  // Business logic methods
  bool get isActive => status == AssignmentStatus.active;
  
  bool get isBreakAssignment => stationId == 'breaks';
  
  bool get hasTimeLimit => duration != null;
  
  DateTime? get estimatedEndTime {
    if (duration == null) return null;
    return assignedAt.add(duration!);
  }
  
  bool get isOverdue {
    final endTime = estimatedEndTime;
    if (endTime == null) return false;
    return DateTime.now().isAfter(endTime);
  }
  
  Duration get timeElapsed => DateTime.now().difference(assignedAt);
  
  Duration? get timeRemaining {
    final endTime = estimatedEndTime;
    if (endTime == null) return null;
    final remaining = endTime.difference(DateTime.now());
    return remaining.isNegative ? Duration.zero : remaining;
  }
  
  bool isConflictWith(Assignment other) {
    // Same employee cannot be assigned to multiple stations at same time
    // (except for break assignments which override all others)
    if (employeeId != other.employeeId) return false;
    if (date != other.date) return false;
    if (dayPart != other.dayPart) return false;
    
    // Break assignments conflict with everything
    if (isBreakAssignment || other.isBreakAssignment) return true;
    
    // Same station/column assignments are not conflicts (multiple people can work same station)
    return false;
  }
  
  String getDisplayText() {
    final stationName = StationRepository.getStationName(stationId);
    if (columnId != null) {
      final columnName = StationRepository.getColumnName(stationId, columnId!);
      return '$stationName - $columnName';
    }
    return stationName;
  }

  Assignment copyWith({
    String? id,
    String? employeeId,
    String? stationId,
    String? columnId,
    DateTime? date,
    DayPart? dayPart,
    DateTime? assignedAt,
    String? assignedBy,
    AssignmentType? type,
    AssignmentStatus? status,
    Duration? duration,
    String? notes,
  }) {
    return Assignment(
      id: id ?? this.id,
      employeeId: employeeId ?? this.employeeId,
      stationId: stationId ?? this.stationId,
      columnId: columnId ?? this.columnId,
      date: date ?? this.date,
      dayPart: dayPart ?? this.dayPart,
      assignedAt: assignedAt ?? this.assignedAt,
      assignedBy: assignedBy ?? this.assignedBy,
      type: type ?? this.type,
      status: status ?? this.status,
      duration: duration ?? this.duration,
      notes: notes ?? this.notes,
    );
  }

  @override
  List<Object?> get props => [
        id,
        employeeId,
        stationId,
        columnId,
        date,
        dayPart,
        assignedAt,
        assignedBy,
        type,
        status,
        duration,
        notes,
      ];
}

enum AssignmentType {
  regular,
  temporary,
  break_,
  training,
  coverage,
}

enum AssignmentStatus {
  active,
  completed,
  cancelled,
  paused,
}

// Assignment conflict resolution
class AssignmentConflict extends Equatable {
  final Assignment existingAssignment;
  final Assignment newAssignment;
  final ConflictType type;
  final ConflictSeverity severity;
  final String description;
  final List<ConflictResolution> possibleResolutions;

  const AssignmentConflict({
    required this.existingAssignment,
    required this.newAssignment,
    required this.type,
    required this.severity,
    required this.description,
    required this.possibleResolutions,
  });

  @override
  List<Object> get props => [
        existingAssignment,
        newAssignment,
        type,
        severity,
        description,
        possibleResolutions,
      ];
}

enum ConflictType {
  timeOverlap,
  stationCapacity,
  employeeRestriction,
  skillRequirement,
}

enum ConflictSeverity {
  warning,
  error,
  critical,
}

enum ConflictResolution {
  replaceExisting,
  addToCurrent,
  cancel,
  postpone,
}
```

#### **Schedule Entity**
```dart
// lib/domain/entities/schedule.dart
import 'package:equatable/equatable.dart';

class Schedule extends Equatable {
  final String id;
  final DateTime date;
  final DayPart dayPart;
  final List<Employee> employees;
  final List<Assignment> assignments;
  final ScheduleStatus status;
  final DateTime createdAt;
  final DateTime updatedAt;
  final String? createdBy;
  final String? notes;
  final ScheduleMetadata metadata;

  const Schedule({
    required this.id,
    required this.date,
    required this.dayPart,
    required this.employees,
    required this.assignments,
    this.status = ScheduleStatus.draft,
    required this.createdAt,
    required this.updatedAt,
    this.createdBy,
    this.notes,
    required this.metadata,
  });

  // Business logic methods
  bool get isPublished => status == ScheduleStatus.published;
  
  bool get isDraft => status == ScheduleStatus.draft;
  
  bool get hasConflicts => getConflicts().isNotEmpty;
  
  int get totalEmployees => employees.length;
  
  int get assignedEmployees => assignments.map((a) => a.employeeId).toSet().length;
  
  int get unassignedEmployees => totalEmployees - assignedEmployees;
  
  double get assignmentPercentage => 
      totalEmployees > 0 ? (assignedEmployees / totalEmployees) * 100 : 0;
  
  List<Employee> getUnassignedEmployees() {
    final assignedIds = assignments.map((a) => a.employeeId).toSet();
    return employees.where((e) => !assignedIds.contains(e.id)).toList();
  }
  
  List<Employee> getEmployeesOnBreak() {
    final breakAssignments = assignments.where((a) => a.isBreakAssignment);
    final breakEmployeeIds = breakAssignments.map((a) => a.employeeId).toSet();
    return employees.where((e) => breakEmployeeIds.contains(e.id)).toList();
  }
  
  List<Assignment> getAssignmentsForEmployee(String employeeId) {
    return assignments.where((a) => a.employeeId == employeeId).toList();
  }
  
  List<Assignment> getAssignmentsForStation(String stationId) {
    return assignments.where((a) => a.stationId == stationId).toList();
  }
  
  List<AssignmentConflict> getConflicts() {
    final conflicts = <AssignmentConflict>[];
    
    for (int i = 0; i < assignments.length; i++) {
      for (int j = i + 1; j < assignments.length; j++) {
        final assignment1 = assignments[i];
        final assignment2 = assignments[j];
        
        if (assignment1.isConflictWith(assignment2)) {
          conflicts.add(AssignmentConflict(
            existingAssignment: assignment1,
            newAssignment: assignment2,
            type: ConflictType.timeOverlap,
            severity: ConflictSeverity.warning,
            description: 'Employee ${assignment1.employeeId} assigned to multiple stations',
            possibleResolutions: [
              ConflictResolution.replaceExisting,
              ConflictResolution.addToCurrent,
              ConflictResolution.cancel,
            ],
          ));
        }
      }
    }
    
    return conflicts;
  }
  
  Map<String, int> getStationCounts() {
    final counts = <String, int>{};
    for (final assignment in assignments) {
      counts[assignment.stationId] = (counts[assignment.stationId] ?? 0) + 1;
    }
    return counts;
  }
  
  bool canAddAssignment(Assignment assignment) {
    // Check for conflicts
    final conflicts = assignments.where((a) => a.isConflictWith(assignment));
    
    // Break assignments always override others
    if (assignment.isBreakAssignment) return true;
    
    // No conflicts found
    return conflicts.isEmpty;
  }
  
  Schedule addAssignment(Assignment assignment) {
    final newAssignments = List<Assignment>.from(assignments);
    
    // If this is a break assignment, remove all other assignments for this employee
    if (assignment.isBreakAssignment) {
      newAssignments.removeWhere((a) => a.employeeId == assignment.employeeId);
    }
    
    newAssignments.add(assignment);
    
    return copyWith(
      assignments: newAssignments,
      updatedAt: DateTime.now(),
      metadata: metadata.copyWith(
        lastModified: DateTime.now(),
        version: metadata.version + 1,
      ),
    );
  }
  
  Schedule removeAssignment(String assignmentId) {
    final newAssignments = assignments.where((a) => a.id != assignmentId).toList();
    
    return copyWith(
      assignments: newAssignments,
      updatedAt: DateTime.now(),
      metadata: metadata.copyWith(
        lastModified: DateTime.now(),
        version: metadata.version + 1,
      ),
    );
  }

  Schedule copyWith({
    String? id,
    DateTime? date,
    DayPart? dayPart,
    List<Employee>? employees,
    List<Assignment>? assignments,
    ScheduleStatus? status,
    DateTime? createdAt,
    DateTime? updatedAt,
    String? createdBy,
    String? notes,
    ScheduleMetadata? metadata,
  }) {
    return Schedule(
      id: id ?? this.id,
      date: date ?? this.date,
      dayPart: dayPart ?? this.dayPart,
      employees: employees ?? this.employees,
      assignments: assignments ?? this.assignments,
      status: status ?? this.status,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      createdBy: createdBy ?? this.createdBy,
      notes: notes ?? this.notes,
      metadata: metadata ?? this.metadata,
    );
  }

  @override
  List<Object?> get props => [
        id,
        date,
        dayPart,
        employees,
        assignments,
        status,
        createdAt,
        updatedAt,
        createdBy,
        notes,
        metadata,
      ];
}

enum ScheduleStatus {
  draft,
  review,
  published,
  archived,
}

class ScheduleMetadata extends Equatable {
  final int version;
  final DateTime lastModified;
  final String? lastModifiedBy;
  final bool hasUnsavedChanges;
  final Map<String, dynamic> customData;

  const ScheduleMetadata({
    this.version = 1,
    required this.lastModified,
    this.lastModifiedBy,
    this.hasUnsavedChanges = false,
    this.customData = const {},
  });

  ScheduleMetadata copyWith({
    int? version,
    DateTime? lastModified,
    String? lastModifiedBy,
    bool? hasUnsavedChanges,
    Map<String, dynamic>? customData,
  }) {
    return ScheduleMetadata(
      version: version ?? this.version,
      lastModified: lastModified ?? this.lastModified,
      lastModifiedBy: lastModifiedBy ?? this.lastModifiedBy,
      hasUnsavedChanges: hasUnsavedChanges ?? this.hasUnsavedChanges,
      customData: customData ?? this.customData,
    );
  }

  @override
  List<Object?> get props => [
        version,
        lastModified,
        lastModifiedBy,
        hasUnsavedChanges,
        customData,
      ];
}
```

---

## 🏗️ Data Models (Data Layer)

### **Employee Model**
```dart
// lib/data/models/employee_model.dart
import 'package:floor/floor.dart';
import 'package:json_annotation/json_annotation.dart';
import '../../domain/entities/employee.dart';

part 'employee_model.g.dart';

@Entity(tableName: 'employees')
@JsonSerializable()
class EmployeeModel {
  @PrimaryKey()
  final String id;
  
  @ColumnInfo(name: 'name')
  final String name;
  
  @ColumnInfo(name: 'shift_start')
  final String shiftStart;
  
  @ColumnInfo(name: 'shift_end')
  final String shiftEnd;
  
  @ColumnInfo(name: 'is_minor')
  final bool isMinor;
  
  @ColumnInfo(name: 'task')
  final String? task;
  
  @ColumnInfo(name: 'created_at')
  final DateTime createdAt;
  
  @ColumnInfo(name: 'updated_at')
  final DateTime updatedAt;
  
  @ColumnInfo(name: 'status')
  final String status;
  
  @ColumnInfo(name: 'certifications')
  final String certifications; // JSON string
  
  @ColumnInfo(name: 'photo_url')
  final String? photoUrl;

  const EmployeeModel({
    required this.id,
    required this.name,
    required this.shiftStart,
    required this.shiftEnd,
    required this.isMinor,
    this.task,
    required this.createdAt,
    required this.updatedAt,
    required this.status,
    required this.certifications,
    this.photoUrl,
  });

  // Convert from Entity to Model
  factory EmployeeModel.fromEntity(Employee employee) {
    return EmployeeModel(
      id: employee.id,
      name: employee.name,
      shiftStart: employee.shiftStart,
      shiftEnd: employee.shiftEnd,
      isMinor: employee.isMinor,
      task: employee.task,
      createdAt: employee.createdAt,
      updatedAt: employee.updatedAt,
      status: employee.status.name,
      certifications: employee.certifications.join(','),
      photoUrl: employee.photoUrl,
    );
  }

  // Convert from Model to Entity
  Employee toEntity() {
    return Employee(
      id: id,
      name: name,
      shiftStart: shiftStart,
      shiftEnd: shiftEnd,
      isMinor: isMinor,
      task: task,
      createdAt: createdAt,
      updatedAt: updatedAt,
      status: EmployeeStatus.values.firstWhere(
        (e) => e.name == status,
        orElse: () => EmployeeStatus.active,
      ),
      certifications: certifications.isEmpty 
          ? [] 
          : certifications.split(','),
      photoUrl: photoUrl,
    );
  }

  // JSON serialization
  factory EmployeeModel.fromJson(Map<String, dynamic> json) =>
      _$EmployeeModelFromJson(json);

  Map<String, dynamic> toJson() => _$EmployeeModelToJson(this);

  EmployeeModel copyWith({
    String? id,
    String? name,
    String? shiftStart,
    String? shiftEnd,
    bool? isMinor,
    String? task,
    DateTime? createdAt,
    DateTime? updatedAt,
    String? status,
    String? certifications,
    String? photoUrl,
  }) {
    return EmployeeModel(
      id: id ?? this.id,
      name: name ?? this.name,
      shiftStart: shiftStart ?? this.shiftStart,
      shiftEnd: shiftEnd ?? this.shiftEnd,
      isMinor: isMinor ?? this.isMinor,
      task: task ?? this.task,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      status: status ?? this.status,
      certifications: certifications ?? this.certifications,
      photoUrl: photoUrl ?? this.photoUrl,
    );
  }
}
```

### **Database DAO (Data Access Object)**
```dart
// lib/data/datasources/local/database/employee_dao.dart
import 'package:floor/floor.dart';
import '../../../models/employee_model.dart';

@dao
abstract class EmployeeDao {
  @Query('SELECT * FROM employees ORDER BY name ASC')
  Future<List<EmployeeModel>> getAllEmployees();

  @Query('SELECT * FROM employees WHERE id = :id')
  Future<EmployeeModel?> getEmployeeById(String id);

  @Query('SELECT * FROM employees WHERE is_minor = :isMinor')
  Future<List<EmployeeModel>> getEmployeesByMinorStatus(bool isMinor);

  @Query('SELECT * FROM employees WHERE status = :status')
  Future<List<EmployeeModel>> getEmployeesByStatus(String status);

  @Query('SELECT * FROM employees WHERE shift_start >= :startTime AND shift_end <= :endTime')
  Future<List<EmployeeModel>> getEmployeesByShiftTime(String startTime, String endTime);

  @insert
  Future<void> insertEmployee(EmployeeModel employee);

  @insert
  Future<void> insertEmployees(List<EmployeeModel> employees);

  @update
  Future<void> updateEmployee(EmployeeModel employee);

  @delete
  Future<void> deleteEmployee(EmployeeModel employee);

  @Query('DELETE FROM employees WHERE id = :id')
  Future<void> deleteEmployeeById(String id);

  @Query('DELETE FROM employees')
  Future<void> deleteAllEmployees();

  @Query('SELECT COUNT(*) FROM employees')
  Future<int?> getEmployeeCount();

  @Query('SELECT COUNT(*) FROM employees WHERE is_minor = 1')
  Future<int?> getMinorEmployeeCount();

  // Stream for real-time updates
  @Query('SELECT * FROM employees ORDER BY name ASC')
  Stream<List<EmployeeModel>> watchAllEmployees();

  @Query('SELECT * FROM employees WHERE id = :id')
  Stream<EmployeeModel?> watchEmployeeById(String id);
}
```

---

## 🔄 State Management with BLoC

### **Employee BLoC Implementation**
```dart
// lib/presentation/bloc/employee/employee_bloc.dart
import 'package:bloc/bloc.dart';
import 'package:equatable/equatable.dart';
import 'package:injectable/injectable.dart';

import '../../../domain/entities/employee.dart';
import '../../../domain/usecases/employee/get_all_employees.dart';
import '../../../domain/usecases/employee/add_employee.dart';
import '../../../domain/usecases/employee/update_employee.dart';
import '../../../domain/usecases/employee/delete_employee.dart';
import '../../../core/error/failures.dart';

part 'employee_event.dart';
part 'employee_state.dart';

@injectable
class EmployeeBloc extends Bloc<EmployeeEvent, EmployeeState> {
  final GetAllEmployees _getAllEmployees;
  final AddEmployee _addEmployee;
  final UpdateEmployee _updateEmployee;
  final DeleteEmployee _deleteEmployee;

  EmployeeBloc(
    this._getAllEmployees,
    this._addEmployee,
    this._updateEmployee,
    this._deleteEmployee,
  ) : super(EmployeeInitial()) {
    on<LoadEmployees>(_onLoadEmployees);
    on<AddEmployeeEvent>(_onAddEmployee);
    on<UpdateEmployeeEvent>(_onUpdateEmployee);
    on<DeleteEmployeeEvent>(_onDeleteEmployee);
    on<RefreshEmployees>(_onRefreshEmployees);
    on<FilterEmployees>(_onFilterEmployees);
    on<SearchEmployees>(_onSearchEmployees);
  }

  Future<void> _onLoadEmployees(
    LoadEmployees event,
    Emitter<EmployeeState> emit,
  ) async {
    emit(EmployeeLoading());

    final result = await _getAllEmployees(NoParams());

    result.fold(
      (failure) => emit(EmployeeError(_mapFailureToMessage(failure))),
      (employees) => emit(EmployeeLoaded(
        employees: employees,
        filteredEmployees: employees,
      )),
    );
  }

  Future<void> _onAddEmployee(
    AddEmployeeEvent event,
    Emitter<EmployeeState> emit,
  ) async {
    if (state is EmployeeLoaded) {
      final currentState = state as EmployeeLoaded;
      emit(currentState.copyWith(isLoading: true));

      final result = await _addEmployee(AddEmployeeParams(event.employee));

      result.fold(
        (failure) => emit(currentState.copyWith(
          isLoading: false,
          error: _mapFailureToMessage(failure),
        )),
        (employee) {
          final updatedEmployees = List<Employee>.from(currentState.employees)
            ..add(employee);
          
          emit(EmployeeLoaded(
            employees: updatedEmployees,
            filteredEmployees: _applyCurrentFilter(updatedEmployees, currentState),
            message: 'Employee ${employee.name} added successfully',
          ));
        },
      );
    }
  }

  Future<void> _onUpdateEmployee(
    UpdateEmployeeEvent event,
    Emitter<EmployeeState> emit,
  ) async {
    if (state is EmployeeLoaded) {
      final currentState = state as EmployeeLoaded;
      emit(currentState.copyWith(isLoading: true));

      final result = await _updateEmployee(UpdateEmployeeParams(event.employee));

      result.fold(
        (failure) => emit(currentState.copyWith(
          isLoading: false,
          error: _mapFailureToMessage(failure),
        )),
        (employee) {
          final updatedEmployees = currentState.employees
              .map((e) => e.id == employee.id ? employee : e)
              .toList();
          
          emit(EmployeeLoaded(
            employees: updatedEmployees,
            filteredEmployees: _applyCurrentFilter(updatedEmployees, currentState),
            message: 'Employee ${employee.name} updated successfully',
          ));
        },
      );
    }
  }

  Future<void> _onDeleteEmployee(
    DeleteEmployeeEvent event,
    Emitter<EmployeeState> emit,
  ) async {
    if (state is EmployeeLoaded) {
      final currentState = state as EmployeeLoaded;
      emit(currentState.copyWith(isLoading: true));

      final result = await _deleteEmployee(DeleteEmployeeParams(event.employeeId));

      result.fold(
        (failure) => emit(currentState.copyWith(
          isLoading: false,
          error: _mapFailureToMessage(failure),
        )),
        (_) {
          final updatedEmployees = currentState.employees
              .where((e) => e.id != event.employeeId)
              .toList();
          
          emit(EmployeeLoaded(
            employees: updatedEmployees,
            filteredEmployees: _applyCurrentFilter(updatedEmployees, currentState),
            message: 'Employee deleted successfully',
          ));
        },
      );
    }
  }

  Future<void> _onRefreshEmployees(
    RefreshEmployees event,
    Emitter<EmployeeState> emit,
  ) async {
    // Don't show loading for refresh
    final result = await _getAllEmployees(NoParams());

    result.fold(
      (failure) {
        if (state is EmployeeLoaded) {
          emit((state as EmployeeLoaded).copyWith(
            error: _mapFailureToMessage(failure),
          ));
        } else {
          emit(EmployeeError(_mapFailureToMessage(failure)));
        }
      },
      (employees) => emit(EmployeeLoaded(
        employees: employees,
        filteredEmployees: employees,
        message: 'Employees refreshed',
      )),
    );
  }

  void _onFilterEmployees(
    FilterEmployees event,
    Emitter<EmployeeState> emit,
  ) {
    if (state is EmployeeLoaded) {
      final currentState = state as EmployeeLoaded;
      final filteredEmployees = _filterEmployees(currentState.employees, event.filter);
      
      emit(currentState.copyWith(
        filteredEmployees: filteredEmployees,
        currentFilter: event.filter,
      ));
    }
  }

  void _onSearchEmployees(
    SearchEmployees event,
    Emitter<EmployeeState> emit,
  ) {
    if (state is EmployeeLoaded) {
      final currentState = state as EmployeeLoaded;
      
      if (event.query.isEmpty) {
        // Reset to filtered employees without search
        emit(currentState.copyWith(
          filteredEmployees: _applyCurrentFilter(currentState.employees, currentState),
          searchQuery: '',
        ));
      } else {
        // Apply search to current filtered employees
        final searchResults = currentState.filteredEmployees
            .where((employee) =>
                employee.name.toLowerCase().contains(event.query.toLowerCase()) ||
                employee.id.toLowerCase().contains(event.query.toLowerCase()))
            .toList();
        
        emit(currentState.copyWith(
          filteredEmployees: searchResults,
          searchQuery: event.query,
        ));
      }
    }
  }

  List<Employee> _filterEmployees(List<Employee> employees, EmployeeFilter filter) {
    switch (filter) {
      case EmployeeFilter.all:
        return employees;
      case EmployeeFilter.minors:
        return employees.where((e) => e.isMinor).toList();
      case EmployeeFilter.adults:
        return employees.where((e) => !e.isMinor).toList();
      case EmployeeFilter.available:
        return employees.where((e) => e.isAvailable).toList();
      case EmployeeFilter.assigned:
        return employees.where((e) => e.task != null).toList();
    }
  }

  List<Employee> _applyCurrentFilter(List<Employee> employees, EmployeeLoaded state) {
    final filtered = _filterEmployees(employees, state.currentFilter);
    
    if (state.searchQuery.isNotEmpty) {
      return filtered
          .where((employee) =>
              employee.name.toLowerCase().contains(state.searchQuery.toLowerCase()) ||
              employee.id.toLowerCase().contains(state.searchQuery.toLowerCase()))
          .toList();
    }
    
    return filtered;
  }

  String _mapFailureToMessage(Failure failure) {
    switch (failure.runtimeType) {
      case ServerFailure:
        return 'Server error occurred. Please try again.';
      case CacheFailure:
        return 'Failed to load cached data.';
      case NetworkFailure:
        return 'No internet connection. Please check your network.';
      case ValidationFailure:
        return failure.message ?? 'Validation error occurred.';
      default:
        return 'An unexpected error occurred.';
    }
  }
}
```

### **Employee Events**
```dart
// lib/presentation/bloc/employee/employee_event.dart
part of 'employee_bloc.dart';

abstract class EmployeeEvent extends Equatable {
  const EmployeeEvent();

  @override
  List<Object?> get props => [];
}

class LoadEmployees extends EmployeeEvent {}

class RefreshEmployees extends EmployeeEvent {}

class AddEmployeeEvent extends EmployeeEvent {
  final Employee employee;

  const AddEmployeeEvent(this.employee);

  @override
  List<Object> get props => [employee];
}

class UpdateEmployeeEvent extends EmployeeEvent {
  final Employee employee;

  const UpdateEmployeeEvent(this.employee);

  @override
  List<Object> get props => [employee];
}

class DeleteEmployeeEvent extends EmployeeEvent {
  final String employeeId;

  const DeleteEmployeeEvent(this.employeeId);

  @override
  List<Object> get props => [employeeId];
}

class FilterEmployees extends EmployeeEvent {
  final EmployeeFilter filter;

  const FilterEmployees(this.filter);

  @override
  List<Object> get props => [filter];
}

class SearchEmployees extends EmployeeEvent {
  final String query;

  const SearchEmployees(this.query);

  @override
  List<Object> get props => [query];
}

enum EmployeeFilter {
  all,
  minors,
  adults,
  available,
  assigned,
}
```

### **Employee States**
```dart
// lib/presentation/bloc/employee/employee_state.dart
part of 'employee_bloc.dart';

abstract class EmployeeState extends Equatable {
  const EmployeeState();

  @override
  List<Object?> get props => [];
}

class EmployeeInitial extends EmployeeState {}

class EmployeeLoading extends EmployeeState {}

class EmployeeLoaded extends EmployeeState {
  final List<Employee> employees;
  final List<Employee> filteredEmployees;
  final EmployeeFilter currentFilter;
  final String searchQuery;
  final bool isLoading;
  final String? error;
  final String? message;

  const EmployeeLoaded({
    required this.employees,
    required this.filteredEmployees,
    this.currentFilter = EmployeeFilter.all,
    this.searchQuery = '',
    this.isLoading = false,
    this.error,
    this.message,
  });

  EmployeeLoaded copyWith({
    List<Employee>? employees,
    List<Employee>? filteredEmployees,
    EmployeeFilter? currentFilter,
    String? searchQuery,
    bool? isLoading,
    String? error,
    String? message,
  }) {
    return EmployeeLoaded(
      employees: employees ?? this.employees,
      filteredEmployees: filteredEmployees ?? this.filteredEmployees,
      currentFilter: currentFilter ?? this.currentFilter,
      searchQuery: searchQuery ?? this.searchQuery,
      isLoading: isLoading ?? this.isLoading,
      error: error,
      message: message,
    );
  }

  @override
  List<Object?> get props => [
        employees,
        filteredEmployees,
        currentFilter,
        searchQuery,
        isLoading,
        error,
        message,
      ];
}

class EmployeeError extends EmployeeState {
  final String message;

  const EmployeeError(this.message);

  @override
  List<Object> get props => [message];
}
```

---

**Next Document**: Part 4 - UI Components & Widgets
This will cover the detailed implementation of all UI components, including drag-and-drop widgets, employee cards, station grids, and all visual elements with their animations and interactions.
