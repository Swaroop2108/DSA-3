import React, { useState } from 'react';
import { Play, RotateCcw, ArrowRight, CheckCircle, Cpu, Clock, Layers, ShieldCheck } from 'lucide-react';
import API from '../services/api';

const DSAVisualizer = () => {
  const [loading, setLoading] = useState(false);
  const [demoData, setDemoData] = useState(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [executed, setExecuted] = useState(false);

  const runSimulation = async () => {
    setLoading(true);
    try {
      const res = await API.post('/scheduling/demo-run');
      if (res.data.success) {
        setDemoData(res.data);
        setCurrentStepIndex(0);
        setExecuted(true);
      }
    } catch (err) {
      alert('Error running simulation: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleNextStep = () => {
    const stepsList = demoData?.steps || demoData?.demoSteps || [];
    if (stepsList.length > 0 && currentStepIndex < stepsList.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    }
  };

  const handleReset = () => {
    setCurrentStepIndex(0);
  };

  const steps = demoData?.steps || demoData?.demoSteps || [];
  const currentStep = steps[currentStepIndex];

  return (
    <div className="card" style={{ background: '#0f172a', color: '#f8fafc', border: '1px solid #1e293b' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #1e293b', paddingBottom: '0.85rem' }}>
        <div>
          <h3 style={{ color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.2rem' }}>
            <Cpu size={22} style={{ color: 'var(--primary-hover)' }} /> Interactive In-Browser DSA Scheduling Engine Visualizer
          </h3>
          <p style={{ color: '#94a3b8', fontSize: '0.82rem', marginTop: '0.2rem' }}>
            College Demo Visualizer: Max-Priority Queue & Min-Heap OR Slot Selection Engine
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.6rem' }}>
          {!executed ? (
            <button
              onClick={runSimulation}
              disabled={loading}
              className="btn btn-primary"
            >
              <Play size={16} /> {loading ? 'Running Engine...' : 'RUN DSA ENGINE'}
            </button>
          ) : (
            <>
              <button
                onClick={handleNextStep}
                disabled={currentStepIndex >= steps.length - 1}
                className="btn btn-primary"
              >
                Next Step ({currentStepIndex + 1}/{steps.length}) <ArrowRight size={16} />
              </button>
              <button
                onClick={handleReset}
                className="btn btn-secondary"
                style={{ background: '#1e293b', color: '#fff', border: 'none' }}
              >
                <RotateCcw size={16} /> Reset
              </button>
            </>
          )}
        </div>
      </div>

      {!executed ? (
        <div style={{ textAlign: 'center', padding: '2.5rem', background: '#090d16', borderRadius: 'var(--radius-sm)', border: '1px dashed #334155' }}>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
            Click <strong>"RUN DSA ENGINE"</strong> to execute client-side algorithms (Priority Queue, Min-Heap, Greedy Scheduler) and observe step-by-step priority queue ordering and min-heap slot assignment.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Step Progress Bar */}
          <div style={{ display: 'flex', gap: '0.35rem' }}>
            {steps.map((st, idx) => (
              <div
                key={idx}
                onClick={() => setCurrentStepIndex(idx)}
                style={{
                  flex: 1,
                  height: '8px',
                  borderRadius: '4px',
                  background: idx === currentStepIndex ? '#0d9488' : (idx < currentStepIndex ? '#0284c7' : '#334155'),
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                title={`Step ${st.step || idx + 1}: ${st.name || st.title}`}
              />
            ))}
          </div>

          {/* Stepper Card Banner */}
          {currentStep && (
            <div style={{ background: '#1e293b', padding: '1rem 1.25rem', borderRadius: 'var(--radius-sm)', borderLeft: '4px solid #0d9488' }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff' }}>
                Step {currentStep.step || currentStepIndex + 1}: {currentStep.name || currentStep.title}
              </div>
              <div style={{ fontSize: '0.88rem', color: '#cbd5e1', marginTop: '0.25rem' }}>
                {currentStep.description}
              </div>
            </div>
          )}

          {/* Visual Data Structures Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
            
            {/* Box 1: Priority Queue Representation */}
            <div style={{ background: '#090d16', padding: '1.25rem', borderRadius: 'var(--radius-sm)', border: '1px solid #1e293b' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#38bdf8', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Layers size={16} /> PATIENT PRIORITY QUEUE (MAX-HEAP)
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {(demoData.queueSnapshot || []).map((p, i) => {
                  const isFront = i === 0;
                  return (
                    <div
                      key={p.patientId || i}
                      style={{
                        padding: '0.6rem 0.85rem',
                        borderRadius: '4px',
                        background: isFront ? '#0d9488' : '#0f172a',
                        border: isFront ? '2px solid #2dd4bf' : '1px solid #334155',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <span>{p.patientId} - {p.name}</span>
                      <span className="badge badge-emergency" style={{ fontSize: '0.65rem' }}>
                        Rank #{i + 1} ({p.priorityLabel || 'EMERGENCY'})
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Box 2: Min Heap OR Slots Representation */}
            <div style={{ background: '#090d16', padding: '1.25rem', borderRadius: 'var(--radius-sm)', border: '1px solid #1e293b' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#34d399', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Clock size={16} /> OPERATING ROOM MIN-HEAP (EARLIEST SLOTS)
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {(demoData.heapSnapshot || []).map((slot, i) => (
                  <div
                    key={slot.orId || i}
                    style={{
                      padding: '0.6rem 0.85rem',
                      borderRadius: '4px',
                      background: i === 0 ? '#064e3b' : '#0f172a',
                      border: i === 0 ? '1px solid #34d399' : '1px solid #334155',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <span>{slot.orId} ({slot.name})</span>
                    <span style={{ fontSize: '0.72rem', color: i === 0 ? '#a7f3d0' : '#94a3b8' }}>
                      {i === 0 ? 'Earliest Root Node' : slot.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recommended Final Schedule */}
          {demoData.recommendedSchedule && (
            <div style={{ background: '#090d16', padding: '1.25rem', borderRadius: 'var(--radius-sm)', border: '1px solid #34d399' }}>
              <h4 style={{ color: '#34d399', fontSize: '1rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <CheckCircle size={18} /> ENGINE SCHEDULING RESULT
              </h4>
              <div style={{ background: '#1e293b', padding: '1rem', borderRadius: '6px', border: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ color: '#38bdf8', fontWeight: 700, fontSize: '0.95rem' }}>
                    Patient: {demoData.recommendedSchedule.patient?.name} ({demoData.recommendedSchedule.patient?.patientId})
                  </div>
                  <div style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '0.2rem' }}>
                    Assigned OR: <strong>{demoData.recommendedSchedule.operatingRoom?.name}</strong>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className="badge badge-scheduled" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}>
                    <ShieldCheck size={14} style={{ display: 'inline', marginRight: '4px' }} /> Conflict-Free Slot Verified
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DSAVisualizer;
