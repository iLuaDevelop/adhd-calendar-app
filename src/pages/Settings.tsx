import React, { useState, useEffect } from 'react';
import { usePreferences } from '../context/PreferencesContext';
import Button from '../components/UI/Button';
import { useToast } from '../context/ToastContext';
import { resetXp } from '../services/xp';

const PURCHASES_KEY = 'adhd_purchases';

const Settings: React.FC = () => {
    const { showToast } = useToast();
    const { preferences, setPreferences } = usePreferences();
    const [localTheme] = useState(preferences.theme || 'dark');
    const [notificationsEnabled, setNotificationsEnabled] = useState(preferences.notificationsEnabled ?? true);
    const [purchases, setPurchases] = useState<Set<number>>(() => {
        const stored = localStorage.getItem(PURCHASES_KEY);
        return stored ? new Set(JSON.parse(stored)) : new Set();
    });

    // apply immediately when user picks a theme
    const pickTheme = (t: 'light' | 'dark' | 'system' | 'sunset' | 'ocean') => {
        setPreferences({ ...preferences, theme: t });
    };

    const save = () => {
        setPreferences({ ...preferences, notificationsEnabled });
    };

    return (
        <div className="container">
            <div className="panel" style={{maxWidth:900,margin:'24px auto'}}>
                <div style={{textAlign: 'center', marginBottom: 24}}>
                    <h2 style={{margin: '0 0 8px 0', fontSize: '2.5rem'}}>Settings</h2>
                    <div className="subtle" style={{fontSize: '1.1rem'}}>Customize your experience</div>
                </div>

                <div className="settings-grid">
                    <section className="settings-section panel" style={{padding:16}}>
                        <h4 style={{marginTop:0}}>Appearance</h4>
                        <div className="setting-row">
                            <label>Theme</label>
                            <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                                <button className={`btn ${preferences.theme === 'light' ? '' : 'ghost'}`} onClick={() => pickTheme('light')}>Light</button>
                                <button className={`btn ${preferences.theme === 'dark' ? '' : 'ghost'}`} onClick={() => pickTheme('dark')}>Dark</button>
                                {purchases.has(1) && <button className={`btn ${preferences.theme === 'sunset' ? '' : 'ghost'}`} onClick={() => pickTheme('sunset')}>Sunset</button>}
                                {purchases.has(2) && <button className={`btn ${preferences.theme === 'ocean' ? '' : 'ghost'}`} onClick={() => pickTheme('ocean')}>Ocean</button>}
                            </div>
                        </div>
                    </section>

                    <section className="settings-section panel" style={{padding:16}}>
                        <h4 style={{marginTop:0}}>Notifications</h4>
                        <div className="setting-row">
                            <label style={{marginRight:12}}>Enable notifications</label>
                            <label className="switch">
                                <input type="checkbox" checked={notificationsEnabled} onChange={(e) => setNotificationsEnabled(e.target.checked)} />
                                <span className="slider" />
                            </label>
                        </div>
                        <div className="subtle" style={{marginTop:8}}>Turn on desktop notifications for reminders and XP achievements.</div>
                    </section>

                    <section className="settings-section panel" style={{padding:16}}>
                        <h4 style={{marginTop:0}}>Account</h4>
                        <div className="setting-row">
                            <label>Export data</label>
                            <div>
                                <Button onClick={() => showToast('Exporting...', 'info')}>Export JSON</Button>
                            </div>
                        </div>
                        <div style={{marginTop:12}} className="setting-row">
                            <label>Reset Level</label>
                            <div>
                                <Button variant="ghost" onClick={() => {
                                    if (confirm('Reset your XP to zero? This cannot be undone.')) {
                                        resetXp();
                                        showToast('XP reset to 0', 'success');
                                    }
                                }}>Reset XP</Button>
                            </div>
                        </div>
                    </section>

                    <section className="settings-section panel" style={{padding:16}}>
                        <h4 style={{marginTop:0}}>Support</h4>
                        <div className="subtle" style={{marginBottom:12}}>Need help with the app? Check out these resources:</div>
                        <div className="setting-row" style={{flexDirection:'column', gap: 8}}>
                            <Button onClick={() => window.open('https://github.com', '_blank')} style={{width:'100%', justifyContent:'flex-start'}}>
                                📚 View Documentation
                            </Button>
                            <Button variant="ghost" onClick={() => window.open('https://github.com', '_blank')} style={{width:'100%', justifyContent:'flex-start'}}>
                                🐛 Report a Bug
                            </Button>
                            <Button variant="ghost" onClick={() => window.open('https://github.com', '_blank')} style={{width:'100%', justifyContent:'flex-start'}}>
                                💡 Request a Feature
                            </Button>
                        </div>
                    </section>

                    <section className="settings-section panel" style={{padding:16}}>
                        <h4 style={{marginTop:0}}>Contact Developer</h4>
                        <div className="subtle" style={{marginBottom:12}}>Have feedback or just want to say hello?</div>
                        <div className="setting-row" style={{flexDirection:'column', gap: 8}}>
                            <Button onClick={() => window.location.href = 'mailto:developer@example.com'} style={{width:'100%', justifyContent:'flex-start'}}>
                                📧 Send Email
                            </Button>
                            <Button variant="ghost" onClick={() => window.open('https://twitter.com', '_blank')} style={{width:'100%', justifyContent:'flex-start'}}>
                                𝕏 Twitter
                            </Button>
                            <Button variant="ghost" onClick={() => window.open('https://discord.com', '_blank')} style={{width:'100%', justifyContent:'flex-start'}}>
                                💬 Discord Community
                            </Button>
                        </div>
                    </section>
                </div>

                <div style={{marginTop: 24, textAlign: 'center'}}>
                    <Button onClick={save}>Save</Button>
                </div>
            </div>
        </div>
    );
};

export default Settings;