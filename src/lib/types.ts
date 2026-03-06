export interface Game {
  id: string;
  opponent: string;
  date: string;
  location: string;
  created_at: string;
}

export interface Prediction {
  id: string;
  user_id: string;
  game_id: string;
  prediction: string;
  confidence_level: number;
  created_at: string;
}

export interface SeasonStat {
  id: string;
  player_name: string;
  stat_category: string;
  predicted_value: number;
  user_id: string;
  created_at: string;
}

export interface ActualResult {
  id: string;
  game_id: string;
  result: string;
  stats: Record<string, any>;
  created_at: string;
}

export interface User {
  id: string;
  email: string;
}