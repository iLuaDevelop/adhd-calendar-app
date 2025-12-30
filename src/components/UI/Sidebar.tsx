import React from 'react';
import { Link } from 'react-router-dom';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ open, onClose }) => {
  return (
    <>
      <aside className={`sidebar ${open ? 'open' : ''}`} aria-hidden={!open}>
        <div className="sidebar-inner panel">
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
            <h4 style={{margin:0}}>Menu</h4>
            <button className="btn ghost" onClick={onClose} aria-label="Close menu">✕</button>
          </div>

          <nav className="sidebar-nav">
            <Link to="/" onClick={onClose} className="sidebar-link">Dashboard</Link>
            <Link to="/quests" onClick={onClose} className="sidebar-link">Quests</Link>
            <Link to="/insights" onClick={onClose} className="sidebar-link">Personal Insights</Link>
            <Link to="/character" onClick={onClose} className="sidebar-link">Character</Link>
            <Link to="/skills" onClick={onClose} className="sidebar-link">Skill Tree</Link>
            <Link to="/store" onClick={onClose} className="sidebar-link">Store</Link>
            <Link to="/leaderboards" onClick={onClose} className="sidebar-link">Leaderboards</Link>
            <Link to="/settings" onClick={onClose} className="sidebar-link">Settings</Link>
          </nav>
        </div>
      </aside>

      <div className={`sidebar-backdrop ${open ? 'open' : ''}`} onClick={onClose} />
    </>
  );
};

export default Sidebar;
