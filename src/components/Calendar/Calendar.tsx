import React, { useMemo, useState, useRef, useEffect } from 'react';
import DayCell from './DayCell';
import { useCalendar } from '../../hooks/useCalendar';
import { grantXp } from '../../services/xp';

const buildMonth = (year: number, month: number) => {
    const weeks: Date[][] = [];
    const first = new Date(year, month, 1);
    let current = new Date(first);
    // move to start of week (Sunday)
    current.setDate(current.getDate() - current.getDay());

    while (weeks.length < 6) {
        const week: Date[] = [];
        for (let i = 0; i < 7; i++) {
            week.push(new Date(current));
            current.setDate(current.getDate() + 1);
        }
        weeks.push(week);
    }
    return weeks;
};

const Calendar: React.FC<{ view?: 'day' | 'week' | 'month' }> = ({ view = 'month' }) => {
    const [displayDate, setDisplayDate] = useState<Date>(() => new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [anchor, setAnchor] = useState<{ x: number; y: number } | null>(null);
    const { events: eventsMap, addEvent, removeEvent } = useCalendar();
    const popupRef = useRef<HTMLDivElement | null>(null);

    const year = displayDate.getFullYear();
    const month = displayDate.getMonth();
    const monthName = displayDate.toLocaleString(undefined, { month: 'long', year: 'numeric' });

    const cells = useMemo(() => {
        // build cells for the month only: placeholders (null) for leading/trailing slots
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const rows = Math.ceil(daysInMonth / 7);
        const total = rows * 7;
        const arr: Array<Date | null> = new Array(total).fill(null);
        for (let i = 0; i < daysInMonth; i++) {
            // place days sequentially from the first cell so day 1 is at index 0
            arr[i] = new Date(year, month, i + 1);
        }
        return arr;
    }, [year, month]);

    const handleDayClick = (date: Date, e: React.MouseEvent<HTMLDivElement>) => {
        e.stopPropagation();
        const target = e.currentTarget as HTMLElement;
        const rect = target.getBoundingClientRect();
        // anchor at center-bottom of the day cell
        const anchorX = rect.left + rect.width / 2;
        const anchorY = rect.bottom;
        setSelectedDate(date);
        setAnchor({ x: anchorX, y: anchorY });
    };

    // close popup on outside click
    useEffect(() => {
        const onDoc = (ev: MouseEvent) => {
            if (!popupRef.current) return;
            if (!(ev.target instanceof Node)) return;
            if (!popupRef.current.contains(ev.target)) {
                setSelectedDate(null);
                setAnchor(null);
            }
        };
        document.addEventListener('click', onDoc);
        return () => document.removeEventListener('click', onDoc);
    }, []);

    const addEventToDay = (date: Date, title: string) => {
        addEvent(date, title);
    };

    const prevMonth = () => setDisplayDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
    const nextMonth = () => setDisplayDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));
    const prevDay = () => setDisplayDate(d => new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1));
    const nextDay = () => setDisplayDate(d => new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1));
    const prevWeek = () => setDisplayDate(d => new Date(d.getFullYear(), d.getMonth(), d.getDate() - 7));
    const nextWeek = () => setDisplayDate(d => new Date(d.getFullYear(), d.getMonth(), d.getDate() + 7));

    const getWeekDays = (date: Date) => {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day; // adjust to start of week (Sunday)
        const start = new Date(d.setDate(diff));
        const days: Date[] = [];
        for (let i = 0; i < 7; i++) {
            days.push(new Date(start));
            start.setDate(start.getDate() + 1);
        }
        return days;
    };

    const weekDays = view === 'week' ? getWeekDays(displayDate) : [];
    const weekLabel = view === 'week' ? `${weekDays[0]?.toLocaleDateString()} - ${weekDays[6]?.toLocaleDateString()}` : '';
    const dayName = view === 'day' ? displayDate.toDateString() : (view === 'week' ? weekLabel : monthName);

    return (
        <div className="calendar" style={{ position: 'relative', display: 'flex', flexDirection: 'column', maxHeight: '65vh' }}>
            <header className="calendar-header" style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:16,paddingBottom:12}}>
                <button className="btn ghost" onClick={view === 'day' ? prevDay : view === 'week' ? prevWeek : prevMonth} aria-label="Previous" style={{color:'var(--text)'}}>◀</button>
                <h1 style={{flex:1,textAlign:'center',margin:0}}>{dayName}</h1>
                <button className="btn ghost" onClick={view === 'day' ? nextDay : view === 'week' ? nextWeek : nextMonth} aria-label="Next" style={{color:'var(--text)'}}>▶</button>
            </header>
            {view === 'day' && (
                <div style={{display:'flex',flexDirection:'column',gap:12,flex:1,overflowY:'auto'}}>
                    <div style={{padding:12}}>
                        <h3 style={{margin:'0 0 8px 0'}}>Events</h3>
                        {displayDate > new Date() && (
                            <div style={{marginBottom:12, padding:'8px 12px', backgroundColor:'rgba(244, 63, 94, 0.1)', border:'1px solid rgba(244, 63, 94, 0.3)', borderRadius:'4px', fontSize:'0.875rem', color:'#f43f5e'}}>
                                You can only complete events for today or past days
                            </div>
                        )}
                        {displayDate < new Date() && (
                            <div style={{marginBottom:12, padding:'8px 12px', backgroundColor:'rgba(244, 63, 94, 0.1)', border:'1px solid rgba(244, 63, 94, 0.3)', borderRadius:'4px', fontSize:'0.875rem', color:'#f43f5e'}}>
                                You can only create events for today or future days
                            </div>
                        )}
                        <div style={{marginBottom:12}}>
                            {(eventsMap[displayDate.toDateString()] || []).map((ev, i) => {
                                const canCompleteEvent = displayDate <= new Date();
                                return (
                                    <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                                        <span>{ev}</span>
                                        <div style={{display:'flex',gap:6}}>
                                            <button 
                                                className="btn ghost" 
                                                onClick={() => { 
                                                    if (canCompleteEvent) {
                                                        removeEvent(displayDate, i); 
                                                        grantXp(15); 
                                                    }
                                                }}
                                                disabled={!canCompleteEvent}
                                                style={{opacity: canCompleteEvent ? 1 : 0.5, cursor: canCompleteEvent ? 'pointer' : 'not-allowed'}}
                                            >
                                                Done
                                            </button>
                                            <button 
                                                className="btn ghost" 
                                                onClick={() => { removeEvent(displayDate, i); }}
                                                style={{cursor: 'pointer', color: '#f43f5e'}}
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <form onSubmit={(e) => { e.preventDefault(); const title = (e.target as any).elements.title.value; if (title.trim() && displayDate >= new Date()) { addEvent(displayDate, title.trim()); (e.target as any).elements.title.value = ''; } }}>
                            <div style={{display:'flex',gap:8}}>
                                <input className="input" name="title" placeholder="Add event..." disabled={displayDate < new Date()} />
                                <button className="btn" type="submit" disabled={displayDate < new Date()}>Add</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {view === 'week' && (
                <div style={{display:'flex',flexDirection:'column',gap:8,padding:12,maxHeight:'60vh',overflowY:'auto'}}>
                    {weekDays.map((day) => {
                        const canCompleteEvent = day <= new Date();
                        return (
                            <div key={day.toDateString()} style={{borderLeft:'4px solid #6366f1',paddingLeft:12}}>
                                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                                    <h4 style={{margin:0}}>{day.toDateString()}</h4>
                                </div>
                                {day > new Date() && (
                                    <div style={{marginBottom:8, padding:'6px 10px', backgroundColor:'rgba(244, 63, 94, 0.1)', border:'1px solid rgba(244, 63, 94, 0.3)', borderRadius:'4px', fontSize:'0.8rem', color:'#f43f5e'}}>
                                        Complete events for today or past days only
                                    </div>
                                )}
                                {day < new Date() && (
                                    <div style={{marginBottom:8, padding:'6px 10px', backgroundColor:'rgba(244, 63, 94, 0.1)', border:'1px solid rgba(244, 63, 94, 0.3)', borderRadius:'4px', fontSize:'0.8rem', color:'#f43f5e'}}>
                                        Cannot create events for past days
                                    </div>
                                )}
                                <div style={{marginBottom:8}}>
                                    {(eventsMap[day.toDateString()] || []).map((ev, i) => (
                                        <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6,paddingBottom:6,borderBottom:'1px solid #374151'}}>
                                            <span>{ev}</span>
                                            <div style={{display:'flex',gap:4}}>
                                                <button 
                                                    className="btn ghost" 
                                                    onClick={() => { 
                                                        if (canCompleteEvent) {
                                                            removeEvent(day, i); 
                                                            grantXp(15); 
                                                        }
                                                    }}
                                                    disabled={!canCompleteEvent}
                                                    style={{opacity: canCompleteEvent ? 1 : 0.5, cursor: canCompleteEvent ? 'pointer' : 'not-allowed', fontSize: '0.8rem'}}
                                                >
                                                    Done
                                                </button>
                                                <button 
                                                    className="btn ghost" 
                                                    onClick={() => { removeEvent(day, i); }}
                                                    style={{cursor: 'pointer', color: '#f43f5e', fontSize: '0.8rem'}}
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <form onSubmit={(e) => { e.preventDefault(); const title = (e.target as any).elements[`title-${day.toDateString()}`]?.value; if (title?.trim() && day >= new Date()) { addEvent(day, title.trim()); (e.target as any).elements[`title-${day.toDateString()}`].value = ''; } }}>
                                    <div style={{display:'flex',gap:6}}>
                                        <input className="input" name={`title-${day.toDateString()}`} placeholder="Add event..." style={{fontSize:'0.875rem'}} disabled={day < new Date()} />
                                        <button className="btn" type="submit" style={{padding:'4px 8px'}} disabled={day < new Date()}>+</button>
                                    </div>
                                </form>
                            </div>
                        );
                    })}
                </div>
            )}

            {view !== 'day' && view !== 'week' && (
                <>
                    <div className="calendar-body">
                        {cells.map((d, idx) => (
                            d ? (
                                <DayCell key={idx} date={d} events={eventsMap[d.toDateString()] || []} onClick={handleDayClick} />
                            ) : (
                                <div key={idx} className="day-cell empty" />
                            )
                        ))}
                    </div>

                    {/* day popup */}
                    {selectedDate && anchor && (() => {
                        const POPUP_W = 320;
                        const POPUP_H = 220;
                        const clamp = (v:number, a:number, b:number) => Math.max(a, Math.min(b, v));
                        const popupLeft = clamp(anchor.x - POPUP_W / 2, 12, window.innerWidth - POPUP_W - 12);
                        // position the popup just below the day cell so it branches off the bottom
                const popupTop = clamp(anchor.y + 8, 12, window.innerHeight - POPUP_H - 12);

                return (
                    <div
                        ref={popupRef}
                        className="panel day-popup"
                        style={{
                            position: 'fixed',
                            left: popupLeft,
                            top: popupTop,
                            width: POPUP_W,
                            zIndex: 300,
                        }}
                    >
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                            <div>
                                <strong>{selectedDate.toDateString()}</strong>
                                <div className="subtle">Quick actions for this day</div>
                            </div>
                            <button className="btn ghost" onClick={() => { setSelectedDate(null); setAnchor(null); }}>Close</button>
                        </div>

                        <div style={{marginTop:12}}>
                            <AddEventForm date={selectedDate} onAdd={(title) => { addEventToDay(selectedDate, title); }} />
                        </div>

                        <div style={{marginTop:12}}>
                            <h4 style={{margin:0}}>Events</h4>
                            <div className="subtle" style={{marginTop:6}}>
                                {(eventsMap[selectedDate.toDateString()] || []).length === 0 ? 'No events' : ''}
                            </div>
                            {selectedDate > new Date() && (
                                <div style={{marginTop:8, padding:'8px 12px', backgroundColor:'rgba(244, 63, 94, 0.1)', border:'1px solid rgba(244, 63, 94, 0.3)', borderRadius:'4px', fontSize:'0.875rem', color:'#f43f5e'}}>
                                    You can only complete events for today or past days
                                </div>
                            )}
                            {selectedDate < new Date() && (
                                <div style={{marginTop:8, padding:'8px 12px', backgroundColor:'rgba(244, 63, 94, 0.1)', border:'1px solid rgba(244, 63, 94, 0.3)', borderRadius:'4px', fontSize:'0.875rem', color:'#f43f5e'}}>
                                    You can only create events for today or future days
                                </div>
                            )}
                            <div style={{marginTop:8, display:'flex',flexDirection:'column',gap:6}}>
                                {(eventsMap[selectedDate.toDateString()] || []).map((ev, i) => {
                                    const canCompleteEvent = selectedDate <= new Date();
                                    return (
                                        <div key={i} className="event" style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                                            <span style={{flex: 1, textAlign: 'center'}}>{ev}</span>
                                            <div style={{display:'flex',gap:4}}>
                                                <button 
                                                    className="btn ghost" 
                                                    onClick={() => { 
                                                        if (canCompleteEvent) {
                                                            removeEvent(selectedDate, i); 
                                                            grantXp(15); 
                                                        }
                                                    }}
                                                    disabled={!canCompleteEvent}
                                                    style={{opacity: canCompleteEvent ? 1 : 0.5, cursor: canCompleteEvent ? 'pointer' : 'not-allowed', color: 'black', fontWeight: 'bold', backgroundColor: 'transparent', border: '2px solid black', padding: '3px 8px', borderRadius: '4px', fontSize: '12px'}}
                                                >
                                                    Done
                                                </button>
                                                <button 
                                                    className="btn ghost" 
                                                    onClick={() => { removeEvent(selectedDate, i); }}
                                                    style={{cursor: 'pointer', color: 'black', fontWeight: 'bold', backgroundColor: 'transparent', border: '2px solid black', padding: '3px 8px', borderRadius: '4px', fontSize: '12px'}}
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                    );
                })()}
                </>
            )}
        </div>
    );
};

const AddEventForm: React.FC<{ date: Date; onAdd: (title: string) => void }> = ({ date, onAdd }) => {
    const [title, setTitle] = useState('');
    const canAddEvent = date >= new Date();
    return (
        <form onSubmit={(e) => { e.preventDefault(); if (title.trim() && canAddEvent) { onAdd(title.trim()); setTitle(''); } }}>
            <div style={{display:'flex',gap:8}}>
                <input className="input" placeholder="Event title" value={title} onChange={(e) => setTitle(e.target.value)} disabled={!canAddEvent} />
                <button className="btn" type="submit" disabled={!canAddEvent}>Add</button>
            </div>
        </form>
    );
};

export default Calendar;