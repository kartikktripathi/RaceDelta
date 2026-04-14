import React, { useEffect, useState, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { f1Api } from '../utils/api';
import LoadingState from '../components/common/LoadingState';
import ErrorState from '../components/common/ErrorState';

export default function Home() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  const yBg = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const yText = useTransform(scrollYProgress, [0, 1], ["0%", "150%"]);
  const opacityText = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const currentYear = new Date().getFullYear();
      const meetings = await f1Api.getMeetings(currentYear);
      
      meetings.sort((a, b) => new Date(a.date_start) - new Date(b.date_start));
      const now = new Date();
      const nextMeeting = meetings.find(m => new Date(m.date_end || m.date_start) > now);

      if (nextMeeting) {
        setData({ type: 'next_gp', data: nextMeeting });
      } else {
        const [drivers, teams] = await Promise.all([
          f1Api.getChampionshipDrivers('latest').catch(() => []),
          f1Api.getChampionshipTeams('latest').catch(() => [])
        ]);
        
        const dChamp = drivers?.sort((a, b) => b.points_current - a.points_current)[0];
        const tChamp = teams?.sort((a, b) => b.points_current - a.points_current)[0];
        
        setData({ type: 'season_ended', driver: dChamp, team: tChamp });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100vw', left: '50%', right: '50%', marginLeft: '-50vw', marginRight: '-50vw', overflowX: 'hidden' }}>
      
      {/* Hero Section */}
      <div style={{ height: '100vh', width: '100%', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <motion.div 
          style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: '-20%', // extra height for parallax smooth scrolling
            backgroundImage: 'url(/WP.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            y: yBg,
            zIndex: -2,
            filter: 'brightness(0.5)'
          }}
        />
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(to bottom, transparent 60%, var(--color-bg-base) 100%)', zIndex: -1 }}></div>
        
        <motion.div 
          style={{ y: yText, opacity: opacityText, textAlign: 'center', zIndex: 1, padding: '0 2rem' }}
        >
          <motion.h1 
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            style={{ 
              fontFamily: 'var(--font-logo)',
              fontSize: 'clamp(4rem, 10vw, 8rem)', 
              fontWeight: 900,
              lineHeight: 1,
              letterSpacing: '5px',
              textTransform: 'uppercase',
              color: '#fff',
              margin: 0,
              textShadow: '0 10px 30px rgba(0,0,0,0.5)'
            }}
          >
            <span style={{ color: 'var(--color-accent-primary)' }}>Apex</span>Grid
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            style={{ 
              fontSize: 'clamp(1rem, 2vw, 1.5rem)', 
              color: '#eaeaea', 
              marginTop: '1rem',
              letterSpacing: '2px',
              fontWeight: 300,
              textTransform: 'uppercase'
            }}
          >
            The Ultimate F1 Data Experience
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 1, repeat: Infinity, repeatType: 'reverse' }}
            style={{ marginTop: '4rem', color: '#fff', fontSize: '2rem' }}
          >
            ↓
          </motion.div>
        </motion.div>
      </div>

      {/* Content Section */}
      <div style={{ padding: '6rem 2rem', background: 'var(--color-bg-base)', position: 'relative', zIndex: 2 }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            style={{ textAlign: 'center', marginBottom: '4rem' }}
          >
            <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem', color: 'var(--color-text-primary)' }}>Live Dashboard</h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.1rem' }}>Get the latest updates direct from the circuit.</p>
          </motion.div>

          {loading && <LoadingState message="Connecting to timing servers..." />}
          {error && <ErrorState message={error} onRetry={fetchDashboardData} />}
          
          {!loading && !error && data && (
            <motion.div 
              className="glass-panel"
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              style={{
                boxShadow: '0 30px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
                padding: '3rem',
                border: '1px solid rgba(255,255,255,0.05)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '1.5rem' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--color-accent-primary)', boxShadow: '0 0 10px var(--color-accent-primary)' }}></div>
                <h3 style={{ margin: 0, fontSize: '1.5rem', letterSpacing: '1px', textTransform: 'uppercase' }}>
                  {data.type === 'next_gp' ? 'Next Grand Prix' : 'Season Concluded'}
                </h3>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>
                {data.type === 'next_gp' ? (
                  <>
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: 'var(--radius-md)', borderLeft: '3px solid var(--color-accent-secondary)' }}>
                      <span style={{ display: 'block', fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--color-text-secondary)', marginBottom: '0.5rem', letterSpacing: '2px' }}>Event / Year</span>
                      <strong style={{ fontSize: '1.4rem' }}>{data.data.year} {data.data.country_name || "Grand Prix"}</strong>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: 'var(--radius-md)', borderLeft: '3px solid var(--color-accent-secondary)' }}>
                      <span style={{ display: 'block', fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--color-text-secondary)', marginBottom: '0.5rem', letterSpacing: '2px' }}>Meeting</span>
                      <strong style={{ fontSize: '1.4rem' }}>{data.data.meeting_name || data.data.meeting_official_name}</strong>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: 'var(--radius-md)', borderLeft: '3px solid var(--color-accent-primary)' }}>
                      <span style={{ display: 'block', fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--color-text-secondary)', marginBottom: '0.5rem', letterSpacing: '2px' }}>Circuit</span>
                      <strong style={{ fontSize: '1.4rem' }}>{data.data.circuit_short_name || data.data.location || "TBA"}</strong>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: 'var(--radius-md)', borderLeft: '3px solid var(--color-accent-primary)' }}>
                      <span style={{ display: 'block', fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--color-text-secondary)', marginBottom: '0.5rem', letterSpacing: '2px' }}>Start Time</span>
                      <strong style={{ fontSize: '1.4rem' }}>{new Date(data.data.date_start).toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</strong>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ background: 'linear-gradient(135deg, rgba(225, 6, 0, 0.1), rgba(0,0,0,0))', borderLeft: '3px solid var(--color-accent-primary)', padding: '2rem', borderRadius: 'var(--radius-md)' }}>
                      <span style={{ display: 'block', fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--color-text-secondary)', letterSpacing: '2px' }}>World Driver Champion</span>
                      <strong style={{ fontSize: '1.8rem', display: 'block', margin: '1rem 0' }}>{data.driver?.full_name || 'TBA'}</strong>
                      <span style={{ color: 'var(--color-accent-tertiary)', fontWeight: 'bold', fontSize: '1.2rem' }}>{data.driver?.points_current} pts</span>
                    </div>
                    <div style={{ background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05), rgba(0,0,0,0))', borderLeft: '3px solid #ccc', padding: '2rem', borderRadius: 'var(--radius-md)' }}>
                      <span style={{ display: 'block', fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--color-text-secondary)', letterSpacing: '2px' }}>World Constructor Champion</span>
                      <strong style={{ fontSize: '1.8rem', display: 'block', margin: '1rem 0' }}>{data.team?.team_name || 'TBA'}</strong>
                      <span style={{ color: 'var(--color-accent-tertiary)', fontWeight: 'bold', fontSize: '1.2rem' }}>{data.team?.points_current} pts</span>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
