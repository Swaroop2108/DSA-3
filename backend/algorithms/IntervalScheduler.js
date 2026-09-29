const MinHeap = require('./MinHeap');

/**
 * Interval Scheduling & Conflict Detection Engine
 * Uses Greedy selection and Interval Overlap validation:
 * Overlap condition: max(startA, startB) < min(endA, endB)
 */
class IntervalScheduler {

  static doIntervalsOverlap(startA, endA, startB, endB) {
    const sA = new Date(startA).getTime();
    const eA = new Date(endA).getTime();
    const sB = new Date(startB).getTime();
    const eB = new Date(endB).getTime();

    return Math.max(sA, sB) < Math.min(eA, eB);
  }

  /**
   * Validate potential conflicts for a given start and end time
   */
  static checkConflicts({ startTime, endTime, orId, doctorId, existingSurgeries, operatingRooms, staffList, excludeSurgeryId = null }) {
    const conflicts = [];
    const targetStart = new Date(startTime);
    const targetEnd = new Date(endTime);

    // 1. Time Sanity Check
    if (isNaN(targetStart.getTime()) || isNaN(targetEnd.getTime())) {
      conflicts.push('Invalid start or end time format.');
      return { hasConflict: true, conflicts };
    }

    if (targetEnd <= targetStart) {
      conflicts.push('End time must be after start time.');
    }

    const now = new Date();
    // allow a 5 minute buffer for immediate scheduling
    if (targetStart.getTime() < now.getTime() - 5 * 60 * 1000) {
      conflicts.push('Cannot schedule a surgery in the past.');
    }

    // 2. OR Status & Maintenance Check
    if (orId) {
      const selectedOr = operatingRooms.find(r => r.orId === orId);
      if (!selectedOr) {
        conflicts.push(`Operating Room ${orId} does not exist.`);
      } else if (selectedOr.status === 'MAINTENANCE') {
        conflicts.push(`Operating Room ${orId} (${selectedOr.name}) is currently under MAINTENANCE.`);
      }
    }

    // 3. Doctor Availability Check
    if (doctorId && staffList) {
      const doctor = staffList.find(s => s.staffId === doctorId || s.name === doctorId);
      if (doctor) {
        if (doctor.status === 'OFF-DUTY') {
          conflicts.push(`Doctor ${doctor.name} is currently OFF-DUTY.`);
        }
        
        // Check doctor working hours if specified (e.g. "08:00" to "18:00")
        if (doctor.availableFrom && doctor.availableTo) {
          const sHour = targetStart.getHours() + targetStart.getMinutes() / 60;
          const eHour = targetEnd.getHours() + targetEnd.getMinutes() / 60;

          const [fromH, fromM] = doctor.availableFrom.split(':').map(Number);
          const [toH, toM] = doctor.availableTo.split(':').map(Number);
          const docStart = fromH + fromM / 60;
          const docEnd = toH + toM / 60;

          if (sHour < docStart || eHour > docEnd) {
            conflicts.push(`Doctor ${doctor.name} working hours are ${doctor.availableFrom} to ${doctor.availableTo}.`);
          }
        }
      }
    }

    // 4. Overlap Check with Active/Scheduled Surgeries
    for (const surg of existingSurgeries) {
      if (surg.status === 'CANCELLED') continue;
      if (excludeSurgeryId && surg.surgeryId === excludeSurgeryId) continue;

      const overlap = this.doIntervalsOverlap(targetStart, targetEnd, surg.startTime, surg.endTime);
      if (overlap) {
        // OR Conflict
        if (orId && surg.orId === orId) {
          const sStr = new Date(surg.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const eStr = new Date(surg.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          conflicts.push(`Operating Room ${orId} is already occupied by ${surg.patientName} (${sStr} - ${eStr}).`);
        }

        // Doctor Conflict
        if (doctorId && (surg.doctorId === doctorId || surg.doctorName === doctorId)) {
          const sStr = new Date(surg.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const eStr = new Date(surg.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          conflicts.push(`Doctor ${surg.doctorName || doctorId} is already assigned to surgery ${surg.surgeryId} (${sStr} - ${eStr}).`);
        }
      }
    }

    return {
      hasConflict: conflicts.length > 0,
      conflicts
    };
  }

  /**
   * Greedy Slot Finder using Min Heap to find earliest non-conflicting slot
   */
  static findBestSlot({ preferredDate, preferredTime, duration = 60, department, requiredEquipment = [], doctorId, ors, existingSurgeries, staffList }) {
    // Determine target start datetime
    let baseDate = preferredDate ? new Date(preferredDate) : new Date();
    if (preferredTime) {
      const [h, m] = preferredTime.split(':').map(Number);
      baseDate.setHours(h, m, 0, 0);
    } else {
      // default next hour round
      baseDate.setMinutes(0, 0, 0);
      if (baseDate < new Date()) {
        baseDate = new Date(Date.now() + 30 * 60 * 1000); // 30 mins in future
      }
    }

    // Filter candidate ORs
    const candidateORs = ors.filter(room => {
      if (room.status === 'MAINTENANCE') return false;
      if (department && room.department.toLowerCase() !== 'general' && room.department.toLowerCase() !== department.toLowerCase()) {
        // match department or allow general OR
        return false;
      }
      // Equipment check if required
      if (requiredEquipment.length > 0) {
        const hasAllEquipment = requiredEquipment.every(req => 
          room.equipment.some(eq => eq.toLowerCase().includes(req.toLowerCase()))
        );
        if (!hasAllEquipment) return false;
      }
      return true;
    });

    const ORsToTest = candidateORs.length > 0 ? candidateORs : ors.filter(r => r.status !== 'MAINTENANCE');

    if (ORsToTest.length === 0) {
      return { found: false, message: 'No available or non-maintenance Operating Rooms found.' };
    }

    // Min Heap to explore time slots starting from baseDate in 15-minute steps
    const slotHeap = new MinHeap();
    
    // Test slots up to 24 hours into the future
    const maxFutureTime = baseDate.getTime() + 24 * 60 * 60 * 1000;
    
    for (const room of ORsToTest) {
      let currentTestStart = new Date(baseDate);
      
      while (currentTestStart.getTime() <= maxFutureTime) {
        const currentTestEnd = new Date(currentTestStart.getTime() + duration * 60 * 1000);

        const check = this.checkConflicts({
          startTime: currentTestStart,
          endTime: currentTestEnd,
          orId: room.orId,
          doctorId,
          existingSurgeries,
          operatingRooms: ors,
          staffList
        });

        if (!check.hasConflict) {
          slotHeap.push({
            availableTime: currentTestStart.getTime(),
            or: room,
            startTime: currentTestStart,
            endTime: currentTestEnd,
            duration
          });
          break; // Found earliest slot for this OR
        }

        // Shift by 15 minutes
        currentTestStart = new Date(currentTestStart.getTime() + 15 * 60 * 1000);
      }
    }

    if (slotHeap.isEmpty()) {
      return {
        found: false,
        message: 'Could not find a non-conflicting slot within the next 24 hours. Consider rescheduling conflicting surgeries or adjusting requirements.'
      };
    }

    const best = slotHeap.poll();
    return {
      found: true,
      bestSlot: {
        orId: best.or.orId,
        orName: best.or.name,
        department: best.or.department,
        startTime: best.startTime,
        endTime: best.endTime,
        duration: best.duration
      },
      message: `Best slot found at ${best.or.name} (${new Date(best.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - ${new Date(best.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})})`
    };
  }
}

module.exports = IntervalScheduler;
