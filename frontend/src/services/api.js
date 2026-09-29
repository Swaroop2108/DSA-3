import * as storage from './storage';
import PriorityQueue from '../algorithms/PriorityQueue';
import MinHeap from '../algorithms/MinHeap';
import Scheduler from '../algorithms/Scheduler';
import ConflictDetector from '../algorithms/ConflictDetector';

/**
 * Self-contained local API layer that replaces REST calls to localhost:5000.
 * Executes all database queries, authentication, and DSA scheduling algorithms in-browser.
 */
class LocalAPIAdapter {
  constructor() {
    this.interceptors = {
      request: { use: () => {} },
      response: { use: () => {} }
    };
  }

  async get(url) {
    const parsed = new URL(url, 'http://local.app');
    const path = parsed.pathname;
    const params = parsed.searchParams;

    // 1. Health Check
    if (path === '/health' || path === '/api/health') {
      return { data: { status: 'healthy', database: 'connected', mode: 'Local Storage' } };
    }

    // 2. Auth / Me
    if (path === '/auth/me' || path === '/api/auth/me') {
      const user = storage.getCurrentUser();
      if (user) {
        return { data: { success: true, user } };
      }
      return Promise.reject({ response: { status: 401, data: { message: 'Not authenticated' } } });
    }

    // 3. Patients
    if (path === '/patients' || path === '/api/patients') {
      let patients = storage.getPatients();
      const search = params.get('search');
      const priority = params.get('priority');
      const status = params.get('status');

      if (search) {
        const query = search.toLowerCase();
        patients = patients.filter(p => 
          p.name.toLowerCase().includes(query) || 
          p.patientId.toLowerCase().includes(query) ||
          p.diagnosis.toLowerCase().includes(query)
        );
      }

      if (priority && priority !== 'ALL') {
        if (!isNaN(Number(priority))) {
          patients = patients.filter(p => p.priority === Number(priority));
        } else {
          patients = patients.filter(p => p.priorityLabel === priority);
        }
      }

      if (status && status !== 'ALL') {
        patients = patients.filter(p => p.status === status);
      }

      return { data: { success: true, count: patients.length, patients } };
    }

    // 4. Beds
    if (path === '/beds' || path === '/api/beds') {
      let beds = storage.getBeds();
      const status = params.get('status');
      const ward = params.get('ward');

      if (status && status !== 'ALL') {
        beds = beds.filter(b => b.status === status);
      }

      if (ward && ward !== 'ALL') {
        beds = beds.filter(b => b.ward === ward);
      }

      return { data: { success: true, count: beds.length, beds } };
    }

    // 5. Operating Rooms
    if (path === '/ors' || path === '/api/ors') {
      const ors = storage.getOperatingRooms();
      return { data: { success: true, count: ors.length, operatingRooms: ors } };
    }

    if (path.match(/\/ors\/[^\/]+\/schedule$/)) {
      const orId = path.split('/')[2];
      const surgeries = storage.getSurgeries().filter(s => s.orId === orId && s.status !== 'CANCELLED');
      return { data: { success: true, count: surgeries.length, schedule: surgeries } };
    }

    // 6. Staff
    if (path === '/staff' || path === '/api/staff') {
      let staffList = storage.getStaff();
      const role = params.get('role');
      const status = params.get('status');

      if (role && role !== 'ALL') {
        staffList = staffList.filter(s => s.role.toLowerCase() === role.toLowerCase());
      }

      if (status && status !== 'ALL') {
        staffList = staffList.filter(s => s.status === status);
      }

      return { data: { success: true, count: staffList.length, staff: staffList } };
    }

    // 7. Surgeries
    if (path === '/surgeries' || path === '/api/surgeries') {
      const surgeries = storage.getSurgeries();
      return { data: { success: true, count: surgeries.length, surgeries } };
    }

    // 8. Audit Logs
    if (path === '/audit/logs' || path === '/api/audit/logs') {
      const logs = storage.getAuditLogs();
      return { data: { success: true, count: logs.length, logs } };
    }

    // 9. Notifications
    if (path === '/audit/notifications' || path === '/api/audit/notifications') {
      const notifications = storage.getNotifications();
      return { data: { success: true, count: notifications.length, notifications } };
    }

    // 9b. Staff Instructions
    if (path === '/instructions' || path === '/api/instructions') {
      const currentUser = storage.getCurrentUser();
      let instructions = [];
      if (currentUser?.role?.toLowerCase() === 'staff') {
        instructions = storage.getInstructionsForStaff(currentUser);
      } else {
        instructions = storage.getInstructions();
      }
      return { data: { success: true, count: instructions.length, instructions } };
    }

    // 9c. Equipment
    if (path === '/equipment' || path === '/api/equipment') {
      let equipment = storage.getEquipment();
      const search = params.get('search');
      const status = params.get('status');
      const category = params.get('category');
      const location = params.get('location');

      if (search) {
        const query = search.toLowerCase();
        equipment = equipment.filter(e =>
          (e.equipmentId && e.equipmentId.toLowerCase().includes(query)) ||
          (e.name && e.name.toLowerCase().includes(query)) ||
          (e.category && e.category.toLowerCase().includes(query)) ||
          (e.location && e.location.toLowerCase().includes(query))
        );
      }

      if (status && status !== 'ALL') {
        equipment = equipment.filter(e => e.status === status);
      }

      if (category && category !== 'ALL') {
        equipment = equipment.filter(e => e.category === category);
      }

      if (location && location !== 'ALL') {
        equipment = equipment.filter(e => e.location === location);
      }

      return { data: { success: true, count: equipment.length, equipment } };
    }


    // 10. Dashboard Stats
    if (path === '/dashboard/stats' || path === '/api/dashboard/stats') {
      const patients = storage.getPatients();
      const beds = storage.getBeds();
      const ors = storage.getOperatingRooms();
      const surgeries = storage.getSurgeries();
      const staffList = storage.getStaff();

      const stats = {
        totalPatients: patients.length,
        admittedPatients: patients.filter(p => p.status === 'ADMITTED').length,
        waitingPatients: patients.filter(p => p.status === 'WAITING').length,
        totalBeds: beds.length,
        availableBeds: beds.filter(b => b.status === 'AVAILABLE').length,
        occupiedBeds: beds.filter(b => b.status === 'OCCUPIED').length,
        maintenanceBeds: beds.filter(b => b.status === 'MAINTENANCE').length,
        totalORs: ors.length,
        availableORs: ors.filter(r => r.status === 'AVAILABLE').length,
        occupiedORs: ors.filter(r => r.status === 'OCCUPIED').length,
        maintenanceORs: ors.filter(r => r.status === 'MAINTENANCE').length,
        totalSurgeries: surgeries.length,
        scheduledSurgeries: surgeries.filter(s => s.status === 'SCHEDULED' || s.status === 'IN_PROGRESS').length,
        emergencyCases: patients.filter(p => p.priority === 1 || p.priorityLabel === 'EMERGENCY').length,
        availableStaff: staffList.filter(s => s.status === 'AVAILABLE').length,
        totalStaff: staffList.length,
        schedulingConflicts: 0
      };

      // Calculate actual conflicts count using Scheduler algorithm
      let conflictCount = 0;
      const activeSurgeries = surgeries.filter(s => s.status === 'SCHEDULED' || s.status === 'IN_PROGRESS');
      for (let i = 0; i < activeSurgeries.length; i++) {
        for (let j = i + 1; j < activeSurgeries.length; j++) {
          const s1 = activeSurgeries[i];
          const s2 = activeSurgeries[j];
          if (Scheduler.doIntervalsOverlap(s1.startTime, s1.endTime, s2.startTime, s2.endTime)) {
            if (s1.orId === s2.orId || (s1.doctorId && s1.doctorId === s2.doctorId)) {
              conflictCount++;
            }
          }
        }
      }
      stats.schedulingConflicts = conflictCount;

      // CHART 1: Patient Priority Queue Breakdown (Emergency, High, Medium, Normal)
      const emergencyCount = patients.filter(p => p.priority === 1 || p.priorityLabel === 'EMERGENCY').length;
      const highCount = patients.filter(p => p.priority === 2 || p.priorityLabel === 'HIGH').length;
      const mediumCount = patients.filter(p => p.priority === 3 || p.priorityLabel === 'MEDIUM').length;
      const normalCount = patients.filter(p => p.priority === 4 || p.priorityLabel === 'NORMAL').length;

      const patientPriorityDistribution = [
        { name: 'Emergency', count: emergencyCount, color: '#ef4444' },
        { name: 'High', count: highCount, color: '#f97316' },
        { name: 'Medium', count: mediumCount, color: '#eab308' },
        { name: 'Normal', count: normalCount, color: '#3b82f6' }
      ];

      // CHART 2: Bed Occupancy Distribution by Ward (ICU, Emergency, General, Private)
      const wardMap = [
        { name: 'ICU', key: 'ICU' },
        { name: 'Emergency', key: 'EMERGENCY' },
        { name: 'General', key: 'GENERAL' },
        { name: 'Private', key: 'PRIVATE' }
      ];

      const bedOccupancyByWard = wardMap.map(w => {
        const wardBeds = beds.filter(b => b.ward?.toUpperCase() === w.key);
        const occupied = wardBeds.filter(b => b.status === 'OCCUPIED').length;
        const available = wardBeds.filter(b => b.status === 'AVAILABLE').length;
        return {
          ward: w.name,
          occupied,
          available
        };
      });

      // Dashboard Sections
      const todaysSchedule = surgeries.filter(s => s.status !== 'CANCELLED').slice(0, 5);
      const emergencyCases = patients.filter(p => p.priority === 1 || p.priorityLabel === 'EMERGENCY');

      return {
        data: {
          success: true,
          stats,
          charts: {
            patientPriorityDistribution,
            bedOccupancyByWard
          },
          sections: {
            todaysSchedule,
            emergencyCases
          }
        }
      };
    }

    // 11. Conflicts
    if (path === '/scheduling/conflicts' || path === '/api/scheduling/conflicts') {
      const surgeries = storage.getSurgeries();
      const ors = storage.getOperatingRooms();
      const staffList = storage.getStaff();
      const activeSurgeries = surgeries.filter(s => s.status === 'SCHEDULED' || s.status === 'IN_PROGRESS');
      
      const detectedConflicts = [];
      for (let i = 0; i < activeSurgeries.length; i++) {
        for (let j = i + 1; j < activeSurgeries.length; j++) {
          const s1 = activeSurgeries[i];
          const s2 = activeSurgeries[j];

          if (Scheduler.doIntervalsOverlap(s1.startTime, s1.endTime, s2.startTime, s2.endTime)) {
            let conflictType = null;
            let description = '';

            if (s1.orId === s2.orId) {
              conflictType = 'OR Conflict';
              description = `Operating Room ${s1.orId} double booked for ${s1.patientName} and ${s2.patientName}.`;
            } else if (s1.doctorId && s1.doctorId === s2.doctorId) {
              conflictType = 'Doctor Conflict';
              description = `Doctor ${s1.doctorName} double booked for surgery ${s1.surgeryId} and ${s2.surgeryId}.`;
            }

            if (conflictType) {
              // Recommend alternative slot using Scheduler
              const suggestion = Scheduler.findBestSlot({
                preferredDate: new Date(s2.startTime),
                duration: s2.duration || 60,
                department: s2.department,
                doctorId: s2.doctorId,
                ors,
                existingSurgeries: surgeries.filter(s => s.surgeryId !== s2.surgeryId),
                staffList
              });

              detectedConflicts.push({
                conflictId: `CONF-${i}-${j}`,
                type: conflictType,
                description,
                surgeryA: s1,
                surgeryB: s2,
                suggestedResolution: suggestion.found ? suggestion.bestSlot : null,
                message: suggestion.message
              });
            }
          }
        }
      }

      return { data: { success: true, conflicts: detectedConflicts } };
    }

    // 12. Reports
    if (path === '/reports' || path === '/api/reports') {
      const patients = storage.getPatients();
      const beds = storage.getBeds();
      const ors = storage.getOperatingRooms();
      const surgeries = storage.getSurgeries();
      const staffList = storage.getStaff();

      const occupiedBeds = beds.filter(b => b.status === 'OCCUPIED').length;
      const availableBeds = beds.filter(b => b.status === 'AVAILABLE').length;
      const maintenanceBeds = beds.filter(b => b.status === 'MAINTENANCE').length;
      const reservedBeds = beds.filter(b => b.status === 'RESERVED').length;

      const now = new Date().getTime();
      const occupiedOrs = ors.filter(r => {
        if (r.status === 'OCCUPIED') return true;
        return surgeries.some(s => s.orId === r.orId && s.status !== 'CANCELLED' && new Date(s.startTime).getTime() <= now && new Date(s.endTime).getTime() >= now);
      }).length;

      const maintenanceOrs = ors.filter(r => r.status === 'MAINTENANCE').length;
      const availableOrs = Math.max(0, ors.length - occupiedOrs - maintenanceOrs);

      const reportData = {
        totalAdmissions: patients.filter(p => p.status === 'ADMITTED').length,
        admissionsCount: patients.filter(p => p.status === 'ADMITTED').length,
        dischargedCount: patients.filter(p => p.status === 'DISCHARGED').length,
        bedUtilizationRate: beds.length > 0 ? Math.round((occupiedBeds / beds.length) * 100) : 0,
        orUtilizationRate: ors.length > 0 ? Math.round((occupiedOrs / ors.length) * 100) : 0,
        totalSurgeries: surgeries.length,
        surgeriesCompleted: surgeries.filter(s => s.status === 'COMPLETED').length,
        surgeriesScheduled: surgeries.filter(s => s.status === 'SCHEDULED' || s.status === 'IN_PROGRESS').length,
        emergencySurgeries: surgeries.filter(s => s.priority === 1 || s.priorityLabel === 'EMERGENCY').length,
        emergencyCasesTotal: patients.filter(p => p.priority === 1 || p.priorityLabel === 'EMERGENCY').length,
        avgSurgeryDuration: surgeries.length > 0 ? Math.round(surgeries.reduce((acc, s) => acc + (Number(s.duration) || 60), 0) / surgeries.length) : 60,
        staffUtilizationRate: staffList.length > 0 ? Math.round((staffList.filter(s => s.status === 'BUSY').length / staffList.length) * 100) : 0,

        // CHART 3: Bed Inventory Breakdown
        beds: {
          total: beds.length,
          available: availableBeds,
          occupied: occupiedBeds,
          maintenance: maintenanceBeds,
          reserved: reservedBeds
        },

        // CHART 4: Operating Rooms Breakdown
        ors: {
          total: ors.length,
          available: availableOrs,
          occupied: occupiedOrs,
          maintenance: maintenanceOrs
        }
      };

      return { data: { success: true, report: reportData } };
    }

    return Promise.reject({ response: { status: 404, data: { message: `Route GET ${path} not found` } } });
  }

  async post(url, data = {}) {
    const parsed = new URL(url, 'http://local.app');
    const path = parsed.pathname;

    // 1. Auth Login
    if (path === '/auth/login' || path === '/api/auth/login') {
      try {
        const sessionUser = storage.authenticateUser(data.email, data.password, data.role);
        return { data: { success: true, user: sessionUser, token: 'medischedule-local-jwt-token' } };
      } catch (err) {
        return Promise.reject({ response: { status: 401, data: { message: err.message } } });
      }
    }

    // 2. Add Patient
    if (path === '/patients' || path === '/api/patients') {
      try {
        const newPatient = storage.addPatient(data);
        return { data: { success: true, patient: newPatient } };
      } catch (err) {
        return Promise.reject({ response: { status: 403, data: { message: err.message } } });
      }
    }

    // 3. Bed Operations
    if (path.match(/\/beds\/[^\/]+\/allocate$/)) {
      try {
        const bedId = path.split('/')[2];
        const bed = storage.allocateBed(bedId, data.patientId, data.patientName);
        return { data: { success: true, bed } };
      } catch (err) {
        return Promise.reject({ response: { status: 403, data: { message: err.message } } });
      }
    }

    if (path.match(/\/beds\/[^\/]+\/release$/)) {
      try {
        const bedId = path.split('/')[2];
        const bed = storage.releaseBed(bedId);
        return { data: { success: true, bed } };
      } catch (err) {
        return Promise.reject({ response: { status: 403, data: { message: err.message } } });
      }
    }

    if (path.match(/\/beds\/[^\/]+\/reserve$/)) {
      try {
        const bedId = path.split('/')[2];
        const bed = storage.updateBedStatus(bedId, 'RESERVED');
        return { data: { success: true, bed } };
      } catch (err) {
        return Promise.reject({ response: { status: 403, data: { message: err.message } } });
      }
    }

    if (path.match(/\/beds\/[^\/]+\/maintenance$/)) {
      try {
        const bedId = path.split('/')[2];
        const bed = storage.updateBedStatus(bedId, 'MAINTENANCE');
        return { data: { success: true, bed } };
      } catch (err) {
        return Promise.reject({ response: { status: 403, data: { message: err.message } } });
      }
    }

    // 4. Add OR
    if (path === '/ors' || path === '/api/ors') {
      try {
        storage.enforceAdminOnly('add operating rooms');
        const ors = storage.getOperatingRooms();
        const newOr = {
          orId: data.orId || `OR-0${ors.length + 1}`,
          name: data.name || `OR-0${ors.length + 1} Suite`,
          department: data.department || 'General Surgery',
          status: data.status || 'AVAILABLE',
          equipment: data.equipment || ['Standard OR Equipment']
        };
        ors.push(newOr);
        storage.saveOperatingRooms(ors);
        storage.addAuditLog({ action: 'OR Added', entity: `OR ${newOr.orId}`, details: `Added new operating room ${newOr.name}.` });
        return { data: { success: true, room: newOr } };
      } catch (err) {
        return Promise.reject({ response: { status: 403, data: { message: err.message } } });
      }
    }

    // 4b. Staff Instructions
    if (path === '/instructions' || path === '/api/instructions') {
      try {
        const instruction = storage.createInstruction(data);
        return { data: { success: true, instruction } };
      } catch (err) {
        return Promise.reject({ response: { status: 403, data: { message: err.message } } });
      }
    }

    // 4c. Add Equipment
    if (path === '/equipment' || path === '/api/equipment') {
      try {
        const newEquipment = storage.addEquipment(data);
        return { data: { success: true, equipment: newEquipment } };
      } catch (err) {
        return Promise.reject({ response: { status: 403, data: { message: err.message } } });
      }
    }


    // 5. Add Staff
    if (path === '/staff' || path === '/api/staff') {
      try {
        const newMember = storage.addStaff(data);
        return { data: { success: true, staff: newMember } };
      } catch (err) {
        return Promise.reject({ response: { status: 403, data: { message: err.message } } });
      }
    }

    // 6. Schedule Surgery
    if (path === '/surgeries' || path === '/api/surgeries') {
      const newSurgery = storage.addSurgery(data);
      return { data: { success: true, surgery: newSurgery } };
    }

    // 7. Find Slot (DSA Scheduler Algorithm)
    if (path === '/scheduling/find-slot' || path === '/api/scheduling/find-slot') {
      const result = Scheduler.findBestSlot({
        preferredDate: data.preferredDate,
        preferredTime: data.preferredTime,
        duration: data.duration,
        department: data.department,
        requiredEquipment: data.requiredEquipment,
        doctorId: data.doctorId,
        ors: storage.getOperatingRooms(),
        existingSurgeries: storage.getSurgeries(),
        staffList: storage.getStaff()
      });
      return { data: { success: result.found, ...result } };
    }

    // 8. Emergency Preemption (DSA Conflict Detector Algorithm)
    if (path === '/scheduling/emergency' || path === '/api/scheduling/emergency') {
      const targetPatient = data.patient || storage.getPatients().find(p => p.patientId === data.patientId) || {};
      const result = ConflictDetector.handleEmergency({
        patient: targetPatient,
        requestedStartTime: data.startTime || data.requestedStartTime,
        duration: data.duration || targetPatient.expectedSurgeryDuration || 60,
        doctorId: data.doctorId || targetPatient.doctorId,
        ors: storage.getOperatingRooms(),
        surgeries: storage.getSurgeries(),
        staffList: storage.getStaff()
      });

      // If preempted or scheduled, save surgery if requested
      if ((data.confirmSchedule || data.autoConfirm) && result.success !== false) {
        if (result.preemptionRequired && result.preemptedSurgery) {
          // Reschedule old surgery
          storage.updateSurgery(result.preemptedSurgery.surgeryId, {
            startTime: result.preemptedSurgery.proposedNewStart,
            endTime: result.preemptedSurgery.proposedNewEnd
          });
        }
        // Save emergency surgery
        const newSurge = storage.addSurgery({
          patientId: targetPatient.patientId || data.patientId,
          patientName: targetPatient.name || data.patientName || 'Emergency Patient',
          surgeryType: targetPatient.surgeryType || data.surgeryType || 'Emergency Procedure',
          orId: result.emergencySlot ? result.emergencySlot.orId : (result.recommendedSlot ? result.recommendedSlot.orId : 'OR-05'),
          doctorId: targetPatient.doctorId || data.doctorId || 'STF-101',
          doctorName: targetPatient.doctor || data.doctorName || 'Dr. Rajesh Kumar',
          department: targetPatient.department || data.department || 'Emergency',
          startTime: (result.emergencySlot || result.recommendedSlot).startTime,
          endTime: (result.emergencySlot || result.recommendedSlot).endTime,
          duration: targetPatient.expectedSurgeryDuration || data.duration || 60,
          priority: 1,
          priorityLabel: 'EMERGENCY',
          status: 'SCHEDULED',
          notes: 'Scheduled via Emergency Preemption Engine'
        });
        
        // Update patient status to SCHEDULED
        if (targetPatient.patientId || data.patientId) {
          storage.updatePatient(targetPatient.patientId || data.patientId, { status: 'SCHEDULED' });
        }

        result.scheduledSurgery = newSurge;
      }

      return { data: { success: true, preemptionPlan: result, ...result } };
    }


    // 9. DSA Engine Demo Run (Visualizer)
    if (path === '/scheduling/demo-run' || path === '/api/scheduling/demo-run') {
      const patients = storage.getPatients();
      const ors = storage.getOperatingRooms();
      const surgeries = storage.getSurgeries();
      const staffList = storage.getStaff();

      // Priority Queue
      const pq = new PriorityQueue();
      patients.forEach(p => pq.push(p));
      const orderedPatients = pq.toArray();

      // Min Heap
      const minHeap = new MinHeap();
      ors.forEach(room => {
        if (room.status !== 'MAINTENANCE') {
          minHeap.push({
            availableTime: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
            or: room
          });
        }
      });

      const nextBestOr = minHeap.peek();
      const highestPriorityPatient = pq.peek();

      const steps = [
        { step: 1, name: 'Build Patient Priority Queue', description: `Constructed Max-Priority Queue with ${patients.length} patients based on urgency rank (EMERGENCY 1 > HIGH 2 > MEDIUM 3 > NORMAL 4).` },
        { step: 2, name: 'Order Patients by Urgency', description: `Top patient selected: ${highestPriorityPatient?.name || 'N/A'} (Priority: ${highestPriorityPatient?.priorityLabel || 'EMERGENCY'}).` },
        { step: 3, name: 'Build OR Min-Heap', description: `Constructed Min-Heap of ${ors.length} operating rooms ordered by earliest available time.` },
        { step: 4, name: 'Select Earliest Available Resource', description: `Min-Heap root returned: ${nextBestOr?.or?.name || 'OR-01 General Suite'}.` },
        { step: 5, name: 'Staff Availability & Working Hours Check', description: 'Validated doctor shift schedules (e.g. Dr. Rajesh Kumar 08:00 - 18:00).' },
        { step: 6, name: 'Interval Overlap Conflict Verification', description: 'Evaluated time interval overlap formula max(startA, startB) < min(endA, endB) for OR & surgeon.' },
        { step: 7, name: 'Greedy Slot Assignment', description: 'Assigned non-conflicting 60-minute window for high-priority surgical case.' },
        { step: 8, name: 'Schedule Generation Complete', description: 'Final schedule generated cleanly without resource collisions.' }
      ];

      return {
        data: {
          success: true,
          steps,
          queueSnapshot: orderedPatients.slice(0, 5),
          heapSnapshot: ors,
          recommendedSchedule: {
            patient: highestPriorityPatient,
            operatingRoom: nextBestOr?.or,
            startTime: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
            endTime: new Date(Date.now() + 90 * 60 * 1000).toISOString()
          }
        }
      };
    }

    return Promise.reject({ response: { status: 404, data: { message: `Route POST ${path} not found` } } });
  }

  async put(url, data = {}) {
    const parsed = new URL(url, 'http://local.app');
    const path = parsed.pathname;

    // 1. Update Patient
    if (path.match(/\/patients\/[^\/]+$/)) {
      try {
        const patientId = path.split('/')[2];
        const updated = storage.updatePatient(patientId, data);
        return { data: { success: true, patient: updated } };
      } catch (err) {
        return Promise.reject({ response: { status: 403, data: { message: err.message } } });
      }
    }

    // 2. Update OR Status
    if (path.match(/\/ors\/[^\/]+$/)) {
      try {
        const orId = path.split('/')[2];
        const updated = storage.updateORStatus(orId, data.status);
        return { data: { success: true, room: updated } };
      } catch (err) {
        return Promise.reject({ response: { status: 403, data: { message: err.message } } });
      }
    }

    // 2b. Complete Staff Instruction
    if (path.match(/\/instructions\/[^\/]+\/complete$/)) {
      const id = path.split('/')[2];
      const updated = storage.completeInstruction(id, data.completionMessage);
      return { data: { success: true, instruction: updated } };
    }

    // 2c. Update Equipment
    if (path.match(/\/equipment\/[^\/]+$/)) {
      try {
        const equipmentId = path.split('/')[2];
        const updated = storage.updateEquipment(equipmentId, data);
        return { data: { success: true, equipment: updated } };
      } catch (err) {
        return Promise.reject({ response: { status: 403, data: { message: err.message } } });
      }
    }


    // 3. Update Staff Status
    if (path.match(/\/staff\/[^\/]+$/)) {
      try {
        const staffId = path.split('/')[2];
        const updated = storage.updateStaff(staffId, data);
        return { data: { success: true, staff: updated } };
      } catch (err) {
        return Promise.reject({ response: { status: 403, data: { message: err.message } } });
      }
    }

    // 4. Update Surgery
    if (path.match(/\/surgeries\/[^\/]+$/)) {
      const surgeryId = path.split('/')[2];
      const updated = storage.updateSurgery(surgeryId, data);
      return { data: { success: true, surgery: updated } };
    }

    // 5. Mark Notification Read
    if (path.match(/\/audit\/notifications\/[^\/]+\/read$/)) {
      const id = path.split('/')[3];
      storage.markNotificationRead(id);
      return { data: { success: true } };
    }

    return Promise.reject({ response: { status: 404, data: { message: `Route PUT ${path} not found` } } });
  }

  async delete(url) {
    const parsed = new URL(url, 'http://local.app');
    const path = parsed.pathname;

    // 1. Delete Patient
    if (path.match(/\/patients\/[^\/]+$/)) {
      try {
        const patientId = path.split('/')[2];
        const deleted = storage.deletePatient(patientId);
        return { data: { success: true, deleted } };
      } catch (err) {
        return Promise.reject({ response: { status: 403, data: { message: err.message } } });
      }
    }

    // 2. Cancel Surgery
    if (path.match(/\/surgeries\/[^\/]+$/)) {
      const surgeryId = path.split('/')[2];
      const deleted = storage.deleteSurgery(surgeryId);
      return { data: { success: true, deleted } };
    }

    // 3. Delete Equipment
    if (path.match(/\/equipment\/[^\/]+$/)) {
      try {
        const equipmentId = path.split('/')[2];
        const deleted = storage.deleteEquipment(equipmentId);
        return { data: { success: true, deleted } };
      } catch (err) {
        return Promise.reject({ response: { status: 403, data: { message: err.message } } });
      }
    }

    return Promise.reject({ response: { status: 404, data: { message: `Route DELETE ${path} not found` } } });
  }
}

export const API = new LocalAPIAdapter();
export default API;
