# MediSchedule - Smart Hospital Resource Management & Scheduling System (DSA-3)

A full-stack, production-ready web application built for college project demonstration integrating **Data Structures & Algorithms (DSA-3)** to optimize hospital resource management, patient priority queuing, bed allocation, Operating Room (OR) scheduling, staff assignment, and emergency preemption.

---

## 🌟 Project Objectives & Features

1. **Patient Registration & Priority Management**: Max-Priority Queue ordering (`EMERGENCY = 1` > `HIGH = 2` > `MEDIUM = 3` > `NORMAL = 4`). Ties broken by FIFO admission timestamp. Auto-generated unique patient IDs (`PAT-2026-XXXX`).
2. **Hospital Bed Allocation**: Grid visualization across ICU, Emergency, General, and Private Wards. Automated priority matching algorithm (Emergency beds reserved for Priority 1; ICU restricted to Priority 1 & 2).
3. **Operating Room (OR) Management**: Real-time suite availability, specialized equipment tracking, and OR schedule timelines.
4. **Surgery Scheduling Engine**: Powered by a **Min-Heap Greedy Slot Finder** discovering non-conflicting time slots in $O(\log M)$ time.
5. **Interval Scheduling & Conflict Detection**: Evaluates overlap condition $\max(S_1, S_2) < \min(E_1, E_2)$ to prevent double-booking ORs or surgeons.
6. **Emergency Preemption Engine**: Preempts lower-priority scheduled surgeries when no immediate OR slot exists for Emergency cases, generating automated rescheduling proposals for Admin review.
7. **Staff Availability Tracking**: Surgeon/Doctor working hours validation and shift management.
8. **Admin & Staff Dashboards**: Real-time stats, Recharts analytical graphs, Today's schedule, Emergency cases alert list, Recent Patients, and Audit activity logs.
9. **DSA Engine Interactive Visualizer**: Step-by-step interactive stepper demonstrating Priority Queue extraction & Min-Heap candidate slot selection for college project evaluation.
10. **Zero-Friction Fallback**: Connects to MongoDB when available, and automatically switches to an In-Memory Database Store if MongoDB is inactive, ensuring zero setup friction.

---

## 🛠️ Technology Stack

- **Frontend**: React.js 18, Vite, React Router 6, Recharts, Lucide Icons, Vanilla CSS Design Tokens.
- **Backend**: Node.js, Express.js REST API.
- **Database**: MongoDB & Mongoose (with seamless In-Memory Fallback).
- **Authentication**: JWT signed tokens & bcryptjs password hashing.
- **Roles**: Admin, Staff.

---

## 📂 Project Structure

```
hospital-scheduling/
├── backend/
│   ├── algorithms/
│   │   ├── PriorityQueue.js      # Max-Heap for Patient Urgency Queuing
│   │   ├── MinHeap.js            # Min-Heap for Earliest Available OR Slot Lookup
│   │   ├── IntervalScheduler.js  # Overlap Detection & Greedy Slot Finder
│   │   └── EmergencyPreemptor.js # Preemption Engine for Critical Emergency Cases
│   ├── config/
│   │   └── db.js                 # MongoDB connection & In-memory auto-fallback
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── patientController.js
│   │   ├── bedController.js
│   │   ├── orController.js
│   │   ├── staffController.js
│   │   ├── surgeryController.js
│   │   ├── schedulingController.js
│   │   ├── dashboardController.js
│   │   └── reportController.js
│   ├── middleware/
│   │   ├── authMiddleware.js     # JWT verification & Role guards
│   │   └── errorHandler.js
│   ├── models/
│   │   ├── User.js, Patient.js, Bed.js, OperatingRoom.js, Staff.js, Surgery.js, AuditLog.js, Notification.js
│   │   └── memoryStore.js        # In-memory storage adapter fallback
│   ├── routes/                   # Express API endpoints
│   ├── utils/
│   │   ├── dbHelper.js           # Unified MongoDB/Memory abstraction
│   │   └── seedData.js           # Seeds 20+ Patients, 20+ Beds, 5 ORs, 10+ Staff
│   ├── server.js
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Common/           # Navbar, Sidebar, Modal, StatCard, ToastContainer
│   │   │   ├── BedGrid.jsx
│   │   │   ├── ScheduleTimeline.jsx
│   │   │   └── DSAVisualizer.jsx # Interactive Queue & Heap Step Visualizer
│   │   ├── pages/
│   │   │   ├── Login.jsx, Dashboard.jsx, Patients.jsx, Beds.jsx, OperatingRooms.jsx
│   │   │   ├── Surgeries.jsx, EmergencyCenter.jsx, StaffPage.jsx, Conflicts.jsx
│   │   │   ├── Reports.jsx, DSAEngine.jsx, AuditLogs.jsx
│   │   ├── services/api.js
│   │   ├── context/AuthContext.jsx
│   │   ├── App.jsx, main.jsx, index.css
│   ├── package.json
│   └── vite.config.js
└── README.md
```

---

## ⚡ Quick Start & Installation

### 1. Backend Setup

```bash
cd backend
npm install
npm run dev
```

The backend server will start on `http://localhost:5000` and automatically populate seed data!

### 2. Frontend Setup

Open a second terminal window:

```bash
cd frontend
npm install
npm run dev
```

The React Vite application will open at `http://localhost:3000`!

---

## 🔑 Demo Credentials

| Role | Email | Password | Access Capabilities |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@medischedule.com` | `admin123` | Full system access, bed/OR creation, surgery cancellation, preemption execution, user management |
| **Staff** | `staff@medischedule.com` | `staff123` | Patient viewing & registration, bed allocation, surgery scheduling, notification viewing |

*(Note: The login page includes single-click **Autofill** buttons for instant testing!)*

---

## 🧮 Data Structures & Algorithms (DSA-3 Concepts)

1. **Max Priority Queue (Heap)**
   - **Time Complexity**: $O(\log N)$ push/pop.
   - **Usage**: Manages patient waiting queues by priority rank (`EMERGENCY = 1` > `HIGH = 2` > `MEDIUM = 3` > `NORMAL = 4`).
2. **Min Heap Earliest Slot Finder**
   - **Time Complexity**: $O(\log M)$ where $M$ is the candidate OR count.
   - **Usage**: Efficiently identifies earliest open surgical suite time slots.
3. **Interval Scheduling**
   - **Time Complexity**: $O(1)$ overlap test per pair.
   - **Usage**: Evaluates $[S_A, E_A] \cap [S_B, E_B]$ to prevent double-booking ORs or doctors.
4. **Greedy Resource Matching**
   - **Time Complexity**: $O(R \times E)$ where $R$ is OR count and $E$ is required equipment list.
   - **Usage**: Matches surgery requirements (e.g., Cardiac Bypass equipment) with specialized ORs.
5. **Emergency Preemption Algorithm**
   - **Time Complexity**: $O(S)$ where $S$ is active surgery count.
   - **Usage**: Preempts lower-priority surgeries for Emergency cases, generating automated rescheduling plans.

---

## 🎭 12 Presentation Demo Scenarios

1. **DEMO 1**: Register a normal priority patient (`NORMAL = 4`).
2. **DEMO 2**: Allocate an available bed matching priority and ward constraints.
3. **DEMO 3**: Click **"Find Best Slot"** on Surgery Scheduling page to run Min-Heap search.
4. **DEMO 4**: View real-time Operating Room schedule timelines.
5. **DEMO 5**: Intentionally schedule an overlapping surgery to trigger conflict detection.
6. **DEMO 6**: Navigate to **Conflicts** page and click **"Apply Auto-Suggestion"**.
7. **DEMO 7**: Register an Emergency patient (`EMERGENCY = 1`).
8. **DEMO 8**: Navigate to **Emergency Center** and run Emergency Preemption.
9. **DEMO 9**: View Max-Priority Queue re-ordering with Emergency at root rank #1.
10. **DEMO 10**: Verify lower-priority surgery automatically rescheduled with updated timeline.
11. **DEMO 11**: Observe Dashboard statistics & Recharts occupancy graphs updating dynamically.
12. **DEMO 12**: Open **DSA Engine** page and click **"Run Scheduling Engine"** for step-by-step algorithm animation.
