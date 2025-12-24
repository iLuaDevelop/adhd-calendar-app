import React, { useEffect, useRef, useState } from 'react';
import { getXp, grantXp as grantXpService, getLevelFromXp, getXpToNextLevel, getXpIntoCurrentLevel, getTotalXpForCurrentLevel } from '../../services/xp';
import { playLevelUpSound, playCriticalSound } from '../../services/sounds';
import CrateRewardModal from '../CrateRewardModal/CrateRewardModal';

const XPBar: React.FC = () => {
  const [xp, setXp] = useState<number>(getXp());
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const prevLevelRef = useRef<number>(getLevelFromXp(xp));
  const [showCongrats, setShowCongrats] = useState(false);
  const [confetti, setConfetti] = useState<number[]>([]);
  const [popups, setPopups] = useState<Array<{ id: number; amount: number; isCritical?: boolean }>>([]);
  const [showCrateModal, setShowCrateModal] = useState(false);

  useEffect(() => {
    // Mark initial load as done on component mount after a longer delay
    // This ensures all XP data is loaded before we start checking for level ups
    const initialLevel = getLevelFromXp(getXp());
    console.log('[XPBar] Mount - initial level:', initialLevel);
    const timer = setTimeout(() => {
      const afterDelay = getLevelFromXp(getXp());
      console.log('[XPBar] Initial load timer done - level:', afterDelay);
      prevLevelRef.current = afterDelay;
      setIsInitialLoad(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);
  const STACK_SPACING = 72; // px between stacked popups

  const level = getLevelFromXp(xp);
  const xpIntoLevel = getXpIntoCurrentLevel(xp);
  const totalXpForLevel = getTotalXpForCurrentLevel(xp);
  const xpNeeded = getXpToNextLevel(xp);
  const progressPercent = totalXpForLevel > 0 ? Math.max(0, Math.min(100, Math.round((xpIntoLevel / totalXpForLevel) * 100))) : 0;

  useEffect(() => {
    const POPUP_DURATION = 4200; // ms — how long each +XP popup stays visible
    const MAX_STACK = 5;
    const BRONZE_CRATE_KEY = 'adhd_bronze_crate_last_opened';
    const onUpdate = (e: any) => {
      setXp(e.detail?.xp ?? getXp());
    };
    const onGranted = (e: any) => {
      const amount = e.detail?.amount ?? 0;
      const isCritical = e.detail?.isCritical ?? false;
      const crateReward = e.detail?.crateReward ?? false;
      const id = Date.now();
      
      // Play critical sound if applicable
      if (isCritical) {
        playCriticalSound();
      }
      
      // Show crate modal if critical roll succeeded
      if (crateReward) {
        setShowCrateModal(true);
      }
      
      setPopups((prev) => {
        // new popup becomes the bottom item (index 0), older items move up
        const next = [{ id, amount, isCritical }, ...prev];
        return next.slice(0, MAX_STACK);
      });
      // schedule removal of this popup by id
      setTimeout(() => {
        setPopups((prev) => prev.filter((p) => p.id !== id));
      }, POPUP_DURATION);
    };
    window.addEventListener('xp:update', onUpdate as EventListener);
    window.addEventListener('xp:granted', onGranted as EventListener);
    return () => {
      window.removeEventListener('xp:update', onUpdate as EventListener);
      window.removeEventListener('xp:granted', onGranted as EventListener);
    };
  }, []);

  useEffect(() => {
    const prev = prevLevelRef.current;
    console.log('[XPBar] Level check:', { level, prev, isInitialLoad, willTrigger: level > prev && !isInitialLoad });
    // Only check for level up if NOT initial load AND level actually increased
    if (level > prev && !isInitialLoad) {
      console.log('[XPBar] LEVEL UP TRIGGERED - playing sound');
      // level up! (but only if not initial load)
      playLevelUpSound();
      setShowCongrats(true);
      setConfetti(Array.from({ length: 20 }, (_, i) => i));
      const t = setTimeout(() => setShowCongrats(false), 2500);
      const t2 = setTimeout(() => setConfetti([]), 2600);
      return () => {
        clearTimeout(t);
        clearTimeout(t2);
      };
    }
    // Always update prevLevelRef, even during initial load
    prevLevelRef.current = level;
  }, [level, isInitialLoad]);

  const grantXp = (amount = 10) => {
    grantXpService(amount);
  };

  return (
    <>
      {/* Level-up congrats and confetti - way down on screen */}
      {showCongrats && (
        <div style={{ position: 'fixed', bottom: '100px', left: '50%', transform: 'translateX(-50%)', pointerEvents: 'none', zIndex: 10000, display: 'block', visibility: 'visible' }}>
          <div className="congrats-text">Level Up! — Lv {level}</div>
        </div>
      )}

      {/* confetti layer */}
      {confetti.length > 0 && (
        <div aria-hidden style={{ position: 'fixed', bottom: '100px', left: '0', right: '0', height: '80px', pointerEvents: 'none', overflow: 'visible', zIndex: 9999, display: 'block', visibility: 'visible' }}>
          {confetti.map((id) => (
            <span key={id} className="confetti" style={{ ['--i' as any]: String(id % 10) } as React.CSSProperties} />
          ))}
        </div>
      )}

      {/* xp popup - positioned outside the footer to ensure visibility */}
      {popups.map((p, idx) => (
        <div
          key={p.id}
          className={`xp-popup show xp-bounce ${p.isCritical ? 'critical' : ''}`}
          role="status"
          aria-live="polite"
          style={{ bottom: `${120 + idx * STACK_SPACING}px` }}
        >
          <span className="amount">+{p.amount}</span>
          {p.isCritical && <span className="critical-badge" style={{ marginLeft: 4, fontWeight: 'bold', color: '#fbbf24' }}>2x</span>}
          <span className="label" style={{ marginLeft: 8 }}>XP</span>
        </div>
      ))}

      <div className="xp-footer" aria-live="polite">
        <div className="xp-inner panel" style={{ position: 'relative', overflow: 'visible' }}>

        <div className="xp-left">
          <div className="xp-level">Lv {level}</div>
          <div className="xp-text">{xp} XP</div>
        </div>

        <div className="xp-track" aria-hidden>
          <div className="xp-fill" style={{ width: `${progressPercent}%` }} />
        </div>

        <div style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--muted)', marginTop: 6 }}>
          {xpNeeded} XP to next level
        </div>

        <div className="xp-actions">
        </div>
      </div>
    </div>

    <CrateRewardModal 
      isOpen={showCrateModal}
      onClose={() => setShowCrateModal(false)}
      onOpen={(reward) => {
        localStorage.setItem('adhd_bronze_crate_last_opened', '0');
        window.dispatchEvent(new CustomEvent('currencyUpdated'));
      }}
    />
    </>
  );
};

export default XPBar;
