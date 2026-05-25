import React, { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { fetchCommandUsage, type CommandUsageItem } from '../services/guildService';
import StyledSelect from './StyledSelect';
import { TrendingUp, Clock, BarChart3 } from 'lucide-react';
import { isAbortError, useAsyncEffect } from '../hooks/useAsyncEffect';

interface ServerStatsProps {
  jwtToken: string;
  guildId: string;
  onStatsDataChange?: (data: {
    from: string;
    to: string;
    interval: string;
    data: CommandUsageItem[];
  }) => void;
}

type TimeRange = 'week' | '2weeks';
type Interval = '1h' | '1d';

// Cache for command usage data
const commandUsageCache = new Map<string, { data: CommandUsageItem[]; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const ServerStats: React.FC<ServerStatsProps> = ({ jwtToken, guildId, onStatsDataChange }) => {
  const [commandUsage, setCommandUsage] = useState<CommandUsageItem[]>([]);
  const [totalUsage, setTotalUsage] = useState<CommandUsageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>('week');
  const [interval, setInterval] = useState<Interval>('1d');
  const [selectedCommands, setSelectedCommands] = useState<string[]>(['total']);
  const [commandSearch, setCommandSearch] = useState('');
  const [commandDropdownOpen, setCommandDropdownOpen] = useState(false);
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');
  const [dailyAnchorOffsetMs, setDailyAnchorOffsetMs] = useState<number | null>(null);

  // Calculate time range as ISO strings (cap at ~2 weeks)
  const { from, to } = useMemo(() => {
    const now = new Date();
    const thirteenDaysMs = 13 * 24 * 60 * 60 * 1000;
    const rangeMs = timeRange === '2weeks' ? thirteenDaysMs : (7 * 24 * 60 * 60 * 1000);
    const fromDate = new Date(now.getTime() - rangeMs);
    return {
      from: fromDate.toISOString(),
      to: now.toISOString(),
    };
  }, [timeRange]);

  const { totalFrom, totalTo } = useMemo(() => {
    const now = new Date();
    const thirteenDaysMs = 13 * 24 * 60 * 60 * 1000;
    const maxRangeStart = new Date(now.getTime() - thirteenDaysMs);
    return {
      totalFrom: maxRangeStart.toISOString(),
      totalTo: now.toISOString(),
    };
  }, []);

  const getIntervalMs = (intervalValue: string) => {
    const match = intervalValue.match(/^(\d+)([smhd])$/);
    if (!match) {
      return 24 * 60 * 60 * 1000;
    }
    const amount = Number(match[1]);
    const unit = match[2];
    const multipliers: Record<string, number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };
    return amount * (multipliers[unit] || multipliers.d);
  };

  const desiredDataInterval = interval === '1d' ? '1h' : interval;

  const getEffectiveInterval = (fromIso: string, toIso: string, desired: string) => {
    const fromMs = new Date(fromIso).getTime();
    const toMs = new Date(toIso).getTime();
    const rangeMs = Math.max(0, toMs - fromMs);
    const calcPoints = (stepMs: number) => (stepMs > 0 ? Math.floor(rangeMs / stepMs) + 1 : 0);
    const desiredMs = getIntervalMs(desired);
    if (calcPoints(desiredMs) <= 100) {
      return desired;
    }
    const minStepMs = Math.ceil(rangeMs / 99);
    const units = [
      { unit: 'd', ms: 24 * 60 * 60 * 1000 },
      { unit: 'h', ms: 60 * 60 * 1000 },
      { unit: 'm', ms: 60 * 1000 },
      { unit: 's', ms: 1000 },
    ];
    const chosen = units.find(({ ms }) => minStepMs >= ms) || units[units.length - 1];
    const value = Math.max(1, Math.ceil(minStepMs / chosen.ms));
    const candidate = `${value}${chosen.unit}`;
    const candidateMs = getIntervalMs(candidate);
    if (calcPoints(candidateMs) > 100) {
      const bumpedValue = Math.ceil(minStepMs / chosen.ms) + 1;
      return `${Math.max(1, bumpedValue)}${chosen.unit}`;
    }
    return candidate;
  };

  const effectiveDataInterval = useMemo(() => {
    return getEffectiveInterval(from, to, desiredDataInterval);
  }, [from, to, desiredDataInterval]);

  const chartInterval = interval === '1d' ? '1d' : effectiveDataInterval;

  const totalsDataInterval = useMemo(() => {
    return getEffectiveInterval(totalFrom, totalTo, desiredDataInterval);
  }, [totalFrom, totalTo, desiredDataInterval]);

  // Fetch command usage data
  useAsyncEffect(async (signal) => {
    const cacheKey = `${guildId}-${from}-${to}-${effectiveDataInterval}`;
    const cached = commandUsageCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      setCommandUsage(cached.data);
      setLoading(false);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await fetchCommandUsage(jwtToken, guildId, from, to, effectiveDataInterval, signal);
      if (signal.aborted) return;
      
      if ('error' in response) {
        const errorMessage = response.error || 'Failed to fetch command usage';
        setError(errorMessage);
        setCommandUsage([]);
      } else {
        setCommandUsage(response);
        onStatsDataChange?.({
          from,
          to,
          interval: effectiveDataInterval,
          data: response,
        });
        commandUsageCache.set(cacheKey, { data: response, timestamp: Date.now() });
      }
    } catch (err) {
      if (signal.aborted || isAbortError(err)) return;
      console.error('Error fetching command usage:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch command usage');
      setCommandUsage([]);
    } finally {
      if (!signal.aborted) {
        setLoading(false);
      }
    }
  }, [jwtToken, guildId, from, to, effectiveDataInterval, onStatsDataChange]);

  useEffect(() => {
    if (interval !== '1d' || commandUsage.length === 0) return;
    let latestTs = -Infinity;
    commandUsage.forEach(cmd => {
      cmd.values.forEach(([isoString]) => {
        const ts = new Date(isoString).getTime();
        if (!Number.isNaN(ts) && ts > latestTs) {
          latestTs = ts;
        }
      });
    });
    if (!Number.isFinite(latestTs)) return;
    const dayMs = 24 * 60 * 60 * 1000;
    const offsetMs = ((latestTs % dayMs) + dayMs) % dayMs;
    setDailyAnchorOffsetMs(prev => (prev === offsetMs ? prev : offsetMs));
  }, [interval, commandUsage]);

  // Fetch totals data (always last 2 weeks, independent of filters)
  useAsyncEffect(async (signal) => {
    const cacheKey = `${guildId}-${totalFrom}-${totalTo}-${totalsDataInterval}`;
    const cached = commandUsageCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      setTotalUsage(cached.data);
      return;
    }

    try {
      const response = await fetchCommandUsage(jwtToken, guildId, totalFrom, totalTo, totalsDataInterval, signal);
      if (signal.aborted) return;

      if ('error' in response) {
        setTotalUsage([]);
      } else {
        setTotalUsage(response);
        commandUsageCache.set(cacheKey, { data: response, timestamp: Date.now() });
      }
    } catch (err) {
      if (signal.aborted || isAbortError(err)) return;
      console.error('Error fetching totals:', err);
      setTotalUsage([]);
    }
  }, [jwtToken, guildId, totalFrom, totalTo, totalsDataInterval]);

  // Get unique commands list
  const commands = useMemo(() => {
    const uniqueCommands = new Map<string, { name: string; group: string; command_id: number }>();
    commandUsage.forEach(cmd => {
      const key = `${cmd.group}:${cmd.name}`;
      if (!uniqueCommands.has(key)) {
        uniqueCommands.set(key, { name: cmd.name, group: cmd.group, command_id: cmd.command_id });
      }
    });
    return Array.from(uniqueCommands.values()).sort((a, b) => {
      if (a.group !== b.group) return a.group.localeCompare(b.group);
      return a.name.localeCompare(b.name);
    });
  }, [commandUsage]);

  const commandOptions = useMemo(() => {
    return commands.map(cmd => ({
      id: `${cmd.group}:${cmd.name}`,
      label: `${cmd.group} ${cmd.name}`,
    }));
  }, [commands]);

  const filteredCommandOptions = useMemo(() => {
    const query = commandSearch.trim().toLowerCase();
    if (!query) return commandOptions;
    return commandOptions.filter(option => option.label.toLowerCase().includes(query));
  }, [commandOptions, commandSearch]);

  const SERIES_COLORS = [
    '#5865F2',
    '#3BA55D',
    '#ED4245',
    '#FEE75C',
    '#EB459E',
    '#57F287',
    '#F47B68',
    '#1ABC9C',
    '#9B59B6',
  ];

  const hashToColor = (key: string) => {
    let hash = 0;
    for (let i = 0; i < key.length; i += 1) {
      hash = (hash * 31 + key.charCodeAt(i)) | 0;
    }
    const index = Math.abs(hash) % SERIES_COLORS.length;
    return SERIES_COLORS[index];
  };

  const getAlignedRange = (fromIso: string, toIso: string, intervalValue: string, dailyAnchorMs?: number | null) => {
    const match = intervalValue.match(/^(\d+)([smhd])$/);
    const unit = match ? match[2] : 'd';
    const intervalMs = getIntervalMs(intervalValue);
    const fromDate = new Date(fromIso);
    const toDate = new Date(toIso);

    let alignedFrom = new Date(fromDate);
    if (unit === 'd') {
      const midnight = Date.UTC(fromDate.getUTCFullYear(), fromDate.getUTCMonth(), fromDate.getUTCDate());
      alignedFrom = new Date(midnight + (dailyAnchorMs ?? 0));
    } else if (unit === 'h') {
      alignedFrom = new Date(Date.UTC(fromDate.getUTCFullYear(), fromDate.getUTCMonth(), fromDate.getUTCDate(), fromDate.getUTCHours()));
    } else if (unit === 'm') {
      alignedFrom = new Date(Date.UTC(
        fromDate.getUTCFullYear(),
        fromDate.getUTCMonth(),
        fromDate.getUTCDate(),
        fromDate.getUTCHours(),
        fromDate.getUTCMinutes()
      ));
    } else if (unit === 's') {
      alignedFrom = new Date(Date.UTC(
        fromDate.getUTCFullYear(),
        fromDate.getUTCMonth(),
        fromDate.getUTCDate(),
        fromDate.getUTCHours(),
        fromDate.getUTCMinutes(),
        fromDate.getUTCSeconds()
      ));
    }

    const fromMs = alignedFrom.getTime();
    const toMs = toDate.getTime();
    const remainder = (toMs - fromMs) % intervalMs;
    const alignedToMs = remainder === 0 ? toMs : toMs - remainder;

    return { fromMs, toMs: alignedToMs, dataToMs: toMs };
  };

  const normalizeSeries = (values: Array<[string, number]>, rangeStartIso: string) => {
    const sorted = [...values].sort(
      ([a], [b]) => new Date(a).getTime() - new Date(b).getTime()
    );
    if (sorted.length === 0) return [];

    const firstTs = new Date(sorted[0][0]).getTime();
    const startTs = new Date(rangeStartIso).getTime();
    
    // If the first sample is within 24h of the request start, assume it existed before
    // and use its value as baseline to avoid a massive spike from time zero.
    let prev = (firstTs - startTs < 24 * 60 * 60 * 1000) ? sorted[0][1] : 0;

    const deltas: Array<[string, number]> = [];
    for (const [isoString, cumulative] of sorted) {
      if (cumulative < prev) {
        // Counter reset: treat current value as the delta from 0
        deltas.push([isoString, Math.max(0, cumulative)]);
      } else {
        deltas.push([isoString, Math.max(0, cumulative - prev)]);
      }
      prev = cumulative;
    }
    return deltas;
  };

  const baselineByCommand = useMemo(() => {
    const fromMs = new Date(from).getTime();
    const baseline = new Map<string, number>();
    totalUsage.forEach(cmd => {
      const key = `${cmd.group}:${cmd.name}`;
      let latestValue: number | null = null;
      let latestTs = -Infinity;
      cmd.values.forEach(([isoString, value]) => {
        const ts = new Date(isoString).getTime();
        if (ts < fromMs && ts > latestTs) {
          latestTs = ts;
          latestValue = value;
        }
      });
      if (latestValue !== null) {
        baseline.set(key, latestValue);
      }
    });
    return baseline;
  }, [from, totalUsage]);

  // Calculate total commands in past 2 weeks
  const totalCommands = useMemo(() => {
    const twoWeeksAgo = new Date(Date.now() - (14 * 24 * 60 * 60 * 1000));
    let total = 0;
    totalUsage.forEach(cmd => {
      const series = normalizeSeries(cmd.values, totalFrom);
      series.forEach(([isoString, count]) => {
        const timestamp = new Date(isoString);
        if (timestamp >= twoWeeksAgo) {
          total += count;
        }
      });
    });
    return total;
  }, [totalUsage, totalFrom]);

  // Find most popular command
  const mostPopularCommand = useMemo<{ name: string; group: string; total: number; key: string } | null>(() => {
    if (totalUsage.length === 0) return null;
    
    const commandTotals = new Map<string, { name: string; group: string; total: number }>();
    
    totalUsage.forEach(cmd => {
      const key = `${cmd.group}:${cmd.name}`;
      const series = normalizeSeries(cmd.values, totalFrom);
      const total = series.reduce((sum, [, count]) => sum + count, 0);
      const existing = commandTotals.get(key);
      
      if (!existing || total > existing.total) {
        commandTotals.set(key, { name: cmd.name, group: cmd.group, total });
      }
    });
    
    let maxTotal = 0;
    let mostPopular: { name: string; group: string; total: number; key: string } | null = null;
    commandTotals.forEach((cmd, key) => {
      if (cmd.total > maxTotal) {
        maxTotal = cmd.total;
        mostPopular = { ...cmd, key };
      }
    });
    
    return mostPopular;
  }, [totalUsage]);

  // Prepare chart data
  const chartData = useMemo(() => {
    if (commandUsage.length === 0) return [];

    const normalizeForChart = (values: Array<[string, number]>, baselineValue?: number) => {
      const sorted = [...values].sort(
        ([a], [b]) => new Date(a).getTime() - new Date(b).getTime()
      );
      if (sorted.length === 0) return [];

      let prev = baselineValue ?? null;
      
      if (prev === null) {
        const firstTs = new Date(sorted[0][0]).getTime();
        // Use the absolute start of our 13-day window to detect "pre-existing" series
        const knowledgeStartTs = new Date(totalFrom).getTime();
        
        // If the first sample we ever saw for this command is within the first 24h 
        // of our 13-day window, assume it's a pre-existing counter and baseline it.
        // Otherwise, it's a new series that started later, so baseline at 0.
        prev = (firstTs - knowledgeStartTs < 24 * 60 * 60 * 1000) ? sorted[0][1] : 0;
      }

      const deltas: Array<[string, number]> = [];
      for (const [isoString, cumulative] of sorted) {
        if (cumulative < prev) {
          deltas.push([isoString, Math.max(0, cumulative)]);
        } else {
          deltas.push([isoString, Math.max(0, cumulative - prev)]);
        }
        prev = cumulative;
      }
      return deltas;
    };

    // Combine all commands or filter by selected command
    const selectedSet = new Set(selectedCommands.length ? selectedCommands : ['total']);
    const shouldIncludeTotal = selectedSet.has('total');
    const seriesKeys = Array.from(selectedSet);

    const intervalMs = getIntervalMs(chartInterval);
    const { fromMs, toMs, dataToMs } = getAlignedRange(from, to, chartInterval, dailyAnchorOffsetMs);

    // Create a map of bucket timestamp -> series counts
    const timestampMap = new Map<number, Record<string, number>>();

    const bucketTimestamp = (ts: number) => {
      if (ts < fromMs || ts > dataToMs) return null;
      const bucketIndex = Math.floor((ts - fromMs) / intervalMs);
      const bucket = fromMs + bucketIndex * intervalMs;
      return bucket > toMs ? null : bucket;
    };

    const addToBucket = (bucket: number, key: string, count: number) => {
      const existing = timestampMap.get(bucket) || {};
      timestampMap.set(bucket, { ...existing, [key]: (existing[key] || 0) + count });
    };

    const allCommandsSeries = commandUsage.map(cmd => {
      const key = `${cmd.group}:${cmd.name}`;
      const baselineValue = baselineByCommand.get(key);
      return {
        key,
        values: normalizeForChart(cmd.values, baselineValue),
      };
    });

    allCommandsSeries.forEach(({ key, values }) => {
      values.forEach(([isoString, count]) => {
        const timestamp = new Date(isoString).getTime();
        const bucket = bucketTimestamp(timestamp);
        if (bucket === null) return;
        if (selectedSet.has(key)) {
          addToBucket(bucket, key, count);
        }
        if (shouldIncludeTotal) {
          addToBucket(bucket, 'total', count);
        }
      });
    });

    // Fill missing timestamps to ensure the X axis shows the full range.
    const data = [];
    for (let ts = fromMs; ts <= toMs; ts += intervalMs) {
      const counts = timestampMap.get(ts) || {};
      const timeLabel = new Date(ts).toLocaleString('en-US', {
        timeZone: 'UTC',
        month: 'short',
        day: 'numeric',
        ...(chartInterval.endsWith('h') ? { hour: 'numeric' } : {}),
      });
      const seriesCounts = seriesKeys.reduce<Record<string, number>>((acc, key) => {
        acc[key] = counts[key] ?? 0;
        return acc;
      }, {});
      data.push({
        timestamp: ts,
        isoString: new Date(ts).toISOString(),
        time: timeLabel,
        ...seriesCounts,
      });
    }

    return data;
  }, [commandUsage, selectedCommands, chartInterval, from, to, baselineByCommand, dailyAnchorOffsetMs]);

  // Format date for display (from and to are ISO strings)
  const formatDateRange = () => {
    const fromDate = new Date(from);
    const toDate = new Date(to);
    return `${fromDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${toDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-discord-blurple border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-discord-red/20 border border-discord-red/50 rounded-lg p-4">
        <p className="text-discord-red text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Info banner */}
      <div className="bg-blue-500/10 border border-blue-500/50 rounded-lg p-4">
        <p className="text-blue-400 text-sm">
          <Clock className="w-4 h-4 inline mr-1" />
          Only data from the past ~2 weeks (about 13 days) is retained.
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Total Commands */}
        <div className="bg-discord-darker rounded-lg p-6 border border-gray-600">
          <div className="flex items-center justify-between">
            <div>
          <p className="text-gray-400 text-sm mb-1">Total Commands (Last ~2 Weeks)</p>
              <p className="text-3xl font-bold text-white">{totalCommands.toLocaleString()}</p>
            </div>
            <BarChart3 className="w-10 h-10 text-discord-blurple" />
          </div>
        </div>

        {/* Most Popular Command */}
        <div className="bg-discord-darker rounded-lg p-6 border border-gray-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-1">Most Popular Command (Last ~2 Weeks)</p>
              {mostPopularCommand ? (
                <div>
                  <p className="text-xl font-semibold text-white">
                    {mostPopularCommand.group} {mostPopularCommand.name}
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    {mostPopularCommand.total.toLocaleString()} uses
                  </p>
                </div>
              ) : (
                <p className="text-gray-400">No data</p>
              )}
            </div>
            <TrendingUp className="w-10 h-10 text-discord-green" />
          </div>
        </div>
      </div>

      {/* Chart controls */}
      <div className="bg-discord-darker rounded-lg p-4 border border-gray-600">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Time Range</label>
            <StyledSelect
              value={timeRange}
              onChange={(value) => setTimeRange(value as TimeRange)}
              options={[
                { value: 'week', label: 'Last Week' },
                { value: '2weeks', label: 'Last ~2 Weeks' },
              ]}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Interval</label>
            <StyledSelect
              value={interval}
              onChange={(value) => setInterval(value as Interval)}
              options={[
                { value: '1d', label: 'Daily' },
                { value: '1h', label: 'Hourly' },
              ]}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Chart Type</label>
            <StyledSelect
              value={chartType}
              onChange={(value) => setChartType(value as 'line' | 'bar')}
              options={[
                { value: 'line', label: 'Line' },
                { value: 'bar', label: 'Bar' },
              ]}
            />
          </div>
          <div className="relative">
            <label className="block text-sm font-medium text-gray-300 mb-2">Commands</label>
            <button
              type="button"
              onClick={() => setCommandDropdownOpen((prev) => !prev)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-left text-white text-sm flex items-center justify-between"
            >
              <span className="truncate">
                {selectedCommands.length ? `${selectedCommands.length} selected` : 'Select commands'}
              </span>
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {commandDropdownOpen && (
              <div className="absolute z-10 mt-2 w-full bg-gray-700 border border-gray-600 rounded-lg p-2 shadow-lg">
                <input
                  type="text"
                  value={commandSearch}
                  onChange={(e) => setCommandSearch(e.target.value)}
                  placeholder="Search commands..."
                  className="w-full bg-gray-800 border border-gray-600 rounded-md px-2 py-1 text-sm text-white placeholder-gray-400 focus:ring-2 focus:ring-discord-blurple focus:border-discord-blurple"
                />
                <div className="mt-2 max-h-48 overflow-y-auto space-y-1">
                  <label className="flex items-center text-sm text-gray-200 space-x-2">
                    <input
                      type="checkbox"
                      checked={selectedCommands.includes('total')}
                      onChange={(e) => {
                        const next = e.target.checked
                          ? Array.from(new Set([...selectedCommands, 'total']))
                          : selectedCommands.filter(item => item !== 'total');
                        setSelectedCommands(next.length ? next : ['total']);
                      }}
                      className="sr-only"
                    />
                    <span className={`h-4 w-4 rounded border border-gray-500 bg-gray-800 flex items-center justify-center ${
                      selectedCommands.includes('total') ? 'bg-discord-blurple border-discord-blurple' : ''
                    }`}>
                      {selectedCommands.includes('total') && (
                        <span className="w-2 h-2 bg-white rounded-sm" />
                      )}
                    </span>
                    <span>Total</span>
                  </label>
                  {filteredCommandOptions.map(option => (
                    <label key={option.id} className="flex items-center text-sm text-gray-200 space-x-2">
                      <input
                        type="checkbox"
                        checked={selectedCommands.includes(option.id)}
                        onChange={(e) => {
                          const next = e.target.checked
                            ? Array.from(new Set([...selectedCommands, option.id]))
                            : selectedCommands.filter(item => item !== option.id);
                          setSelectedCommands(next.length ? next : ['total']);
                        }}
                        className="sr-only"
                      />
                      <span className={`h-4 w-4 rounded border border-gray-500 bg-gray-800 flex items-center justify-center ${
                        selectedCommands.includes(option.id) ? 'bg-discord-blurple border-discord-blurple' : ''
                      }`}>
                        {selectedCommands.includes(option.id) && (
                          <span className="w-2 h-2 bg-white rounded-sm" />
                        )}
                      </span>
                      <span>{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-discord-darker rounded-lg p-6 border border-gray-600">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-white">
            Command Usage
          </h3>
          <p className="text-sm text-gray-400 mt-1">{formatDateRange()}</p>
        </div>
        {chartData.length === 0 ? (
          <div className="h-[400px] flex items-center justify-center text-gray-400">
            No data available for the selected time range
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            {chartType === 'bar' ? (
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="time"
                  stroke="#9CA3AF"
                  style={{ fontSize: '12px' }}
                />
                <YAxis
                  stroke="#9CA3AF"
                  style={{ fontSize: '12px' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: '#F3F4F6' }}
                />
                <Legend />
                {Array.from(new Set(selectedCommands.length ? selectedCommands : ['total'])).map((key) => {
                  const label = key === 'total'
                    ? 'Total'
                    : commandOptions.find(option => option.id === key)?.label || key;
                  const color = key === 'total' ? '#5865F2' : hashToColor(key);
                  return (
                    <Bar
                      key={key}
                      dataKey={key}
                      fill={color}
                      name={label}
                      radius={[3, 3, 0, 0]}
                    />
                  );
                })}
              </BarChart>
            ) : (
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="time"
                  stroke="#9CA3AF"
                  style={{ fontSize: '12px' }}
                />
                <YAxis
                  stroke="#9CA3AF"
                  style={{ fontSize: '12px' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: '#F3F4F6' }}
                />
                <Legend />
                {Array.from(new Set(selectedCommands.length ? selectedCommands : ['total'])).map((key) => {
                  const label = key === 'total'
                    ? 'Total'
                    : commandOptions.find(option => option.id === key)?.label || key;
                  const color = key === 'total' ? '#5865F2' : hashToColor(key);
                  return (
                    <Line
                      key={key}
                      type="monotone"
                      dataKey={key}
                      stroke={color}
                      strokeWidth={2}
                      dot={{ fill: color, r: 3 }}
                      activeDot={{ r: 5 }}
                      name={label}
                    />
                  );
                })}
              </LineChart>
            )}
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default ServerStats;

