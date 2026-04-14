import React from 'react';

const FALLBACK_IMAGE = 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/fallback/fallback.png.transform/1col/image.png';

export default function DriverCard({ driver }) {
  const teamColor = driver.team_colour ? `#${driver.team_colour}` : "#e10600";
  const driverName = driver.full_name || `${driver.first_name} ${driver.last_name}`;
  const headshot = driver.headshot_url || FALLBACK_IMAGE;

  return (
    <div className="glass-panel" style={{ borderTop: `3px solid ${teamColor}`, padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.02)', fontWeight: 'bold' }}>
        <span style={{ background: teamColor, padding: '2px 6px', borderRadius: '4px', fontSize: '0.8rem', color: '#fff' }}>
          {driver.driver_number}
        </span>
      </div>
      <div style={{ padding: '1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <img 
          src={headshot} 
          alt={driverName}
          style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover', border: `2px solid ${teamColor}` }}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <strong style={{ fontSize: '1.1rem' }}>{driverName}</strong>
          <span style={{ 
            fontSize: '0.8rem', 
            paddingLeft: '6px', 
            borderLeft: `3px solid ${teamColor}`, 
            color: 'var(--color-text-secondary)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {driver.team_name || 'Unknown Team'}
          </span>
        </div>
      </div>
    </div>
  );
}
