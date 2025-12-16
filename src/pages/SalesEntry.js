import React, { useState, useEffect } from 'react';
import { useEstate } from '../context/EstateContext';
import { EstateService, SaleService } from '../api/services';
import styles from '../styles/SalesEntry.module.css';

const SalesEntry = () => {
    const  selectedEstate  = useEstate();
    
    // Header State
    const [allEstates, setAllEstates] = useState([]);
    const [targetEstateId, setTargetEstateId] = useState(selectedEstate?._id || '');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [buyer, setBuyer] = useState('');

    // Item Entry State
    const [cropType, setCropType] = useState('Rubber'); // Default
    // Rubber Specifics
    const [sheetWeight, setSheetWeight] = useState('');
    const [sheetRate, setSheetRate] = useState('');
    const [scrapWeight, setScrapWeight] = useState('');
    const [scrapRate, setScrapRate] = useState('');
    // Other Crops Specifics
    const [genericWeight, setGenericWeight] = useState('');
    const [genericRate, setGenericRate] = useState('');
    const [customName, setCustomName] = useState('');

    // The Cart (Bill Items)
    const [items, setItems] = useState([]);

    useEffect(() => {
        EstateService.getAll().then(res => setAllEstates(res.data));
    }, []);

    // --- LOGIC: ADD ITEM TO CART ---
    const handleAddItem = (e) => {
        e.preventDefault();
        const newItems = [];

        if (cropType === 'Rubber') {
            // Validate
            if (!sheetWeight && !scrapWeight) return alert("Enter weight for Sheet or Scrap");

            // Add Sheet if exists
            if (sheetWeight && sheetRate) {
                newItems.push({
                    crop: 'Rubber',
                    subType: 'Sheet',
                    weightKg: Number(sheetWeight),
                    pricePerKg: Number(sheetRate),
                    lineTotal: Number(sheetWeight) * Number(sheetRate)
                });
            }
            // Add Scrap if exists
            if (scrapWeight && scrapRate) {
                newItems.push({
                    crop: 'Rubber',
                    subType: 'Scrap',
                    weightKg: Number(scrapWeight),
                    pricePerKg: Number(scrapRate),
                    lineTotal: Number(scrapWeight) * Number(scrapRate)
                });
            }
            // Reset Fields
            setSheetWeight(''); setSheetRate(''); setScrapWeight(''); setScrapRate('');
        } else {
            // Logic for Pepper, Cardamom, Custom
            if (!genericWeight || !genericRate) return alert("Enter Weight and Rate");
            
            newItems.push({
                crop: cropType === 'Custom' ? customName : cropType,
                subType: '-',
                weightKg: Number(genericWeight),
                pricePerKg: Number(genericRate),
                lineTotal: Number(genericWeight) * Number(genericRate)
            });
            // Reset
            setGenericWeight(''); setGenericRate(''); setCustomName('');
        }

        setItems([...items, ...newItems]);
    };

    const handleRemoveItem = (index) => {
        const updated = [...items];
        updated.splice(index, 1);
        setItems(updated);
    };

    const handleRemoveAll = () => {
        setItems([])
    }

    // --- SUBMIT FINAL SALE ---
    const handleSubmitSale = async () => {
        if (items.length === 0) return alert("No items in this sale");
        if (!targetEstateId) return alert("Select Estate");

        const grandTotal = items.reduce((sum, item) => sum + item.lineTotal, 0);

        try {
            await SaleService.create({
                estate: targetEstateId,
                date,
                buyerName: buyer,
                items,
                grandTotal
            });
            alert("Sale Recorded Successfully!");
            setItems([]);
            setBuyer('');
        } catch (error) {
            console.error(error);
            alert("Failed to save sale");
        }
    };

    const calculateGrandTotal = () => items.reduce((sum, item) => sum + item.lineTotal, 0);

    return (
        <div className={styles.container}>
            <h2 className={styles.header}>Record New Sale</h2>

            <div className={styles.card}>
                {/* 1. SALE HEADER DETAILS */}
                <div className={styles.row}>
                    <div className={styles.col}>
                        <label className={styles.label}>Estate</label>
                        <select className={styles.select} value={targetEstateId} onChange={e => setTargetEstateId(e.target.value)}>
                            <option value="">-- Select --</option>
                            {allEstates.map(est => <option key={est._id} value={est._id}>{est.name}</option>)}
                        </select>
                    </div>
                    <div className={styles.col}>
                        <label className={styles.label}>Date</label>
                        <input type="date" className={styles.input} value={date} onChange={e => setDate(e.target.value)} />
                    </div>
                    <div className={styles.col}>
                        <label className={styles.label}>Buyer Name</label>
                        <input type="text" className={styles.input} value={buyer} onChange={e => setBuyer(e.target.value)} placeholder="e.g. Kottayam Traders" />
                    </div>
                </div>

                <hr style={{borderColor:'#333', margin:'2rem 0'}} />

                {/* 2. ITEM ENTRY AREA */}
                <div className={styles.entrySection}>
                    <div style={{marginBottom:'1rem'}}>
                        <label className={styles.label} style={{marginRight:'1rem'}}>Select Crop:</label>
                        <select className={styles.select} style={{width:'200px'}} value={cropType} onChange={e => setCropType(e.target.value)}>
                            <option value="Rubber">Rubber (Sheet/Scrap)</option>
                            <option value="Pepper">Pepper</option>
                            <option value="Cardamom">Cardamom</option>
                            <option value="Coffee">Coffee</option>
                            <option value="Custom">Custom / Other</option>
                        </select>
                    </div>

                    {/* DYNAMIC FORM BASED ON CROP */}
                    {cropType === 'Rubber' ? (
                        <>
                            {/* Rubber Row 1: Sheet */}
                            <div className={styles.row}>
                                <div className={styles.col} style={{flex:0.5}}><label className={styles.label}>Type</label><span style={{color:'#fff', marginTop:'10px'}}>Sheet</span></div>
                                <div className={styles.col}><label className={styles.label}>Weight (Kg)</label><input type="number" className={styles.input} value={sheetWeight} onChange={e => setSheetWeight(e.target.value)} placeholder="0" /></div>
                                <div className={styles.col}><label className={styles.label}>Rate / Kg</label><input type="number" className={styles.input} value={sheetRate} onChange={e => setSheetRate(e.target.value)} placeholder="₹" /></div>
                            </div>
                            {/* Rubber Row 2: Scrap */}
                            <div className={styles.row}>
                                <div className={styles.col} style={{flex:0.5}}><span style={{color:'#fff', marginTop:'10px'}}>Scrap</span></div>
                                <div className={styles.col}><input type="number" className={styles.input} value={scrapWeight} onChange={e => setScrapWeight(e.target.value)} placeholder="0" /></div>
                                <div className={styles.col}><input type="number" className={styles.input} value={scrapRate} onChange={e => setScrapRate(e.target.value)} placeholder="₹" /></div>
                            </div>
                        </>
                    ) : (
                        // Generic Form
                        <div className={styles.row}>
                             {cropType === 'Custom' && (
                                <div className={styles.col}><label className={styles.label}>Item Name</label><input type="text" className={styles.input} value={customName} onChange={e => setCustomName(e.target.value)} /></div>
                             )}
                             <div className={styles.col}><label className={styles.label}>Weight (Kg)</label><input type="number" className={styles.input} value={genericWeight} onChange={e => setGenericWeight(e.target.value)} /></div>
                             <div className={styles.col}><label className={styles.label}>Rate / Kg</label><input type="number" className={styles.input} value={genericRate} onChange={e => setGenericRate(e.target.value)} /></div>
                        </div>
                    )}

                    <button className={styles.addBtn} onClick={handleAddItem}>+ Add to Bill</button>
                </div>

                {/* 3. BILL SUMMARY */}
                {items.length > 0 && (
                    <div>
                        <div className={styles.headerContainer}>
                            <h3 className={styles.label}>Current Bill Items</h3>
                            <button className={styles.addBtn} onClick={handleRemoveAll}>Reset</button>
                        </div>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Crop</th>
                                    <th>Type</th>
                                    <th>Weight</th>
                                    <th>Rate</th>
                                    <th>Total</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item, idx) => (
                                    <tr key={idx}>
                                        <td>{item.crop}</td>
                                        <td>{item.subType}</td>
                                        <td>{item.weightKg} kg</td>
                                        <td>₹{item.pricePerKg}</td>
                                        <td style={{color:'#10b981'}}>₹{item.lineTotal.toLocaleString()}</td>
                                        <td><button className={styles.removeBtn} onClick={() => handleRemoveItem(idx)}>✕</button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <div className={styles.totalRow}>
                            <span>Grand Total</span>
                            <span style={{color:'#10b981'}}>₹ {calculateGrandTotal().toLocaleString()}</span>
                        </div>

                        <button className={styles.submitBtn} onClick={handleSubmitSale}>
                            Confirm Sale & Save
                        </button>
                        
                    </div>
                )}
            </div>
        </div>
    );
};

export default SalesEntry;