import React, { useState, useEffect } from 'react';
import { useEstate } from '../context/EstateContext';
import { WorkerService, EstateService } from '../api/services'; // Added EstateService
import styles from '../styles/WorkersPage.module.css';

const WorkersPage = () => {
    const { selectedEstate } = useEstate();
    
    // Data State
    const [workers, setWorkers] = useState([]);
    const [allEstates, setAllEstates] = useState([]); // List of available estates
    const [loading, setLoading] = useState(false);

    // Selection State (Default to global context, but selectable)
    const [targetEstateId, setTargetEstateId] = useState(selectedEstate?._id || '');

    // Form Inputs
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [dailyWage, setDailyWage] = useState('');

    // 1. Fetch All Estates (On Load)
    useEffect(() => {
        EstateService.getAll()
            .then(res => setAllEstates(res.data))
            .catch(err => console.error("Failed to load estates", err));
    }, []);

    // 2. Fetch Workers whenever the TARGET Estate changes
    // This keeps the list on the right in sync with the form on the left
    useEffect(() => {
        if(targetEstateId) {
            fetchWorkers(targetEstateId);
        } else {
            setWorkers([]);
        }
    }, [targetEstateId]);

    const fetchWorkers = async (estateId) => {
        try {
            const res = await WorkerService.getByEstate(estateId);
            setWorkers(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleAddWorker = async (e) => {
        e.preventDefault();
        
        if (!targetEstateId) return alert("Please select an estate first");
        if (!name || !dailyWage) return alert("Name and Wage are required");

        setLoading(true);

        try {
            await WorkerService.create({
                estate: targetEstateId, // <--- Uses the dropdown value
                name,
                phone,
                dailyWage: Number(dailyWage)
            });
            
            // Clear inputs
            setName('');
            setPhone('');
            setDailyWage('');
            
            // Refresh list
            fetchWorkers(targetEstateId);
            alert("Worker Added Successfully");
        } catch (error) {
            alert("Error adding worker");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <h2 className={styles.header}>Manage Workers</h2>
            
            <div className={styles.grid}>
                
                {/* --- LEFT: ADD WORKER FORM --- */}
                <div className={styles.card}>
                    <h3 className={styles.cardHeader}>Add New Worker</h3>
                    
                    {/* NEW: Estate Selector */}
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Select Estate</label>
                        <select 
                            className={styles.input} // Reusing input style for consistency
                            value={targetEstateId}
                            onChange={(e) => setTargetEstateId(e.target.value)}
                        >
                            <option value="">-- Choose Estate --</option>
                            {allEstates.map(est => (
                                <option key={est._id} value={est._id}>{est.name}</option>
                            ))}
                        </select>
                    </div>

                    <form onSubmit={handleAddWorker}>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Full Name</label>
                            <input 
                                type="text" 
                                className={styles.input}
                                placeholder="e.g. Raju Brother"
                                value={name}
                                onChange={e => setName(e.target.value)}
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Daily Wage (₹)</label>
                            <input 
                                type="number" 
                                className={styles.input}
                                placeholder="e.g. 500"
                                value={dailyWage}
                                onChange={e => setDailyWage(e.target.value)}
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Phone Number</label>
                            <input 
                                type="text" 
                                className={styles.input}
                                placeholder="Optional"
                                value={phone}
                                onChange={e => setPhone(e.target.value)}
                            />
                        </div>

                        <button type="submit" className={styles.submitBtn} disabled={loading}>
                            {loading ? 'Adding...' : '+ Add Worker'}
                        </button>
                    </form>
                </div>

                {/* --- RIGHT: WORKER LIST --- */}
                <div className={styles.card}>
                    <h3 className={styles.cardHeader}>
                        Worker Directory 
                        {/* Dynamic Count Label */}
                        <span style={{color: '#666', fontSize: '0.8em', marginLeft:'10px'}}>
                            {workers.length > 0 ? `(${workers.length} found)` : '(Select estate)'}
                        </span>
                    </h3>

                    {workers.length === 0 ? (
                        <div style={{textAlign:'center', padding:'2rem', color:'#666', fontStyle:'italic'}}>
                            {targetEstateId ? "No workers added to this estate yet." : "Please select an estate to view workers."}
                        </div>
                    ) : (
                        <div className={styles.tableContainer}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Phone</th>
                                        <th>Base Wage</th>
                                        <th>Current Loan</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {workers.map(worker => (
                                        <tr key={worker._id}>
                                            <td style={{fontWeight:500}}>{worker.name}</td>
                                            <td style={{color:'#888'}}>{worker.phone || '-'}</td>
                                            <td><span className={styles.wageBadge}>₹{worker.dailyWage}</span></td>
                                            <td style={{color: worker.currentBalance > 0 ? '#ef4444' : '#888'}}>
                                                {worker.currentBalance > 0 ? `₹${worker.currentBalance}` : '-'}
                                            </td>
                                        </tr>
                                    ))}
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