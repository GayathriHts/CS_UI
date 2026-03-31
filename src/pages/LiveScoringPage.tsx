import { useParams, Link } from 'react-router-dom';
import { useLiveScoring } from '../hooks/useLiveScoring';
import Navbar from '../components/Navbar';

export default function LiveScoringPage() {
  const { matchId } = useParams<{ matchId: string }>();
  const { liveScore, scorecard, lastBall, isConnected } = useLiveScoring(matchId);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Top Nav */}
      <Navbar
        title="Live Scoring"
        backTo="/dashboard"
        variant="dark"
        rightContent={
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${isConnected ? 'bg-green-600' : 'bg-red-600'}`}>
            {isConnected ? '● Connected' : '○ Disconnected'}
          </span>
        }
      />

      <div className="max-w-4xl mx-auto pt-20 px-4 pb-8">
        {liveScore ? (
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 mb-6 shadow-xl border border-gray-700">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold">{liveScore.battingTeam}</h2>
                <p className="text-5xl font-bold text-brand-light mt-2">
                  {liveScore.totalRuns}<span className="text-gray-400 text-3xl">/{liveScore.totalWickets}</span>
                </p>
                <p className="text-gray-400 mt-1">Overs: {liveScore.currentOver}</p>
              </div>
              <div className="text-right">
                <img src="/images/vs.png" alt="vs" className="w-10 h-10 mx-auto mb-2 opacity-50" onError={(e) => { (e.target as HTMLImageElement).textContent = 'VS'; }} />
                <h2 className="text-xl text-gray-300">{liveScore.bowlingTeam}</h2>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm bg-black/20 rounded-xl p-4">
              <div className="flex items-center gap-2">
                <img src="/images/batsman.png" alt="" className="w-5 h-5" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                <span className="text-gray-300">Batting:</span>
                <span className="font-medium">{liveScore.currentBatsman}</span>
              </div>
              <div className="flex items-center gap-2 justify-end">
                <img src="/images/ball3.png" alt="" className="w-5 h-5" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                <span className="text-gray-300">Bowling:</span>
                <span className="font-medium">{liveScore.currentBowler}</span>
              </div>
            </div>
            <div className="mt-4 text-center bg-black/20 rounded-xl p-3">
              <span className="text-gray-400 text-sm">Last 6 balls: </span>
              <span className="font-mono text-xl tracking-widest text-brand-light">{liveScore.lastSixBalls}</span>
            </div>
          </div>
        ) : (
          <div className="bg-gray-800 rounded-2xl p-12 text-center border border-gray-700">
            <div className="w-16 h-16 border-4 border-brand-green border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-400 text-lg">Waiting for match data...</p>
          </div>
        )}

        {lastBall && (
          <div className="bg-gray-800 rounded-xl p-5 mb-6 border border-gray-700">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Last Ball</p>
            <p className="text-lg">
              Over {lastBall.overNumber}.{lastBall.ballNumber} —{' '}
              {lastBall.isWicket ? (
                <span className="text-red-400 font-bold">WICKET! ({lastBall.wicketType})</span>
              ) : (
                <span className="text-brand-light font-bold">{lastBall.runs} run{lastBall.runs !== 1 ? 's' : ''}</span>
              )}
            </p>
            {lastBall.commentary && <p className="text-gray-400 text-sm mt-1">{lastBall.commentary}</p>}
          </div>
        )}

        {scorecard && (
          <div className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700">
            <div className="p-5 border-b border-gray-700">
              <h3 className="font-bold text-lg">Scorecard</h3>
            </div>
            {scorecard.innings.map((inn) => (
              <div key={inn.id} className="p-5 border-b border-gray-700 last:border-0">
                <p className="text-brand-light font-semibold mb-3">
                  Innings {inn.inningsNumber}: {inn.battingTeamName} — {inn.totalRuns}/{inn.totalWickets} ({inn.totalOvers} ov)
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-gray-400 text-left border-b border-gray-700">
                        <th className="pb-2">Batsman</th><th className="pb-2 text-center">R</th><th className="pb-2 text-center">B</th>
                        <th className="pb-2 text-center">4s</th><th className="pb-2 text-center">6s</th><th className="pb-2 text-center">SR</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inn.batting.map((b) => (
                        <tr key={b.batsmanId} className="border-t border-gray-700/50">
                          <td className="py-2">
                            {b.batsmanName}
                            <span className="text-gray-500 text-xs ml-2">{b.dismissalType || 'not out'}</span>
                          </td>
                          <td className="text-center font-bold">{b.runsScored}</td>
                          <td className="text-center text-gray-400">{b.ballsFaced}</td>
                          <td className="text-center text-gray-400">{b.fours}</td>
                          <td className="text-center text-gray-400">{b.sixes}</td>
                          <td className="text-center text-gray-400">{b.ballsFaced > 0 ? ((b.runsScored / b.ballsFaced) * 100).toFixed(1) : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
