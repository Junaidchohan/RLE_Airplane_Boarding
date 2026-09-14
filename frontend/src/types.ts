export type PassengerState = 'empty' | 'stowing' | 'seated';
export type AisleStatus = 'MOVING' | 'STALLED' | 'STOWING';

export interface ChartDataPoint {
  step: number;
  reward: number;
  stalled: number;
}

export interface SeatData {
  seat_num: number;
  state: PassengerState;
  passenger: string | null;
}

export interface AisleData {
  row: number;
  passenger: string | null;
  status: AisleStatus;
}

export interface LobbyData {
  row: number;
  passengers: string[];
}

export interface StatsData {
  seated: number;
  total: number;
  stalled: number;
  moving: number;
  stowing: number;
  mask: boolean[];
}

export interface StateResponse {
  ok: boolean;
  step: number;
  reward_step: number;
  reward_total: number;
  terminated: boolean;
  action: number | null;
  cabin: SeatData[][];
  aisle: AisleData[];
  lobby: LobbyData[];
  stats: StatsData;
  message: string | null;
  error?: string;
}
