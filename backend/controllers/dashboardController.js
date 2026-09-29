const dbHelper = require('../utils/dbHelper');
const IntervalScheduler = require('../algorithms/IntervalScheduler');

exports.getStats = async (req, res, next) => {
  try {
    const patients = await dbHelper.getPatients();
    const beds = await dbHelper.getBeds();
    const ors = await dbHelper.getORs();
    const staff = await dbHelper.getStaff();
    const surgeries = await dbHelper.getSurgeries();
    const auditLogs = await dbHelper.getAuditLogs();
    const notifications = await dbHelper.getNotifications();

    // Stats calculations
    const totalPatients = patients.length;
    const admittedPatients = patients.filter(p => p.status === 'ADMITTED' || p.status === 'SCHEDULED' || p.status === 'IN SURGERY').length;
    const emergencyCases = patients.filter(p => p.priority === 1 && p.status !== 'DISCHARGED').length;

    const availableBeds = beds.filter(b => b.status === 'AVAILABLE').length;
    const occupiedBeds = beds.filter(b => b.status === 'OCCUPIED').length;
    const totalBeds = beds.length;

    const totalORs = ors.length;
    const availableORs = ors.filter(o => o.status === 'AVAILABLE').length;

    const scheduledSurgeries = surgeries.filter(s => s.status === 'SCHEDULED' || s.status === 'IN_PROGRESS').length;
    const availableStaff = staff.filter(s => s.status === 'AVAILABLE').length;

    // Calculate active conflicts count
    let conflictCount = 0;
    for (let i = 0; i < surgeries.length; i++) {
      for (let j = i + 1; j < surgeries.length; j++) {
        if (surgeries[i].status === 'CANCELLED' || surgeries[j].status === 'CANCELLED') continue;
        const overlap = IntervalScheduler.doIntervalsOverlap(
          surgeries[i].startTime, surgeries[i].endTime,
          surgeries[j].startTime, surgeries[j].endTime
        );
        if (overlap && (surgeries[i].orId === surgeries[j].orId || surgeries[i].doctorId === surgeries[j].doctorId)) {
          conflictCount++;
        }
      }
    }

    // Chart Data 1: Bed Occupancy by Ward
    const bedOccupancyByWard = ['ICU', 'EMERGENCY', 'GENERAL', 'PRIVATE'].map(ward => {
      const wardBeds = beds.filter(b => b.ward === ward);
      return {
        ward,
        occupied: wardBeds.filter(b => b.status === 'OCCUPIED').length,
        available: wardBeds.filter(b => b.status === 'AVAILABLE').length,
        maintenance: wardBeds.filter(b => b.status === 'MAINTENANCE').length,
        reserved: wardBeds.filter(b => b.status === 'RESERVED').length,
        total: wardBeds.length
      };
    });

    // Chart Data 2: OR Utilization Rate
    const orUtilization = ors.map(room => {
      const roomSurgeries = surgeries.filter(s => s.orId === room.orId && s.status !== 'CANCELLED');
      const totalHours = roomSurgeries.reduce((acc, s) => acc + (s.duration || 60) / 60, 0);
      return {
        orId: room.orId,
        name: room.name,
        status: room.status,
        scheduledHours: Number(totalHours.toFixed(1)),
        surgeriesCount: roomSurgeries.length
      };
    });

    // Chart Data 3: Patient Priority Distribution
    const patientPriorityDistribution = [
      { name: 'Emergency', priority: 1, count: patients.filter(p => p.priority === 1).length, color: '#ef4444' },
      { name: 'High', priority: 2, count: patients.filter(p => p.priority === 2).length, color: '#f97316' },
      { name: 'Medium', priority: 3, count: patients.filter(p => p.priority === 3).length, color: '#eab308' },
      { name: 'Normal', priority: 4, count: patients.filter(p => p.priority === 4).length, color: '#06b6d4' }
    ];

    // Chart Data 4: Staff Availability by Role
    const staffRoles = ['Surgeon', 'Doctor', 'Nurse', 'Technician', 'Anesthetist'];
    const staffAvailability = staffRoles.map(role => ({
      role,
      available: staff.filter(s => s.role === role && s.status === 'AVAILABLE').length,
      busy: staff.filter(s => s.role === role && s.status === 'BUSY').length,
      offDuty: staff.filter(s => s.role === role && s.status === 'OFF-DUTY').length
    }));

    // Dashboard Sections
    const today = new Date().toDateString();
    const todaysSchedule = surgeries.filter(s => new Date(s.startTime).toDateString() === today);
    const emergencyList = patients.filter(p => p.priority === 1 && p.status !== 'DISCHARGED');
    const recentPatients = patients.slice(0, 5);
    const recentActivity = auditLogs.slice(0, 8);

    res.json({
      success: true,
      stats: {
        totalPatients,
        admittedPatients,
        availableBeds,
        occupiedBeds,
        totalBeds,
        totalORs,
        availableORs,
        scheduledSurgeries,
        emergencyCases,
        availableStaff,
        schedulingConflicts: conflictCount
      },
      charts: {
        bedOccupancyByWard,
        orUtilization,
        patientPriorityDistribution,
        staffAvailability
      },
      sections: {
        todaysSchedule,
        upcomingSurgeries: surgeries.filter(s => new Date(s.startTime) > new Date()).slice(0, 5),
        emergencyCases: emergencyList,
        recentPatients,
        recentActivity,
        notifications: notifications.slice(0, 5)
      }
    });
  } catch (err) {
    next(err);
  }
};
