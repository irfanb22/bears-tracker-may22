import { useCallback, useEffect, useState } from 'react';
import { CheckCircle, Loader2, Lock, Save, ShieldCheck, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

type SeasonState = 'draft' | 'open' | 'locked';
type Winner = 'bears' | 'opponent' | null;

interface SeasonStatus {
  state: SeasonState;
  lock_at: string;
  total_games: number;
}

interface GameRow {
  id: string;
  week: number;
  opponent: string;
  short_name: string;
  home: boolean;
  date_label: string;
  winner: Winner;
}

export function GamePickAdminPanel() {
  const [status, setStatus] = useState<SeasonStatus | null>(null);
  const [games, setGames] = useState<GameRow[]>([]);
  const [selectedState, setSelectedState] = useState<SeasonState>('draft');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [{ data: statusData, error: statusError }, { data: gameData, error: gamesError }] = await Promise.all([
        supabase.rpc('get_game_pick_season_status', { target_season: 2026 }),
        supabase
          .from('game_pick_games')
          .select('id, week, opponent, short_name, home, date_label, winner')
          .eq('season', 2026)
          .order('week', { ascending: true }),
      ]);

      if (statusError) throw statusError;
      if (gamesError) throw gamesError;

      const nextStatus = ((statusData || [])[0] || null) as SeasonStatus | null;
      setStatus(nextStatus);
      setSelectedState(nextStatus?.state || 'draft');
      setGames((gameData || []) as GameRow[]);
    } catch (loadError) {
      console.error('Error loading game-pick administration:', loadError);
      setError(loadError instanceof Error ? loadError.message : 'Could not load game-pick administration.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const updateSeasonState = async () => {
    if (!status || selectedState === status.state) return;
    const action = selectedState === 'open' ? 'open game picks to every signed-in fan' : `change the season to ${selectedState}`;
    if (!window.confirm(`Are you sure you want to ${action}?`)) return;

    setSaving('season-state');
    setError(null);
    const { error: saveError } = await supabase.rpc('set_game_pick_season_state', {
      target_season: 2026,
      target_state: selectedState,
    });
    setSaving(null);

    if (saveError) {
      setError(saveError.message);
      return;
    }

    setNotice(`2026 game picks are now ${selectedState}.`);
    await load();
  };

  const setWinner = async (game: GameRow, winner: Winner) => {
    setSaving(game.id);
    setError(null);
    const { error: saveError } = await supabase.rpc('set_game_pick_result', {
      target_game_id: game.id,
      target_winner: winner,
    });
    setSaving(null);

    if (saveError) {
      setError(saveError.message);
      return;
    }

    setGames((current) => current.map((item) => (item.id === game.id ? { ...item, winner } : item)));
    setNotice(winner ? `Week ${game.week} result saved.` : `Week ${game.week} result cleared.`);
  };

  if (loading) {
    return (
      <section className="mt-8 rounded-xl bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
          <Loader2 className="h-4 w-4 animate-spin text-bears-orange" /> Loading game picks…
        </div>
      </section>
    );
  }

  if (!status) return null;

  return (
    <section className="mt-8 overflow-hidden rounded-xl bg-white shadow-sm">
      <div className="border-b border-slate-100 p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-bears-orange">2026 game picks</p>
            <h2 className="mt-1 text-xl font-bold text-bears-navy">Rollout and game results</h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">Draft is admin-only. Open allows signed-in fans to pick. Locked makes every forecast read-only.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedState}
              onChange={(event) => setSelectedState(event.target.value as SeasonState)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-700"
            >
              <option value="draft">Draft · admin only</option>
              <option value="open">Open · fans can pick</option>
              <option value="locked">Locked · read only</option>
            </select>
            <button
              type="button"
              onClick={() => void updateSeasonState()}
              disabled={selectedState === status.state || saving === 'season-state'}
              className="inline-flex items-center gap-2 rounded-lg bg-bears-navy px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              {saving === 'season-state' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save state
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs font-bold">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-slate-700">
            {status.state === 'draft' ? <ShieldCheck className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
            Current state: {status.state}
          </span>
          <span className="rounded-full bg-orange-50 px-3 py-1.5 text-bears-orange">Locks Sep 13 · 12:00 PM CT</span>
        </div>

        {notice && <p className="mt-4 text-sm font-semibold text-emerald-700">{notice}</p>}
        {error && <p className="mt-4 text-sm font-semibold text-red-700">{error}</p>}
      </div>

      <div className="divide-y divide-slate-100">
        {games.map((game) => (
          <div key={game.id} className="grid gap-3 px-5 py-4 md:grid-cols-[70px_minmax(0,1fr)_auto] md:items-center">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Week</p>
              <p className="text-lg font-black text-bears-navy">{game.week}</p>
            </div>
            <div>
              <p className="font-bold text-slate-900">{game.home ? 'vs.' : 'at'} {game.opponent}</p>
              <p className="mt-0.5 text-xs font-medium text-slate-500">{game.date_label}</p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => void setWinner(game, 'bears')}
                disabled={saving === game.id}
                className={`rounded-lg border px-3 py-2 text-xs font-black ${game.winner === 'bears' ? 'border-bears-navy bg-bears-navy text-white' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
              >
                Bears
              </button>
              <button
                type="button"
                onClick={() => void setWinner(game, 'opponent')}
                disabled={saving === game.id}
                className={`rounded-lg border px-3 py-2 text-xs font-black ${game.winner === 'opponent' ? 'border-bears-orange bg-bears-orange text-white' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
              >
                {game.short_name}
              </button>
              <button
                type="button"
                onClick={() => void setWinner(game, null)}
                disabled={!game.winner || saving === game.id}
                aria-label={`Clear Week ${game.week} result`}
                className="flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-30"
              >
                {saving === game.id ? <Loader2 className="h-4 w-4 animate-spin" /> : game.winner ? <X className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
