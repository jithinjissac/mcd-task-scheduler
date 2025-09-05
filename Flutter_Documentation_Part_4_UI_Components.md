# McDonald's Task Scheduler Flutter Documentation - Part 4: UI Components & Widgets

## 📋 Navigation
← [Part 3: Data Models & State Management](./Flutter_Documentation_Part_3_Data_Models.md) | [Part 5: Screens & Navigation](./Flutter_Documentation_Part_5_Screens_Navigation.md) →

---

## 🎨 UI Components & Widgets

### **Component Architecture Overview**

The UI layer follows a hierarchical component structure with reusable widgets that maintain consistency across the application while providing platform-specific optimizations.

```
┌─────────────────────────────────────────────────────────┐
│                    App Widget                          │
└─────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│                 Screen Widgets                         │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────┐   │
│  │    Home     │ │  Schedule   │ │   Settings      │   │
│  │   Screen    │ │   Screen    │ │    Screen       │   │
│  └─────────────┘ └─────────────┘ └─────────────────┘   │
└─────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│               Container Widgets                        │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────┐   │
│  │ Employee    │ │  Station    │ │  Assignment     │   │
│  │    Pool     │ │    Grid     │ │     Panel       │   │
│  └─────────────┘ └─────────────┘ └─────────────────┘   │
└─────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│                Atomic Widgets                          │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────┐   │
│  │ Employee    │ │  Station    │ │    Common       │   │
│  │   Card      │ │   Widget    │ │   Components    │   │
│  └─────────────┘ └─────────────┘ └─────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

## 🎯 Core UI Components

### **Employee Card Widget**
```dart
// lib/presentation/widgets/employee/employee_card.dart
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

import '../../../domain/entities/employee.dart';
import '../../theme/app_theme.dart';
import '../common/draggable_widget.dart';
import '../common/minor_indicator.dart';
import '../common/status_indicator.dart';

class EmployeeCard extends StatefulWidget {
  final Employee employee;
  final bool isDraggable;
  final bool isSelected;
  final bool showDetails;
  final VoidCallback? onTap;
  final VoidCallback? onLongPress;
  final Function(Employee)? onDragStarted;
  final Function(Employee)? onDragCompleted;
  final Function(Employee)? onDragCancelled;
  final double? width;
  final double? height;
  final EdgeInsets? margin;
  final BoxConstraints? constraints;

  const EmployeeCard({
    Key? key,
    required this.employee,
    this.isDraggable = true,
    this.isSelected = false,
    this.showDetails = true,
    this.onTap,
    this.onLongPress,
    this.onDragStarted,
    this.onDragCompleted,
    this.onDragCancelled,
    this.width,
    this.height,
    this.margin,
    this.constraints,
  }) : super(key: key);

  @override
  State<EmployeeCard> createState() => _EmployeeCardState();
}

class _EmployeeCardState extends State<EmployeeCard>
    with TickerProviderStateMixin {
  late AnimationController _scaleController;
  late AnimationController _glowController;
  late Animation<double> _scaleAnimation;
  late Animation<double> _glowAnimation;
  
  bool _isDragging = false;
  bool _isHovered = false;

  @override
  void initState() {
    super.initState();
    _initializeAnimations();
  }

  void _initializeAnimations() {
    _scaleController = AnimationController(
      duration: const Duration(milliseconds: 150),
      vsync: this,
    );
    
    _glowController = AnimationController(
      duration: const Duration(milliseconds: 300),
      vsync: this,
    );

    _scaleAnimation = Tween<double>(
      begin: 1.0,
      end: 1.05,
    ).animate(CurvedAnimation(
      parent: _scaleController,
      curve: Curves.easeInOut,
    ));

    _glowAnimation = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _glowController,
      curve: Curves.easeInOut,
    ));
  }

  @override
  void dispose() {
    _scaleController.dispose();
    _glowController.dispose();
    super.dispose();
  }

  void _handleDragStart() {
    setState(() => _isDragging = true);
    _scaleController.forward();
    _glowController.forward();
    
    // Haptic feedback
    HapticFeedback.mediumImpact();
    
    widget.onDragStarted?.call(widget.employee);
  }

  void _handleDragEnd() {
    setState(() => _isDragging = false);
    _scaleController.reverse();
    _glowController.reverse();
    
    widget.onDragCompleted?.call(widget.employee);
  }

  void _handleDragCancelled() {
    setState(() => _isDragging = false);
    _scaleController.reverse();
    _glowController.reverse();
    
    widget.onDragCancelled?.call(widget.employee);
  }

  void _handleTap() {
    HapticFeedback.lightImpact();
    widget.onTap?.call();
  }

  void _handleLongPress() {
    HapticFeedback.heavyImpact();
    widget.onLongPress?.call();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    Widget cardContent = _buildCardContent(theme);
    
    if (widget.isDraggable) {
      cardContent = _buildDraggableCard(cardContent);
    }
    
    return AnimatedBuilder(
      animation: Listenable.merge([_scaleAnimation, _glowAnimation]),
      builder: (context, child) => Transform.scale(
        scale: _scaleAnimation.value,
        child: Container(
          width: widget.width,
          height: widget.height,
          margin: widget.margin ?? EdgeInsets.all(4.w),
          constraints: widget.constraints,
          decoration: _buildCardDecoration(theme),
          child: cardContent,
        ),
      ),
    );
  }

  Widget _buildDraggableCard(Widget child) {
    return LongPressDraggable<Employee>(
      data: widget.employee,
      delay: const Duration(milliseconds: 500),
      hapticFeedbackOnStart: false, // We handle this manually
      dragAnchorStrategy: pointerDragAnchorStrategy,
      onDragStarted: _handleDragStart,
      onDragEnd: (_) => _handleDragEnd(),
      onDraggableCanceled: (_, __) => _handleDragCancelled(),
      feedback: _buildDragFeedback(),
      childWhenDragging: _buildChildWhenDragging(),
      child: GestureDetector(
        onTap: _handleTap,
        onLongPress: _handleLongPress,
        child: MouseRegion(
          onEnter: (_) => setState(() => _isHovered = true),
          onExit: (_) => setState(() => _isHovered = false),
          child: child,
        ),
      ),
    );
  }

  Widget _buildCardContent(ThemeData theme) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(12.r),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(12.r),
          onTap: widget.isDraggable ? null : _handleTap,
          child: Padding(
            padding: EdgeInsets.all(12.w),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildHeader(),
                if (widget.showDetails) ...[
                  SizedBox(height: 8.h),
                  _buildDetails(),
                ],
                SizedBox(height: 8.h),
                _buildFooter(),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Row(
      children: [
        _buildAvatar(),
        SizedBox(width: 12.w),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildNameRow(),
              SizedBox(height: 4.h),
              _buildShiftTime(),
            ],
          ),
        ),
        _buildStatusIndicators(),
      ],
    );
  }

  Widget _buildAvatar() {
    return Container(
      width: 40.w,
      height: 40.w,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: AppColors.surface,
        border: Border.all(
          color: widget.employee.isMinor 
              ? AppColors.warning 
              : AppColors.primary.withOpacity(0.3),
          width: 2.w,
        ),
      ),
      child: widget.employee.photoUrl != null
          ? CachedNetworkImage(
              imageUrl: widget.employee.photoUrl!,
              imageBuilder: (context, imageProvider) => Container(
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  image: DecorationImage(
                    image: imageProvider,
                    fit: BoxFit.cover,
                  ),
                ),
              ),
              placeholder: (context, url) => _buildAvatarPlaceholder(),
              errorWidget: (context, url, error) => _buildAvatarPlaceholder(),
            )
          : _buildAvatarPlaceholder(),
    );
  }

  Widget _buildAvatarPlaceholder() {
    return Icon(
      Icons.person,
      size: 24.sp,
      color: AppColors.onSurface.withOpacity(0.6),
    );
  }

  Widget _buildNameRow() {
    return Row(
      children: [
        Expanded(
          child: Text(
            widget.employee.name,
            style: AppTextStyles.bodyMedium.copyWith(
              fontWeight: FontWeight.w600,
              color: AppColors.onSurface,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ),
        if (widget.employee.isMinor) ...[
          SizedBox(width: 4.w),
          MinorIndicator(size: 16.sp),
        ],
      ],
    );
  }

  Widget _buildShiftTime() {
    return Text(
      '${widget.employee.shiftStart} - ${widget.employee.shiftEnd}',
      style: AppTextStyles.bodySmall.copyWith(
        color: AppColors.onSurface.withOpacity(0.7),
      ),
    );
  }

  Widget _buildStatusIndicators() {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        StatusIndicator(
          status: widget.employee.status,
          size: 8.sp,
        ),
        if (widget.employee.task != null) ...[
          SizedBox(height: 4.h),
          Icon(
            Icons.work,
            size: 12.sp,
            color: AppColors.primary,
          ),
        ],
      ],
    );
  }

  Widget _buildDetails() {
    if (!widget.showDetails) return const SizedBox.shrink();
    
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (widget.employee.task != null)
          _buildCurrentTask(),
        if (widget.employee.certifications.isNotEmpty)
          _buildCertifications(),
      ],
    );
  }

  Widget _buildCurrentTask() {
    return Container(
      padding: EdgeInsets.symmetric(horizontal: 8.w, vertical: 4.h),
      decoration: BoxDecoration(
        color: AppColors.primary.withOpacity(0.1),
        borderRadius: BorderRadius.circular(6.r),
        border: Border.all(
          color: AppColors.primary.withOpacity(0.3),
          width: 1.w,
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            Icons.work,
            size: 12.sp,
            color: AppColors.primary,
          ),
          SizedBox(width: 4.w),
          Flexible(
            child: Text(
              widget.employee.task!,
              style: AppTextStyles.bodySmall.copyWith(
                color: AppColors.primary,
                fontWeight: FontWeight.w500,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCertifications() {
    return Wrap(
      spacing: 4.w,
      runSpacing: 2.h,
      children: widget.employee.certifications.take(3).map((cert) {
        return Container(
          padding: EdgeInsets.symmetric(horizontal: 6.w, vertical: 2.h),
          decoration: BoxDecoration(
            color: AppColors.secondary.withOpacity(0.1),
            borderRadius: BorderRadius.circular(4.r),
          ),
          child: Text(
            cert,
            style: AppTextStyles.caption.copyWith(
              color: AppColors.secondary,
              fontSize: 10.sp,
            ),
          ),
        );
      }).toList(),
    );
  }

  Widget _buildFooter() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        _buildShiftDuration(),
        if (widget.employee.requiresSupervision(''))
          Icon(
            Icons.supervisor_account,
            size: 16.sp,
            color: AppColors.warning,
          ),
      ],
    );
  }

  Widget _buildShiftDuration() {
    final duration = widget.employee.shiftDuration;
    final hours = duration.inHours;
    final minutes = duration.inMinutes % 60;
    
    return Text(
      '${hours}h ${minutes}m',
      style: AppTextStyles.caption.copyWith(
        color: AppColors.onSurface.withOpacity(0.6),
      ),
    );
  }

  BoxDecoration _buildCardDecoration(ThemeData theme) {
    return BoxDecoration(
      color: _getCardBackgroundColor(),
      borderRadius: BorderRadius.circular(12.r),
      border: Border.all(
        color: _getBorderColor(),
        width: _getBorderWidth(),
      ),
      boxShadow: _getBoxShadow(),
    );
  }

  Color _getCardBackgroundColor() {
    if (widget.employee.isMinor) {
      return AppColors.warning.withOpacity(0.1);
    }
    
    if (widget.isSelected) {
      return AppColors.primary.withOpacity(0.1);
    }
    
    if (_isDragging) {
      return AppColors.surface.withOpacity(0.9);
    }
    
    return AppColors.surface;
  }

  Color _getBorderColor() {
    if (_isDragging) {
      return AppColors.primary.withOpacity(0.8);
    }
    
    if (widget.isSelected) {
      return AppColors.primary;
    }
    
    if (widget.employee.isMinor) {
      return AppColors.warning.withOpacity(0.6);
    }
    
    if (_isHovered) {
      return AppColors.primary.withOpacity(0.4);
    }
    
    return AppColors.outline.withOpacity(0.3);
  }

  double _getBorderWidth() {
    if (_isDragging || widget.isSelected) {
      return 2.w;
    }
    
    return 1.w;
  }

  List<BoxShadow> _getBoxShadow() {
    if (_isDragging) {
      return [
        BoxShadow(
          color: AppColors.primary.withOpacity(0.3 * _glowAnimation.value),
          blurRadius: 12.r * _glowAnimation.value,
          spreadRadius: 2.r * _glowAnimation.value,
        ),
        BoxShadow(
          color: Colors.black.withOpacity(0.1),
          blurRadius: 8.r,
          offset: Offset(0, 4.h),
        ),
      ];
    }
    
    if (_isHovered || widget.isSelected) {
      return [
        BoxShadow(
          color: Colors.black.withOpacity(0.08),
          blurRadius: 6.r,
          offset: Offset(0, 2.h),
        ),
      ];
    }
    
    return [
      BoxShadow(
        color: Colors.black.withOpacity(0.04),
        blurRadius: 4.r,
        offset: Offset(0, 2.h),
      ),
    ];
  }

  Widget _buildDragFeedback() {
    return Material(
      elevation: 8,
      borderRadius: BorderRadius.circular(12.r),
      child: Transform.scale(
        scale: 1.1,
        child: Container(
          width: (widget.width ?? 200.w) * 1.1,
          height: (widget.height ?? 120.h) * 1.1,
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(12.r),
            border: Border.all(
              color: AppColors.primary,
              width: 2.w,
            ),
            boxShadow: [
              BoxShadow(
                color: AppColors.primary.withOpacity(0.3),
                blurRadius: 16.r,
                spreadRadius: 4.r,
              ),
            ],
          ),
          child: Opacity(
            opacity: 0.9,
            child: _buildCardContent(Theme.of(context)),
          ),
        ),
      ),
    );
  }

  Widget _buildChildWhenDragging() {
    return Opacity(
      opacity: 0.5,
      child: _buildCardContent(Theme.of(context)),
    );
  }
}
```

### **Station Widget**
```dart
// lib/presentation/widgets/station/station_widget.dart
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

import '../../../domain/entities/station.dart';
import '../../../domain/entities/employee.dart';
import '../../../domain/entities/assignment.dart';
import '../../theme/app_theme.dart';
import '../common/drop_zone.dart';
import '../employee/employee_card.dart';
import 'station_header.dart';
import 'task_column.dart';

class StationWidget extends StatefulWidget {
  final Station station;
  final List<Assignment> assignments;
  final List<Employee> employees;
  final Function(Employee, Station, String?)? onEmployeeDropped;
  final Function(Assignment)? onAssignmentRemoved;
  final bool isActive;
  final bool showCapacityIndicator;
  final VoidCallback? onTap;

  const StationWidget({
    Key? key,
    required this.station,
    required this.assignments,
    required this.employees,
    this.onEmployeeDropped,
    this.onAssignmentRemoved,
    this.isActive = true,
    this.showCapacityIndicator = true,
    this.onTap,
  }) : super(key: key);

  @override
  State<StationWidget> createState() => _StationWidgetState();
}

class _StationWidgetState extends State<StationWidget>
    with TickerProviderStateMixin {
  late AnimationController _pulseController;
  late AnimationController _scaleController;
  late Animation<double> _pulseAnimation;
  late Animation<double> _scaleAnimation;
  
  bool _isHovering = false;
  bool _isDragOver = false;

  @override
  void initState() {
    super.initState();
    _initializeAnimations();
  }

  void _initializeAnimations() {
    _pulseController = AnimationController(
      duration: const Duration(milliseconds: 1000),
      vsync: this,
    );
    
    _scaleController = AnimationController(
      duration: const Duration(milliseconds: 200),
      vsync: this,
    );

    _pulseAnimation = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _pulseController,
      curve: Curves.easeInOut,
    ));

    _scaleAnimation = Tween<double>(
      begin: 1.0,
      end: 1.02,
    ).animate(CurvedAnimation(
      parent: _scaleController,
      curve: Curves.easeInOut,
    ));
  }

  @override
  void dispose() {
    _pulseController.dispose();
    _scaleController.dispose();
    super.dispose();
  }

  void _handleDragEnter() {
    setState(() => _isDragOver = true);
    _pulseController.repeat(reverse: true);
    _scaleController.forward();
  }

  void _handleDragLeave() {
    setState(() => _isDragOver = false);
    _pulseController.stop();
    _scaleController.reverse();
  }

  void _handleDrop(Employee employee, String? columnId) {
    setState(() => _isDragOver = false);
    _pulseController.stop();
    _scaleController.reverse();
    
    HapticFeedback.mediumImpact();
    widget.onEmployeeDropped?.call(employee, widget.station, columnId);
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: Listenable.merge([_pulseAnimation, _scaleAnimation]),
      builder: (context, child) => Transform.scale(
        scale: _scaleAnimation.value,
        child: Container(
          decoration: _buildStationDecoration(),
          child: DropZone<Employee>(
            onDragEnter: _handleDragEnter,
            onDragLeave: _handleDragLeave,
            onAccept: (employee) => _handleDrop(employee, null),
            canAccept: (employee) => widget.station.canAcceptEmployee(employee),
            child: MouseRegion(
              onEnter: (_) => setState(() => _isHovering = true),
              onExit: (_) => setState(() => _isHovering = false),
              child: GestureDetector(
                onTap: widget.onTap,
                child: _buildStationContent(),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildStationContent() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        StationHeader(
          station: widget.station,
          assignmentCount: widget.assignments.length,
          showCapacityIndicator: widget.showCapacityIndicator,
        ),
        Expanded(
          child: _buildStationBody(),
        ),
      ],
    );
  }

  Widget _buildStationBody() {
    if (widget.station.id == 'dfs') {
      return _buildDFSContent();
    }
    
    if (widget.station.columns.isNotEmpty) {
      return _buildColumnLayout();
    }
    
    return _buildSimpleLayout();
  }

  Widget _buildColumnLayout() {
    return Row(
      children: widget.station.columns.map((column) {
        final columnAssignments = widget.assignments
            .where((a) => a.columnId == column.id)
            .toList();
        
        return Expanded(
          child: TaskColumn(
            column: column,
            station: widget.station,
            assignments: columnAssignments,
            employees: _getEmployeesForAssignments(columnAssignments),
            onEmployeeDropped: (employee) => _handleDrop(employee, column.id),
            onAssignmentRemoved: widget.onAssignmentRemoved,
          ),
        );
      }).toList(),
    );
  }

  Widget _buildSimpleLayout() {
    final assignedEmployees = _getEmployeesForAssignments(widget.assignments);
    
    return Padding(
      padding: EdgeInsets.all(12.w),
      child: assignedEmployees.isEmpty
          ? _buildEmptyState()
          : _buildEmployeeList(assignedEmployees),
    );
  }

  Widget _buildEmployeeList(List<Employee> employees) {
    return ListView.builder(
      itemCount: employees.length,
      itemBuilder: (context, index) {
        final employee = employees[index];
        final assignment = widget.assignments.firstWhere(
          (a) => a.employeeId == employee.id,
        );
        
        return Padding(
          padding: EdgeInsets.only(bottom: 8.h),
          child: _buildAssignedEmployeeCard(employee, assignment),
        );
      },
    );
  }

  Widget _buildAssignedEmployeeCard(Employee employee, Assignment assignment) {
    return Container(
      padding: EdgeInsets.all(8.w),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(8.r),
        border: Border.all(
          color: AppColors.primary.withOpacity(0.3),
          width: 1.w,
        ),
      ),
      child: Row(
        children: [
          Expanded(
            child: EmployeeCard(
              employee: employee,
              isDraggable: false,
              showDetails: false,
              height: 60.h,
            ),
          ),
          IconButton(
            onPressed: () => widget.onAssignmentRemoved?.call(assignment),
            icon: Icon(
              Icons.close,
              size: 16.sp,
              color: AppColors.error,
            ),
            constraints: BoxConstraints.tightFor(width: 32.w, height: 32.h),
            padding: EdgeInsets.zero,
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            _getStationIcon(),
            size: 32.sp,
            color: AppColors.onSurface.withOpacity(0.3),
          ),
          SizedBox(height: 8.h),
          Text(
            'Drop employees here',
            style: AppTextStyles.bodySmall.copyWith(
              color: AppColors.onSurface.withOpacity(0.5),
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildDFSContent() {
    return Container(
      padding: EdgeInsets.all(12.w),
      child: Column(
        children: [
          Container(
            padding: EdgeInsets.all(8.w),
            decoration: BoxDecoration(
              color: AppColors.error.withOpacity(0.1),
              borderRadius: BorderRadius.circular(8.r),
              border: Border.all(
                color: AppColors.error.withOpacity(0.3),
                width: 1.w,
              ),
            ),
            child: Row(
              children: [
                Icon(
                  Icons.info_outline,
                  color: AppColors.error,
                  size: 16.sp,
                ),
                SizedBox(width: 8.w),
                Expanded(
                  child: Text(
                    'Information Only - No Employee Assignment',
                    style: AppTextStyles.bodySmall.copyWith(
                      color: AppColors.error,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
              ],
            ),
          ),
          SizedBox(height: 12.h),
          Expanded(
            child: _buildDFSSchedule(),
          ),
        ],
      ),
    );
  }

  Widget _buildDFSSchedule() {
    final dfsSchedule = _getDFSSchedule();
    final today = DateTime.now().weekday;
    
    return ListView.builder(
      itemCount: dfsSchedule.length,
      itemBuilder: (context, index) {
        final entry = dfsSchedule.entries.elementAt(index);
        final isToday = _getDayNumber(entry.key) == today;
        
        return Container(
          margin: EdgeInsets.only(bottom: 8.h),
          padding: EdgeInsets.all(8.w),
          decoration: BoxDecoration(
            color: isToday 
                ? AppColors.primary.withOpacity(0.1)
                : AppColors.surface.withOpacity(0.5),
            borderRadius: BorderRadius.circular(6.r),
            border: isToday
                ? Border.all(color: AppColors.primary, width: 1.w)
                : null,
          ),
          child: Row(
            children: [
              Container(
                width: 8.w,
                height: 8.w,
                decoration: BoxDecoration(
                  color: isToday ? AppColors.primary : AppColors.outline,
                  shape: BoxShape.circle,
                ),
              ),
              SizedBox(width: 12.w),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      entry.key,
                      style: AppTextStyles.bodySmall.copyWith(
                        fontWeight: isToday ? FontWeight.w600 : FontWeight.w400,
                        color: isToday 
                            ? AppColors.primary 
                            : AppColors.onSurface,
                      ),
                    ),
                    SizedBox(height: 2.h),
                    Text(
                      entry.value,
                      style: AppTextStyles.caption.copyWith(
                        color: AppColors.onSurface.withOpacity(0.7),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Map<String, String> _getDFSSchedule() {
    return {
      'Monday': 'Milk and hot chocolate discard',
      'Tuesday': 'Shakes, sundae and topping discard',
      'Wednesday': 'Oil drop temperatures recorded',
      'Thursday': 'Equipment maintenance check',
      'Friday': 'Muffin, Toaster calibration',
      'Saturday': 'Deep cleaning protocols',
      'Sunday': 'Egg cookers calibrations',
    };
  }

  int _getDayNumber(String dayName) {
    switch (dayName) {
      case 'Monday': return 1;
      case 'Tuesday': return 2;
      case 'Wednesday': return 3;
      case 'Thursday': return 4;
      case 'Friday': return 5;
      case 'Saturday': return 6;
      case 'Sunday': return 7;
      default: return 0;
    }
  }

  List<Employee> _getEmployeesForAssignments(List<Assignment> assignments) {
    return assignments
        .map((assignment) => widget.employees.firstWhere(
              (employee) => employee.id == assignment.employeeId,
              orElse: () => Employee(
                id: assignment.employeeId,
                name: 'Unknown Employee',
                shiftStart: '00:00',
                shiftEnd: '00:00',
                isMinor: false,
                createdAt: DateTime.now(),
                updatedAt: DateTime.now(),
              ),
            ))
        .toList();
  }

  BoxDecoration _buildStationDecoration() {
    return BoxDecoration(
      color: _getStationBackgroundColor(),
      borderRadius: BorderRadius.circular(16.r),
      border: Border.all(
        color: _getStationBorderColor(),
        width: _getStationBorderWidth(),
      ),
      boxShadow: _getStationBoxShadow(),
    );
  }

  Color _getStationBackgroundColor() {
    if (!widget.isActive) {
      return AppColors.surface.withOpacity(0.5);
    }
    
    if (_isDragOver) {
      return AppColors.primary.withOpacity(0.1);
    }
    
    switch (widget.station.capacityStatus) {
      case CapacityStatus.full:
        return AppColors.error.withOpacity(0.05);
      case CapacityStatus.high:
        return AppColors.warning.withOpacity(0.05);
      case CapacityStatus.medium:
        return AppColors.info.withOpacity(0.05);
      case CapacityStatus.low:
        return AppColors.surface;
    }
  }

  Color _getStationBorderColor() {
    if (!widget.isActive) {
      return AppColors.outline.withOpacity(0.3);
    }
    
    if (_isDragOver) {
      return AppColors.primary.withOpacity(0.8);
    }
    
    if (_isHovering) {
      return AppColors.primary.withOpacity(0.4);
    }
    
    switch (widget.station.capacityStatus) {
      case CapacityStatus.full:
        return AppColors.error.withOpacity(0.6);
      case CapacityStatus.high:
        return AppColors.warning.withOpacity(0.6);
      case CapacityStatus.medium:
        return AppColors.info.withOpacity(0.6);
      case CapacityStatus.low:
        return AppColors.outline.withOpacity(0.3);
    }
  }

  double _getStationBorderWidth() {
    if (_isDragOver) {
      return 2.w;
    }
    
    return 1.w;
  }

  List<BoxShadow> _getStationBoxShadow() {
    if (_isDragOver) {
      return [
        BoxShadow(
          color: AppColors.primary.withOpacity(0.3 * _pulseAnimation.value),
          blurRadius: 16.r * _pulseAnimation.value,
          spreadRadius: 4.r * _pulseAnimation.value,
        ),
        BoxShadow(
          color: Colors.black.withOpacity(0.1),
          blurRadius: 8.r,
          offset: Offset(0, 4.h),
        ),
      ];
    }
    
    if (_isHovering) {
      return [
        BoxShadow(
          color: Colors.black.withOpacity(0.08),
          blurRadius: 8.r,
          offset: Offset(0, 2.h),
        ),
      ];
    }
    
    return [
      BoxShadow(
        color: Colors.black.withOpacity(0.04),
        blurRadius: 4.r,
        offset: Offset(0, 2.h),
      ),
    ];
  }

  IconData _getStationIcon() {
    switch (widget.station.category.toLowerCase()) {
      case 'kitchen':
        return Icons.restaurant_menu;
      case 'service':
        return Icons.room_service;
      case 'drive_thru':
        return Icons.drive_eta;
      case 'cleaning':
        return Icons.cleaning_services;
      case 'management':
        return Icons.supervisor_account;
      default:
        return Icons.work;
    }
  }
}
```

### **Drag and Drop System**
```dart
// lib/presentation/widgets/common/drop_zone.dart
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

import '../../theme/app_theme.dart';

class DropZone<T> extends StatefulWidget {
  final Widget child;
  final bool Function(T data)? canAccept;
  final void Function(T data)? onAccept;
  final VoidCallback? onDragEnter;
  final VoidCallback? onDragLeave;
  final bool showVisualFeedback;
  final Color? acceptColor;
  final Color? rejectColor;

  const DropZone({
    Key? key,
    required this.child,
    this.canAccept,
    this.onAccept,
    this.onDragEnter,
    this.onDragLeave,
    this.showVisualFeedback = true,
    this.acceptColor,
    this.rejectColor,
  }) : super(key: key);

  @override
  State<DropZone<T>> createState() => _DropZoneState<T>();
}

class _DropZoneState<T> extends State<DropZone<T>> {
  bool _isDragOver = false;
  bool _canAcceptCurrentDrag = false;

  @override
  Widget build(BuildContext context) {
    return DragTarget<T>(
      onWillAccept: (data) {
        if (data == null) return false;
        
        final canAccept = widget.canAccept?.call(data) ?? true;
        setState(() {
          _isDragOver = true;
          _canAcceptCurrentDrag = canAccept;
        });
        
        widget.onDragEnter?.call();
        return canAccept;
      },
      onAccept: (data) {
        setState(() {
          _isDragOver = false;
          _canAcceptCurrentDrag = false;
        });
        
        widget.onAccept?.call(data);
      },
      onLeave: (data) {
        setState(() {
          _isDragOver = false;
          _canAcceptCurrentDrag = false;
        });
        
        widget.onDragLeave?.call();
      },
      builder: (context, candidateData, rejectedData) {
        return AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          curve: Curves.easeInOut,
          decoration: widget.showVisualFeedback 
              ? _buildDropZoneDecoration() 
              : null,
          child: widget.child,
        );
      },
    );
  }

  BoxDecoration? _buildDropZoneDecoration() {
    if (!_isDragOver) return null;
    
    final color = _canAcceptCurrentDrag
        ? (widget.acceptColor ?? AppColors.success)
        : (widget.rejectColor ?? AppColors.error);
    
    return BoxDecoration(
      border: Border.all(
        color: color.withOpacity(0.8),
        width: 2.w,
      ),
      borderRadius: BorderRadius.circular(8.r),
      color: color.withOpacity(0.1),
    );
  }
}
```

---

**Next Document**: Part 5 - Screens & Navigation
This will cover the detailed implementation of all screens including the main schedule screen, employee management, settings, and the navigation system with responsive layouts for different screen sizes.
