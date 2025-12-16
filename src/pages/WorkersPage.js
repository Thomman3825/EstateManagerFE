import React, { useState, useEffect, useMemo } from 'react';
import { useEstate } from '../context/EstateContext';
import { WorkerService, EstateService } from '../api/services';
import styles from '../styles/WorkersPage.module.css';

const WorkersPage = () => {
    const  selectedEstate  = useEstate();
    
    // --- STATE ---
    const [allWorkers, setAllWorkers] = useState([]); // Stores ALL workers across all estates
    const [allEstates, setAllEstates] = useState([]); 
    const [loading, setLoading] = useState(false);

    // Inputs
    const [addFormEstateId, setAddFormEstateId] = useState(''); // Specific estate for Adding
    const [filterEstateId, setFilterEstateId] = useState('');   // Filter for List (Empty = All)

    // Form Data
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [dailyWage, setDailyWage] = useState('');

    // 1. Initial Load: Fetch Estates, then Fetch ALL Workers
    useEffect(() => {
        const loadInitialData = async () => {
            try {
                // A. Get All Estates
                const estateRes = await EstateService.getAll();
                const estatesList = estateRes.data;
                setAllEstates(estatesList);

                // Set default for Add Form (if global context exists)
                if (selectedEstate) {
                    setAddFormEstateId(selectedEstate._id);
                } else if (estatesList.length > 0) {
                    setAddFormEstateId(estatesList[0]._id);
                }

                // B. Get Workers for ALL Estates immediately
                if (estatesList.length > 0) {
                    fetchAllWorkers(estatesList);
                }
            } catch (err) {
                console.error("Failed to load initial data", err);
            }
        };

        loadInitialData();
    }, []); // Run once on mount

    // Helper: Fetch workers for provided estates and merge them
    const fetchAllWorkers = async (estates) => {
        try {
            // Create a promise for each estate to fetch its workers
            const promises = estates.map(est => WorkerService.getByEstate(est._id));
            const results = await Promise.all(promises);
            
            // Flatten the array of arrays into one single list
            const combinedWorkers = results.map(res => res.data).flat();
            setAllWorkers(combinedWorkers);
        } catch (error) {
            console.error("Error fetching all workers", error);
        }
    };

    // 2. Computed: Filtered Workers for Display
    const displayedWorkers = useMemo(() => {
        if (!filterEstateId) return allWorkers; // Show All
        return allWorkers.filter(w => {
            // Handle case where w.estate is an object or a string ID
            const workerEstateId = typeof w.estate === 'object' ? w.estate._id : w.estate;
            return workerEstateId === filterEstateId;
        });
    }, [allWorkers, filterEstateId]);

    // 3. Handle Add Worker
    const handleAddWorker = async (e) => {
        e.preventDefault();
        
        if (!addFormEstateId) return alert("Please select an estate to add the worker to.");
        if (!name || !dailyWage) return alert("Name and Wage are required");

        setLoading(true);

        try {
            await WorkerService.create({
                estate: addFormEstateId,
                name,
                phone,
                dailyWage: Number(dailyWage)
            });
            
            // Clear inputs
            setName('');
            setPhone('');
            setDailyWage('');
            
            // Refresh ALL workers to ensure list is up to date
            await fetchAllWorkers(allEstates);
            
            alert("Worker Added Successfully");
        } catch (error) {
            alert("Error adding worker");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    // Helper to get Estate Name from ID (for the table display)
    const getEstateName = (worker) => {
        // If backend populated the estate field
        if (worker.estate && worker.estate.name) return worker.estate.name;
        
        // If backend only sent ID, look it up in allEstates
        const estateId = typeof worker.estate === 'object' ? worker.estate._id : worker.estate;
        const found = allEstates.find(e => e._id === estateId);
        return found ? found.name : 'Unknown';
    };

    return (
        <div className={styles.container}>
            <h2 className={styles.header}>Manage Workers</h2>
            
            <div className={styles.grid}>
                
                {/* --- LEFT: ADD WORKER FORM --- */}
                <div className={styles.card}>
                    <h3 className={styles.cardHeader}>Add New Worker</h3>
                    
                    {/* Estate Selector for ADDING */}
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Assign to Estate</label>
                        <select 
                            className={styles.input}
                            value={addFormEstateId}
                            onChange={(e) => setAddFormEstateId(e.target.value)}
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
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem'}}>
                        <h3 className={styles.cardHeader} style={{marginBottom:0}}>
                            Directory 
                            <span style={{color: '#666', fontSize: '0.8em', marginLeft:'10px'}}>
                                ({displayedWorkers.length})
                            </span>
                        </h3>

                        {/* FILTER DROPDOWN */}
                        <select 
                            style={{
                                padding: '6px 12px',
                                borderRadius: '6px',
                                background: '#121212',
                                color: '#fff',
                                border: '1px solid #333',
                                fontSize: '0.85rem'
                            }}
                            value={filterEstateId}
                            onChange={(e) => setFilterEstateId(e.target.value)}
                        >
                            <option value="">Show All Locations</option>
                            {allEstates.map(est => (
                                <option key={est._id} value={est._id}>{est.name}</option>
                            ))}
                        </select>
                    </div>

                    {displayedWorkers.length === 0 ? (
                        <div style={{textAlign:'center', padding:'2rem', color:'#666', fontStyle:'italic'}}>
                            No workers found.
                        </div>
                    ) : (
                        <div className={styles.tableContainer}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Location</th> {/* Added Location Header */}
                                        <th>Wage</th>
                                        <th>Loan</th>
                                        <th>Phone</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {displayedWorkers.map(worker => (
                                        <tr key={worker._id}>
                                            <td style={{fontWeight:500}}>{worker.name}</td>
                                            
                                            {/* Estate Column */}
                                            <td>
                                                <span style={{
                                                    fontSize:'0.75rem', 
                                                    background:'rgba(59, 130, 246, 0.15)', 
                                                    color:'#60a5fa', 
                                                    padding:'2px 6px', 
                                                    borderRadius:'4px'
                                                }}>
                                                    {getEstateName(worker)}
                                                </span>
                                            </td>

                                            <td><span className={styles.wageBadge}>₹{worker.dailyWage}</span></td>
                                            
                                            <td style={{color: worker.currentBalance > 0 ? '#ef4444' : '#888'}}>
                                                {worker.currentBalance > 0 ? `₹${worker.currentBalance}` : '-'}
                                            </td>
                                            
                                            <td style={{color:'#888', fontSize:'0.9em'}}>{worker.phone || '-'}</td>
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