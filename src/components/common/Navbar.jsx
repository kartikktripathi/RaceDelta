import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { motion, useScroll, useMotionValueEvent } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import styles from './Navbar.module.css';

export default function Navbar() {
  const { isLight, toggleTheme } = useTheme();
  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious();
    if (latest > previous && latest > 150) {
      setHidden(true);
    } else {
      setHidden(false);
    }
    setScrolled(latest > 50);
  });

  return (
    <div className={styles.navbarWrapper}>
      <motion.nav 
        className={styles.navbar}
        variants={{
          visible: { y: 0, opacity: 1, scale: scrolled ? 0.95 : 1 },
          hidden: { y: -100, opacity: 0 }
        }}
        animate={hidden ? "hidden" : "visible"}
        transition={{ duration: 0.35, ease: "easeInOut" }}
        style={{
          background: scrolled 
            ? (isLight ? 'rgba(255,255,255,0.85)' : 'rgba(15,15,17,0.85)')
            : (isLight ? 'rgba(255,255,255,0.4)' : 'rgba(15,15,17,0.4)'),
        }}
      >
        <div className={styles.container}>
          <NavLink to="/" className={styles.logo}>
            <span className="highlight" style={{ color: 'var(--color-accent-primary)' }}>Apex</span>Grid
          </NavLink>
          <div className={styles.links}>
            <NavLink to="/drivers" className={({isActive}) => isActive ? styles.activeLink : styles.link}>Drivers</NavLink>
            <NavLink to="/teams" className={({isActive}) => isActive ? styles.activeLink : styles.link}>Teams</NavLink>
            <NavLink to="/seasons" className={({isActive}) => isActive ? styles.activeLink : styles.link}>Seasons</NavLink>
            <NavLink to="/leaderboard" className={({isActive}) => isActive ? styles.activeLink : styles.link}>Leaderboard</NavLink>
            <NavLink to="/game" className={({isActive}) => isActive ? styles.activeLink : styles.link}>Game</NavLink>
          </div>
          <button onClick={toggleTheme} className={styles.themeToggle} aria-label="Toggle theme">
            <span className={styles.themeIcon}>{isLight ? '🌙' : '☀️'}</span>
          </button>
        </div>
      </motion.nav>
    </div>
  );
}
