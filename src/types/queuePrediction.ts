export type CrowdLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';

export type DepartmentType = 'Registration' | 'OPD' | 'Laboratory' | 'Pharmacy' | 'Billing';

export type PredictionModelType = 'RULE_BASED' | 'ML_AI';

export interface QueueHistoryRecord {
  id: string;
  date: string; // YYYY-MM-DD
  dayOfWeek: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  timeSlot: string; // e.g. "08:00 AM"
  department: DepartmentType;
  numberOfArrivals: number;
  queueLength: number;
  activeCounters: number;
  avgServiceTimeMins: number;
  completedPatients: number;
  waitingTimeMins: number;
  appointmentDensityScore: number; // 1 to 10
}

export interface DepartmentPrediction {
  department: DepartmentType;
  currentQueue: number;
  activeCounters: number;
  avgServiceTimeMins: number;
  formulaWaitTimeMins: number; // Base formula result
  estimatedWaitTimeMins: number; // Final adjusted estimate
  predictedQueue30Mins: number;
  predictedQueue60Mins: number;
  crowdLevel: CrowdLevel;
  confidenceScorePercent: number; // 0 - 100
  recommendedAction: string;
  actionExecuted?: boolean;
  factors: {
    timeOfDayMultiplier: number;
    dayOfWeekMultiplier: number;
    appointmentDensityFactor: number;
    arrivalRatePer15Min: number;
    throughputPer15Min: number;
  };
}

export interface QueuePredictionOverview {
  timestamp: string;
  modelUsed: PredictionModelType;
  totalWaitingPatients: number;
  averageWaitTimeMins: number;
  overallCrowdIndex: CrowdLevel;
  predictions: Record<DepartmentType, DepartmentPrediction>;
  hourlyPeakData: Array<{
    hour: string;
    arrivals: number;
    throughputCapacity: number;
    projectedQueue: number;
  }>;
  aiStrategicInsights?: string;
}

export interface SimulationParams {
  department: DepartmentType | 'ALL';
  arrivalSurgePercent: number; // e.g. +20%
  counterChangeDelta: number; // e.g. +1 counter or -1 counter
  dayOfWeek?: string;
  timeSlot?: string;
}
