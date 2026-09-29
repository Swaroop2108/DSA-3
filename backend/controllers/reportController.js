const dbHelper = require('../utils/dbHelper');

exports.getReports = async (req, res, next) => {
  try {
    const { timeframe = 'week' } = req.query; // 'today', 'week', 'month'

    const patients = await dbHelper.getPatients();
    const beds = await dbHelper.getBeds();
    const ors = await dbHelper.getORs();
    const staff = await dbHelper.getStaff();
    const surgeries = await dbHelper.getSurgeries();

    const now = new Date();
    let startDate = new Date();

    if (timeframe === 'today') {
      startDate.setHours(0, 0, 0, 0);
    } else if (timeframe === 'week') {
      startDate.setDate(now.getDate() - 7);
    } else if (timeframe === 'month') {
      startDate.setMonth(now.getMonth() - 1);
    }

    const filteredPatients = patients.filter(p => new Date(p.admissionDate || p.createdAt || now) >= startDate);
    const filteredSurgeries = surgeries.filter(s => new Date(s.startTime) >= startDate);

    const totalAdmissions = filteredPatients.length;
    const emergencySurgeries = filteredSurgeries.filter(s => s.priority === 1).length;

    const occupiedBedsCount = beds.filter(b => b.status === 'OCCUPIED').length;
    const bedUtilizationRate = Number(((occupiedBedsCount / (beds.length || 1)) * 100).toFixed(1));

    const occupiedORsCount = ors.filter(o => o.status === 'OCCUPIED').length;
    const orUtilizationRate = Number(((occupiedORsCount / (ors.length || 1)) * 100).toFixed(1));

    const totalSurgeryMinutes = filteredSurgeries.reduce((acc, s) => acc + (s.duration || 60), 0);
    const avgSurgeryDuration = filteredSurgeries.length > 0 ? Math.round(totalSurgeryMinutes / filteredSurgeries.length) : 0;

    const availableStaffCount = staff.filter(s => s.status === 'AVAILABLE').length;
    const staffUtilizationRate = Number((((staff.length - availableStaffCount) / (staff.length || 1)) * 100).toFixed(1));

    res.json({
      success: true,
      timeframe,
      report: {
        totalAdmissions,
        totalSurgeries: filteredSurgeries.length,
        emergencySurgeries,
        bedUtilizationRate,
        orUtilizationRate,
        avgSurgeryDuration,
        staffUtilizationRate,
        beds: {
          total: beds.length,
          occupied: occupiedBedsCount,
          available: beds.filter(b => b.status === 'AVAILABLE').length,
          maintenance: beds.filter(b => b.status === 'MAINTENANCE').length
        },
        ors: {
          total: ors.length,
          available: ors.filter(o => o.status === 'AVAILABLE').length,
          occupied: occupiedORsCount,
          maintenance: ors.filter(o => o.status === 'MAINTENANCE').length
        }
      }
    });
  } catch (err) {
    next(err);
  }
};
