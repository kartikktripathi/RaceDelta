import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { f1Api } from '../utils/api';
import LoadingState from '../components/common/LoadingState';
import ErrorState from '../components/common/ErrorState';

const FALLBACK_IMAGE = 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/fallback/fallback.png.transform/1col/image.png';

export default function Seasons() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [year, setYear] = useState(() => new Date().getFullYear());
  
  const [search, setSearch] = useState('');
  const [countryFilter, setCountryFilter] = useState('');
  const [sortDir, setSortDir] = useState('az');

  const fetchSeasonData = useCallback(async (selectedYear) => {
    setLoading(true);
    setError(null);
    try {
      const sessions = await f1Api.getSessions(selectedYear);
      const now = new Date();
      const pastRaces = sessions
        .filter(s => new Date(s.date_end || s.date_start) < now)
        .sort((a, b) => new Date(a.date_start) - new Date(b.date_start));

      let driversMap = {};
      const podiumRounds = [];

      for (let i = 0; i < pastRaces.length; i += 3) {
        const batch = pastRaces.slice(i, i + 3);
        const batchResults = await Promise.all(batch.map(async (race) => {
          try {
            const [posData, drvs] = await Promise.all([
              f1Api.getPositions(race.session_key, 3),
              f1Api.getDrivers(race.session_key)
            ]);
            
            drvs.forEach(d => {
              if (!driversMap[d.driver_number]) driversMap[d.driver_number] = d;
            });

            const positions = { 1: null, 2: null, 3: null };
            posData.forEach(p => {
              const pos = p.position;
              if (pos >= 1 && pos <= 3) {
                if (!positions[pos] || new Date(p.date) > new Date(positions[pos].date)) {
                  positions[pos] = p;
                }
              }
            });

            return { race, podium: [positions[1], positions[2], positions[3]] };
          } catch(err) {
            return { race, podium: [null, null, null], error: true };
          }
        }));
        podiumRounds.push(...batchResults);
      }

      setData({ pastRaces, podiumRounds, driversMap });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSeasonData(year);
  }, [fetchSeasonData, year]);

  const { countries, filteredRounds } = useMemo(() => {
    if (!data) return { countries: [], filteredRounds: [] };
    
    const countrySet = new Set(data.podiumRounds.map(r => r.race.country_name).filter(Boolean));
    
    let rounds = [...data.podiumRounds];
    if (countryFilter) {
      rounds = rounds.filter(r => r.race.country_name === countryFilter);
    }
    if (search) {
      const q = search.toLowerCase();
      rounds = rounds.filter(r => 
        (r.race.country_name || '').toLowerCase().includes(q) || 
        (r.race.location || '').toLowerCase().includes(q)
      );
    }
    
    rounds.sort((a, b) => {
      const ta = (a.race.country_name || a.race.location || '').toLowerCase();
      const tb = (b.race.country_name || b.race.location || '').toLowerCase();
      return sortDir === 'az' ? ta.localeCompare(tb) : tb.localeCompare(ta);
    });
    
    return { countries: Array.from(countrySet).sort(), filteredRounds: rounds };
  }, [data, countryFilter, search, sortDir]);

  if (loading && !data) return <LoadingState message={`Loading ${year} season data...`} />;
  if (error) return <ErrorState message={error} onRetry={() => fetchSeasonData(year)} />;

  const renderDriverUI = (posEvent) => {
    if (!posEvent) return <div style={{ opacity: 0.5 }}>N/A</div>;
    const driver = data.driversMap[posEvent.driver_number];
    if (!driver) return <div>#{posEvent.driver_number}</div>;
    
    const teamColor = driver.team_colour ? `#${driver.team_colour}` : "#ccc";
    const name = driver.name_acronym || driver.last_name;
    const headshot = driver.headshot_url || FALLBACK_IMAGE;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
        <img 
          src={headshot} 
          alt={name} 
          style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: `2px solid ${teamColor}`, background: `${teamColor}33` }} 
        />
        <span style={{ fontSize: '0.75rem', fontWeight: 'bold', background: 'rgba(0,0,0,0.5)', padding: '2px 4px', borderRadius: '4px', color: '#fff' }}>
          {name}
        </span>
      </div>
    );
  };

  return (
    <div>
      <div className="header-row">
        <h1 className="page-title">Season Results</h1>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <select 
            value={year} 
            onChange={(e) => setYear(Number(e.target.value))}
            className="controls-input"
          >
            {[2024, 2025].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <input 
            type="text" 
            placeholder="Search GP..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="controls-input"
          />
          <select 
            value={countryFilter} 
            onChange={(e) => setCountryFilter(e.target.value)}
            className="controls-input"
          >
            <option value="">All Countries</option>
            {countries.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {loading && data && <div style={{ textAlign: 'center', marginBottom: '1rem', color: 'var(--color-accent-primary)' }}>Loading {year} races...</div>}

      {filteredRounds.length === 0 ? (
        <div className="state-container">
          <p className="text-muted">No past races found for your criteria.</p>
        </div>
      ) : (
        <motion.div 
          className="grid-standard"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
          }}
        >
          {filteredRounds.map((round) => {
            const { race, podium } = round;
            const gpTitle = race.location ? `${race.country_name} (${race.location})` : race.country_name;
            const dateStr = new Date(race.date_start).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

            return (
              <motion.div key={race.session_key} className="glass-panel" style={{ padding: 0, display: 'flex', flexDirection: 'column' }} variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}>
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', textAlign: 'center', borderBottom: '1px solid var(--color-border)' }}>
                  <strong>{gpTitle}</strong>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>{dateStr}</div>
                </div>
                <div style={{ flex: 1, padding: '1rem', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                  {podium.every(p => !p) ? (
                    <div style={{ textAlign: 'center', padding: '1rem 0', color: 'var(--color-text-secondary)' }}>
                      Podium data currently unavailable.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: '0.5rem', height: '120px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '30%' }}>
                        {renderDriverUI(podium[1])}
                        <div style={{ width: '100%', height: '30px', background: 'silver', color: 'black', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', marginTop: '0.5rem', borderRadius: '4px 4px 0 0' }}>2</div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '40%' }}>
                        {renderDriverUI(podium[0])}
                        <div style={{ width: '100%', height: '45px', background: 'gold', color: 'black', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', marginTop: '0.5rem', borderRadius: '4px 4px 0 0' }}>1</div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '30%' }}>
                        {renderDriverUI(podium[2])}
                        <div style={{ width: '100%', height: '20px', background: '#cd7f32', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', marginTop: '0.5rem', borderRadius: '4px 4px 0 0' }}>3</div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
