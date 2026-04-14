import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { f1Api } from '../utils/api';
import LoadingState from '../components/common/LoadingState';
import ErrorState from '../components/common/ErrorState';

const FALLBACK_IMAGE = 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/fallback/fallback.png.transform/1col/image.png';

const DRIVER_PRICE = (rank) => rank <= 5 ? 50 : rank <= 10 ? 30 : rank <= 15 ? 20 : 10;
const TEAM_PRICE = (rank) => rank <= 3 ? 50 : rank <= 6 ? 30 : 20;

export default function Game() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [drivers, setDrivers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [p1, setP1] = useState({ drivers: [], team: null, budget: 100 });
  const [p2, setP2] = useState({ drivers: [], team: null, budget: 100 });
  const [activeTab, setActiveTab] = useState({ p1: 'drivers', p2: 'drivers' });
  const [simulating, setSimulating] = useState(false);
  const [results, setResults] = useState(null);

  const initGame = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const year = 2025;
      const sessions = await f1Api.getSessions(year);
      const now = new Date();
      const pastRaces = sessions.filter(s => new Date(s.date_end || s.date_start) < now).sort((a,b) => new Date(a.date_start) - new Date(b.date_start));
      const sessionKey = pastRaces.length > 0 ? pastRaces[pastRaces.length - 1].session_key : 'latest';

      const [dChamp, cChamp, drvs] = await Promise.all([
        f1Api.getChampionshipDrivers(sessionKey).catch(() => []),
        f1Api.getChampionshipTeams(sessionKey).catch(() => []),
        f1Api.getDrivers(sessionKey).catch(() => [])
      ]);

      const driverInfo = {};
      const teamColorMap = {};
      if (drvs) {
        drvs.forEach(d => {
          driverInfo[d.driver_number] = d;
          if (d.team_name && d.team_colour) teamColorMap[d.team_name] = d.team_colour;
        });
      }

      const dList = (dChamp || []).sort((a,b) => b.points_current - a.points_current).map((d, i) => {
        const info = driverInfo[d.driver_number] || {};
        return {
          ...d,
          headshot_url: info.headshot_url || FALLBACK_IMAGE,
          team_colour: info.team_colour || teamColorMap[d.team_name],
          price: DRIVER_PRICE(i + 1),
          rank: i + 1
        };
      });

      const tList = (cChamp || []).sort((a,b) => b.points_current - a.points_current).map((t, i) => {
        return {
          ...t,
          team_colour: teamColorMap[t.team_name],
          price: TEAM_PRICE(i + 1),
          rank: i + 1
        };
      });

      setDrivers(dList);
      setTeams(tList);
    } catch (err) {
      setError("Failed to load Fantasy Game data. Please ensure the API is reachable.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const toggleTab = (player, tab) => setActiveTab(prev => ({ ...prev, [player]: tab }));

  const pickDriver = (player, d) => {
    const pState = player === 1 ? p1 : p2;
    const setP = player === 1 ? setP1 : setP2;

    if (pState.drivers.find(x => x.driver_number === d.driver_number)) return; // Already picked
    if (pState.drivers.length >= 2) return; // Full
    if (pState.budget < d.price) return; // Too expensive

    setP({ ...pState, drivers: [...pState.drivers, d], budget: pState.budget - d.price });
  };

  const removeDriver = (player, i) => {
    const pState = player === 1 ? p1 : p2;
    const setP = player === 1 ? setP1 : setP2;
    const d = pState.drivers[i];
    const newDrivers = pState.drivers.filter((_, idx) => idx !== i);
    setP({ ...pState, drivers: newDrivers, budget: pState.budget + d.price });
  };

  const pickTeam = (player, t) => {
    const pState = player === 1 ? p1 : p2;
    const setP = player === 1 ? setP1 : setP2;

    if (pState.team?.team_name === t.team_name) return; // Already picked
    const newBudget = pState.budget + (pState.team ? pState.team.price : 0) - t.price;
    if (newBudget < 0) return; // Too expensive

    setP({ ...pState, team: t, budget: newBudget });
  };

  const removeTeam = (player) => {
    const pState = player === 1 ? p1 : p2;
    const setP = player === 1 ? setP1 : setP2;
    setP({ ...pState, team: null, budget: pState.budget + pState.team.price });
  };

  const isReady = p1.drivers.length === 2 && p1.team && p2.drivers.length === 2 && p2.team;

  const simulateRace = () => {
    setSimulating(true);
    // Simple random simulation logic for demo
    setTimeout(() => {
      const scoreEvent = (d, multiplier) => ({ name: d.last_name || d.team_name, pts: Math.floor(Math.random() * 25), multiplier });
      
      const p1d1 = scoreEvent(p1.drivers[0], 0.5);
      const p1d2 = scoreEvent(p1.drivers[1], 0.2);
      const p1t1 = scoreEvent(p1.team, 0.3);
      const p1Total = p1d1.pts * p1d1.multiplier + p1d2.pts * p1d2.multiplier + p1t1.pts * p1t1.multiplier;

      const p2d1 = scoreEvent(p2.drivers[0], 0.5);
      const p2d2 = scoreEvent(p2.drivers[1], 0.2);
      const p2t1 = scoreEvent(p2.team, 0.3);
      const p2Total = p2d1.pts * p2d1.multiplier + p2d2.pts * p2d2.multiplier + p2t1.pts * p2t1.multiplier;

      setResults({ p1Total, p2Total, details: { p1: [p1d1, p1d2, p1t1], p2: [p2d1, p2d2, p2t1] } });
      setSimulating(false);
    }, 1500);
  };

  const resetGame = () => {
    setResults(null);
    setP1({ drivers: [], team: null, budget: 100 });
    setP2({ drivers: [], team: null, budget: 100 });
  };

  const RosterItem = ({ item, isTeam, onAdd, disabled }) => {
    const name = isTeam ? item.team_name : item.last_name || item.full_name;
    const color = item.team_colour ? `#${item.team_colour}` : '#ccc';
    return (
      <div 
        onClick={!disabled ? onAdd : undefined}
        style={{ 
          display: 'flex', justifyContent: 'space-between', padding: '0.5rem', 
          border: `1px solid ${color}55`, borderRadius: '4px', marginBottom: '0.5rem',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.4 : 1,
          background: 'rgba(255,255,255,0.02)',
          transition: 'background var(--transition-fast)'
        }}
      >
        <span style={{ fontWeight: 'bold' }}>{name}</span>
        <span style={{ color: 'var(--color-accent-tertiary)', fontWeight: 'bold' }}>{item.price}c</span>
      </div>
    );
  };

  const renderDraftPanel = (playerState, playerNum) => {
    const active = activeTab[`p${playerNum}`];
    return (
      <div className="glass-panel" style={{ flex: 1, padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0, color: playerNum === 1 ? 'var(--color-accent-secondary)' : 'var(--color-accent-primary)' }}>Player {playerNum}</h2>
          <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{playerState.budget} <span>CR</span></div>
        </div>
        
        <div style={{ display: 'grid', gap: '1rem', marginBottom: '2rem' }}>
          {[0, 1].map(i => {
            const d = playerState.drivers[i];
            return (
              <div key={`d${i}`} style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px dashed var(--color-border)', position: 'relative' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>Driver {i+1} &times; {i===0?0.5:0.2}</div>
                {d ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <strong style={{ flex: 1 }}>{d.last_name}</strong>
                    <button style={{ color: 'red' }} onClick={() => removeDriver(playerNum, i)}>X</button>
                  </div>
                ) : <div style={{ color: '#555' }}>Select below</div>}
              </div>
            );
          })}
          
          <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px dashed var(--color-border)', position: 'relative' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>Constructor &times; 0.3</div>
            {playerState.team ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <strong style={{ flex: 1 }}>{playerState.team.team_name}</strong>
                <button style={{ color: 'red' }} onClick={() => removeTeam(playerNum)}>X</button>
              </div>
            ) : <div style={{ color: '#555' }}>Select below</div>}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--color-border)', marginBottom: '1rem' }}>
          <button className={`btn`} style={{ flex: 1, background: active === 'drivers' ? 'var(--color-border)' : 'transparent', border: 'none' }} onClick={() => toggleTab(playerNum, 'drivers')}>Drivers</button>
          <button className={`btn`} style={{ flex: 1, background: active === 'teams' ? 'var(--color-border)' : 'transparent', border: 'none' }} onClick={() => toggleTab(playerNum, 'teams')}>Constructors</button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', maxHeight: '300px', paddingRight: '0.5rem' }}>
          {active === 'drivers' ? (
            drivers.map(d => {
              const disabled = playerState.budget < d.price || playerState.drivers.length >= 2 || playerState.drivers.some(x => x.driver_number === d.driver_number);
              return <RosterItem key={d.driver_number} item={d} disabled={disabled} onAdd={() => pickDriver(playerNum, d)} />;
            })
          ) : (
            teams.map(t => {
              const disabled = playerState.team?.team_name === t.team_name || (playerState.budget + (playerState.team ? playerState.team.price : 0)) < t.price;
              return <RosterItem key={t.team_name} item={t} isTeam disabled={disabled} onAdd={() => pickTeam(playerNum, t)} />;
            })
          )}
        </div>
      </div>
    );
  };

  if (loading) return <LoadingState message="Loading 2025 Championship data for draft..." />;
  if (error) return <ErrorState message={error} onRetry={initGame} />;

  if (simulating) {
    return <LoadingState message="Simulating race results..." />;
  }

  if (results) {
    const p1Wins = results.p1Total >= results.p2Total;
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="state-container">
        <h1 className="page-title" style={{ fontSize: '3rem', marginBottom: '2rem' }}>{p1Wins ? 'Player 1 Wins!' : 'Player 2 Wins!'}</h1>
        <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center' }}>
          <div className="glass-panel" style={{ width: '300px' }}>
            <h3 style={{ color: 'var(--color-accent-secondary)' }}>Player 1</h3>
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: '1rem 0' }}>{results.p1Total.toFixed(1)}</div>
            {results.details.p1.map((d,i) => <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#aaa', borderTop: '1px solid #333', paddingTop: '0.5rem', marginTop: '0.5rem' }}><span>{d.name} &times; {d.multiplier}</span><span>{d.pts} pts</span></div>)}
          </div>
          <div className="glass-panel" style={{ width: '300px' }}>
            <h3 style={{ color: 'var(--color-accent-primary)' }}>Player 2</h3>
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: '1rem 0' }}>{results.p2Total.toFixed(1)}</div>
            {results.details.p2.map((d,i) => <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#aaa', borderTop: '1px solid #333', paddingTop: '0.5rem', marginTop: '0.5rem' }}><span>{d.name} &times; {d.multiplier}</span><span>{d.pts} pts</span></div>)}
          </div>
        </div>
        <button className="btn" onClick={resetGame} style={{ marginTop: '2rem' }}>Play Again 🔄</button>
      </motion.div>
    );
  }

  return (
    <div>
      <div className="header-row">
        <div>
          <h1 className="page-title" style={{ marginBottom: '0.25rem' }}>Fantasy Draft</h1>
          <p className="text-muted" style={{ fontSize: '0.9rem' }}>Pick 2 drivers + 1 constructor · 100 credits</p>
        </div>
        <button className="btn" disabled={!isReady} onClick={simulateRace} style={{ background: isReady ? 'var(--color-accent-primary)' : 'rgba(255,255,255,0.05)', color: '#fff', border: 'none', padding: '1rem 2rem', fontSize: '1.2rem' }}>
          Start Race 🏁
        </button>
      </div>

      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
        {renderDraftPanel(p1, 1)}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'var(--color-text-secondary)', fontSize: '2rem' }}>VS</div>
        {renderDraftPanel(p2, 2)}
      </div>
    </div>
  );
}
