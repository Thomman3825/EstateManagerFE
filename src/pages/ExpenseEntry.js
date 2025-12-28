// frontend/src/pages/ExpenseEntry.js
import React, { useState, useEffect, useCallback } from 'react';
import { useEstate } from '../context/EstateContext';
import { WorkerService, ExpenseService, EstateService } from '../api/services';
import styles from '../styles/ExpenseEntry.module.css';

const ExpenseEntry = () => {
    const selectedEstate = useEstate();
    
    // --- STATE ---
    const [allEstates, setAllEstates] = useState([]);
    const [targetEstateId, setTargetEstateId] = useState(selectedEstate?._id || '');
    const [workers, setWorkers] = useState([]);
    const [expenses, setExpenses] = useState([]); 
    const [editingId, setEditingId] = useState(null); 

    // Period Selectors
    const currentYear = new Date().getFullYear();
    const [year, setYear] = useState(currentYear);
    const [month, setMonth] = useState(new Date().getMonth()); 
    const [week, setWeek] = useState(1); 

    // Form Data
    const [entryType, setEntryType] = useState('GENERAL');
    const [date, setDate] = useState(''); 
    
    // Expense Inputs
    const [category, setCategory] = useState('Fertilizer');
    const [amount, setAmount] = useState('');
    const [desc, setDesc] = useState('');
    
    // Wage Inputs
    const [selectedWorker, setSelectedWorker] = useState('');
    const [daysWorked, setDaysWorked] = useState(6);
    const [deduction, setDeduction] = useState(0);

    // --- HELPER: CALCULATE DATE RANGE ---
    const getWeekRange = (y, m, w) => {
        const startDay = (w - 1) * 7 + 1;
        const endDay = w * 7;
        const startDate = new Date(Date.UTC(y, m, startDay));
        const endDate = new Date(Date.UTC(y, m, endDay));
        return {
            start: startDate.toISOString().split('T')[0],
            end: endDate.toISOString().split('T')[0]
        };
    };

    // --- EFFECTS ---
    useEffect(() => {
        EstateService.getAll().then(res => setAllEstates(res.data));
    }, []);

    const fetchExpenses = useCallback(async () => {
        if (!targetEstateId) return;
        const { start, end } = getWeekRange(year, month, week);
        try {
            const res = await ExpenseService.getByEstate(targetEstateId, start, end); 
            setExpenses(res.data);
        } catch (error) {
            console.error("Failed to fetch expenses", error);
        }
    }, [targetEstateId, year, month, week]); 

    useEffect(() => {
        if(targetEstateId) {
            WorkerService.getByEstate(targetEstateId).then(res => setWorkers(res.data));
            fetchExpenses();
        }
    }, [targetEstateId, fetchExpenses]);

    useEffect(() => {
        // Only update date if NOT editing
        const day = week * 7; 
        const dateObj = new Date(Date.UTC(year, month, day));
        const dateStr = dateObj.toISOString().split('T')[0];
        
        if (!editingId) {
            setDate(dateStr);
        }
    }, [year, month, week, editingId]);

    // --- ACTIONS ---
    const handleEdit = (item) => {
        setEditingId(item._id);

        const isWage = 
            item.type === 'WAGE' || 
            (item.workerId && item.workerId !== null) ||
            (item.description && item.description.toLowerCase().includes('wages:'));

        setEntryType(isWage ? 'WAGE' : 'GENERAL');
        
        setAmount(item.amount);
        setDesc(item.description || '');
        if(item.date) setDate(item.date.split('T')[0]);
        
        if (isWage) {
            const wId = item.workerId && typeof item.workerId === 'object' 
                ? item.workerId._id 
                : item.workerId;

            let derivedWorkerId = wId || '';
            if (!derivedWorkerId && item.description) {
                 const match = workers.find(w => item.description.includes(w.name));
                 if(match) derivedWorkerId = match._id;
            }

            setSelectedWorker(derivedWorkerId);
            setDaysWorked(item.daysWorked || 6);
            setDeduction(item.deductionAmount || 0);
        } else {
            setCategory(item.category || 'Fertilizer');
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancel = () => {
        setEditingId(null);
        setAmount('');
        setDesc('');
        setDeduction(0);
        setDaysWorked(6);
        const day = week * 7; 
        const dateObj = new Date(Date.UTC(year, month, day));
        setDate(dateObj.toISOString().split('T')[0]);
    };

    const handleDelete = async (id) => {
        if(!window.confirm("Delete this entry?")) return;
        try {
            await ExpenseService.delete(id);
            fetchExpenses(); 
        } catch (err) {
            alert("Error deleting");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if(!targetEstateId) return alert("Select an Estate");

        const payload = {
            estate: targetEstateId,
            date,
            amount,
            description: desc
        };

        if (entryType === 'WAGE') {
            if(!selectedWorker) return alert("Select a Worker");
            payload.type = 'WAGE';      
            payload.category = 'Wages'; 
            payload.workerId = selectedWorker;
            payload.daysWorked = daysWorked;
            payload.deductionAmount = deduction;
        } else {
            payload.type = 'GENERAL';   
            payload.category = category;
        }

        try {
            if (editingId) {
                await ExpenseService.update(editingId, payload);
                alert("Entry Updated!");
            } else {
                if (entryType === 'WAGE') {
                     await WorkerService.pay(payload);
                } else {
                     await ExpenseService.create(payload);
                }
                alert("Entry Saved!");
            }
            handleCancel(); 
            fetchExpenses();
        } catch (error) {
            console.error(error);
            alert("Error saving");
        }
    };

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    return (
        <div className={styles.container}>
            <h2 className={styles.title}>Weekly Expenses</h2>

            <div className={styles.card}>
                
                {/* 1. ESTATE SELECTOR (Disabled on Edit) */}
                <div style={{marginBottom:'1rem'}}>
                    <label className={styles.label}>Select Estate</label>
                    <select 
                        className={styles.select}
                        value={targetEstateId}
                        onChange={e => setTargetEstateId(e.target.value)}
                        disabled={!!editingId}
                        style={{opacity: editingId ? 0.6 : 1}}
                    >
                        <option value="">-- Choose Estate --</option>
                        {allEstates.map(est => (
                            <option key={est._id} value={est._id}>{est.name}</option>
                        ))}
                    </select>
                </div>

                {/* 2. PERIOD SELECTOR (Disabled on Edit) */}
                <div className={styles.periodContainer} style={{opacity: editingId ? 0.6 : 1, pointerEvents: editingId ? 'none' : 'auto'}}>
                    <div className={styles.periodRow}>
                        <div style={{flex:1}}>
                            <label className={styles.label}>Year</label>
                            <select 
                                className={styles.select} 
                                value={year} 
                                onChange={e => setYear(Number(e.target.value))}
                                disabled={!!editingId}
                            >
                                {[currentYear-1, currentYear, currentYear+1].map(y => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                        </div>
                        <div style={{flex:2}}>
                            <label className={styles.label}>Month</label>
                            <select 
                                className={styles.select} 
                                value={month} 
                                onChange={e => setMonth(Number(e.target.value))}
                                disabled={!!editingId}
                            >
                                {monthNames.map((m, idx) => (
                                    <option key={idx} value={idx}>{m}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div style={{marginTop: '0.75rem'}}>
                        <label className={styles.label}>Select Week (Filters List Below)</label>
                        <div className={styles.weekGrid}>
                            {[1, 2, 3, 4, 5].map(w => (
                                <button
                                    key={w}
                                    type="button"
                                    disabled={!!editingId}
                                    className={`${styles.weekBtn} ${week === w ? styles.activeWeek : ''}`}
                                    onClick={() => setWeek(w)}
                                    style={{cursor: editingId ? 'not-allowed' : 'pointer'}}
                                >
                                    Week {w}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 3. FORM TYPE TOGGLE (Disabled on Edit) */}
                <div className={styles.toggleContainer} style={{opacity: editingId ? 0.6 : 1, pointerEvents: editingId ? 'none' : 'auto'}}>
                    <button 
                        className={`${styles.toggleBtn} ${entryType === 'GENERAL' ? styles.activeToggle : ''}`}
                        onClick={() => setEntryType('GENERAL')}
                        disabled={!!editingId}
                    >
                        General Bill
                    </button>
                    <button 
                        className={`${styles.toggleBtn} ${entryType === 'WAGE' ? styles.activeToggle : ''}`}
                        onClick={() => setEntryType('WAGE')}
                        disabled={!!editingId}
                    >
                        Worker Wage
                    </button>
                </div>

                {/* 4. DATA ENTRY FORM */}
                <form onSubmit={handleSubmit} className={styles.form}>
                    
                    <div className={styles.dateDisplay}>
                        {editingId ? 'Editing Entry Date:' : 'Entry Date:'} <strong style={{color:'#fff'}}>{date}</strong>
                    </div>

                    {/* ... (WAGE and GENERAL Inputs - same as before) ... */}
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
                                    <label className={styles.label}>Days</label>
                                    <input type="number" className={styles.input} value={daysWorked} onChange={e => setDaysWorked(e.target.value)} />
                                </div>
                                <div className={styles.col}>
                                    <label className={styles.label}>Deduction</label>
                                    <input type="number" className={styles.input} value={deduction} onChange={e => setDeduction(e.target.value)} />
                                </div>
                            </div>
                        </>
                    )}

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

                    <div className={styles.buttonGroup}>
                        {editingId && (
                            <button type="button" onClick={handleCancel} className={styles.cancelBtn}>
                                Cancel
                            </button>
                        )}
                        <button type="submit" className={styles.submitBtn}>
                            {editingId ? 'Update Entry' : 'Save Entry'}
                        </button>
                    </div>
                </form>
            </div>

            {/* 5. LIST ... (Same as before) ... */}
            <h3 className={styles.subTitle}>
                Entries for Week {week} ({monthNames[month]} {year})
            </h3>
            
            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Details</th>
                            <th>Amount</th>
                            <th style={{textAlign:'center'}}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {expenses.length === 0 && (
                            <tr><td colSpan="4" style={{textAlign:'center', padding:'20px', color:'#666'}}>No entries found for this week.</td></tr>
                        )}
                        {expenses.map(item => (
                            <tr key={item._id}>
                                <td>{new Date(item.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</td>
                                <td>
                                    {item.type === 'WAGE' 
                                        ? <div style={{display:'flex', flexDirection:'column'}}>
                                            <span style={{fontWeight:'bold', color:'#fff'}}>{item.workerId?.name || 'Worker'}</span>
                                            <span className={styles.wageTag}>WAGE</span> 
                                          </div>
                                        : <div style={{display:'flex', flexDirection:'column'}}>
                                            <span style={{fontWeight:'bold', color:'#fff'}}>{item.category}</span>
                                            <span style={{fontSize:'0.8rem', color:'#888'}}>{item.description}</span>
                                          </div>
                                    }
                                </td>
                                <td style={{color:'#ef4444', fontWeight:'bold', fontSize:'1rem'}}>₹{item.amount}</td>
                                <td style={{textAlign:'center'}}>
                                    <button className={styles.editBtn} onClick={() => handleEdit(item)}>Edit</button>
                                    <button className={styles.removeBtn} onClick={() => handleDelete(item._id)}>✕</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ExpenseEntry;