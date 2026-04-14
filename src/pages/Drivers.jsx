import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useDrivers } from '../hooks/useF1Data';
import LoadingState from '../components/common/LoadingState';
import ErrorState from '../components/common/ErrorState';
import DriverCard from '../components/driver/DriverCard';

export default function Drivers() {
  const { data: drivers, loading, error, refetch } = useDrivers('latest');
  
  const [search, setSearch] = useState('');
  const [teamFilter, setTeamFilter] = useState('');
  const [sortDir, setSortDir] = useState('az');

  const { uniqueDrivers, teams } = useMemo(() => {
    if (!drivers) return { uniqueDrivers: [], teams: [] };
    const unique = [];
    const seen = new Set();
    const teamSet = new Set();
    
    drivers.forEach(d => {
      if (!seen.has(d.driver_number)) {
        unique.push(d);
        seen.add(d.driver_number);
        if (d.team_name) teamSet.add(d.team_name);
      }
    });
    return { uniqueDrivers: unique, teams: Array.from(teamSet).sort() };
  }, [drivers]);

  const filteredDrivers = useMemo(() => {
    let list = [...uniqueDrivers];
    
    if (teamFilter) {
      list = list.filter(d => d.team_name === teamFilter);
    }
    
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(d => {
        const name = (d.full_name || `${d.first_name} ${d.last_name}`).toLowerCase();
        const team = (d.team_name || '').toLowerCase();
        return name.includes(q) || team.includes(q);
      });
    }
    
    list.sort((a, b) => {
      const na = (a.full_name || `${a.first_name || ''} ${a.last_name || ''}`).toLowerCase();
      const nb = (b.full_name || `${b.first_name || ''} ${b.last_name || ''}`).toLowerCase();
      return sortDir === 'az' ? na.localeCompare(nb) : nb.localeCompare(na);
    });
    
    return list;
  }, [uniqueDrivers, search, teamFilter, sortDir]);

  if (loading) return <LoadingState message="Loading latest drivers data..." />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;

  return (
    <div>
      <div className="header-row">
        <h1 className="page-title">F1 Drivers</h1>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <input 
            type="text" 
            placeholder="Search drivers or teams..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="controls-input"
          />
          <select 
            value={teamFilter} 
            onChange={(e) => setTeamFilter(e.target.value)}
            className="controls-input"
          >
            <option value="">All Teams</option>
            {teams.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <div style={{ display: 'flex', background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
            <button 
              className={`btn ${sortDir === 'az' ? '' : 'text-muted'}`} 
              style={{ border: 'none', borderRadius: 0, background: sortDir === 'az' ? 'var(--color-border)' : 'transparent' }} 
              onClick={() => setSortDir('az')}
            >
              A-Z
            </button>
            <button 
              className={`btn ${sortDir === 'za' ? '' : 'text-muted'}`} 
              style={{ border: 'none', borderRadius: 0, background: sortDir === 'za' ? 'var(--color-border)' : 'transparent' }} 
              onClick={() => setSortDir('za')}
            >
              Z-A
            </button>
          </div>
        </div>
      </div>

      {filteredDrivers.length === 0 ? (
        <div className="state-container">
          <p className="text-muted">No drivers match your filters.</p>
        </div>
      ) : (
        <motion.div 
          className="grid-standard"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
          }}
        >
          {filteredDrivers.map(driver => (
            <motion.div key={driver.driver_number} variants={{ hidden: { opacity: 0, scale: 0.95 }, visible: { opacity: 1, scale: 1 } }}>
              <DriverCard driver={driver} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
