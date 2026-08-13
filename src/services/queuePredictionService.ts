import {
  DepartmentType,
  QueueHistoryRecord,
  DepartmentPrediction,
  QueuePredictionOverview,
  PredictionModelType,
  CrowdLevel,
  SimulationParams
} from '../types/queuePrediction';

// Baseline Live Counters and Queue state
const BASE_DEPARTMENT_STATE: Record<DepartmentType, { queue: number; counters: number; avgServiceMins: number; appointmentsNextHour: number }> = {
  Registration: { queue: 32, counters: 4, avgServiceMins: 4, appointmentsNextHour: 28 },
  OPD: { queue: 86, counters: 3, avgServiceMins: 8, appointmentsNextHour: 45 },
  Laboratory: { queue: 24, counters: 3, avgServiceMins: 6, appointmentsNextHour: 20 },
  Pharmacy: { queue: 41, counters: 4, avgServiceMins: 5, appointmentsNextHour: 35 },
  Billing: { queue: 18, counters: 5, avgServiceMins: 3, appointmentsNextHour: 15 }
};

// Historical Queue Data Generator
export function generateQueueHistory(): QueueHistoryRecord[] {
  const days: QueueHistoryRecord['dayOfWeek'][] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const times = ['08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM', '06:00 PM', '07:00 PM'];
  const depts: DepartmentType[] = ['Registration', 'OPD', 'Laboratory', 'Pharmacy', 'Billing'];

  const history: QueueHistoryRecord[] = [];
  let idCounter = 1;

  days.forEach((day, dayIdx) => {
    times.forEach((time, timeIdx) => {
      depts.forEach(dept => {
        // Peak hours are 09:00 AM - 12:00 PM and 04:00 PM - 06:00 PM
        const isPeak = (timeIdx >= 1 && timeIdx <= 4) || (timeIdx >= 8 && timeIdx <= 10);
        const dayMultiplier = day === 'Monday' ? 1.35 : day === 'Saturday' || day === 'Sunday' ? 0.7 : 1.0;
        
        let baseArrivals = 15;
        let baseServiceMins = 5;
        let baseCounters = 3;

        if (dept === 'OPD') { baseArrivals = 35; baseServiceMins = 8; baseCounters = 3; }
        else if (dept === 'Registration') { baseArrivals = 25; baseServiceMins = 4; baseCounters = 4; }
        else if (dept === 'Laboratory') { baseArrivals = 20; baseServiceMins = 6; baseCounters = 3; }
        else if (dept === 'Pharmacy') { baseArrivals = 30; baseServiceMins = 5; baseCounters = 4; }
        else if (dept === 'Billing') { baseArrivals = 22; baseServiceMins = 3.5; baseCounters = 5; }

        const arrivals = Math.round((baseArrivals * (isPeak ? 1.8 : 0.8) * dayMultiplier) + (Math.sin(timeIdx) * 3));
        const activeCounters = isPeak ? baseCounters : Math.max(1, baseCounters - 1);
        const queueLen = Math.max(2, Math.round(arrivals * 1.4 + (isPeak ? 15 : 0)));
        const completed = Math.round(activeCounters * (60 / baseServiceMins) * 0.85);
        const waitMins = Math.round((queueLen * baseServiceMins) / activeCounters);

        history.push({
          id: `qh-${idCounter++}`,
          date: `2026-08-${String(10 + (dayIdx % 7)).padStart(2, '0')}`,
          dayOfWeek: day,
          timeSlot: time,
          department: dept,
          numberOfArrivals: Math.max(1, arrivals),
          queueLength: queueLen,
          activeCounters,
          avgServiceTimeMins: baseServiceMins,
          completedPatients: completed,
          waitingTimeMins: waitMins,
          appointmentDensityScore: isPeak ? Math.floor(7 + Math.random() * 4) : Math.floor(2 + Math.random() * 4)
        });
      });
    });
  });

  return history;
}

// Cached history
const queueHistoryCache = generateQueueHistory();

export function getQueueHistory(): QueueHistoryRecord[] {
  return queueHistoryCache;
}

// Time of day multiplier logic
function getTimeOfDayMultiplier(timeSlotStr?: string): number {
  if (!timeSlotStr) {
    const currentHour = new Date().getHours();
    if (currentHour >= 9 && currentHour <= 12) return 1.35; // Morning Rush
    if (currentHour >= 16 && currentHour <= 18) return 1.20; // Evening Surge
    if (currentHour >= 12 && currentHour <= 14) return 0.85; // Lunch Slowdown
    return 1.0;
  }
  if (timeSlotStr.includes('09:') || timeSlotStr.includes('10:') || timeSlotStr.includes('11:')) return 1.35;
  if (timeSlotStr.includes('04:') || timeSlotStr.includes('05:')) return 1.20;
  if (timeSlotStr.includes('01:') || timeSlotStr.includes('02:')) return 0.85;
  return 1.0;
}

function getDayOfWeekMultiplier(dayStr?: string): number {
  if (!dayStr) {
    const day = new Date().getDay(); // 0 is Sun, 1 is Mon...
    if (day === 1) return 1.30; // Monday heavy OPD inflow
    if (day === 6 || day === 0) return 0.75; // Weekend lower OPD
    return 1.0;
  }
  if (dayStr === 'Monday') return 1.30;
  if (dayStr === 'Friday') return 1.15;
  if (dayStr === 'Saturday' || dayStr === 'Sunday') return 0.75;
  return 1.0;
}

// Core Prediction Calculation
export function calculateDepartmentPrediction(
  dept: DepartmentType,
  model: PredictionModelType = 'RULE_BASED',
  simulation?: SimulationParams,
  overrideState?: Partial<typeof BASE_DEPARTMENT_STATE['Registration']>
): DepartmentPrediction {
  const base = { ...BASE_DEPARTMENT_STATE[dept], ...overrideState };

  // Apply simulation adjustments if targeted
  let queue = base.queue;
  let counters = base.counters;

  if (simulation) {
    if (simulation.department === 'ALL' || simulation.department === dept) {
      if (simulation.arrivalSurgePercent) {
        queue = Math.round(queue * (1 + simulation.arrivalSurgePercent / 100));
      }
      if (simulation.counterChangeDelta) {
        counters = Math.max(1, counters + simulation.counterChangeDelta);
      }
    }
  }

  const avgServiceMins = base.avgServiceMins;
  const timeOfDayMult = getTimeOfDayMultiplier(simulation?.timeSlot);
  const dayOfWeekMult = getDayOfWeekMultiplier(simulation?.dayOfWeek);
  const appointmentDensityFactor = 1 + (base.appointmentsNextHour / 100);

  // Initial Formula: Patients ahead * Avg service time / Active service counters
  const formulaWaitTime = Math.round((queue * avgServiceMins) / Math.max(1, counters));

  let finalWaitTime = formulaWaitTime;
  let predicted30m = queue;
  let predicted60m = queue;
  let confidence = 92;

  // Arrival rate per 15 mins and throughput per 15 mins
  const baseArrivalsPer15m = (queue / 4) * timeOfDayMult * dayOfWeekMult;
  const throughputPer15m = (counters * (15 / avgServiceMins));

  if (model === 'RULE_BASED') {
    // Transparent Rule-Based Algorithm
    const weightedMultiplier = timeOfDayMult * dayOfWeekMult * appointmentDensityFactor;
    finalWaitTime = Math.round(formulaWaitTime * weightedMultiplier);

    const netRate15m = baseArrivalsPer15m - throughputPer15m;
    predicted30m = Math.max(0, Math.round(queue + netRate15m * 2));
    predicted60m = Math.max(0, Math.round(queue + netRate15m * 4));
    confidence = 88;
  } else {
    // Advanced ML/AI Predictor model with exponential decay smoothing & non-linear bottleneck dampening
    const nonLinearDampening = Math.log10(queue + 1) * 0.15;
    const aiAdjustedMultiplier = (timeOfDayMult * 0.4 + dayOfWeekMult * 0.3 + appointmentDensityFactor * 0.3) + nonLinearDampening;
    finalWaitTime = Math.round(formulaWaitTime * aiAdjustedMultiplier);

    // ML regression simulation curve
    const netRate15m = (baseArrivalsPer15m * 0.95) - throughputPer15m;
    predicted30m = Math.max(0, Math.round(queue + netRate15m * 1.8));
    predicted60m = Math.max(0, Math.round(queue + netRate15m * 3.4));
    confidence = 95;
  }

  // Determine Crowd Level
  let crowdLevel: CrowdLevel = 'LOW';
  const queuePerCounter = queue / counters;

  if (finalWaitTime >= 120 || queuePerCounter >= 18) {
    crowdLevel = 'CRITICAL';
  } else if (finalWaitTime >= 45 || queuePerCounter >= 10) {
    crowdLevel = 'HIGH';
  } else if (finalWaitTime >= 15 || queuePerCounter >= 5) {
    crowdLevel = 'MODERATE';
  } else {
    crowdLevel = 'LOW';
  }

  // Generate Contextual Recommended Action
  let recommendedAction = '';
  if (dept === 'OPD') {
    if (crowdLevel === 'CRITICAL') recommendedAction = 'Activate additional consultation capacity & deploy +2 doctors.';
    else if (crowdLevel === 'HIGH') recommendedAction = 'Assign float physician and open express consultation room.';
    else if (crowdLevel === 'MODERATE') recommendedAction = 'Notify patients via SMS/App to arrive 15 mins prior to slot.';
    else recommendedAction = 'Optimal flow. Maintain standard doctor schedule.';
  } else if (dept === 'Registration') {
    if (crowdLevel === 'CRITICAL' || crowdLevel === 'HIGH') recommendedAction = 'Open self-service token kiosks and activate Counter #4.';
    else recommendedAction = 'Standard desk registration operational.';
  } else if (dept === 'Laboratory') {
    if (crowdLevel === 'CRITICAL' || crowdLevel === 'HIGH') recommendedAction = 'Redirect non-urgent phlebotomy patients to 1st Floor Satellite Lab.';
    else recommendedAction = 'Laboratory phlebotomy queues within normal limits.';
  } else if (dept === 'Pharmacy') {
    if (crowdLevel === 'CRITICAL' || crowdLevel === 'HIGH') recommendedAction = 'Deploy express prescription dispensing station and float pharmacist.';
    else recommendedAction = 'Pharmacy order processing on schedule.';
  } else if (dept === 'Billing') {
    if (crowdLevel === 'CRITICAL' || crowdLevel === 'HIGH') recommendedAction = 'Enable QR/UPI express self-checkout kiosk and open Desk #5.';
    else recommendedAction = 'Billing operations running smoothly.';
  }

  return {
    department: dept,
    currentQueue: queue,
    activeCounters: counters,
    avgServiceTimeMins: avgServiceMins,
    formulaWaitTimeMins: formulaWaitTime,
    estimatedWaitTimeMins: finalWaitTime,
    predictedQueue30Mins: predicted30m,
    predictedQueue60Mins: predicted60m,
    crowdLevel,
    confidenceScorePercent: confidence,
    recommendedAction,
    factors: {
      timeOfDayMultiplier: Number(timeOfDayMult.toFixed(2)),
      dayOfWeekMultiplier: Number(dayOfWeekMult.toFixed(2)),
      appointmentDensityFactor: Number(appointmentDensityFactor.toFixed(2)),
      arrivalRatePer15Min: Number(baseArrivalsPer15m.toFixed(1)),
      throughputPer15Min: Number(throughputPer15m.toFixed(1))
    }
  };
}

// Generate Full Overview across all 5 departments
export function getQueuePredictionOverview(
  model: PredictionModelType = 'RULE_BASED',
  simulation?: SimulationParams,
  overrideState?: Partial<Record<DepartmentType, Partial<typeof BASE_DEPARTMENT_STATE['Registration']>>>
): QueuePredictionOverview {
  const depts: DepartmentType[] = ['Registration', 'OPD', 'Laboratory', 'Pharmacy', 'Billing'];
  const predictions = {} as Record<DepartmentType, DepartmentPrediction>;

  let totalWaiting = 0;
  let totalWaitMinsSum = 0;
  let criticalCount = 0;
  let highCount = 0;

  depts.forEach(d => {
    const p = calculateDepartmentPrediction(d, model, simulation, overrideState ? overrideState[d] : undefined);
    predictions[d] = p;
    totalWaiting += p.currentQueue;
    totalWaitMinsSum += p.estimatedWaitTimeMins;
    if (p.crowdLevel === 'CRITICAL') criticalCount++;
    if (p.crowdLevel === 'HIGH') highCount++;
  });

  const avgWait = Math.round(totalWaitMinsSum / depts.length);

  let overallCrowd: CrowdLevel = 'LOW';
  if (criticalCount >= 1 || avgWait >= 60) overallCrowd = 'CRITICAL';
  else if (highCount >= 2 || avgWait >= 30) overallCrowd = 'HIGH';
  else if (avgWait >= 12) overallCrowd = 'MODERATE';

  // Generate 8 AM to 7 PM Hourly Peak Projection Data
  const hourlyPeakData = [
    { hour: '08:00 AM', arrivals: 42, throughputCapacity: 50, projectedQueue: 18 },
    { hour: '09:00 AM', arrivals: 95, throughputCapacity: 65, projectedQueue: 48 },
    { hour: '10:00 AM', arrivals: 140, throughputCapacity: 70, projectedQueue: 118 },
    { hour: '11:00 AM', arrivals: 125, throughputCapacity: 75, projectedQueue: 168 },
    { hour: '12:00 PM', arrivals: 80, throughputCapacity: 70, projectedQueue: 178 },
    { hour: '01:00 PM', arrivals: 50, throughputCapacity: 60, projectedQueue: 168 },
    { hour: '02:00 PM', arrivals: 65, throughputCapacity: 65, projectedQueue: 168 },
    { hour: '03:00 PM', arrivals: 85, throughputCapacity: 70, projectedQueue: 183 },
    { hour: '04:00 PM', arrivals: 110, throughputCapacity: 75, projectedQueue: 218 },
    { hour: '05:00 PM', arrivals: 90, throughputCapacity: 70, projectedQueue: 238 },
    { hour: '06:00 PM', arrivals: 55, throughputCapacity: 65, projectedQueue: 228 },
    { hour: '07:00 PM', arrivals: 30, throughputCapacity: 50, projectedQueue: 208 }
  ];

  return {
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    modelUsed: model,
    totalWaitingPatients: totalWaiting,
    averageWaitTimeMins: avgWait,
    overallCrowdIndex: overallCrowd,
    predictions,
    hourlyPeakData
  };
}
