import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { f1Api } from '../utils/api';
import LoadingState from '../components/common/LoadingState';
import ErrorState from '../components/common/ErrorState';

const FALLBACK_IMAGE = 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/fallback/fallback.png.transform/1col/image.png';

export default function Leaderboard() {
  const [activeTab, setActiveTab] = useState('drivers');
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLeaderboard = useCallback(async (selectedYear) => {
    setLoading(true);
    setError(null);
    try {
      const sessions = await f1Api.getSessions(selectedYear);
      if (!sessions.length) throw new Error(`No race sessions found for ${selectedYear}`);
      
      const now = new Date();
      const sorted = sessions.sort((a, b) => new Date(a.date_start) - new Date(b.date_start));
      const completed = sorted.filter(s => new Date(s.date_end || s.date_start) < now);
      
      const sessionKey = completed.length > 0 ? completed[completed.length - 1].session_key : sorted[0].session_key;

      const [dChamp, cChamp, drvs] = await Promise.all([
        f1Api.getChampionshipDrivers(sessionKey),
        f1Api.getChampionshipTeams(sessionKey),
        f1Api.getDrivers(sessionKey)
      ]);

      const driverInfoMap = {};
      const teamColorMap = {};
      if (drvs) {
        drvs.forEach(d => {
          driverInfoMap[d.driver_number] = d;
          if (d.team_name && d.team_colour) teamColorMap[d.team_name] = d.team_colour;
        });
      }

      const enrichDriver = (d) => {
        const info = driverInfoMap[d.driver_number] || {};
        return { 
          ...d, 
          headshot_url: info.headshot_url || FALLBACK_IMAGE, 
          name_acronym: info.name_acronym,
          team_colour: info.team_colour || teamColorMap[d.team_name] 
        };
      };

      const enrichTeam = (t) => {
        return { 
          ...t, 
          team_colour: teamColorMap[t.team_name] 
        };
      };

      const drivers = (dChamp || []).sort((a, b) => b.points_current - a.points_current).map(enrichDriver);
      const teams = (cChamp || []).sort((a, b) => b.points_current - a.points_current).map(enrichTeam);

      setData({ drivers, teams });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaderboard(year);
  }, [fetchLeaderboard, year]);

  const renderDriverPodium = () => {
    if (!data?.drivers?.length) return null;
    const top3 = data.drivers.slice(0, 3);
    const order = [top3[1], top3[0], top3[2]];
    const posLabel = ['2nd', '1st', '3rd'];

    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: '1rem', marginTop: '2rem', marginBottom: '3rem' }}>
        {order.map((d, i) => {
          if (!d) return null;
          const color = d.team_colour ? `#${d.team_colour}` : '#e10600';
          const name = d.full_name || `${d.first_name || ''} ${d.last_name || ''}`;
          const isWinner = i === 1;
          return (
            <motion.div 
              key={d.driver_number || name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: isWinner ? '140px' : '110px' }}
            >
              <div style={{ color: 'var(--color-text-secondary)', fontWeight: 'bold', marginBottom: '0.5rem' }}>{posLabel[i]}</div>
              <img src={d.headshot_url} alt={name} style={{ width: isWinner ? '90px' : '70px', height: isWinner ? '90px' : '70px', borderRadius: '50%', border: `3px solid ${color}`, objectFit: 'cover', background: `${color}33`, marginBottom: '1rem', boxShadow: isWinner ? `0 0 20px ${color}` : 'none' }} />
              <strong style={{ textAlign: 'center', fontSize: isWinner ? '1.1rem' : '0.9rem', lineHeight: '1.2' }}>{name}</strong>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem', textAlign: 'center' }}>{d.team_name}</div>
              <div style={{ marginTop: '0.5rem', fontWeight: 'bold', color: 'var(--color-accent-tertiary)' }}>{d.points_current} <span style={{fontSize: '0.7rem', color: '#aaa'}}>PTS</span></div>
            </motion.div>
          );
        })}
      </div>
    );
  };

  const renderTeamPodium = () => {
    if (!data?.teams?.length) return null;
    const top3 = data.teams.slice(0, 3);
    const order = [top3[1], top3[0], top3[2]];
    const posLabel = ['2nd', '1st', '3rd'];

    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: '1rem', marginTop: '2rem', marginBottom: '3rem' }}>
        {order.map((t, i) => {
          if (!t) return null;
          const color = t.team_colour ? `#${t.team_colour}` : '#e10600';
          const isWinner = i === 1;
          const initial = t.team_name ? t.team_name.charAt(0) : 'T';
          return (
            <motion.div 
              key={t.team_name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: isWinner ? '140px' : '110px' }}
            >
              <div style={{ color: 'var(--color-text-secondary)', fontWeight: 'bold', marginBottom: '0.5rem' }}>{posLabel[i]}</div>
              <div style={{ width: isWinner ? '90px' : '70px', height: isWinner ? '90px' : '70px', borderRadius: '50%', border: `3px solid ${color}`, background: `${color}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: isWinner ? '2rem' : '1.5rem', fontWeight: 'bold', color: '#fff', marginBottom: '1rem', boxShadow: isWinner ? `0 0 20px ${color}` : 'none' }}>{initial}</div>
              <strong style={{ textAlign: 'center', fontSize: isWinner ? '1.1rem' : '0.9rem', lineHeight: '1.2' }}>{t.team_name}</strong>
              <div style={{ marginTop: '0.5rem', fontWeight: 'bold', color: 'var(--color-accent-tertiary)' }}>{t.points_current} <span style={{fontSize: '0.7rem', color: '#aaa'}}>PTS</span></div>
            </motion.div>
          );
        })}
      </div>
    );
  };

  const TableHeader = () => (
    <div style={{ display: 'grid', gridTemplateColumns: '50px 1fr 100px', padding: '1rem', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
      <div>Pos</div>
      <div>{activeTab === 'drivers' ? 'Driver' : 'Constructor'}</div>
      <div style={{ textAlign: 'right' }}>Points</div>
    </div>
  );

  return (
    <div>
      <div className="header-row">
        <h1 className="page-title">Leaderboard</h1>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <select 
            value={year} 
            onChange={(e) => setYear(Number(e.target.value))}
            className="controls-input"
          >
            {[2024, 2025].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <div style={{ display: 'flex', background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '4px' }}>
            <button 
              className="btn" 
              style={{ background: activeTab === 'drivers' ? 'var(--color-accent-primary)' : 'transparent', border: 'none', color: activeTab === 'drivers' ? '#fff' : 'var(--color-text-secondary)' }}
              onClick={() => setActiveTab('drivers')}
            >
              Drivers
            </button>
            <button 
              className="btn" 
              style={{ background: activeTab === 'constructors' ? 'var(--color-accent-primary)' : 'transparent', border: 'none', color: activeTab === 'constructors' ? '#fff' : 'var(--color-text-secondary)' }}
              onClick={() => setActiveTab('constructors')}
            >
              Constructors
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <LoadingState message={`Fetching ${year} championship standings...`} />
      ) : error ? (
        <ErrorState message={error} onRetry={() => fetchLeaderboard(year)} />
      ) : (
        <div>
          {activeTab === 'drivers' && data?.drivers && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {renderDriverPodium()}
              <div className="glass-panel" style={{ padding: 0 }}>
                <TableHeader />
                {data.drivers.slice(3).map((d, i) => {
                  const color = d.team_colour ? `#${d.team_colour}` : '#e10600';
                  const name = d.full_name || `${d.first_name || ''} ${d.last_name || ''}`;
                  return (
                    <div key={d.driver_number} style={{ display: 'grid', gridTemplateColumns: '50px 1fr 100px', padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', alignItems: 'center', transition: 'background var(--transition-fast)' }} className="leaderboard-row">
                      <strong style={{ color: 'var(--color-text-secondary)' }}>{i + 4}</strong>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ width: '4px', height: '24px', background: color, borderRadius: '2px' }}></div>
                        <img src={d.headshot_url} alt={name} style={{ width: '30px', height: '30px', borderRadius: '50%', border: `1px solid ${color}` }} />
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 'bold' }}>{name}</span>
                          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{d.team_name}</span>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', fontWeight: 'bold' }}>{d.points_current}</div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {activeTab === 'constructors' && data?.teams && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {renderTeamPodium()}
              <div className="glass-panel" style={{ padding: 0 }}>
                <TableHeader />
                {data.teams.slice(3).map((t, i) => {
                  const color = t.team_colour ? `#${t.team_colour}` : '#e10600';
                  return (
                    <div key={t.team_name} style={{ display: 'grid', gridTemplateColumns: '50px 1fr 100px', padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', alignItems: 'center', transition: 'background var(--transition-fast)' }}>
                      <strong style={{ color: 'var(--color-text-secondary)' }}>{i + 4}</strong>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ width: '4px', height: '24px', background: color, borderRadius: '2px' }}></div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 'bold' }}>{t.team_name}</span>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', fontWeight: 'bold' }}>{t.points_current}</div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}
