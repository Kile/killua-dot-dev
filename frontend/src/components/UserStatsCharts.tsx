import React, { useState } from 'react';
import { Target, Users } from 'lucide-react';
import { Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import StyledSelect from './StyledSelect';

interface UserStatsChartsProps {
  userInfo: any;
}

const UserStatsCharts: React.FC<UserStatsChartsProps> = ({ userInfo }) => {
  const [selectedGameStat, setSelectedGameStat] = useState('rps_pvp');
  const [selectedActionStat, setSelectedActionStat] = useState('hug');

  // Prepare chart data
  const gameStatsData = userInfo ? (() => {
    let data: Array<{ name: string; value: number; fill: string }> = [];
    
    switch (selectedGameStat) {
      case 'rps_pvp':
        if (userInfo.rps_stats?.pvp) {
          data = [
            { name: 'Won', value: userInfo.rps_stats.pvp.won || 0, fill: '#10B981' },
            { name: 'Lost', value: userInfo.rps_stats.pvp.lost || 0, fill: '#EF4444' },
            { name: 'Tied', value: userInfo.rps_stats.pvp.tied || 0, fill: '#F59E0B' },
          ];
        }
        break;
      case 'rps_pve':
        if (userInfo.rps_stats?.pve) {
          data = [
            { name: 'Won', value: userInfo.rps_stats.pve.won || 0, fill: '#10B981' },
            { name: 'Lost', value: userInfo.rps_stats.pve.lost || 0, fill: '#EF4444' },
            { name: 'Tied', value: userInfo.rps_stats.pve.tied || 0, fill: '#F59E0B' },
          ];
        }
        break;
      case 'trivia_easy':
        if (userInfo.trivia_stats?.easy) {
          data = [
            { name: 'Correct', value: userInfo.trivia_stats.easy.right || 0, fill: '#10B981' },
            { name: 'Incorrect', value: userInfo.trivia_stats.easy.wrong || 0, fill: '#EF4444' },
          ];
        }
        break;
      case 'trivia_medium':
        if (userInfo.trivia_stats?.medium) {
          data = [
            { name: 'Correct', value: userInfo.trivia_stats.medium.right || 0, fill: '#10B981' },
            { name: 'Incorrect', value: userInfo.trivia_stats.medium.wrong || 0, fill: '#EF4444' },
          ];
        }
        break;
      case 'trivia_hard':
        if (userInfo.trivia_stats?.hard) {
          data = [
            { name: 'Correct', value: userInfo.trivia_stats.hard.right || 0, fill: '#10B981' },
            { name: 'Incorrect', value: userInfo.trivia_stats.hard.wrong || 0, fill: '#EF4444' },
          ];
        }
        break;
    }
    
    // Filter out zero values, but only if not all values are zero
    const totalValue = data.reduce((sum, item) => sum + item.value, 0);
    if (totalValue > 0) {
      return data.filter(item => item.value > 0);
    }
    return data;
  })() : [];

  const actionStatsData = userInfo && userInfo.action_stats ? (() => {
    const actionData = userInfo.action_stats[selectedActionStat];
    if (!actionData) return [];
    
    const data = [
      { name: 'Used', value: actionData.used || 0, fill: '#3B82F6' },
      { name: 'Targeted', value: actionData.targeted || 0, fill: '#8B5CF6' },
    ];
    
    // Filter out zero values, but only if not all values are zero
    const totalValue = data.reduce((sum, item) => sum + item.value, 0);
    if (totalValue > 0) {
      return data.filter(item => item.value > 0);
    }
    return data;
  })() : [];

  return (
    <div className="grid lg:grid-cols-2 gap-8 mb-8">
      {/* Game Stats */}
      <div className="bg-discord-darker rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <Target className="w-5 h-5 mr-2 text-discord-blurple" />
          Game Statistics
        </h3>
        <div className="mb-4">
          <StyledSelect 
            onChange={(e) => setSelectedGameStat(e.target.value)}
            value={selectedGameStat}
          >
            <option value="rps_pvp">Rock Paper Scissors (PVP)</option>
            <option value="rps_pve">Rock Paper Scissors (PVE)</option>
            <option value="trivia_easy">Trivia (Easy)</option>
            <option value="trivia_medium">Trivia (Medium)</option>
            <option value="trivia_hard">Trivia (Hard)</option>
          </StyledSelect>
        </div>
        {(gameStatsData.length === 0 || gameStatsData.every(d => (d as any).value === 0)) ? (
          <div className="h-[200px] flex items-center justify-center text-gray-400">No data</div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={gameStatsData}
                cx="50%"
                cy="50%"
                outerRadius={60}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
              >
                {gameStatsData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={(entry as any).fill} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Action Stats */}
      <div className="bg-discord-darker rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <Users className="w-5 h-5 mr-2 text-discord-blurple" />
          Action Statistics
        </h3>
        <div className="mb-4">
          <StyledSelect 
            onChange={(e) => setSelectedActionStat(e.target.value)}
            value={selectedActionStat}
          >
            <option value="hug">Hug</option>
            <option value="pat">Pat</option>
            <option value="slap">Slap</option>
            <option value="poke">Poke</option>
            <option value="tickle">Tickle</option>
            <option value="cuddle">Cuddle</option>
          </StyledSelect>
        </div>
        {(actionStatsData.length === 0 || actionStatsData.every(d => (d as any).value === 0)) ? (
          <div className="h-[200px] flex items-center justify-center text-gray-400">No data</div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={actionStatsData}
                cx="50%"
                cy="50%"
                outerRadius={60}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
              >
                {actionStatsData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={(entry as any).fill} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default UserStatsCharts;
