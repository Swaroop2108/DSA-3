const bcrypt = require('bcryptjs');
const memoryStore = require('../models/memoryStore');
const mongoose = require('mongoose');

const sampleUsers = [
  {
    name: 'Hospital Administrator',
    email: 'admin@medischedule.com',
    password: 'admin123',
    role: 'Admin',
    department: 'Hospital Administration',
    phone: '+1-555-0100'
  },
  {
    name: 'Nurse John Miller',
    email: 'staff@medischedule.com',
    password: 'staff123',
    role: 'Staff',
    department: 'Surgical Nursing',
    phone: '+1-555-0101'
  }
];

const samplePatients = [
  { patientId: 'PAT-2026-1001', name: 'Robert Vance', age: 62, gender: 'Male', phone: '555-0191', email: 'rvance@gmail.com', diagnosis: 'Acute Appendicitis', priority: 1, priorityLabel: 'EMERGENCY', surgeryRequired: true, surgeryType: 'Appendectomy', expectedSurgeryDuration: 60, doctor: 'Dr. Rajesh Kumar', department: 'General Surgery', status: 'ADMITTED', bedId: 'EMG-01' },
  { patientId: 'PAT-2026-1002', name: 'Elena Rostova', age: 45, gender: 'Female', phone: '555-0192', email: 'elena.r@yahoo.com', diagnosis: 'Coronary Artery Blockage', priority: 1, priorityLabel: 'EMERGENCY', surgeryRequired: true, surgeryType: 'Coronary Artery Bypass (CABG)', expectedSurgeryDuration: 180, doctor: 'Dr. Vikram Sharma', department: 'Cardiology', status: 'SCHEDULED', bedId: 'ICU-01' },
  { patientId: 'PAT-2026-1003', name: 'Michael Chang', age: 29, gender: 'Male', phone: '555-0193', email: 'mchang@tech.io', diagnosis: 'Compound Femur Fracture', priority: 2, priorityLabel: 'HIGH', surgeryRequired: true, surgeryType: 'Open Reduction Internal Fixation', expectedSurgeryDuration: 120, doctor: 'Dr. Anita Desai', department: 'Orthopedics', status: 'ADMITTED', bedId: 'GEN-01' },
  { patientId: 'PAT-2026-1004', name: 'Sophia Patel', age: 34, gender: 'Female', phone: '555-0194', email: 'spatel@outcomes.org', diagnosis: 'Gallbladder Stones', priority: 3, priorityLabel: 'MEDIUM', surgeryRequired: true, surgeryType: 'Laparoscopic Cholecystectomy', expectedSurgeryDuration: 90, doctor: 'Dr. Rajesh Kumar', department: 'General Surgery', status: 'SCHEDULED', bedId: 'PRV-01' },
  { patientId: 'PAT-2026-1005', name: 'David Miller', age: 58, gender: 'Male', phone: '555-0195', email: 'dmiller@company.com', diagnosis: 'Inguinal Hernia', priority: 4, priorityLabel: 'NORMAL', surgeryRequired: true, surgeryType: 'Hernia Repair', expectedSurgeryDuration: 60, doctor: 'Dr. Sanjay Gupta', department: 'General Surgery', status: 'WAITING', bedId: null },
  { patientId: 'PAT-2026-1006', name: 'Priya Sharma', age: 51, gender: 'Female', phone: '555-0196', email: 'priya.s@gmail.com', diagnosis: 'Degenerative Knee Osteoarthritis', priority: 3, priorityLabel: 'MEDIUM', surgeryRequired: true, surgeryType: 'Total Knee Arthroplasty', expectedSurgeryDuration: 120, doctor: 'Dr. Anita Desai', department: 'Orthopedics', status: 'SCHEDULED', bedId: 'GEN-02' },
  { patientId: 'PAT-2026-1007', name: 'James Wilson', age: 71, gender: 'Male', phone: '555-0197', email: 'jwilson@oldnet.com', diagnosis: 'Severe Subdural Hematoma', priority: 1, priorityLabel: 'EMERGENCY', surgeryRequired: true, surgeryType: 'Emergency Craniotomy', expectedSurgeryDuration: 150, doctor: 'Dr. Emily Watson', department: 'Neurology', status: 'ADMITTED', bedId: 'ICU-02' },
  { patientId: 'PAT-2026-1008', name: 'Aarav Mehta', age: 12, gender: 'Male', phone: '555-0198', email: 'amehta.parent@gmail.com', diagnosis: 'Acute Tonsillitis', priority: 4, priorityLabel: 'NORMAL', surgeryRequired: false, surgeryType: 'N/A', expectedSurgeryDuration: 0, doctor: 'Dr. Sanjay Gupta', department: 'Pediatrics', status: 'WAITING', bedId: null },
  { patientId: 'PAT-2026-1009', name: 'Chloe Bennett', age: 41, gender: 'Female', phone: '555-0199', email: 'cbennett@work.com', diagnosis: 'Thyroid Nodule', priority: 4, priorityLabel: 'NORMAL', surgeryRequired: true, surgeryType: 'Partial Thyroidectomy', expectedSurgeryDuration: 90, doctor: 'Dr. Rajesh Kumar', department: 'General Surgery', status: 'WAITING', bedId: null },
  { patientId: 'PAT-2026-1010', name: 'Vikramaditya Rao', age: 67, gender: 'Male', phone: '555-0200', email: 'vrao@finance.in', diagnosis: 'Aortic Valve Stenosis', priority: 2, priorityLabel: 'HIGH', surgeryRequired: true, surgeryType: 'Aortic Valve Replacement', expectedSurgeryDuration: 210, doctor: 'Dr. Vikram Sharma', department: 'Cardiology', status: 'ADMITTED', bedId: 'ICU-03' },
  { patientId: 'PAT-2026-1011', name: 'Grace Taylor', age: 26, gender: 'Female', phone: '555-0201', email: 'gtaylor@art.com', diagnosis: 'Ovarian Cyst Rupture', priority: 1, priorityLabel: 'EMERGENCY', surgeryRequired: true, surgeryType: 'Laparotomy', expectedSurgeryDuration: 75, doctor: 'Dr. Sarah Jenkins', department: 'Gynecology', status: 'SCHEDULED', bedId: 'EMG-02' },
  { patientId: 'PAT-2026-1012', name: 'Karan Malhotra', age: 38, gender: 'Male', phone: '555-0202', email: 'karan.m@agency.com', diagnosis: 'Lumbar Disc Herniation', priority: 3, priorityLabel: 'MEDIUM', surgeryRequired: true, surgeryType: 'Microdiscectomy', expectedSurgeryDuration: 105, doctor: 'Dr. Emily Watson', department: 'Neurology', status: 'ADMITTED', bedId: 'PRV-02' },
  { patientId: 'PAT-2026-1013', name: 'Hannah Abbott', age: 83, gender: 'Female', phone: '555-0203', email: 'habbott@care.org', diagnosis: 'Hip Fracture (Femoral Neck)', priority: 2, priorityLabel: 'HIGH', surgeryRequired: true, surgeryType: 'Hemiarthroplasty', expectedSurgeryDuration: 90, doctor: 'Dr. Anita Desai', department: 'Orthopedics', status: 'ADMITTED', bedId: 'GEN-03' },
  { patientId: 'PAT-2026-1014', name: 'Tariq Al-Mansoor', age: 49, gender: 'Male', phone: '555-0204', email: 'tariq@gulf.ae', diagnosis: 'Renal Calculus (Kidney Stone)', priority: 3, priorityLabel: 'MEDIUM', surgeryRequired: true, surgeryType: 'Laser Lithotripsy', expectedSurgeryDuration: 60, doctor: 'Dr. Sanjay Gupta', department: 'Urology', status: 'WAITING', bedId: null },
  { patientId: 'PAT-2026-1015', name: 'Jessica Alba', age: 31, gender: 'Female', phone: '555-0205', email: 'jessica@studio.com', diagnosis: 'Acute Trauma (Motorcycle Accident)', priority: 1, priorityLabel: 'EMERGENCY', surgeryRequired: true, surgeryType: 'Emergency Abdominal Trauma Surgery', expectedSurgeryDuration: 120, doctor: 'Dr. Rajesh Kumar', department: 'Emergency', status: 'ADMITTED', bedId: 'EMG-03' },
  { patientId: 'PAT-2026-1016', name: 'Siddharth Nair', age: 55, gender: 'Male', phone: '555-0206', email: 'snair@corp.com', diagnosis: 'Cataract', priority: 4, priorityLabel: 'NORMAL', surgeryRequired: true, surgeryType: 'Phacoemulsification', expectedSurgeryDuration: 45, doctor: 'Dr. Sarah Jenkins', department: 'Ophthalmology', status: 'DISCHARGED', bedId: null },
  { patientId: 'PAT-2026-1017', name: 'Maria Garcia', age: 60, gender: 'Female', phone: '555-0207', email: 'mgarcia@latam.org', diagnosis: 'Diabetic Foot Ulcer Debridement', priority: 3, priorityLabel: 'MEDIUM', surgeryRequired: true, surgeryType: 'Surgical Debridement', expectedSurgeryDuration: 60, doctor: 'Dr. Sanjay Gupta', department: 'General Surgery', status: 'ADMITTED', bedId: 'GEN-04' },
  { patientId: 'PAT-2026-1018', name: 'Nathaniel Cole', age: 47, gender: 'Male', phone: '555-0208', email: 'ncole@ventures.co', diagnosis: 'Rotator Cuff Tear', priority: 4, priorityLabel: 'NORMAL', surgeryRequired: true, surgeryType: 'Arthroscopic Rotator Cuff Repair', expectedSurgeryDuration: 90, doctor: 'Dr. Anita Desai', department: 'Orthopedics', status: 'WAITING', bedId: null },
  { patientId: 'PAT-2026-1019', name: 'Zoya Khan', age: 23, gender: 'Female', phone: '555-0209', email: 'zkhan@university.edu', diagnosis: 'Ankle Ligament Rupture', priority: 4, priorityLabel: 'NORMAL', surgeryRequired: false, surgeryType: 'N/A', expectedSurgeryDuration: 0, doctor: 'Dr. Anita Desai', department: 'Orthopedics', status: 'WAITING', bedId: null },
  { patientId: 'PAT-2026-1020', name: 'Benjamin Franklin', age: 77, gender: 'Male', phone: '555-0210', email: 'bfranklin@history.org', diagnosis: 'Carotid Artery Stenosis', priority: 2, priorityLabel: 'HIGH', surgeryRequired: true, surgeryType: 'Carotid Endarterectomy', expectedSurgeryDuration: 120, doctor: 'Dr. Vikram Sharma', department: 'Cardiology', status: 'SCHEDULED', bedId: 'ICU-04' }
];

const sampleBeds = [
  // ICU WARD
  { bedId: 'ICU-01', ward: 'ICU', floor: '3rd Floor', type: 'ICU', status: 'OCCUPIED', equipment: ['Ventilator', 'ECG Monitor', 'Infusion Pump'], assignedPatientId: 'PAT-2026-1002', assignedPatientName: 'Elena Rostova', assignedDate: new Date() },
  { bedId: 'ICU-02', ward: 'ICU', floor: '3rd Floor', type: 'ICU', status: 'OCCUPIED', equipment: ['Ventilator', 'Intracranial Pressure Monitor'], assignedPatientId: 'PAT-2026-1007', assignedPatientName: 'James Wilson', assignedDate: new Date() },
  { bedId: 'ICU-03', ward: 'ICU', floor: '3rd Floor', type: 'ICU', status: 'OCCUPIED', equipment: ['Ventilator', 'Telemetry System'], assignedPatientId: 'PAT-2026-1010', assignedPatientName: 'Vikramaditya Rao', assignedDate: new Date() },
  { bedId: 'ICU-04', ward: 'ICU', floor: '3rd Floor', type: 'ICU', status: 'OCCUPIED', equipment: ['Ventilator', 'Arterial Line'], assignedPatientId: 'PAT-2026-1020', assignedPatientName: 'Benjamin Franklin', assignedDate: new Date() },
  { bedId: 'ICU-05', ward: 'ICU', floor: '3rd Floor', type: 'ICU', status: 'AVAILABLE', equipment: ['Ventilator', 'ECG Monitor'], assignedPatientId: null, assignedPatientName: null },
  { bedId: 'ICU-06', ward: 'ICU', floor: '3rd Floor', type: 'ICU', status: 'MAINTENANCE', equipment: ['Ventilator (Servicing)'], assignedPatientId: null, assignedPatientName: null },

  // EMERGENCY WARD
  { bedId: 'EMG-01', ward: 'EMERGENCY', floor: '1st Floor', type: 'EMERGENCY', status: 'OCCUPIED', equipment: ['Defibrillator', 'Suction Machine'], assignedPatientId: 'PAT-2026-1001', assignedPatientName: 'Robert Vance', assignedDate: new Date() },
  { bedId: 'EMG-02', ward: 'EMERGENCY', floor: '1st Floor', type: 'EMERGENCY', status: 'OCCUPIED', equipment: ['Crash Cart', 'Oxygen Line'], assignedPatientId: 'PAT-2026-1011', assignedPatientName: 'Grace Taylor', assignedDate: new Date() },
  { bedId: 'EMG-03', ward: 'EMERGENCY', floor: '1st Floor', type: 'EMERGENCY', status: 'OCCUPIED', equipment: ['Trauma Monitor', 'Defibrillator'], assignedPatientId: 'PAT-2026-1015', assignedPatientName: 'Jessica Alba', assignedDate: new Date() },
  { bedId: 'EMG-04', ward: 'EMERGENCY', floor: '1st Floor', type: 'EMERGENCY', status: 'AVAILABLE', equipment: ['Crash Cart', 'Oxygen Line'], assignedPatientId: null, assignedPatientName: null },
  { bedId: 'EMG-05', ward: 'EMERGENCY', floor: '1st Floor', type: 'EMERGENCY', status: 'AVAILABLE', equipment: ['Defibrillator'], assignedPatientId: null, assignedPatientName: null },

  // GENERAL WARD
  { bedId: 'GEN-01', ward: 'GENERAL', floor: '2nd Floor', type: 'GENERAL', status: 'OCCUPIED', equipment: ['IV Stand', 'Call Button'], assignedPatientId: 'PAT-2026-1003', assignedPatientName: 'Michael Chang', assignedDate: new Date() },
  { bedId: 'GEN-02', ward: 'GENERAL', floor: '2nd Floor', type: 'GENERAL', status: 'OCCUPIED', equipment: ['IV Stand', 'Adjustable Bed'], assignedPatientId: 'PAT-2026-1006', assignedPatientName: 'Priya Sharma', assignedDate: new Date() },
  { bedId: 'GEN-03', ward: 'GENERAL', floor: '2nd Floor', type: 'GENERAL', status: 'OCCUPIED', equipment: ['Traction Frame'], assignedPatientId: 'PAT-2026-1013', assignedPatientName: 'Hannah Abbott', assignedDate: new Date() },
  { bedId: 'GEN-04', ward: 'GENERAL', floor: '2nd Floor', type: 'GENERAL', status: 'OCCUPIED', equipment: ['IV Stand'], assignedPatientId: 'PAT-2026-1017', assignedPatientName: 'Maria Garcia', assignedDate: new Date() },
  { bedId: 'GEN-05', ward: 'GENERAL', floor: '2nd Floor', type: 'GENERAL', status: 'AVAILABLE', equipment: ['Standard Medical Bed'], assignedPatientId: null, assignedPatientName: null },
  { bedId: 'GEN-06', ward: 'GENERAL', floor: '2nd Floor', type: 'GENERAL', status: 'AVAILABLE', equipment: ['Standard Medical Bed'], assignedPatientId: null, assignedPatientName: null },
  { bedId: 'GEN-07', ward: 'GENERAL', floor: '2nd Floor', type: 'GENERAL', status: 'MAINTENANCE', equipment: ['Hydraulic Pump Disrepair'], assignedPatientId: null, assignedPatientName: null },

  // PRIVATE WARD
  { bedId: 'PRV-01', ward: 'PRIVATE', floor: '4th Floor', type: 'PRIVATE', status: 'OCCUPIED', equipment: ['Private Bath', 'ECG', 'TV'], assignedPatientId: 'PAT-2026-1004', assignedPatientName: 'Sophia Patel', assignedDate: new Date() },
  { bedId: 'PRV-02', ward: 'PRIVATE', floor: '4th Floor', type: 'PRIVATE', status: 'OCCUPIED', equipment: ['Private Bath', 'Recliner'], assignedPatientId: 'PAT-2026-1012', assignedPatientName: 'Karan Malhotra', assignedDate: new Date() },
  { bedId: 'PRV-03', ward: 'PRIVATE', floor: '4th Floor', type: 'PRIVATE', status: 'RESERVED', equipment: ['Executive Suite Setup'], assignedPatientId: null, assignedPatientName: null },
  { bedId: 'PRV-04', ward: 'PRIVATE', floor: '4th Floor', type: 'PRIVATE', status: 'AVAILABLE', equipment: ['Private Suite'], assignedPatientId: null, assignedPatientName: null }
];

const sampleORs = [
  { orId: 'OR-01', name: 'OR-01 General Surgery Suite', department: 'General Surgery', status: 'AVAILABLE', equipment: ['Laparoscopic Tower', 'Anesthesia Workstation', 'Cautery Machine', 'Electrosurgical Unit'] },
  { orId: 'OR-02', name: 'OR-02 Cardiac Operating Theatre', department: 'Cardiology', status: 'OCCUPIED', equipment: ['Heart-Lung Bypass Machine', 'Transesophageal Echocardiogram', 'Intra-Aortic Balloon Pump'] },
  { orId: 'OR-03', name: 'OR-03 Orthopedic Suite', department: 'Orthopedics', status: 'AVAILABLE', equipment: ['C-Arm Fluoroscopy Machine', 'Orthopedic Surgery Table', 'Surgical Drill System'] },
  { orId: 'OR-04', name: 'OR-04 Neurosurgery Suite', department: 'Neurology', status: 'AVAILABLE', equipment: ['Surgical Microscope', 'Stereotactic Navigation System', 'Ultrasonic Aspirator'] },
  { orId: 'OR-05', name: 'OR-05 Trauma & Emergency Suite', department: 'Emergency', status: 'AVAILABLE', equipment: ['Rapid Infuser System', 'Cell Saver Machine', 'Defibrillator', 'Mobile X-Ray'] }
];

const sampleStaff = [
  { staffId: 'STF-101', name: 'Dr. Rajesh Kumar', role: 'Surgeon', department: 'General Surgery', specialization: 'Laparoscopic & Emergency Surgery', phone: '555-0301', email: 'rkumar@medischedule.com', status: 'AVAILABLE', availableFrom: '08:00', availableTo: '18:00' },
  { staffId: 'STF-102', name: 'Dr. Vikram Sharma', role: 'Surgeon', department: 'Cardiology', specialization: 'Cardiothoracic Surgery', phone: '555-0302', email: 'vsharma@medischedule.com', status: 'BUSY', availableFrom: '08:00', availableTo: '19:00' },
  { staffId: 'STF-103', name: 'Dr. Anita Desai', role: 'Surgeon', department: 'Orthopedics', specialization: 'Joint Replacement & Trauma', phone: '555-0303', email: 'adesai@medischedule.com', status: 'AVAILABLE', availableFrom: '09:00', availableTo: '17:00' },
  { staffId: 'STF-104', name: 'Dr. Emily Watson', role: 'Surgeon', department: 'Neurology', specialization: 'Cerebrovascular & Brain Trauma', phone: '555-0304', email: 'ewatson@medischedule.com', status: 'AVAILABLE', availableFrom: '08:00', availableTo: '16:00' },
  { staffId: 'STF-105', name: 'Dr. Sanjay Gupta', role: 'Doctor', department: 'General Surgery', specialization: 'Hernia & Gastrointestinal', phone: '555-0305', email: 'sgupta@medischedule.com', status: 'AVAILABLE', availableFrom: '08:30', availableTo: '17:30' },
  { staffId: 'STF-106', name: 'Dr. Sarah Jenkins', role: 'Surgeon', department: 'Gynecology', specialization: 'Minimally Invasive Gynecology', phone: '555-0306', email: 'sjenkins@medischedule.com', status: 'AVAILABLE', availableFrom: '09:00', availableTo: '18:00' },
  { staffId: 'STF-107', name: 'Dr. Marcus Vance', role: 'Anesthetist', department: 'Anesthesiology', specialization: 'Neuro & Cardiac Anesthesia', phone: '555-0307', email: 'mvance@medischedule.com', status: 'AVAILABLE', availableFrom: '07:00', availableTo: '19:00' },
  { staffId: 'STF-108', name: 'Nurse Clara Oswald', role: 'Nurse', department: 'Operating Room', specialization: 'Scrub Nurse Lead', phone: '555-0308', email: 'coswald@medischedule.com', status: 'AVAILABLE', availableFrom: '07:30', availableTo: '16:30' },
  { staffId: 'STF-109', name: 'Technician David Lee', role: 'Technician', department: 'Biomedical', specialization: 'Surgical Equipment Specialist', phone: '555-0309', email: 'dlee@medischedule.com', status: 'AVAILABLE', availableFrom: '08:00', availableTo: '17:00' },
  { staffId: 'STF-110', name: 'Nurse Rebecca Roy', role: 'Nurse', department: 'Emergency', specialization: 'Triage & Critical Care Nurse', phone: '555-0310', email: 'rroy@medischedule.com', status: 'AVAILABLE', availableFrom: '08:00', availableTo: '20:00' }
];

const now = new Date();
const today0900 = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0, 0);
const today1030 = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 30, 0);
const today1100 = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 11, 0, 0);
const today1200 = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);
const today1300 = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 13, 0, 0);
const today1400 = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 14, 0, 0);
const today1515 = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 15, 15, 0);
const today1530 = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 15, 30, 0);
const today1730 = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 17, 30, 0);

const sampleSurgeries = [
  {
    surgeryId: 'SURG-2026-101',
    patientId: 'PAT-2026-1002',
    patientName: 'Elena Rostova',
    surgeryType: 'Coronary Artery Bypass (CABG)',
    orId: 'OR-02',
    doctorId: 'STF-102',
    doctorName: 'Dr. Vikram Sharma',
    department: 'Cardiology',
    startTime: today0900,
    endTime: today1400,
    duration: 300,
    priority: 1,
    priorityLabel: 'EMERGENCY',
    status: 'IN_PROGRESS',
    notes: 'Emergency CABG due to 95% left main stenosis.',
    requiredEquipment: ['Heart-Lung Bypass Machine']
  },
  {
    surgeryId: 'SURG-2026-104',
    patientId: 'PAT-2026-1004',
    patientName: 'Sophia Patel',
    surgeryType: 'Laparoscopic Cholecystectomy',
    orId: 'OR-01',
    doctorId: 'STF-101',
    doctorName: 'Dr. Rajesh Kumar',
    department: 'General Surgery',
    startTime: today1030,
    endTime: today1200,
    duration: 90,
    priority: 3,
    priorityLabel: 'MEDIUM',
    status: 'SCHEDULED',
    notes: 'Elective gallbladder removal.',
    requiredEquipment: ['Laparoscopic Tower']
  },
  {
    surgeryId: 'SURG-2026-106',
    patientId: 'PAT-2026-1006',
    patientName: 'Priya Sharma',
    surgeryType: 'Total Knee Arthroplasty',
    orId: 'OR-03',
    doctorId: 'STF-103',
    doctorName: 'Dr. Anita Desai',
    department: 'Orthopedics',
    startTime: today1100,
    endTime: today1300,
    duration: 120,
    priority: 3,
    priorityLabel: 'MEDIUM',
    status: 'SCHEDULED',
    notes: 'Right knee replacement.',
    requiredEquipment: ['C-Arm Fluoroscopy Machine']
  },
  {
    surgeryId: 'SURG-2026-111',
    patientId: 'PAT-2026-1011',
    patientName: 'Grace Taylor',
    surgeryType: 'Laparotomy',
    orId: 'OR-05',
    doctorId: 'STF-106',
    doctorName: 'Dr. Sarah Jenkins',
    department: 'Gynecology',
    startTime: today1400,
    endTime: today1515,
    duration: 75,
    priority: 1,
    priorityLabel: 'EMERGENCY',
    status: 'SCHEDULED',
    notes: 'Urgent laparotomy for cyst rupture.',
    requiredEquipment: ['Rapid Infuser System']
  },
  {
    surgeryId: 'SURG-2026-120',
    patientId: 'PAT-2026-1020',
    patientName: 'Benjamin Franklin',
    surgeryType: 'Carotid Endarterectomy',
    orId: 'OR-04',
    doctorId: 'STF-104',
    doctorName: 'Dr. Emily Watson',
    department: 'Neurology',
    startTime: today1530,
    endTime: today1730,
    duration: 120,
    priority: 2,
    priorityLabel: 'HIGH',
    status: 'SCHEDULED',
    notes: 'Stroke prevention vascular procedure.',
    requiredEquipment: ['Surgical Microscope']
  }
];

const sampleAuditLogs = [
  { logId: 'LOG-1001', timestamp: new Date(Date.now() - 3600000 * 5), user: 'Dr. Sarah Connor', role: 'Admin', action: 'System Initialization', entity: 'System', details: 'MediSchedule backend database initialized.' },
  { logId: 'LOG-1002', timestamp: new Date(Date.now() - 3600000 * 4), user: 'Dr. Sarah Connor', role: 'Admin', action: 'Patient Registration', entity: 'Patient PAT-2026-1001', details: 'Registered Emergency patient Robert Vance.' },
  { logId: 'LOG-1003', timestamp: new Date(Date.now() - 3600000 * 3), user: 'Nurse John Miller', role: 'Staff', action: 'Bed Allocation', entity: 'Bed EMG-01', details: 'Allocated bed EMG-01 to Robert Vance.' },
  { logId: 'LOG-1004', timestamp: new Date(Date.now() - 3600000 * 2), user: 'Dr. Sarah Connor', role: 'Admin', action: 'Surgery Scheduled', entity: 'Surgery SURG-2026-101', details: 'Scheduled CABG for Elena Rostova in OR-02.' },
  { logId: 'LOG-1005', timestamp: new Date(Date.now() - 3600000 * 1), user: 'Dr. Sarah Connor', role: 'Admin', action: 'Emergency Handling', entity: 'Surgery SURG-2026-111', details: 'Triggered emergency preemption workflow for Grace Taylor.' }
];

const sampleNotifications = [
  { notificationId: 'NOTIF-01', title: '🚨 Emergency Patient Registered', message: 'Patient Grace Taylor registered with EMERGENCY priority.', type: 'EMERGENCY', read: false, createdAt: new Date(Date.now() - 1800000) },
  { notificationId: 'NOTIF-02', title: '🛏️ Bed Allocated', message: 'Bed ICU-01 allocated to patient Elena Rostova.', type: 'SUCCESS', read: false, createdAt: new Date(Date.now() - 3600000) },
  { notificationId: 'NOTIF-03', title: '🏥 Surgery Scheduled', message: 'Surgery SURG-2026-104 (Laparoscopic Cholecystectomy) scheduled for OR-01.', type: 'INFO', read: true, createdAt: new Date(Date.now() - 5400000) },
  { notificationId: 'NOTIF-04', title: '⚠️ Maintenance Alert', message: 'Bed GEN-07 marked under MAINTENANCE for hydraulic repair.', type: 'WARNING', read: false, createdAt: new Date(Date.now() - 7200000) }
];

async function seedDatabase() {
  console.log('🌱 Starting MediSchedule Seed Data process...');
  
  try {
    // Check if Mongoose connection is established
    if (mongoose.connection.readyState === 1) {
      console.log('Connecting to MongoDB Mongoose Models...');
      const User = require('../models/User');
      const Patient = require('../models/Patient');
      const Bed = require('../models/Bed');
      const OperatingRoom = require('../models/OperatingRoom');
      const Staff = require('../models/Staff');
      const Surgery = require('../models/Surgery');
      const AuditLog = require('../models/AuditLog');
      const Notification = require('../models/Notification');

      await User.deleteMany({});
      await Patient.deleteMany({});
      await Bed.deleteMany({});
      await OperatingRoom.deleteMany({});
      await Staff.deleteMany({});
      await Surgery.deleteMany({});
      await AuditLog.deleteMany({});
      await Notification.deleteMany({});

      // Hash passwords for users
      const hashedUsers = await Promise.all(sampleUsers.map(async u => ({
        ...u,
        password: await bcrypt.hash(u.password, 10)
      })));

      await User.insertMany(hashedUsers);
      await Patient.insertMany(samplePatients);
      await Bed.insertMany(sampleBeds);
      await OperatingRoom.insertMany(sampleORs);
      await Staff.insertMany(sampleStaff);
      await Surgery.insertMany(sampleSurgeries);
      await AuditLog.insertMany(sampleAuditLogs);
      await Notification.insertMany(sampleNotifications);

      console.log('✅ MongoDB database successfully seeded with realistic MediSchedule data!');
    } else {
      console.log('⚡ Populating In-Memory Fallback Store with seed dataset...');
      memoryStore.reset();
      
      for (const u of sampleUsers) {
        const hashedPassword = await bcrypt.hash(u.password, 10);
        memoryStore.users.push({ ...u, password: hashedPassword, _id: memoryStore.generateId('usr') });
      }

      memoryStore.patients = samplePatients.map(p => ({ ...p, _id: memoryStore.generateId('pat') }));
      memoryStore.beds = sampleBeds.map(b => ({ ...b, _id: memoryStore.generateId('bed') }));
      memoryStore.ors = sampleORs.map(o => ({ ...o, _id: memoryStore.generateId('or') }));
      memoryStore.staff = sampleStaff.map(s => ({ ...s, _id: memoryStore.generateId('stf') }));
      memoryStore.surgeries = sampleSurgeries.map(s => ({ ...s, _id: memoryStore.generateId('surg') }));
      memoryStore.auditLogs = sampleAuditLogs.map(a => ({ ...a, _id: memoryStore.generateId('log') }));
      memoryStore.notifications = sampleNotifications.map(n => ({ ...n, _id: memoryStore.generateId('ntf') }));

      memoryStore.isUsingMemory = true;
      console.log('✅ In-memory fallback store populated cleanly! (Total Patients: ' + memoryStore.patients.length + ', Beds: ' + memoryStore.beds.length + ')');
    }
  } catch (err) {
    console.error('❌ Error during seeding:', err);
  }
}

// Allow direct CLI running via `npm run seed`
if (require.main === module) {
  const connectDB = require('../config/db');
  connectDB().then(() => {
    console.log('Seed process finished.');
    process.exit(0);
  }).catch((err) => {
    console.error('Seed process failed:', err);
    process.exit(1);
  });
}

module.exports = seedDatabase;
