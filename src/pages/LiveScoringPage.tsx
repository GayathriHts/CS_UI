import { useParams } from 'react-router-dom';
import { useLiveScoring } from '../hooks/useLiveScoring';
import Navbar from '../components/Navbar';

export default function LiveScoringPage() {
  const { matchId } = useParams<{ matchId: string }>();
  const { liveUpdate, scorecard, lastDelivery, isConnected } = useLiveScoring(matchId);

  const formatOvers = (overNo: number, ballInOver: number) =>
    `${overNo}.${ballInOver}`;

  const formatDeliveryRuns = (d: typeof lastDelivery) => {
    if (!d) return '';
    const parts: string[] = [];
    if (d.wideRuns > 0) parts.push(`${d.wideRuns}wd`);
    if (d.noBallRuns > 0) parts.push(`${d.noBallRuns}nb`);
    if (d.byeRuns > 0) parts.push(`${d.byeRuns}b`);
    if (d.legByeRuns > 0) parts.push(`${d.legByeRuns}lb`);
    if (d.runsOffBat > 0 || parts.length === 0) parts.unshift(`${d.runsOffBat}`);
    return parts.join(' + ');
  };

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
        {liveUpdate ? (
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 mb-6 shadow-xl border border-gray-700">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold">Innings {liveUpdate.inningsNo}</h2>
                <p className="text-5xl font-bold text-brand-light mt-2">
                  {liveUpdate.totalRuns}<span className="text-gray-400 text-3xl">/{liveUpdate.totalWickets}</span>
                </p>
                <p className="text-gray-400 mt-1">Overs: {formatOvers(liveUpdate.overNo, liveUpdate.ballInOver)}</p>
              </div>
              <div className="text-right">
                <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-red-600 animate-pulse">LIVE</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm bg-black/20 rounded-xl p-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <img src="/images/batsman.png" alt="" className="w-5 h-5" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  <span className="text-gray-300">Striker:</span>
                  <span className="font-medium">{liveUpdate.strikerFirstName} {liveUpdate.strikerLastName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-5" />
                  <span className="text-gray-300">Non-Striker:</span>
                  <span className="font-medium text-gray-400">{liveUpdate.nonStrikerFirstName} {liveUpdate.nonStrikerLastName}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 justify-end">
                <img src="/images/ball3.png" alt="" className="w-5 h-5" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                <span className="text-gray-300">Bowling:</span>
                <span className="font-medium">{liveUpdate.bowlerFirstName} {liveUpdate.bowlerLastName}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gray-800 rounded-2xl p-12 text-center border border-gray-700">
            <div className="w-16 h-16 border-4 border-brand-green border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-400 text-lg">Waiting for match data...</p>
          </div>
        )}

        {lastDelivery && (
          <div className="bg-gray-800 rounded-xl p-5 mb-6 border border-gray-700">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Last Delivery</p>
            <p className="text-lg">
              Over {lastDelivery.overNo}.{lastDelivery.ballIndexLegal} —{' '}
              {lastDelivery.isWicket ? (
                <span className="text-red-400 font-bold">WICKET! ({lastDelivery.dismissalKind})</span>
              ) : (
                <span className="text-brand-light font-bold">{formatDeliveryRuns(lastDelivery)} run{lastDelivery.totalRuns !== 1 ? 's' : ''}</span>
              )}
              {!lastDelivery.isLegalDelivery && <span className="text-yellow-400 ml-2 text-sm">(illegal delivery)</span>}
            </p>
          </div>
        )}

        {scorecard && scorecard.innings && (
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
                      <tr className="text-gray-400 text-left border-b border-gray-700 font-bold text-sm">
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

                {inn.bowling && inn.bowling.length > 0 && (
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-gray-400 text-left border-b border-gray-700 font-bold text-sm">
                          <th className="pb-2">Bowler</th><th className="pb-2 text-center">O</th><th className="pb-2 text-center">M</th>
                          <th className="pb-2 text-center">R</th><th className="pb-2 text-center">W</th><th className="pb-2 text-center">Econ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inn.bowling.map((bw) => (
                          <tr key={bw.bowlerId} className="border-t border-gray-700/50">
                            <td className="py-2">{bw.bowlerName}</td>
                            <td className="text-center">{bw.overs}</td>
                            <td className="text-center text-gray-400">{bw.maidens}</td>
                            <td className="text-center text-gray-400">{bw.runsConceded}</td>
                            <td className="text-center font-bold">{bw.wickets}</td>
                            <td className="text-center text-gray-400">{bw.overs > 0 ? (bw.runsConceded / bw.overs).toFixed(1) : '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
