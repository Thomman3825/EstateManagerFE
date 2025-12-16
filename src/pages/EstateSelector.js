import React, { useEffect, useState } from 'react';
import { EstateService } from '../api/services';
import { useEstate } from '../context/EstateContext';
import { useNavigate } from 'react-router-dom';
import styles from '../styles/Dashboard.module.css'; // Reusing your dashboard styles

const EstateSelector = () => {
    const [estates, setEstates] = useState([]);
    const  switchEstate  = useEstate();
    const navigate = useNavigate();

    useEffect(() => {
        // This now fetches the AGGREGATED data (Sales, Expenses, Worker Counts)
        EstateService.getAll().then(res => setEstates(res.data));
    }, []);

    const handleSelect = (estate) => {
        // switchEstate(estate);
        navigate('/dashboard');
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        window.location.href = '/login';
    };

    const handleCreate = async () => {
        const name = prompt("Enter Estate Name:");
        if(!name) return;
        await EstateService.create({ name, location: 'Kerala' });
        window.location.reload();
    };

    return (
        <div className={styles.container} style={{maxWidth:'1000px', margin:'0 auto', padding:'2rem'}}>
            <div className={styles.headerRow}>
                <h1 className={styles.pageTitle}>Your Estates</h1>
                <div style={{display:'flex', gap:'10px'}}>
                     <button onClick={handleCreate} style={{background:'#10b981', color:'white', padding:'8px 16px', borderRadius:'6px', border:'none', cursor:'pointer'}}>
                        + Add Estate
                    </button>
                    <button onClick={handleLogout} style={{background:'#333', color:'#aaa', padding:'8px 16px', borderRadius:'6px', border:'none', cursor:'pointer'}}>
                        Log Out
                    </button>
                </div>
            </div>

            <div className={styles.card} style={{padding:'0'}}>
                <div className={styles.tableContainer}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th style={{paddingLeft:'20px'}}>Estate Name</th>
                                <th>Workers</th>
                                <th style={{textAlign:'right'}}>Total Expense</th>
                                <th style={{textAlign:'right'}}>Total Sales</th>
                                <th style={{textAlign:'right', paddingRight:'20px'}}>Net Profit</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {estates.length === 0 ? (
                                <tr><td colSpan="6" style={{textAlign:'center', padding:'30px', color:'#666'}}>No estates found. Create one!</td></tr>
                            ) : (
                                estates.map(est => {
                                    const profit = (est.totalSales || 0) - (est.totalExpenses || 0);
                                    return (
                                        <tr key={est._id} style={{cursor:'default'}}>
                                            <td style={{paddingLeft:'20px', fontWeight:'600', color:'white'}}>{est.name}</td>
                                            <td style={{color:'#aaa'}}>{est.workerCount} Workers</td>
                                            <td style={{textAlign:'right', color:'#ef4444', fontFamily:'monospace'}}>
                                                ₹ {(est.totalExpenses || 0).toLocaleString()}
                                            </td>
                                            <td style={{textAlign:'right', color:'#10b981', fontFamily:'monospace'}}>
                                                ₹ {(est.totalSales || 0).toLocaleString()}
                                            </td>
                                            <td style={{textAlign:'right', paddingRight:'20px', fontFamily:'monospace', color: profit >= 0 ? '#10b981' : '#ef4444', fontWeight:'bold'}}>
                                                ₹ {profit.toLocaleString()}
                                            </td>
                                            <td>
                                                <button 
                                                    onClick={() => handleSelect(est)}
                                                    style={{background:'#3b82f6', color:'white', border:'none', padding:'6px 12px', borderRadius:'4px', cursor:'pointer'}}
                                                >
                                                    Open Dashboard
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default EstateSelector;