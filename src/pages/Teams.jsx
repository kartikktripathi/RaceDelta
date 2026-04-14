import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useDrivers } from '../hooks/useF1Data';
import LoadingState from '../components/common/LoadingState';
import ErrorState from '../components/common/ErrorState';

export default function Teams() {
  const { data: drivers, loading, error, refetch } = useDrivers('latest');

  const teams = useMemo(() => {
    if (!drivers) return [];
    
    const uniqueTeamsMap = {};
    
    for (const d of drivers) {
      if (d.team_name) {
        if (!uniqueTeamsMap[d.team_name]) {
          uniqueTeamsMap[d.team_name] = {
            team_name: d.team_name,
            team_colour: d.team_colour,
            drivers: []
          };
        }
        
        const driverName = d.full_name || `${d.first_name} ${d.last_name}`;
        if (!uniqueTeamsMap[d.team_name].drivers.includes(driverName)) {
          uniqueTeamsMap[d.team_name].drivers.push(driverName);
        }
      }
    }
    
    return Object.values(uniqueTeamsMap).sort((a, b) => a.team_name.localeCompare(b.team_name));
  }, [drivers]);

  if (loading) return <LoadingState message="Loading latest teams data..." />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;

  return (
    <div>
      <div className="header-row">
        <h1 className="page-title">F1 Constructors</h1>
      </div>

      {teams.length === 0 ? (
        <div className="state-container">
          <p className="text-muted">No teams data available.</p>
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
          {teams.map(team => {
            const teamColor = team.team_colour ? `#${team.team_colour}` : "#e10600";
            return (
              <motion.div 
                key={team.team_name} 
                className="glass-panel" 
                style={{ borderTop: `3px solid ${teamColor}`, padding: '0', overflow: 'hidden' }}
                variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}
              >
                <div style={{ padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.02)' }}>
                  <span style={{ background: teamColor, padding: '2px 6px', borderRadius: '4px', fontSize: '0.8rem', color: '#fff', fontWeight: 'bold' }}>
                    F1
                  </span>
                </div>
                <div style={{ padding: '1.5rem 1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <div style={{ 
                    minWidth: '60px', 
                    height: '60px', 
                    borderRadius: '50%', 
                    border: `2px solid ${teamColor}`, 
                    background: `${teamColor}33`, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    fontWeight: 'bold', 
                    fontSize: '1.5rem', 
                    color: '#fff' 
                  }}>
                    {team.team_name.charAt(0)}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <strong style={{ fontSize: '1.2rem' }}>{team.team_name}</strong>
                    <div style={{ 
                      fontSize: '0.85rem', 
                      paddingLeft: '6px', 
                      borderLeft: `2px solid ${teamColor}`, 
                      color: 'var(--color-text-secondary)',
                      lineHeight: '1.4'
                    }}>
                      {team.drivers.join(" & ")}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
