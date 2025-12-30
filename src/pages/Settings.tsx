import React, { useState, useEffect } from 'react';
import { usePreferences } from '../context/PreferencesContext';
import { useLanguage } from '../context/LanguageContext';
import Button from '../components/UI/Button';
import { useToast } from '../context/ToastContext';
import { resetXp } from '../services/xp';

const PURCHASES_KEY = 'adhd_purchases';

const Settings: React.FC = () => {
    const { showToast } = useToast();
    const { language, setLanguage } = useLanguage();
    const { t } = useLanguage();
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
                    <h2 style={{margin: '0 0 8px 0', fontSize: '2.5rem'}}>{t('settings.title')}</h2>
                    <div className="subtle" style={{fontSize: '1.1rem'}}>{t('settings.customize')}</div>
                </div>

                <div className="settings-grid">
                    <section className="settings-section panel" style={{padding:16}}>
                        <h4 style={{marginTop:0}}>{t('settings.language')}</h4>
                        <div className="setting-row">
                            <label>{t('settings.chooseLanguage')}</label>
                            <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                                <button className={`btn ${language === 'en' ? '' : 'ghost'}`} onClick={() => { setLanguage('en'); showToast(t('settings.languageChanged'), 'success'); }}>English</button>
                                <button className={`btn ${language === 'es' ? '' : 'ghost'}`} onClick={() => { setLanguage('es'); showToast(t('settings.languageChanged'), 'success'); }}>Español</button>
                                <button className={`btn ${language === 'fr' ? '' : 'ghost'}`} onClick={() => { setLanguage('fr'); showToast(t('settings.languageChanged'), 'success'); }}>Français</button>
                            </div>
                        </div>
                    </section>

                    <section className="settings-section panel" style={{padding:16}}>
                        <h4 style={{marginTop:0}}>{t('settings.appearance')}</h4>
                        <div className="setting-row">
                            <label>{t('settings.theme')}</label>
                            <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                                <button className={`btn ${preferences.theme === 'light' ? '' : 'ghost'}`} onClick={() => pickTheme('light')}>{t('settings.light')}</button>
                                <button className={`btn ${preferences.theme === 'dark' ? '' : 'ghost'}`} onClick={() => pickTheme('dark')}>{t('settings.dark')}</button>
                                {purchases.has(1) && <button className={`btn ${preferences.theme === 'sunset' ? '' : 'ghost'}`} onClick={() => pickTheme('sunset')}>{t('settings.sunset')}</button>}
                                {purchases.has(2) && <button className={`btn ${preferences.theme === 'ocean' ? '' : 'ghost'}`} onClick={() => pickTheme('ocean')}>{t('settings.ocean')}</button>}
                            </div>
                        </div>
                    </section>

                    <section className="settings-section panel" style={{padding:16}}>
                        <h4 style={{marginTop:0}}>{t('settings.notifications')}</h4>
                        <div className="setting-row">
                            <label style={{marginRight:12}}>{t('settings.enableNotifications')}</label>
                            <label className="switch">
                                <input type="checkbox" checked={notificationsEnabled} onChange={(e) => setNotificationsEnabled(e.target.checked)} />
                                <span className="slider" />
                            </label>
                        </div>
                        <div className="subtle" style={{marginTop:8}}>Turn on desktop notifications for reminders and XP achievements.</div>
                    </section>

                    <section className="settings-section panel" style={{padding:16}}>
                        <h4 style={{marginTop:0}}>{t('settings.account')}</h4>
                        <div className="setting-row">
                            <label>{t('settings.exportData')}</label>
                            <div>
                                <Button onClick={() => showToast('Exporting...', 'info')}>{t('settings.exportJSON')}</Button>
                            </div>
                        </div>
                        <div style={{marginTop:12}} className="setting-row">
                            <label>{t('settings.resetLevel')}</label>
                            <div>
                                <Button variant="ghost" onClick={() => {
                                    if (confirm('Reset your XP to zero? This cannot be undone.')) {
                                        resetXp();
                                        showToast('XP reset to 0', 'success');
                                    }
                                }}>{t('settings.resetXp')}</Button>
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