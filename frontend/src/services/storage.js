import {
  initialUsers,
  initialPatients,
  initialBeds,
  initialOperatingRooms,
  initialStaff,
  initialSurgeries,
  initialAuditLogs,
  initialNotifications,
  initialInstructions,
  initialEquipment
} from './seedData';

const KEYS = {
  USERS: 'medischedule_users',
  PATIENTS: 'medischedule_patients',
  BEDS: 'medischedule_beds',
  ORS: 'medischedule_operating_rooms',
  STAFF: 'medischedule_staff',
  SURGERIES: 'medischedule_surgeries',
  AUDIT_LOGS: 'medischedule_audit_logs',
  NOTIFICATIONS: 'medischedule_notifications',
  CURRENT_USER: 'medischedule_current_user',
  INSTRUCTIONS: 'medischedule_instructions',
  EQUIPMENT: 'medischedule_equipment'
};

// Internal getter / setter helpers with JSON parsing
const getItem = (key, fallback = []) => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch (e) {
    console.error(`Error reading ${key} from localStorage:`, e);
    return fallback;
  }
};

const setItem = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error(`Error writing ${key} to localStorage:`, e);
  }
};

export const enforceAdminOnly = (actionName = 'this action') => {
  const currentUser = getItem(KEYS.CURRENT_USER, null);
  if (currentUser && currentUser.role?.toLowerCase() === 'staff') {
    if (actionName.includes('equipment')) {
      throw new Error('Staff accounts have view-only access to equipment.');
    }
    throw new Error('Staff accounts have view-only access.');
  }
};

/**
 * Initialize storage with default seed data if empty
 */
export const initStorage = () => {
  if (!localStorage.getItem(KEYS.PATIENTS)) {
    console.log('🌱 Initializing MediSchedule demo data in localStorage...');
    setItem(KEYS.USERS, initialUsers);
    setItem(KEYS.PATIENTS, initialPatients);
    setItem(KEYS.BEDS, initialBeds);
    setItem(KEYS.ORS, initialOperatingRooms);
    setItem(KEYS.STAFF, initialStaff);
    setItem(KEYS.SURGERIES, initialSurgeries);
    setItem(KEYS.AUDIT_LOGS, initialAuditLogs);
    setItem(KEYS.NOTIFICATIONS, initialNotifications);
    setItem(KEYS.INSTRUCTIONS, initialInstructions);
    setItem(KEYS.EQUIPMENT, initialEquipment);
  } else {
    if (!localStorage.getItem(KEYS.INSTRUCTIONS)) {
      setItem(KEYS.INSTRUCTIONS, initialInstructions);
    }
    if (!localStorage.getItem(KEYS.EQUIPMENT)) {
      setItem(KEYS.EQUIPMENT, initialEquipment);
    }
  }
};

/**
 * Reset storage to default baseline demo data
 */
export const resetStorage = () => {
  console.log('🔄 Resetting MediSchedule local storage...');
  Object.values(KEYS).forEach(k => {
    if (k !== KEYS.CURRENT_USER) {
      localStorage.removeItem(k);
    }
  });
  setItem(KEYS.USERS, initialUsers);
  setItem(KEYS.PATIENTS, initialPatients);
  setItem(KEYS.BEDS, initialBeds);
  setItem(KEYS.ORS, initialOperatingRooms);
  setItem(KEYS.STAFF, initialStaff);
  setItem(KEYS.SURGERIES, initialSurgeries);
  setItem(KEYS.AUDIT_LOGS, initialAuditLogs);
  setItem(KEYS.NOTIFICATIONS, initialNotifications);
  setItem(KEYS.INSTRUCTIONS, initialInstructions);
  setItem(KEYS.EQUIPMENT, initialEquipment);

  
  // Also log reset event
  addAuditLog({
    user: 'System Admin',
    role: 'admin',
    action: 'Reset Demo Data',
    entity: 'System Storage',
    details: 'Reset all application datasets back to default initial state.'
  });
};

// Call initStorage on module load
initStorage();

// ==========================================
// 1. PATIENT STORAGE HELPERS
// ==========================================
export const getPatients = () => getItem(KEYS.PATIENTS, []);
export const savePatients = (patients) => setItem(KEYS.PATIENTS, patients);

export const addPatient = (patientData) => {
  enforceAdminOnly('add patient');
  const patients = getPatients();
  const nextId = `PAT-2026-${1000 + patients.length + 1}`;
  const priorityMap = { 1: 'EMERGENCY', 2: 'HIGH', 3: 'MEDIUM', 4: 'NORMAL' };
  
  const newPatient = {
    patientId: patientData.patientId || nextId,
    name: patientData.name,
    age: Number(patientData.age) || 30,
    gender: patientData.gender || 'Male',
    phone: patientData.phone || '555-0000',
    email: patientData.email || '',
    diagnosis: patientData.diagnosis || 'Pending Diagnosis',
    priority: Number(patientData.priority) || 4,
    priorityLabel: priorityMap[patientData.priority] || 'NORMAL',
    surgeryRequired: Boolean(patientData.surgeryRequired),
    surgeryType: patientData.surgeryType || 'N/A',
    expectedSurgeryDuration: Number(patientData.expectedSurgeryDuration) || 0,
    doctor: patientData.doctor || 'Dr. Rajesh Kumar',
    department: patientData.department || 'General Surgery',
    status: patientData.status || (patientData.bedId ? 'ADMITTED' : 'WAITING'),
    bedId: patientData.bedId || null,
    admissionDate: new Date().toISOString()
  };

  patients.unshift(newPatient);
  savePatients(patients);

  // If bed was assigned, update bed state
  if (newPatient.bedId) {
    allocateBed(newPatient.bedId, newPatient.patientId, newPatient.name);
  }

  addAuditLog({
    action: 'Patient Registration',
    entity: `Patient ${newPatient.patientId}`,
    details: `Registered ${newPatient.priorityLabel} patient ${newPatient.name}.`
  });

  return newPatient;
};

export const updatePatient = (patientId, updatedFields) => {
  enforceAdminOnly('update patient');
  const patients = getPatients();
  const index = patients.findIndex(p => p.patientId === patientId);
  if (index !== -1) {
    const oldBed = patients[index].bedId;
    patients[index] = { ...patients[index], ...updatedFields };
    savePatients(patients);

    // Handle bed change if updated
    if (updatedFields.bedId !== undefined && updatedFields.bedId !== oldBed) {
      if (oldBed) releaseBed(oldBed);
      if (updatedFields.bedId) allocateBed(updatedFields.bedId, patientId, patients[index].name);
    }

    addAuditLog({
      action: 'Patient Updated',
      entity: `Patient ${patientId}`,
      details: `Updated details for ${patients[index].name}.`
    });
    return patients[index];
  }
  return null;
};

export const deletePatient = (patientId) => {
  enforceAdminOnly('delete patient');
  const patients = getPatients();
  const patient = patients.find(p => p.patientId === patientId);
  if (patient) {
    if (patient.bedId) {
      releaseBed(patient.bedId);
    }
    const filtered = patients.filter(p => p.patientId !== patientId);
    savePatients(filtered);

    addAuditLog({
      action: 'Patient Deleted',
      entity: `Patient ${patientId}`,
      details: `Removed record for patient ${patient.name}.`
    });
    return true;
  }
  return false;
};

// ==========================================
// 2. BED STORAGE HELPERS
// ==========================================
export const getBeds = () => getItem(KEYS.BEDS, []);
export const saveBeds = (beds) => setItem(KEYS.BEDS, beds);

export const allocateBed = (bedId, patientId, patientName = '') => {
  enforceAdminOnly('allocate beds');
  const beds = getBeds();
  const bed = beds.find(b => b.bedId === bedId);
  if (bed) {
    bed.status = 'OCCUPIED';
    bed.assignedPatientId = patientId;
    bed.assignedPatientName = patientName || bed.assignedPatientName || 'Assigned Patient';
    bed.assignedDate = new Date().toISOString();
    saveBeds(beds);

    // Sync patient status to ADMITTED
    if (patientId) {
      const patients = getPatients();
      const patIndex = patients.findIndex(p => p.patientId === patientId);
      if (patIndex !== -1) {
        patients[patIndex].bedId = bedId;
        patients[patIndex].status = 'ADMITTED';
        savePatients(patients);
      }
    }

    addAuditLog({
      action: 'Bed Allocated',
      entity: `Bed ${bedId}`,
      details: `Allocated bed ${bedId} (${bed.ward}) to patient ${patientName || patientId}.`
    });
    return bed;
  }
  return null;
};

export const releaseBed = (bedId) => {
  enforceAdminOnly('release beds');
  const beds = getBeds();
  const bed = beds.find(b => b.bedId === bedId);
  if (bed) {
    const prevPatientId = bed.assignedPatientId;
    const prevPatientName = bed.assignedPatientName;

    bed.status = 'AVAILABLE';
    bed.assignedPatientId = null;
    bed.assignedPatientName = null;
    bed.assignedDate = null;
    saveBeds(beds);

    // Sync patient record if patient had this bed
    if (prevPatientId) {
      const patients = getPatients();
      const patIndex = patients.findIndex(p => p.patientId === prevPatientId);
      if (patIndex !== -1 && patients[patIndex].bedId === bedId) {
        patients[patIndex].bedId = null;
        if (patients[patIndex].status === 'ADMITTED') {
          patients[patIndex].status = 'WAITING';
        }
        savePatients(patients);
      }
    }

    addAuditLog({
      action: 'Bed Released',
      entity: `Bed ${bedId}`,
      details: `Released bed ${bedId} (${prevPatientName ? 'previously ' + prevPatientName : ''}).`
    });
    return bed;
  }
  return null;
};

export const updateBedStatus = (bedId, newStatus) => {
  enforceAdminOnly('update bed status');
  const beds = getBeds();
  const bed = beds.find(b => b.bedId === bedId);
  if (bed) {
    bed.status = newStatus;
    if (newStatus === 'AVAILABLE' || newStatus === 'MAINTENANCE') {
      bed.assignedPatientId = null;
      bed.assignedPatientName = null;
    }
    saveBeds(beds);

    addAuditLog({
      action: 'Bed Status Update',
      entity: `Bed ${bedId}`,
      details: `Changed bed ${bedId} status to ${newStatus}.`
    });
    return bed;
  }
  return null;
};

// ==========================================
// 3. OPERATING ROOMS HELPERS
// ==========================================
export const getOperatingRooms = () => getItem(KEYS.ORS, []);
export const saveOperatingRooms = (ors) => setItem(KEYS.ORS, ors);

export const updateORStatus = (orId, status) => {
  enforceAdminOnly('update operating room status');
  const ors = getOperatingRooms();
  const room = ors.find(r => r.orId === orId);
  if (room) {
    room.status = status;
    saveOperatingRooms(ors);

    addAuditLog({
      action: 'OR Status Update',
      entity: `OR ${orId}`,
      details: `Operating Room ${orId} status updated to ${status}.`
    });
    return room;
  }
  return null;
};


// ==========================================
// 4. STAFF HELPERS
// ==========================================
export const getStaff = () => getItem(KEYS.STAFF, []);
export const saveStaff = (staffList) => setItem(KEYS.STAFF, staffList);

export const addStaff = (staffData) => {
  enforceAdminOnly('add staff');
  const staffList = getStaff();
  const nextId = `STF-${100 + staffList.length + 1}`;
  const newMember = {
    staffId: staffData.staffId || nextId,
    name: staffData.name,
    role: staffData.role || 'Doctor',
    department: staffData.department || 'General Surgery',
    specialization: staffData.specialization || 'General',
    phone: staffData.phone || '555-0300',
    email: staffData.email || '',
    status: staffData.status || 'AVAILABLE',
    availableFrom: staffData.availableFrom || '08:00',
    availableTo: staffData.availableTo || '17:00'
  };

  staffList.push(newMember);
  saveStaff(staffList);

  addAuditLog({
    action: 'Staff Registered',
    entity: `Staff ${newMember.staffId}`,
    details: `Added new staff member ${newMember.name} (${newMember.role}).`
  });
  return newMember;
};

export const updateStaff = (staffId, updatedFields) => {
  enforceAdminOnly('update staff');
  const staffList = getStaff();
  const index = staffList.findIndex(s => s.staffId === staffId);
  if (index !== -1) {
    staffList[index] = { ...staffList[index], ...updatedFields };
    saveStaff(staffList);

    addAuditLog({
      action: 'Staff Updated',
      entity: `Staff ${staffId}`,
      details: `Updated info for ${staffList[index].name}.`
    });
    return staffList[index];
  }
  return null;
};

export const deleteStaff = (staffId) => {
  enforceAdminOnly('delete staff');
  const staffList = getStaff();
  const index = staffList.findIndex(s => s.staffId === staffId);
  if (index !== -1) {
    const deleted = staffList.splice(index, 1)[0];
    saveStaff(staffList);
    addAuditLog({
      action: 'Staff Deleted',
      entity: `Staff ${staffId}`,
      details: `Deleted staff member ${deleted.name}.`
    });
    return deleted;
  }
  return null;
};

// ==========================================
// 5. SURGERY HELPERS
// ==========================================
export const getSurgeries = () => getItem(KEYS.SURGERIES, []);
export const saveSurgeries = (surgeries) => setItem(KEYS.SURGERIES, surgeries);

export const addSurgery = (surgeryData) => {
  const surgeries = getSurgeries();
  const nextId = `SURG-2026-${100 + surgeries.length + 1}`;
  
  const priorityMap = { 1: 'EMERGENCY', 2: 'HIGH', 3: 'MEDIUM', 4: 'NORMAL' };
  const priorityNum = Number(surgeryData.priority) || 4;

  const newSurgery = {
    surgeryId: surgeryData.surgeryId || nextId,
    patientId: surgeryData.patientId || '',
    patientName: surgeryData.patientName || 'Unknown Patient',
    surgeryType: surgeryData.surgeryType || 'Surgical Procedure',
    orId: surgeryData.orId || 'OR-01',
    doctorId: surgeryData.doctorId || 'STF-101',
    doctorName: surgeryData.doctorName || 'Dr. Rajesh Kumar',
    department: surgeryData.department || 'General Surgery',
    startTime: surgeryData.startTime || new Date().toISOString(),
    endTime: surgeryData.endTime || new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    duration: Number(surgeryData.duration) || 60,
    priority: priorityNum,
    priorityLabel: priorityMap[priorityNum] || 'NORMAL',
    status: surgeryData.status || 'SCHEDULED',
    notes: surgeryData.notes || '',
    requiredEquipment: surgeryData.requiredEquipment || []
  };

  surgeries.unshift(newSurgery);
  saveSurgeries(surgeries);

  // Add notification
  addNotification({
    title: priorityNum === 1 ? '🚨 Emergency Surgery Scheduled' : '🏥 Surgery Scheduled',
    message: `Surgery ${newSurgery.surgeryId} (${newSurgery.surgeryType}) scheduled in ${newSurgery.orId} for ${newSurgery.patientName}.`,
    type: priorityNum === 1 ? 'EMERGENCY' : 'INFO'
  });

  addAuditLog({
    action: priorityNum === 1 ? 'Emergency Scheduled' : 'Surgery Scheduled',
    entity: `Surgery ${newSurgery.surgeryId}`,
    details: `Scheduled ${newSurgery.surgeryType} for ${newSurgery.patientName} in ${newSurgery.orId}.`
  });

  return newSurgery;
};

export const updateSurgery = (surgeryId, updatedFields) => {
  const surgeries = getSurgeries();
  const index = surgeries.findIndex(s => s.surgeryId === surgeryId);
  if (index !== -1) {
    surgeries[index] = { ...surgeries[index], ...updatedFields };
    saveSurgeries(surgeries);

    addAuditLog({
      action: 'Surgery Updated',
      entity: `Surgery ${surgeryId}`,
      details: `Updated surgery schedule/status for ${surgeries[index].surgeryId}.`
    });
    return surgeries[index];
  }
  return null;
};

export const deleteSurgery = (surgeryId) => {
  const surgeries = getSurgeries();
  const surgery = surgeries.find(s => s.surgeryId === surgeryId);
  if (surgery) {
    const filtered = surgeries.filter(s => s.surgeryId !== surgeryId);
    saveSurgeries(filtered);

    addAuditLog({
      action: 'Surgery Cancelled',
      entity: `Surgery ${surgeryId}`,
      details: `Cancelled surgery ${surgeryId} for ${surgery.patientName}.`
    });
    return true;
  }
  return false;
};

// ==========================================
// 6. NOTIFICATIONS HELPERS
// ==========================================
export const getNotifications = () => getItem(KEYS.NOTIFICATIONS, []);
export const saveNotifications = (notifs) => setItem(KEYS.NOTIFICATIONS, notifs);

export const addNotification = (notifData) => {
  const notifs = getNotifications();
  const newNotif = {
    notificationId: `NOTIF-${Date.now().toString().slice(-4)}`,
    title: notifData.title || 'System Notification',
    message: notifData.message || '',
    type: notifData.type || 'INFO',
    read: false,
    createdAt: new Date().toISOString()
  };

  notifs.unshift(newNotif);
  saveNotifications(notifs);
  return newNotif;
};

export const markNotificationRead = (notificationId) => {
  const notifs = getNotifications();
  const notif = notifs.find(n => n.notificationId === notificationId || n._id === notificationId);
  if (notif) {
    notif.read = true;
    saveNotifications(notifs);
  }
  return notifs;
};

// ==========================================
// 7. AUDIT LOG HELPERS
// ==========================================
export const getAuditLogs = () => getItem(KEYS.AUDIT_LOGS, []);
export const saveAuditLogs = (logs) => setItem(KEYS.AUDIT_LOGS, logs);

export const addAuditLog = ({ action, entity, details, user, role }) => {
  const currentUser = getItem(KEYS.CURRENT_USER, null);
  const logs = getAuditLogs();
  
  const newLog = {
    logId: `LOG-${1000 + logs.length + 1}`,
    timestamp: new Date().toISOString(),
    user: user || currentUser?.name || 'Hospital Administrator',
    role: role || currentUser?.role || 'admin',
    action: action || 'System Event',
    entity: entity || 'N/A',
    details: details || ''
  };

  logs.unshift(newLog);
  saveAuditLogs(logs);
  return newLog;
};

// ==========================================
// 8. USER AUTH HELPERS
// ==========================================
export const getUsers = () => getItem(KEYS.USERS, initialUsers);

export const authenticateUser = (email, password, role) => {
  const users = getUsers();
  const targetEmail = (email || '').trim().toLowerCase();
  const targetRole = (role || 'admin').trim().toLowerCase();

  const user = users.find(u => 
    u.email.toLowerCase() === targetEmail && 
    u.password === password && 
    u.role.toLowerCase() === targetRole
  );

  if (user) {
    const sessionUser = {
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      phone: user.phone
    };
    localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(sessionUser));
    
    addAuditLog({
      user: user.name,
      role: user.role,
      action: 'Login',
      entity: 'User Authentication',
      details: `User ${user.email} logged in successfully as ${user.role}.`
    });

    return sessionUser;
  }

  throw new Error('Invalid email, password, or role selection.');
};

export const getCurrentUser = () => {
  return getItem(KEYS.CURRENT_USER, null);
};

export const clearCurrentUser = () => {
  const currentUser = getCurrentUser();
  if (currentUser) {
    addAuditLog({
      user: currentUser.name,
      role: currentUser.role,
      action: 'Logout',
      entity: 'User Authentication',
      details: `User ${currentUser.email} logged out.`
    });
  }
  localStorage.removeItem(KEYS.CURRENT_USER);
};

// ==========================================
// 9. STAFF INSTRUCTION HELPERS
// ==========================================
export const getInstructions = () => getItem(KEYS.INSTRUCTIONS, initialInstructions);
export const saveInstructions = (instructions) => setItem(KEYS.INSTRUCTIONS, instructions);

export const createInstruction = (data) => {
  enforceAdminOnly('create instructions');
  const instructions = getInstructions();
  const currentUser = getCurrentUser();
  const nextId = `INST-${1000 + instructions.length + 1}`;

  const newInst = {
    instructionId: data.instructionId || nextId,
    title: data.title,
    description: data.description || '',
    assignedStaffId: data.assignedStaffId || '',
    assignedStaffName: data.assignedStaffName || 'Staff Member',
    priority: data.priority || 'Normal',
    dueDate: data.dueDate || '',
    createdBy: currentUser?.name || 'Hospital Administrator',
    createdAt: new Date().toISOString(),
    status: 'PENDING',
    completedAt: null,
    completedBy: null,
    completionMessage: null
  };

  instructions.unshift(newInst);
  saveInstructions(instructions);

  // Notification for assigned staff member (Requirement 13)
  addNotification({
    title: '🔔 New instruction from Admin',
    message: `Admin assigned instruction: "${newInst.title}"`,
    type: 'INFO',
    assignedStaffId: newInst.assignedStaffId,
    assignedStaffName: newInst.assignedStaffName
  });

  addAuditLog({
    action: 'Instruction Created',
    entity: `Instruction ${newInst.instructionId}`,
    details: `Assigned "${newInst.title}" to ${newInst.assignedStaffName}.`
  });

  return newInst;
};

export const completeInstruction = (instructionId, completionMessage = '') => {
  const instructions = getInstructions();
  const currentUser = getCurrentUser();
  const inst = instructions.find(i => i.instructionId === instructionId);

  if (inst) {
    inst.status = 'COMPLETED';
    inst.completedAt = new Date().toISOString();
    inst.completedBy = currentUser?.name || inst.assignedStaffName || 'Staff Member';
    inst.completionMessage = completionMessage || '';

    saveInstructions(instructions);

    // Notification for Admin (Requirement 14)
    addNotification({
      title: 'Staff member completed an instruction.',
      message: `✓ ${inst.completedBy} completed: "${inst.title}". Done Message: "${completionMessage || 'Completed'}"`,
      type: 'SUCCESS',
      targetRole: 'admin'
    });

    addAuditLog({
      action: 'Instruction Completed',
      entity: `Instruction ${instructionId}`,
      details: `${inst.completedBy} completed instruction "${inst.title}". Done message: ${completionMessage}`
    });

    return inst;
  }
  return null;
};

export const getInstructionsForStaff = (staffUser) => {
  const instructions = getInstructions();
  if (!staffUser) return [];

  // Filter instructions assigned to the current staff member
  return instructions.filter(inst => {
    if (inst.assignedStaffId && staffUser.staffId && inst.assignedStaffId === staffUser.staffId) return true;
    if (inst.assignedStaffName && staffUser.name && inst.assignedStaffName.toLowerCase() === staffUser.name.toLowerCase()) return true;
    if (inst.assignedStaffEmail && staffUser.email && inst.assignedStaffEmail.toLowerCase() === staffUser.email.toLowerCase()) return true;
    // Demo user mapping: Nurse John Miller
    if (staffUser.email === 'staff@medischedule.com' && (inst.assignedStaffName === 'Nurse John Miller' || inst.assignedStaffId === 'STF-111')) return true;
    return false;
  });
};

// ==========================================
// 10. EQUIPMENT HELPERS
// ==========================================
export const getEquipment = () => getItem(KEYS.EQUIPMENT, initialEquipment);
export const saveEquipment = (equipmentList) => setItem(KEYS.EQUIPMENT, equipmentList);

export const addEquipment = (data) => {
  enforceAdminOnly('add equipment');
  const equipmentList = getEquipment();
  const nextId = data.equipmentId || `EQ-${String(equipmentList.length + 1).padStart(3, '0')}`;
  const todayStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  const newEquipment = {
    equipmentId: nextId,
    name: data.name,
    category: data.category || 'Critical Care',
    location: data.location || 'Central Supply',
    status: data.status || 'AVAILABLE',
    currentAssignment: data.currentAssignment || (data.status === 'IN USE' ? data.location : '—'),
    lastUpdated: data.lastUpdated || todayStr,
    maintenanceDetails: data.maintenanceDetails || '',
    repairStatus: data.repairStatus || (data.status === 'UNDER REPAIR' ? 'In Repair' : ''),
    repairReason: data.repairReason || '',
    reportedDate: data.reportedDate || (data.status === 'UNDER REPAIR' ? todayStr : ''),
    expectedAvailability: data.expectedAvailability || '',
    maintenanceDate: data.maintenanceDate || (data.status === 'MAINTENANCE' ? todayStr : '')
  };

  equipmentList.unshift(newEquipment);
  saveEquipment(equipmentList);

  addAuditLog({
    action: 'Equipment Added',
    entity: `Equipment ${newEquipment.equipmentId}`,
    details: `Added new equipment "${newEquipment.name}" (${newEquipment.category}) in ${newEquipment.location}.`
  });

  return newEquipment;
};

export const updateEquipment = (equipmentId, updatedFields) => {
  enforceAdminOnly('update equipment');
  const equipmentList = getEquipment();
  const index = equipmentList.findIndex(e => e.equipmentId === equipmentId);

  if (index !== -1) {
    const oldItem = equipmentList[index];
    const todayStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

    let auditAction = 'Equipment Updated';

    if (updatedFields.status && updatedFields.status !== oldItem.status) {
      if (updatedFields.status === 'UNDER REPAIR') {
        auditAction = 'Equipment Marked Under Repair';
      } else if (updatedFields.status === 'MAINTENANCE') {
        auditAction = 'Equipment Marked Maintenance';
      } else if (updatedFields.status === 'AVAILABLE') {
        auditAction = 'Equipment Marked Available';
      } else {
        auditAction = 'Equipment Status Changed';
      }

      if (updatedFields.status === 'UNDER REPAIR' || updatedFields.status === 'MAINTENANCE') {
        addNotification({
          title: `⚠️ Equipment Status: ${updatedFields.status}`,
          message: `Equipment ${equipmentId} (${oldItem.name}) in ${updatedFields.location || oldItem.location} changed status to ${updatedFields.status}.`,
          type: 'WARNING'
        });
      }
    } else if (updatedFields.currentAssignment !== undefined && updatedFields.currentAssignment !== oldItem.currentAssignment) {
      auditAction = 'Equipment Assigned';
    }

    const updatedItem = {
      ...oldItem,
      ...updatedFields,
      lastUpdated: todayStr
    };

    equipmentList[index] = updatedItem;
    saveEquipment(equipmentList);

    addAuditLog({
      action: auditAction,
      entity: `Equipment ${equipmentId}`,
      details: `Updated ${updatedItem.name} (${equipmentId}): Status is ${updatedItem.status}, Location: ${updatedItem.location}, Assignment: ${updatedItem.currentAssignment}.`
    });

    return updatedItem;
  }
  return null;
};

export const deleteEquipment = (equipmentId) => {
  enforceAdminOnly('delete equipment');
  const equipmentList = getEquipment();
  const index = equipmentList.findIndex(e => e.equipmentId === equipmentId);

  if (index !== -1) {
    const deleted = equipmentList.splice(index, 1)[0];
    saveEquipment(equipmentList);

    addAuditLog({
      action: 'Equipment Deleted',
      entity: `Equipment ${equipmentId}`,
      details: `Deleted equipment record for ${deleted.name} (${equipmentId}).`
    });

    return deleted;
  }
  return null;
};


