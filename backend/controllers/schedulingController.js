const dbHelper = require('../utils/dbHelper');
const PriorityQueue = require('../algorithms/PriorityQueue');
const IntervalScheduler = require('../algorithms/IntervalScheduler');
const EmergencyPreemptor = require('../algorithms/EmergencyPreemptor');

// 1. Find Best Slot (Greedy + Min Heap)
exports.findSlot = async (req, res, next) => {
  try {
    const { preferredDate, preferredTime, duration, department, requiredEquipment, doctorId } = req.body;

    const existingSurgeries = await dbHelper.getSurgeries();
    const ors = await dbHelper.getORs();
    const staffList = await dbHelper.getStaff();

    const result = IntervalScheduler.findBestSlot({
      preferredDate,
      preferredTime,
      duration: duration ? Number(duration) : 60,
      department,
      requiredEquipment: Array.isArray(requiredEquipment) ? requiredEquipment : [],
      doctorId,
      ors,
      existingSurgeries,
      staffList
    });

    res.json({
      success: true,
      result
    });
  } catch (err) {
    next(err);
  }
};

// 2. Schedule Surgery with Priority Queue
exports.scheduleSurgery = async (req, res, next) => {
  try {
    const { patientId, orId, doctorId, startTime, duration = 60, notes } = req.body;

    if (!patientId || !orId || !doctorId || !startTime) {
      return res.status(400).json({ success: false, message: 'Patient ID, OR ID, Doctor ID, and Start Time are required.' });
    }

    const patient = await dbHelper.getPatientById(patientId);
    if (!patient) return res.status(404).json({ success: false, message: 'Patient not found.' });

    const doctor = await dbHelper.getStaffById(doctorId);
    const doctorName = doctor ? doctor.name : doctorId;

    const sTime = new Date(startTime);
    const eTime = new Date(sTime.getTime() + duration * 60 * 1000);

    const existingSurgeries = await dbHelper.getSurgeries();
    const operatingRooms = await dbHelper.getORs();
    const staffList = await dbHelper.getStaff();

    const check = IntervalScheduler.checkConflicts({
      startTime: sTime,
      endTime: eTime,
      orId,
      doctorId,
      existingSurgeries,
      operatingRooms,
      staffList
    });

    if (check.hasConflict) {
      return res.status(400).json({
        success: false,
        message: 'Scheduling Conflict Detected.',
        conflicts: check.conflicts
      });
    }

    const surgeryId = `SURG-2026-${Math.floor(100 + Math.random() * 900)}`;

    const newSurgery = await dbHelper.createSurgery({
      surgeryId,
      patientId: patient.patientId,
      patientName: patient.name,
      surgeryType: patient.surgeryType || 'Surgical Procedure',
      orId,
      doctorId,
      doctorName,
      department: patient.department || 'General',
      startTime: sTime,
      endTime: eTime,
      duration: Number(duration),
      priority: patient.priority || 4,
      priorityLabel: patient.priorityLabel || 'NORMAL',
      status: 'SCHEDULED',
      notes: notes || ''
    });

    await dbHelper.updatePatient(patient.patientId, { status: 'SCHEDULED' });

    await dbHelper.addAuditLog({
      user: req.user ? req.user.name : 'System',
      role: req.user ? req.user.role : 'System',
      action: 'DSA Surgery Schedule',
      entity: `Surgery ${surgeryId}`,
      details: `Scheduled ${patient.name} (${patient.priorityLabel}) in ${orId} from ${sTime.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} to ${eTime.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}.`
    });

    res.json({
      success: true,
      message: 'Surgery scheduled successfully.',
      surgery: newSurgery
    });
  } catch (err) {
    next(err);
  }
};

// 3. Emergency Case Preemption Algorithm Endpoint
exports.handleEmergency = async (req, res, next) => {
  try {
    const { patientId, requestedStartTime, duration = 60, doctorId, autoConfirm = false } = req.body;

    const patient = await dbHelper.getPatientById(patientId);
    if (!patient) return res.status(404).json({ success: false, message: 'Emergency patient not found.' });

    const surgeries = await dbHelper.getSurgeries();
    const ors = await dbHelper.getORs();
    const staffList = await dbHelper.getStaff();

    const preemptionPlan = EmergencyPreemptor.handleEmergency({
      patient,
      requestedStartTime,
      duration: Number(duration),
      doctorId,
      ors,
      surgeries,
      staffList
    });

    if (!preemptionPlan.success && preemptionPlan.preemptionRequired) {
      return res.status(400).json({
        success: false,
        message: preemptionPlan.message,
        preemptionPlan
      });
    }

    if (autoConfirm && preemptionPlan.preemptionRequired && preemptionPlan.preemptedSurgery) {
      // Execute the preemption
      const { emergencySlot, preemptedSurgery } = preemptionPlan;

      // 1. Reschedule lower priority surgery
      await dbHelper.updateSurgery(preemptedSurgery.surgeryId, {
        startTime: preemptedSurgery.proposedNewStart,
        endTime: preemptedSurgery.proposedNewEnd,
        status: 'RESCHEDULED',
        isEmergencyPreempted: true,
        notes: `Rescheduled to accommodate Emergency Case (${patient.name}).`
      });

      // 2. Create Emergency surgery
      const surgId = `SURG-EMG-${Math.floor(100 + Math.random() * 900)}`;
      const doc = await dbHelper.getStaffById(doctorId || 'STF-101');
      const emergencySurgery = await dbHelper.createSurgery({
        surgeryId: surgId,
        patientId: patient.patientId,
        patientName: patient.name,
        surgeryType: patient.surgeryType || 'Emergency Procedure',
        orId: emergencySlot.orId,
        doctorId: doc ? doc.staffId : 'STF-101',
        doctorName: doc ? doc.name : 'Dr. Rajesh Kumar',
        department: patient.department || 'Emergency',
        startTime: emergencySlot.startTime,
        endTime: emergencySlot.endTime,
        duration: emergencySlot.duration,
        priority: 1,
        priorityLabel: 'EMERGENCY',
        status: 'SCHEDULED',
        notes: 'Emergency Case Preemption Procedure.'
      });

      await dbHelper.updatePatient(patient.patientId, { status: 'SCHEDULED' });

      await dbHelper.addAuditLog({
        user: req.user ? req.user.name : 'System',
        role: req.user ? req.user.role : 'System',
        action: 'Emergency Preemption Execution',
        entity: `Emergency Surgery ${surgId}`,
        details: `Preempted surgery ${preemptedSurgery.surgeryId} (${preemptedSurgery.patientName}) in ${emergencySlot.orId} for emergency patient ${patient.name}.`
      });

      await dbHelper.addNotification({
        title: '🚨 Emergency Surgery Scheduled',
        message: `Emergency surgery ${surgId} scheduled in ${emergencySlot.orId}. Surgery ${preemptedSurgery.surgeryId} rescheduled.`,
        type: 'EMERGENCY'
      });

      return res.json({
        success: true,
        executed: true,
        message: 'Emergency surgery scheduled and conflicting lower-priority surgery rescheduled successfully.',
        emergencySurgery,
        rescheduledSurgery: preemptedSurgery
      });
    }

    res.json({
      success: true,
      executed: false,
      message: preemptionPlan.message,
      preemptionPlan
    });
  } catch (err) {
    next(err);
  }
};

// 4. Get Active Conflicts across system
exports.getConflicts = async (req, res, next) => {
  try {
    const surgeries = await dbHelper.getSurgeries();
    const ors = await dbHelper.getORs();
    const staffList = await dbHelper.getStaff();

    const conflictList = [];

    for (let i = 0; i < surgeries.length; i++) {
      for (let j = i + 1; j < surgeries.length; j++) {
        const s1 = surgeries[i];
        const s2 = surgeries[j];

        if (s1.status === 'CANCELLED' || s2.status === 'CANCELLED') continue;

        const overlap = IntervalScheduler.doIntervalsOverlap(s1.startTime, s1.endTime, s2.startTime, s2.endTime);
        if (overlap) {
          if (s1.orId === s2.orId) {
            conflictList.push({
              type: 'OR Overlap',
              resource: s1.orId,
              surgeryA: s1,
              surgeryB: s2,
              message: `OR ${s1.orId} double booked between Surgery ${s1.surgeryId} (${s1.patientName}) and ${s2.surgeryId} (${s2.patientName}).`,
              suggestedAlternative: `Move Surgery ${s2.priority > s1.priority ? s2.surgeryId : s1.surgeryId} to an alternative available OR or time.`
            });
          }

          if (s1.doctorId === s2.doctorId) {
            conflictList.push({
              type: 'Doctor Overlap',
              resource: s1.doctorName,
              surgeryA: s1,
              surgeryB: s2,
              message: `Doctor ${s1.doctorName} assigned to simultaneous surgeries (${s1.surgeryId} and ${s2.surgeryId}).`,
              suggestedAlternative: `Assign an alternative surgeon to ${s2.surgeryId} or shift timing.`
            });
          }
        }
      }
    }

    res.json({
      success: true,
      count: conflictList.length,
      conflicts: conflictList
    });
  } catch (err) {
    next(err);
  }
};

// 5. Interactive DSA Demo Simulation Endpoint for Presentation (Section 7)
exports.runDSADemo = async (req, res, next) => {
  try {
    // Standard Demonstration Dataset as specified in Section 7
    const demoPatients = [
      { patientId: 'P1', name: 'Rahul', priority: 4, priorityLabel: 'NORMAL', diagnosis: 'Hernia Repair', surgeryType: 'Hernia Repair', expectedSurgeryDuration: 60, doctor: 'Dr. Sanjay Gupta', department: 'General Surgery' },
      { patientId: 'P2', name: 'Ramesh', priority: 1, priorityLabel: 'EMERGENCY', diagnosis: 'Acute Abdominal Trauma', surgeryType: 'Emergency Laparotomy', expectedSurgeryDuration: 90, doctor: 'Dr. Rajesh Kumar', department: 'Emergency' },
      { patientId: 'P3', name: 'Priya', priority: 2, priorityLabel: 'HIGH', diagnosis: 'Femur Fracture', surgeryType: 'Orthopedic Fixation', expectedSurgeryDuration: 120, doctor: 'Dr. Anita Desai', department: 'Orthopedics' },
      { patientId: 'P4', name: 'Siddharth', priority: 3, priorityLabel: 'MEDIUM', diagnosis: 'Gallbladder Stones', surgeryType: 'Laparoscopic Cholecystectomy', expectedSurgeryDuration: 75, doctor: 'Dr. Rajesh Kumar', department: 'General Surgery' }
    ];

    // Priority Queue Ordering
    const pQueue = new PriorityQueue();
    demoPatients.forEach(p => pQueue.push(p));
    const orderedQueue = pQueue.toArray();

    // Min Heap Available OR Slots
    const minHeapSlots = [
      { orId: 'OR-02', name: 'OR-02 Cardiac Suite', availableTime: '09:00 AM', status: 'AVAILABLE' },
      { orId: 'OR-01', name: 'OR-01 General Suite', availableTime: '10:30 AM', status: 'AVAILABLE' },
      { orId: 'OR-03', name: 'OR-03 Orthopedic Suite', availableTime: '01:00 PM', status: 'AVAILABLE' }
    ];

    const demoSteps = [
      {
        step: 1,
        title: 'STEP 1: Patient Queue Created',
        description: 'Unordered incoming patient requests (P1 Normal, P2 Emergency, P3 High, P4 Medium) loaded into system.',
        queueState: demoPatients,
        activeTarget: null
      },
      {
        step: 2,
        title: 'STEP 2: Priority Queue Orders Patients',
        description: 'Heap ordering applied: Priority 1 (Emergency) > Priority 2 (High) > Priority 3 (Medium) > Priority 4 (Normal).',
        queueState: orderedQueue,
        activeTarget: null
      },
      {
        step: 3,
        title: 'STEP 3: Emergency Patient Moves to Front',
        description: 'Root element extracted: P2 Emergency (Ramesh) receives top precedence for immediate OR assignment.',
        queueState: orderedQueue,
        activeTarget: orderedQueue[0]
      },
      {
        step: 4,
        title: 'STEP 4: Min Heap Finds Earliest Available OR',
        description: 'Min-Heap evaluates candidate OR slots by earliest timestamp: OR-02 (09:00 AM) > OR-01 (10:30 AM) > OR-03 (01:00 PM).',
        minHeapSlots,
        activeTarget: orderedQueue[0]
      },
      {
        step: 5,
        title: 'STEP 5: Staff Availability Checked',
        description: 'Validated Dr. Rajesh Kumar working hours (08:00 - 18:00) and shift status (AVAILABLE).',
        staffChecked: 'Dr. Rajesh Kumar - Verified Available',
        activeTarget: orderedQueue[0]
      },
      {
        step: 6,
        title: 'STEP 6: Conflict Detection Performed',
        description: 'Evaluated max(StartA, StartB) < min(EndA, EndB) across OR-02 schedules. Zero double-booking detected.',
        conflictResult: 'NO_CONFLICT',
        activeTarget: orderedQueue[0]
      },
      {
        step: 7,
        title: 'STEP 7: Final Schedule Generated',
        description: 'Procedure assigned: P2 Ramesh scheduled in OR-02 at 09:00 AM. P3 Priya scheduled in OR-03 at 11:00 AM. P4 Siddharth scheduled in OR-01 at 10:30 AM. P1 Rahul scheduled at 01:00 PM.',
        finalSchedule: [
          { time: '09:00 AM', or: 'OR-02', patient: 'P2 Ramesh', priority: 'EMERGENCY', doctor: 'Dr. Rajesh Kumar' },
          { time: '10:30 AM', or: 'OR-01', patient: 'P4 Siddharth', priority: 'MEDIUM', doctor: 'Dr. Rajesh Kumar' },
          { time: '11:00 AM', or: 'OR-03', patient: 'P3 Priya', priority: 'HIGH', doctor: 'Dr. Anita Desai' },
          { time: '01:00 PM', or: 'OR-01', patient: 'P1 Rahul', priority: 'NORMAL', doctor: 'Dr. Sanjay Gupta' }
        ]
      }
    ];

    res.json({
      success: true,
      initialUnorderedQueue: demoPatients,
      priorityQueueState: orderedQueue,
      minHeapSlots,
      demoSteps
    });
  } catch (err) {
    next(err);
  }
};

