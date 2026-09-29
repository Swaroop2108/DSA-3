const IntervalScheduler = require('./IntervalScheduler');
const MinHeap = require('./MinHeap');

/**
 * Emergency Preemption Algorithm for Urgent / Critical Surgical Cases
 * Preempts lowest priority non-emergency surgeries when no immediate OR slot is open.
 */
class EmergencyPreemptor {
  
  static handleEmergency({ patient, requestedStartTime, duration = 60, doctorId, ors, surgeries, staffList }) {
    const start = requestedStartTime ? new Date(requestedStartTime) : new Date(Date.now() + 5 * 60 * 1000); // default in 5 mins
    const end = new Date(start.getTime() + duration * 60 * 1000);

    // Step 1: Try greedy non-preemptive slot search first
    const bestSlot = IntervalScheduler.findBestSlot({
      preferredDate: start,
      preferredTime: `${start.getHours()}:${start.getMinutes()}`,
      duration,
      department: patient.department || 'Emergency',
      doctorId,
      ors,
      existingSurgeries: surgeries,
      staffList
    });

    // If an immediate slot within 30 minutes is free, no preemption needed!
    if (bestSlot.found && new Date(bestSlot.bestSlot.startTime).getTime() <= start.getTime() + 30 * 60 * 1000) {
      return {
        preemptionRequired: false,
        recommendedSlot: bestSlot.bestSlot,
        message: 'Immediate OR slot found without needing surgery preemption.'
      };
    }

    // Step 2: No immediate slot available. Search for preemptable lower-priority surgeries
    // Find all active surgeries overlapping [start, end]
    const conflictingSurgeries = surgeries.filter(s => 
      s.status === 'SCHEDULED' || s.status === 'IN_PROGRESS'
    ).filter(s => 
      IntervalScheduler.doIntervalsOverlap(start, end, s.startTime, s.endTime)
    );

    if (conflictingSurgeries.length === 0) {
      // Find available OR ignoring non-overlapping future surgeries
      const availableOr = ors.find(r => r.status !== 'MAINTENANCE');
      return {
        preemptionRequired: false,
        recommendedSlot: {
          orId: availableOr ? availableOr.orId : 'OR-01',
          orName: availableOr ? availableOr.name : 'OR-01 Emergency Suite',
          startTime: start,
          endTime: end,
          duration
        },
        message: 'No direct time collision; emergency slot assigned.'
      };
    }

    // Filter surgeries that can be preempted (Priority 2, 3, 4 - i.e. HIGH, MEDIUM, NORMAL)
    // Emergency surgeries (Priority 1) CANNOT be preempted!
    const preemptableCandidates = conflictingSurgeries.filter(s => s.priority > 1);

    if (preemptableCandidates.length === 0) {
      return {
        success: false,
        preemptionRequired: true,
        message: 'CRITICAL CONFLICT: All overlapping OR slots are occupied by other EMERGENCY surgeries. Immediate manual intervention required.'
      };
    }

    // Sort preemptable candidates by lowest priority first (highest numerical value = lowest priority, e.g. 4 > 3 > 2)
    preemptableCandidates.sort((a, b) => b.priority - a.priority);
    const targetPreemptedSurgery = preemptableCandidates[0];

    // Find rescheduled slot for the preempted surgery after the emergency procedure finishes
    const newPreemptedStart = new Date(end.getTime() + 15 * 60 * 1000); // 15 min buffer after emergency
    const newPreemptedEnd = new Date(newPreemptedStart.getTime() + targetPreemptedSurgery.duration * 60 * 1000);

    return {
      success: true,
      preemptionRequired: true,
      emergencySlot: {
        orId: targetPreemptedSurgery.orId,
        startTime: start,
        endTime: end,
        duration
      },
      preemptedSurgery: {
        surgeryId: targetPreemptedSurgery.surgeryId,
        patientName: targetPreemptedSurgery.patientName,
        currentPriority: targetPreemptedSurgery.priorityLabel || 'NORMAL',
        originalStart: targetPreemptedSurgery.startTime,
        originalEnd: targetPreemptedSurgery.endTime,
        proposedNewStart: newPreemptedStart,
        proposedNewEnd: newPreemptedEnd
      },
      message: `Emergency Preemption Alert: Surgery ${targetPreemptedSurgery.surgeryId} (${targetPreemptedSurgery.patientName}, Priority: ${targetPreemptedSurgery.priorityLabel}) in ${targetPreemptedSurgery.orId} will be rescheduled to ${newPreemptedStart.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}.`
    };
  }
}

module.exports = EmergencyPreemptor;
