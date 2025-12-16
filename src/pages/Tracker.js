import React, { useState, useEffect } from 'react';
import { ExpenseService, SaleService, EstateService } from '../api/services';
import { useEstate } from '../context/EstateContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import styles from '../styles/Tracker.module.css';

const Tracker = () => {
    const  selectedEstate  = useEstate();
    
    // --- STATE: DATA ---
    const [allEstates, setAllEstates] = useState([]);
    const [loading, setLoading] = useState(false);
    
    // Data Buckets
    const [expenses, setExpenses] = useState([]);
    const [sales, setSales] = useState([]);
    const [totals, setTotals] = useState({ expense: 0, income: 0, profit: 0 });

    // --- STATE: FILTERS ---
    const [filterMode, setFilterMode] = useState('WEEK'); 
    const [selectedEstateIds, setSelectedEstateIds] = useState([]);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    
    // Time Inputs
    const currentYear = new Date().getFullYear();
    const [selYear, setSelYear] = useState(currentYear);
    const [selMonth, setSelMonth] = useState(new Date().getMonth());
    const [selWeek, setSelWeek] = useState(1);
    
    // Calculated Dates
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // --- 1. INITIAL LOAD ---
    useEffect(() => {
        EstateService.getAll().then(res => setAllEstates(res.data));

        if (selectedEstate) {
            setSelectedEstateIds([selectedEstate._id]);
        }

        // Default to Current Week
        const today = new Date();
        const dayOfMonth = today.getDate();
        const approxWeek = Math.ceil(dayOfMonth / 7);
        setSelWeek(approxWeek > 5 ? 5 : approxWeek);
        
        calculateDateRange('WEEK', today.getFullYear(), today.getMonth(), approxWeek);
    }, [selectedEstate]); 

    // --- 2. DATE LOGIC ---
    const calculateDateRange = (mode, year, month, week, customStart, customEnd) => {
        let start = new Date();
        let end = new Date();

        if (mode === 'WEEK') {
            const startDay = 1 + (week - 1) * 7;
            const endDay = week * 7;
            start = new Date(year, month, startDay);
            end = new Date(year, month, endDay);
        } else if (mode === 'MONTH') {
            start = new Date(year, month, 1);
            end = new Date(year, month + 1, 0);
        } else if (mode === 'YEAR') {
            start = new Date(year, 0, 1);
            end = new Date(year, 11, 31);
        } else if (mode === 'CUSTOM') {
            setStartDate(customStart);
            setEndDate(customEnd);
            return;
        }

        const format = (d) => {
            const offset = d.getTimezoneOffset() * 60000;
            return new Date(d.getTime() - offset).toISOString().split('T')[0];
        };

        setStartDate(format(start));
        setEndDate(format(end));
    };

    useEffect(() => {
        if(filterMode !== 'CUSTOM') {
            calculateDateRange(filterMode, selYear, selMonth, selWeek);
        }
    }, [filterMode, selYear, selMonth, selWeek]);


    // --- 3. FETCH DATA (EXPENSES + SALES) ---
    const handleAnalyze = async () => {
        if (selectedEstateIds.length === 0) return alert("Select at least one estate");
        setLoading(true);
        try {
            const params = {
                estates: selectedEstateIds.join(','),
                from: startDate,
                to: endDate
            };

            // Parallel API Calls
            const [expRes, saleRes] = await Promise.all([
                ExpenseService.getReport(params),
                SaleService.getReport(params)
            ]);

            setExpenses(expRes.data.data);
            setSales(saleRes.data.data);
            
            setTotals({
                expense: expRes.data.total,
                income: saleRes.data.total,
                profit: saleRes.data.total - expRes.data.total
            });

        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // --- UI HELPERS ---
    const toggleEstate = (id) => {
        if (selectedEstateIds.includes(id)) {
            setSelectedEstateIds(selectedEstateIds.filter(e => e !== id));
        } else {
            setSelectedEstateIds([...selectedEstateIds, id]);
        }
    };

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    // --- DATA TRANSFORMATION ---
    
    // 1. Chart Data: Compare Total Income vs Total Expense
    const chartData = [
        { name: 'Financials', Income: totals.income, Expense: totals.expense }
    ];

    // 2. Timeline Data: Merge Expenses & Sales, Sort by Date
    const getMergedTimeline = () => {
        // Tag them so we know which is which
        const taggedExpenses = expenses.map(e => ({ ...e, type: 'EXPENSE' }));
        const taggedSales = sales.map(s => ({ ...s, type: 'INCOME', category: 'Sale', description: `Buyer: ${s.buyerName}` }));
        
        const combined = [...taggedExpenses, ...taggedSales];
        
        // Group by Date String
        const groups = {};
        combined.forEach(item => {
            const dateObj = new Date(item.date);
            const dateStr = dateObj.toLocaleDateString('en-US', { 
                weekday: 'short', month: 'short', day: 'numeric' 
            });
            if (!groups[dateStr]) groups[dateStr] = [];
            groups[dateStr].push(item);
        });
        return groups;
    };

    const timelineGroups = getMergedTimeline();
    // Sort Dates Descending
    const sortedDates = Object.keys(timelineGroups).sort((a,b) => {
        // Find a representative date object from the group to sort
        const dateA = new Date(timelineGroups[a][0].date);
        const dateB = new Date(timelineGroups[b][0].date);
        return dateB - dateA;
    });

    return (
        <div className={styles.container}>
            <h2 className={styles.header}>Analytics & Reports</h2>

            {/* --- FILTER SECTION --- */}
            <div className={styles.filterCard}>
                
                {/* Top Row */}
                <div className={styles.topRow}>
                    <div className={styles.estateSelector}>
                        <span className={styles.label}>Estates</span>
                        <div className={styles.multiSelectBox} onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
                            {selectedEstateIds.length === 0 ? (
                                <span style={{color:'#666', fontSize:'0.9rem'}}>Select Estates...</span>
                            ) : (
                                <div className={styles.selectedTags}>
                                    {allEstates.filter(e => selectedEstateIds.includes(e._id)).map(e => (
                                        <span key={e._id} className={styles.tag}>{e.name}</span>
                                    ))}
                                </div>
                            )}
                            {isDropdownOpen && (
                                <div className={styles.dropdownMenu} onClick={e => e.stopPropagation()}>
                                    {allEstates.map(est => (
                                        <div key={est._id} className={styles.dropdownItem} onClick={() => toggleEstate(est._id)}>
                                            <input type="checkbox" checked={selectedEstateIds.includes(est._id)} readOnly />
                                            <span>{est.name}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div style={{flex: 1, minWidth: '300px'}}>
                        <span className={styles.label}>Period Type</span>
                        <div className={styles.filterTabs}>
                            {['WEEK', 'MONTH', 'YEAR', 'CUSTOM'].map(mode => (
                                <button
                                    key={mode}
                                    className={`${styles.tab} ${filterMode === mode ? styles.activeTab : ''}`}
                                    onClick={() => setFilterMode(mode)}
                                >
                                    {mode === "CUSTOM" ? mode : mode+"LY"}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Bottom Row */}
                <div className={styles.controlsRow}>
                    {filterMode !== 'CUSTOM' && (
                        <div className={styles.controlGroup}>
                            <label className={styles.label}>Year</label>
                            <select className={styles.select} value={selYear} onChange={e => setSelYear(Number(e.target.value))}>
                                {[currentYear-1, currentYear, currentYear+1].map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </div>
                    )}

                    {(filterMode === 'WEEK' || filterMode === 'MONTH') && (
                        <div className={styles.controlGroup}>
                            <label className={styles.label}>Month</label>
                            <select className={styles.select} value={selMonth} onChange={e => setSelMonth(Number(e.target.value))}>
                                {monthNames.map((m, i) => <option key={i} value={i}>{m}</option>)}
                            </select>
                        </div>
                    )}

                    {filterMode === 'WEEK' && (
                        <div className={styles.controlGroup}>
                            <label className={styles.label}>Week</label>
                            <select className={styles.select} value={selWeek} onChange={e => setSelWeek(Number(e.target.value))}>
                                {[1, 2, 3, 4, 5].map(w => <option key={w} value={w}>Week {w}</option>)}
                            </select>
                        </div>
                    )}

                    {filterMode === 'CUSTOM' && (
                        <>
                            <div className={styles.controlGroup}>
                                <label className={styles.label}>Start</label>
                                <input type="date" className={styles.dateInput} onChange={e => setStartDate(e.target.value)} />
                            </div>
                            <div className={styles.controlGroup}>
                                <label className={styles.label}>End</label>
                                <input type="date" className={styles.dateInput} onChange={e => setEndDate(e.target.value)} />
                            </div>
                        </>
                    )}

                    <button onClick={handleAnalyze} className={styles.analyzeBtn}>
                        {loading ? 'Processing...' : 'Analyze Data'}
                    </button>
                </div>
                
                <div style={{marginTop: '0.5rem', fontSize:'0.85rem', color:'#666'}}>
                    Range: <strong style={{color:'#fff'}}>{startDate}</strong> to <strong style={{color:'#fff'}}>{endDate}</strong>
                </div>
            </div>

            {/* --- RESULTS SECTION --- */}
            {(expenses.length > 0 || sales.length > 0) && (
                <>
                    {/* 1. SUMMARY CARDS (3-Col Grid) */}
                    <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'1.5rem', marginBottom:'1.5rem'}}>
                        {/* Income */}
                        <div className={styles.totalCard}>
                            <span className={styles.totalLabel}>TOTAL INCOME</span>
                            <span className={styles.totalValue} style={{color:'#10b981'}}>
                                ₹ {totals.income.toLocaleString()}
                            </span>
                        </div>
                        {/* Expense */}
                        <div className={styles.totalCard}>
                            <span className={styles.totalLabel}>TOTAL EXPENSE</span>
                            <span className={styles.totalValue} style={{color:'#ef4444'}}>
                                ₹ {totals.expense.toLocaleString()}
                            </span>
                        </div>
                        {/* Profit */}
                        <div className={styles.totalCard} style={{border: totals.profit >= 0 ? '1px solid #10b981' : '1px solid #ef4444'}}>
                            <span className={styles.totalLabel}>NET PROFIT</span>
                            <span className={styles.totalValue} style={{color: totals.profit >= 0 ? '#10b981' : '#ef4444'}}>
                                {totals.profit >= 0 ? '+' : ''} ₹ {totals.profit.toLocaleString()}
                            </span>
                        </div>
                    </div>

                    {/* 2. SPLIT VIEW: CHART & TIMELINE */}
                    <div className={styles.contentGrid}>
                        
                        {/* CHART */}
                        <div className={styles.chartSection}>
                            <h3 className={styles.sectionTitle}>Income vs Expense</h3>
                            <ResponsiveContainer width="100%" height="90%">
                                <BarChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false}/>
                                    <XAxis dataKey="name" stroke="#888" tick={{fontSize: 12}} />
                                    <YAxis stroke="#888" tick={{fontSize: 12}} />
                                    <Tooltip 
                                        contentStyle={{backgroundColor: '#111', borderColor:'#333'}}
                                        itemStyle={{color:'#fff'}}
                                        cursor={{fill: 'rgba(255,255,255,0.05)'}}
                                    />
                                    <Legend />
                                    <Bar dataKey="Income" fill="#10b981" radius={[4,4,0,0]} barSize={60} />
                                    <Bar dataKey="Expense" fill="#ef4444" radius={[4,4,0,0]} barSize={60} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* TIMELINE (Merged Sales & Expenses) */}
                        <div className={styles.timelineSection}>
                            <h3 className={styles.sectionTitle}>Activity Feed</h3>
                            
                            <div className={styles.timelineScrollArea}>
                                {sortedDates.map((dateKey) => (
                                    <div key={dateKey} className={styles.timelineGroup}>
                                        {/* Color dot based on first item type */}
                                        <div 
                                            className={styles.dateDot}
                                            style={{backgroundColor: timelineGroups[dateKey][0].type === 'INCOME' ? '#10b981' : '#3b82f6'}}
                                        ></div>
                                        <div className={styles.dateHeader}>{dateKey}</div>
                                        
                                        {timelineGroups[dateKey].map((item, idx) => (
                                            <div key={idx} className={styles.timelineItem}>
                                                <div>
                                                    <div className={styles.itemCategory} style={{color: item.type === 'INCOME' ? '#10b981' : '#ddd'}}>
                                                        {item.category === 'Sale' ? 'Rubber Sale' : item.category}
                                                    </div>
                                                    <div className={styles.itemDesc}>
                                                        {item.estate?.name} {item.description ? `— ${item.description}` : ''}
                                                    </div>
                                                </div>
                                                <div className={styles.itemAmount} style={{color: item.type === 'INCOME' ? '#10b981' : '#ef4444'}}>
                                                    {item.type === 'INCOME' ? '+' : '-'} ₹ {(item.grandTotal || item.amount).toLocaleString()}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>
                </>
            )}
        </div>
    );
};

export default Tracker;