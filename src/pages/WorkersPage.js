// frontend/src/pages/WorkersPage.js
import React, { useState, useEffect, useMemo } from 'react';
import { useEstate } from '../context/EstateContext';
import { WorkerService, EstateService } from '../api/services';
import styles from '../styles/WorkersPage.module.css';

const WorkersPage = () => {
    const selectedEstate = useEstate(); 
    
    // --- STATE ---
    const [allWorkers, setAllWorkers] = useState([]); 
    const [allEstates, setAllEstates] = useState([]); 
    const [loading, setLoading] = useState(false);

    // Edit Mode State
    const [editingId, setEditingId] = useState(null);
    const [wageHistory, setWageHistory] = useState([]); 

    // Expandable Rows State (Stores IDs of expanded workers)
    const [expandedIds, setExpandedIds] = useState(new Set());

    // Inputs
    const [addFormEstateId, setAddFormEstateId] = useState(''); 
    const [filterEstateId, setFilterEstateId] = useState('');   

    // Form Data
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [dailyWage, setDailyWage] = useState('');

    // 1. Initial Load
    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const estateRes = await EstateService.getAll();
                const estatesList = estateRes.data;
                setAllEstates(estatesList);

                if (selectedEstate) {
                    setAddFormEstateId(selectedEstate._id);
                } else if (estatesList.length > 0) {
                    setAddFormEstateId(estatesList[0]._id);
                }

                if (estatesList.length > 0) {
                    fetchAllWorkers(estatesList);
                }
            } catch (err) {
                console.error("Failed to load initial data", err);
            }
        };
        loadInitialData();
    }, []); 

    // Helper: Fetch workers
    const fetchAllWorkers = async (estates) => {
        try {
            const promises = estates.map(est => WorkerService.getByEstate(est._id));
            const results = await Promise.all(promises);
            const combinedWorkers = results.map(res => res.data).flat();
            setAllWorkers(combinedWorkers);
        } catch (error) {
            console.error("Error fetching all workers", error);
        }
    };

    // 2. Filtered Workers
    const displayedWorkers = useMemo(() => {
        if (!filterEstateId) return allWorkers; 
        return allWorkers.filter(w => {
            const workerEstateId = typeof w.estate === 'object' ? w.estate._id : w.estate;
            return workerEstateId === filterEstateId;
        });
    }, [allWorkers, filterEstateId]);

    // --- ACTIONS ---

    // Toggle History Expansion
    const toggleHistory = (workerId) => {
        const newSet = new Set(expandedIds);
        if (newSet.has(workerId)) {
            newSet.delete(workerId);
        } else {
            newSet.add(workerId);
        }
        setExpandedIds(newSet);
    };

    // Edit Clicked
    const handleEdit = (worker) => {
        setEditingId(worker._id);
        setName(worker.name);
        setPhone(worker.phone || '');
        setDailyWage(worker.dailyWage);
        
        const eId = typeof worker.estate === 'object' ? worker.estate._id : worker.estate;
        setAddFormEstateId(eId);
        setWageHistory(worker.wageHistory || []);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Cancel Edit
    const handleCancel = () => {
        setEditingId(null);
        setName('');
        setPhone('');
        setDailyWage('');
        setWageHistory([]);
    };

    // Submit
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!addFormEstateId) return alert("Please select an estate.");
        if (!name || !dailyWage) return alert("Name and Wage are required");

        setLoading(true);

        const payload = {
            estate: addFormEstateId,
            name,
            phone,
            dailyWage: Number(dailyWage)
        };

        try {
            if (editingId) {
                await WorkerService.update(editingId, payload);
                alert("Worker Updated Successfully");
            } else {
                await WorkerService.create(payload);
                alert("Worker Added Successfully");
            }
            handleCancel(); 
            await fetchAllWorkers(allEstates); 
        } catch (error) {
            alert("Error saving worker");
        } finally {
            setLoading(false);
        }
    };

    const getEstateName = (worker) => {
        if (worker.estate && worker.estate.name) return worker.estate.name;
        const estateId = typeof worker.estate === 'object' ? worker.estate._id : worker.estate;
        const found = allEstates.find(e => e._id === estateId);
        return found ? found.name : 'Unknown';
    };

    return (
        <div className={styles.container}>
            <h2 className={styles.header}>Manage Workers</h2>
            
            <div className={styles.grid}>
                
                {/* --- LEFT: FORM --- */}
                <div className={styles.card}>
                    <h3 className={styles.cardHeader}>
                        {editingId ? 'Edit Worker' : 'Add New Worker'}
                    </h3>
                    
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Assign to Estate</label>
                        <select 
                            className={styles.input}
                            value={addFormEstateId}
                            onChange={(e) => setAddFormEstateId(e.target.value)}
                            disabled={!!editingId}
                            style={{opacity: editingId ? 0.6 : 1}}
                        >
                            <option value="">-- Choose Estate --</option>
                            {allEstates.map(est => (
                                <option key={est._id} value={est._id}>{est.name}</option>
                            ))}
                        </select>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Full Name</label>
                            <input type="text" className={styles.input} placeholder="e.g. Raju Brother" value={name} onChange={e => setName(e.target.value)} />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Daily Wage (₹)</label>
                            <input type="number" className={styles.input} placeholder="e.g. 500" value={dailyWage} onChange={e => setDailyWage(e.target.value)} />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Phone Number</label>
                            <input type="text" className={styles.input} placeholder="Optional" value={phone} onChange={e => setPhone(e.target.value)} />
                        </div>

                        <button type="submit" className={styles.submitBtn} disabled={loading}>
                            {loading ? 'Saving...' : (editingId ? 'Update Worker' : '+ Add Worker')}
                        </button>
                        
                        {editingId && (
                            <button type="button" onClick={handleCancel} style={{marginTop:'10px', width:'100%', padding:'12px', background:'#2a2a2a', border:'1px solid #444', color:'#ccc', borderRadius:'8px', cursor:'pointer', fontWeight:600}}>
                                Cancel Edit
                            </button>
                        )}
                    </form>
                </div>

                {/* --- RIGHT: LIST --- */}
                <div className={styles.card}>
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem'}}>
                        <h3 className={styles.cardHeader} style={{marginBottom:0}}>Directory ({displayedWorkers.length})</h3>
                        <select 
                            style={{padding: '6px 12px', borderRadius: '6px', background: '#121212', color: '#fff', border: '1px solid #333', fontSize: '0.85rem'}}
                            value={filterEstateId}
                            onChange={(e) => setFilterEstateId(e.target.value)}
                        >
                            <option value="">Show All Locations</option>
                            {allEstates.map(est => (<option key={est._id} value={est._id}>{est.name}</option>))}
                        </select>
                    </div>

                    {displayedWorkers.length === 0 ? (
                        <div style={{textAlign:'center', padding:'2rem', color:'#666'}}>No workers found.</div>
                    ) : (
                        <div className={styles.tableContainer}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Location</th>
                                        <th>Wage</th>
                                        <th>Loan</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {displayedWorkers.map(worker => {
                                        const isExpanded = expandedIds.has(worker._id);
                                        return (
                                            <React.Fragment key={worker._id}>
                                                <tr>
                                                    <td>
                                                        <div style={{fontWeight:500}}>{worker.name}</div>
                                                        <div style={{fontSize:'0.75rem', color:'#666'}}>{worker.phone}</div>
                                                    </td>
                                                    <td>
                                                        <span style={{fontSize:'0.75rem', background:'rgba(59, 130, 246, 0.15)', color:'#60a5fa', padding:'2px 6px', borderRadius:'4px'}}>
                                                            {getEstateName(worker)}
                                                        </span>
                                                    </td>
                                                    <td><span className={styles.wageBadge}>₹{worker.dailyWage}</span></td>
                                                    <td style={{color: worker.currentBalance > 0 ? '#ef4444' : '#888'}}>
                                                        {worker.currentBalance > 0 ? `₹${worker.currentBalance}` : '-'}
                                                    </td>
                                                    <td>
                                                        <div style={{display:'flex', gap:'8px'}}>
                                                            <button 
                                                                onClick={() => handleEdit(worker)}
                                                                style={{background:'transparent', border:'1px solid #3b82f6', color:'#3b82f6', padding:'4px 8px', borderRadius:'4px', cursor:'pointer', fontSize:'0.75rem', fontWeight:600}}
                                                            >
                                                                Edit
                                                            </button>
                                                            {/* History Toggle Button */}
                                                            <button 
                                                                onClick={() => toggleHistory(worker._id)}
                                                                style={{
                                                                    background: isExpanded ? '#333' : 'transparent', 
                                                                    border:'1px solid #666', 
                                                                    color:'#ccc', 
                                                                    padding:'4px 8px', 
                                                                    borderRadius:'4px', 
                                                                    cursor:'pointer', 
                                                                    fontSize:'0.75rem'
                                                                }}
                                                            >
                                                                {isExpanded ? 'Hide' : 'History'}
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                                
                                                {/* --- EXPANDABLE ROW --- */}
                                                {isExpanded && (
                                                    <tr>
                                                        <td colSpan="5" style={{padding:0, borderBottom:'1px solid #333'}}>
                                                            <div style={{background:'#121212', padding:'1rem', borderLeft:'3px solid #3b82f6'}}>
                                                                <h4 style={{fontSize:'0.8rem', color:'#888', textTransform:'uppercase', margin:'0 0 0.5rem 0'}}>Wage History</h4>
                                                                {(!worker.wageHistory || worker.wageHistory.length === 0) ? (
                                                                    <div style={{fontSize:'0.85rem', color:'#555'}}>No history recorded.</div>
                                                                ) : (
                                                                    <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(150px, 1fr))', gap:'0.5rem'}}>
                                                                        {worker.wageHistory.slice().reverse().map((h, i) => (
                                                                            <div key={i} style={{background:'#1e1e1e', padding:'6px 10px', borderRadius:'4px', border:'1px solid #333', fontSize:'0.85rem', display:'flex', justifyContent:'space-between'}}>
                                                                                <span style={{color:'#10b981', fontWeight:'bold'}}>₹{h.wage}</span>
                                                                                <span style={{color:'#666'}}>{new Date(h.date).toLocaleDateString('en-GB')}</span>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default WorkersPage;