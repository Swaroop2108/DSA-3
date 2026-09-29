import React from 'react';
import DSAVisualizer from '../components/DSAVisualizer';
import { Cpu, Zap, Clock, ShieldAlert, CheckCircle, Code } from 'lucide-react';

const DSAEngine = () => {
  const dsaConcepts = [
    {
      title: 'Priority Queue (Heap-Based)',
      purpose: 'Prioritize Emergency, High, Medium, and Normal priority patients for bed and surgery allocation.',
      complexity: 'Insertion: O(log N) | Removal: O(log N) | Peek: O(1)',
      input: 'Unordered Patient Objects with Priority Ranks (EMERGENCY=1, HIGH=2, MEDIUM=3, NORMAL=4) and admission timestamp.',
      output: 'Max-Priority extracted Patient Object with highest urgency served first.',
      useInProject: 'Maintains the patient waiting list so Emergency patients (Priority 1) are scheduled before elective cases, resolving ties using FIFO admission dates.'
    },
    {
      title: 'Min-Heap Earliest Slot Finder',
      purpose: 'Efficiently locate the earliest available Operating Room and Doctor time slot across multiple candidate surgical suites.',
      complexity: 'Push Slot: O(log M) | Poll Earliest: O(log M) where M = number of candidate ORs.',
      input: 'Operating Room candidate list, target surgery duration, doctor shift schedules.',
      output: 'Optimal non-conflicting time slot [startTime, endTime] with minimum start datetime.',
      useInProject: 'Powers the "Find Best Slot" feature when scheduling surgeries, testing 15-minute interval offsets and prioritizing earlier open slots.'
    },
    {
      title: 'Interval Scheduling & Overlap Detection',
      purpose: 'Prevent overlapping surgery procedures in the same Operating Room or with the same Doctor.',
      complexity: 'Overlap Check: O(1) per interval pair | Sort Intervals: O(N log N)',
      input: 'Time intervals [Start_A, End_A] and [Start_B, End_B].',
      output: 'Boolean overlap indicator: max(Start_A, Start_B) < min(End_A, End_B).',
      useInProject: 'Validates all new surgery requests and reschedule attempts against existing DB schedules, doctor working hours, and OR maintenance windows.'
    },
    {
      title: 'Greedy Allocation Strategy',
      purpose: 'Select locally optimal Operating Rooms matching department specialization and required equipment.',
      complexity: 'O(R * E) where R = number of ORs and E = equipment requirements.',
      input: 'Required surgical equipment list (e.g. Laparoscopic Tower, C-Arm Fluoroscopy) and department.',
      output: 'Filtered list of eligible non-maintenance Operating Rooms.',
      useInProject: 'Ensures cardiac surgeries are matched to Cardiac ORs with heart-lung bypass equipment, avoiding improper room assignment.'
    },
    {
      title: 'Emergency Preemption Engine',
      purpose: 'Handle urgent Emergency patient arrivals when all Operating Rooms are currently occupied.',
      complexity: 'O(S) where S = number of active overlapping scheduled surgeries.',
      input: 'Emergency Patient Request (Priority 1) and requested emergency window.',
      output: 'Preemption proposal identifying lowest priority candidate surgery for rescheduling.',
      useInProject: 'Preempts elective Normal/Medium priority surgeries for emergency cases, automatically proposing delayed replacement slots and notifying admins.'
    }
  ];

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Cpu size={28} style={{ color: 'var(--primary)' }} /> DSA Engine & Algorithmic Architecture
          </h1>
          <p className="page-subtitle">Demonstrating Data Structures & Algorithms (DSA-3) in MediSchedule.</p>
        </div>
      </div>

      {/* Interactive Demonstration Stepper Component */}
      <div style={{ marginBottom: '2rem' }}>
        <DSAVisualizer />
      </div>

      {/* Concept Breakdown Grid */}
      <h2 style={{ fontSize: '1.3rem', marginBottom: '1.25rem', color: 'var(--text-main)' }}>
        📚 Core Data Structures & Algorithms Breakdown
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {dsaConcepts.map((item, idx) => (
          <div key={idx} className="card" style={{ borderLeft: '4px solid var(--primary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
              <h3 style={{ fontSize: '1.15rem', color: 'var(--primary-text)' }}>
                {idx + 1}. {item.title}
              </h3>
              <span className="badge badge-scheduled" style={{ fontFamily: 'var(--font-mono)' }}>
                {item.complexity}
              </span>
            </div>

            <p style={{ color: 'var(--text-main)', fontSize: '0.92rem', marginBottom: '0.85rem' }}>
              <strong>Purpose:</strong> {item.purpose}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', background: '#f8fafc', padding: '0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontSize: '0.85rem' }}>
              <div><strong>Input:</strong> {item.input}</div>
              <div><strong>Output:</strong> {item.output}</div>
              <div style={{ gridColumn: 'span 2' }}>
                <strong style={{ color: 'var(--primary)' }}>How Used in MediSchedule Project:</strong> {item.useInProject}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DSAEngine;
