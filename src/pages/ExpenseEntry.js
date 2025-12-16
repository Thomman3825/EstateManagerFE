import React, { useState, useEffect } from 'react';
import { useEstate } from '../context/EstateContext';
import { WorkerService, ExpenseService, EstateService } from '../api/services';
import styles from '../styles/ExpenseEntry.module.css';

const ExpenseEntry = () => {
    const { selectedEstate } = useEstate();
    
    // --- STATE ---
    const [allEstates, setAllEstates] = useState([]);
    const [targetEstateId, setTargetEstateId] = useState(selectedEstate?._id || '');
    const [workers, setWorkers] = useState([]);

    // Period Selectors
    const currentYear = new Date().getFullYear();
    const [year, setYear] = useState(currentYear);
    const [month, setMonth] = useState(new Date().getMonth()); // 0 = Jan
    const [week, setWeek] = useState(1); // 1 to 5

    // Form Data
    const [entryType, setEntryType] = useState('GENERAL');
    const [date, setDate] = useState(''); // Will auto-calculate based on week
    
    // Expense Inputs
    const [category, setCategory] = useState('Fertilizer');
    const [amount, setAmount] = useState('');
    const [desc, setDesc] = useState('');
    
    // Wage Inputs
    const [selectedWorker, setSelectedWorker] = useState('');
    const [daysWorked, setDaysWorked] = useState(6);
    const [deduction, setDeduction] = useState(0);

    // --- EFFECT: LOAD DATA ---
    useEffect(() => {
        EstateService.getAll().then(res => setAllEstates(res.data));
    }, []);

    useEffect(() => {
        if(targetEstateId) {
            WorkerService.getByEstate(targetEstateId).then(res => setWorkers(res.data));
        }
    }, [targetEstateId]);

    // --- EFFECT: AUTO-SET DATE BASED ON PERIOD ---
    // When User changes Year/Month/Week, we update the "Date" field automatically
    useEffect(() => {
        // PREVIOUS LOGIC (Start of Week):
        // const day = 1 + (week - 1) * 7; 

        // NEW LOGIC (End of Week):
        // Week 1 -> Day 7
        // Week 2 -> Day 14
        // Week 3 -> Day 21
        // ...
        const day = week * 7; 
        
        // Note: JS Date handles overflow automatically. 
        // If you select Feb 30th (Week 5), it will naturally roll over to March 2nd/3rd.
        const dateObj = new Date(Date.UTC(year, month, day));
        
        const dateStr = dateObj.toISOString().split('T')[0];
        setDate(dateStr);

    }, [year, month, week]);

    // --- SUBMIT ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        if(!targetEstateId) return alert("Select an Estate");

        try {
            if (entryType === 'WAGE') {
                if(!selectedWorker) return alert("Select a Worker");
                await WorkerService.pay({
                    workerId: selectedWorker,
                    daysWorked,
                    deductionAmount: deduction,
                    date // Uses the auto-calculated date from the week
                });
            } else {
                await ExpenseService.create({
                    estate: targetEstateId,
                    date,
                    category,
                    amount,
                    description: desc
                });
            }
            alert("Entry Saved!");
            setAmount('');
            setDesc('');
        } catch (error) {
            console.error(error);
            alert("Error saving");
        }
    };

    // Helper: Generate Month Names
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    return (
        <div className={styles.container}>
            <h2 className={styles.title}>Weekly Expenses</h2>

            <div className={styles.card}>
                
                {/* 1. ESTATE SELECTOR */}
                <div style={{marginBottom:'1rem'}}>
                    <label className={styles.label}>Select Estate</label>
                    <select 
                        className={styles.select}
                        value={targetEstateId}
                        onChange={e => setTargetEstateId(e.target.value)}
                    >
                        <option value="">-- Choose Estate --</option>
                        {allEstates.map(est => (
                            <option key={est._id} value={est._id}>{est.name}</option>
                        ))}
                    </select>
                </div>

                {/* 2. PERIOD SELECTOR (Year / Month / Week) */}
                <div className={styles.periodContainer}>
                    <div className={styles.periodRow}>
                        {/* Year */}
                        <div style={{flex:1}}>
                            <label className={styles.label}>Year</label>
                            <select 
                                className={styles.select} 
                                value={year} 
                                onChange={e => setYear(Number(e.target.value))}
                            >
                                {[currentYear-1, currentYear, currentYear+1].map(y => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                        </div>
                        {/* Month */}
                        <div style={{flex:2}}>
                            <label className={styles.label}>Month</label>
                            <select 
                                className={styles.select} 
                                value={month} 
                                onChange={e => setMonth(Number(e.target.value))}
                            >
                                {monthNames.map((m, idx) => (
                                    <option key={idx} value={idx}>{m}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Week Buttons */}
                    <div>
                        <label className={styles.label}>Select Week</label>
                        <div className={styles.weekGrid}>
                            {[1, 2, 3, 4, 5].map(w => (
                                <button
                                    key={w}
                                    className={`${styles.weekBtn} ${week === w ? styles.activeWeek : ''}`}
                                    onClick={() => setWeek(w)}
                                >
                                    Week {w}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 3. FORM TYPE TOGGLE */}
                <div className={styles.toggleContainer}>
                    <button 
                        className={`${styles.toggleBtn} ${entryType === 'GENERAL' ? styles.activeToggle : ''}`}
                        onClick={() => setEntryType('GENERAL')}
                    >
                        General Bill
                    </button>
                    <button 
                        className={`${styles.toggleBtn} ${entryType === 'WAGE' ? styles.activeToggle : ''}`}
                        onClick={() => setEntryType('WAGE')}
                    >
                        Worker Wage
                    </button>
                </div>

                {/* 4. DATA ENTRY FORM */}
                <form onSubmit={handleSubmit} className={styles.form}>
                    
                    {/* Read-Only Date Display (Visual Confirmation) */}
                    <div style={{background:'#1a1a1a', padding:'8px', borderRadius:'6px', fontSize:'0.85rem', color:'#666', border:'1px solid #333'}}>
                        Logging for date: <strong style={{color:'#fff'}}>{date}</strong> (Calculated from Week {week})
                    </div>

                    {/* --- WAGE SECTION --- */}
                    {entryType === 'WAGE' && (
                        <>
                            <div>
                                <label className={styles.label}>Worker</label>
                                <select 
                                    className={styles.select}
                                    value={selectedWorker}
                                    onChange={e => setSelectedWorker(e.target.value)}
                                >
                                    <option value="">Select Worker...</option>
                                    {workers.map(w => (
                                        <option key={w._id} value={w._id}>{w.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className={styles.row}>
                                <div className={styles.col}>
                                    <label className={styles.label}>Days Worked</label>
                                    <input type="number" className={styles.input} value={daysWorked} onChange={e => setDaysWorked(e.target.value)} />
                                </div>
                                <div className={styles.col}>
                                    <label className={styles.label}>Loan Deduction</label>
                                    <input type="number" className={styles.input} value={deduction} onChange={e => setDeduction(e.target.value)} />
                                </div>
                            </div>
                        </>
                    )}

                    {/* --- GENERAL SECTION --- */}
                    {entryType === 'GENERAL' && (
                        <>
                            <div className={styles.row}>
                                <div className={styles.col}>
                                    <label className={styles.label}>Category</label>
                                    <select className={styles.select} value={category} onChange={e => setCategory(e.target.value)}>
                                        <option>Fertilizer</option>
                                        <option>Chemicals</option>
                                        <option>Tools</option>
                                        <option>Transport</option>
                                        <option>Maintenance</option>
                                        <option>Other</option>
                                    </select>
                                </div>
                                <div className={styles.col}>
                                    <label className={styles.label}>Amount (₹)</label>
                                    <input type="number" className={styles.input} value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" />
                                </div>
                            </div>
                            <div>
                                <label className={styles.label}>Description</label>
                                <input type="text" className={styles.input} value={desc} onChange={e => setDesc(e.target.value)} placeholder="Details..." />
                            </div>
                        </>
                    )}

                    <button type="submit" className={styles.submitBtn}>Save Entry</button>
                </form>
            </div>
        </div>
    );
};

export default ExpenseEntry;