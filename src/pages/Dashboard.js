import React, { useEffect, useState } from 'react';
import { useEstate } from '../context/EstateContext';
import { ExpenseService, SaleService, EstateService } from '../api/services';
import { 
    LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend 
} from 'recharts';
import styles from '../styles/Dashboard.module.css';

const Dashboard = () => {
    const { selectedEstate, switchEstate } = useEstate();
    
    // --- STATE ---
    const [loading, setLoading] = useState(false);
    const [allEstates, setAllEstates] = useState([]); 
    
    // Multi-Select State
    const [selectedEstateIds, setSelectedEstateIds] = useState([]);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    // Filter State
    const [filterMode, setFilterMode] = useState('MONTH'); // 'MONTH', 'QUARTER', 'YEAR', 'CUSTOM'
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');

    // Data State
    const [stats, setStats] = useState({ income: 0, expense: 0, profit: 0 });
    const [chartData, setChartData] = useState([]);
    const [recentTx, setRecentTx] = useState([]);

    // 1. Initial Load
    useEffect(() => {
        EstateService.getAll().then(res => setAllEstates(res.data));
        if (selectedEstate) setSelectedEstateIds([selectedEstate._id]);
    }, [selectedEstate]);

    // 2. Main Data Fetcher
    useEffect(() => {
        if (selectedEstateIds.length > 0) {
            fetchData();
        } else {
            resetData();
        }
    }, [selectedEstateIds, filterMode, customStart, customEnd]);

    const resetData = () => {
        setStats({ income: 0, expense: 0, profit: 0 });
        setChartData([]);
        setRecentTx([]);
    };

    const getDates = () => {
        const now = new Date();
        let start, end;
        if (filterMode === 'WEEK') {
            // Calculate Start (Sunday) and End (Saturday) of current week
            const day = now.getDay(); // 0 (Sun) to 6 (Sat)
            const diff = now.getDate() - day; // Adjust to Sunday
            start = new Date(now.setDate(diff));
            end = new Date(now.setDate(start.getDate() + 6));
        }
        else if (filterMode === 'MONTH') {
            start = new Date(now.getFullYear(), now.getMonth(), 1);
            end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        } else if (filterMode === 'QUARTER') {
            const currQuarter = Math.floor(now.getMonth() / 3);
            start = new Date(now.getFullYear(), currQuarter * 3, 1);
            end = new Date(now.getFullYear(), currQuarter * 3 + 3, 0);
        } else if (filterMode === 'YEAR') {
            start = new Date(now.getFullYear(), 0, 1);
            end = new Date(now.getFullYear(), 11, 31);
        } else if (filterMode === 'CUSTOM') {
            if (!customStart || !customEnd) return null;
            start = new Date(customStart);
            end = new Date(customEnd);
        }

        // Format to YYYY-MM-DD
        const format = (d) => new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
        return { from: format(start), to: format(end) };
    };

    const fetchData = async () => {
        const dateRange = getDates();
        if (!dateRange) return; // Wait for custom input

        setLoading(true);
        try {
            const params = { estates: selectedEstateIds.join(','), from: dateRange.from, to: dateRange.to };

            const [expRes, saleRes] = await Promise.all([
                ExpenseService.getReport(params),
                SaleService.getReport(params)
            ]);

            // A. CALCULATE TOTALS
            const totalInc = saleRes.data.total;
            const totalExp = expRes.data.total;
            setStats({
                income: totalInc,
                expense: totalExp,
                profit: totalInc - totalExp
            });

            // B. RECENT TRANSACTIONS
            const expenses = expRes.data.data.map(e => ({ ...e, type: 'EXPENSE', label: e.category }));
            const sales = saleRes.data.data.map(s => ({ ...s, type: 'INCOME', label: 'Sale' }));
            const allTx = [...expenses, ...sales].sort((a,b) => new Date(b.date) - new Date(a.date));
            setRecentTx(allTx.slice(0, 6)); 

            // C. PROCESS CHART DATA (Dynamic Grouping)
            processChartData(expRes.data.data, saleRes.data.data, dateRange.from, dateRange.to);

        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const processChartData = (expList, saleList, startDate, endDate) => {
        // Decide Grouping: If Year/Quarter -> Group by Month. If Month/Custom -> Group by Day.
        const isLongPeriod = filterMode === 'YEAR' || filterMode === 'QUARTER';
        
        const dataMap = {};

        // Helper to init map keys
        const addToMap = (list, keyField) => {
            list.forEach(item => {
                const d = new Date(item.date);
                let key;
                
                if (isLongPeriod) {
                    // Group by Month (e.g., "Jan", "Feb")
                    key = d.toLocaleDateString('en-US', { month: 'short' });
                    // To sort correctly later, we might need an index, but localized strings usually sort roughly ok or we use a separate sort key. 
                    // For strict sorting, we can use YYYY-MM as key and format later.
                } else {
                    // Group by Day (e.g., "01", "02" or "Mon 01")
                    key = d.toLocaleDateString('en-US', { day: '2-digit', month: 'short' });
                }

                if (!dataMap[key]) dataMap[key] = { name: key, Income: 0, Expense: 0, sortDate: d.getTime() };
                
                if (keyField === 'income') dataMap[key].Income += item.grandTotal;
                else dataMap[key].Expense += item.amount;
            });
        };

        addToMap(saleList, 'income');
        addToMap(expList, 'expense');

        // Convert Map to Array and Sort
        let chartArray = Object.values(dataMap).sort((a, b) => a.sortDate - b.sortDate);

        // If empty (no data), show empty graph placeholder logic or just empty
        setChartData(chartArray);
    };

    // Toggle logic for checkbox
    const toggleEstate = (id) => {
        if (selectedEstateIds.includes(id)) {
            setSelectedEstateIds(selectedEstateIds.filter(e => e !== id));
        } else {
            setSelectedEstateIds([...selectedEstateIds, id]);
        }
    };

    return (
        <div className={styles.container}>
            
            {/* --- HEADER ROW --- */}
            <div className={styles.headerRow}>
                <h1 className={styles.pageTitle}>Dashboard</h1>
                
                <div style={{display:'flex', gap:'1rem', flexWrap:'wrap'}}>
                    {/* Filter Bar */}
                    <div className={styles.filterBar}>
                        {["WEEK",'MONTH', 'QUARTER', 'YEAR', 'CUSTOM'].map(mode => (
                            <button 
                                key={mode}
                                className={`${styles.filterBtn} ${filterMode === mode ? styles.activeBtn : ''}`}
                                onClick={() => setFilterMode(mode)}
                            >
                                {mode}
                            </button>
                        ))}

                        {filterMode === 'CUSTOM' && (
                            <>
                                <span className={styles.separator}>|</span>
                                <input type="date" className={styles.dateInput} onChange={e => setCustomStart(e.target.value)} />
                                <span className={styles.separator}>-</span>
                                <input type="date" className={styles.dateInput} onChange={e => setCustomEnd(e.target.value)} />
                            </>
                        )}
                    </div>

                    {/* Estate Multi-Select */}
                    <div className={styles.multiSelectWrapper}>
                        <div 
                            className={styles.multiSelectBox} 
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        >
                            {selectedEstateIds.length === 0 ? (
                                <span style={{color:'#888', fontSize:'0.9rem'}}>Select Estates...</span>
                            ) : (
                                <div className={styles.selectedTags}>
                                    {allEstates
                                        .filter(e => selectedEstateIds.includes(e._id))
                                        .map(e => (
                                            <span key={e._id} className={styles.tag}>{e.name}</span>
                                        ))
                                    }
                                </div>
                            )}
                        </div>
                        {isDropdownOpen && (
                            <div className={styles.dropdownMenu} onClick={e => e.stopPropagation()}>
                                {allEstates.map(est => (
                                    <div 
                                        key={est._id} 
                                        className={styles.dropdownItem}
                                        onClick={() => toggleEstate(est._id)}
                                    >
                                        <input 
                                            type="checkbox" 
                                            className={styles.checkbox}
                                            checked={selectedEstateIds.includes(est._id)} 
                                            readOnly 
                                        />
                                        <span>{est.name}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ROW 1: FINANCIAL SUMMARY */}
            <div className={styles.gridRowTop}>
                {/* Income */}
                <div className={styles.card}>
                    <h3 className={styles.cardTitle}>Income ({filterMode})</h3>
                    <div className={styles.totalRow}>
                        <span className={styles.statValue} style={{color:'#10b981'}}>
                            {loading ? '...' : `₹ ${stats.income.toLocaleString()}`}
                        </span>
                    </div>
                    <span className={styles.statSub}>Sales Revenue</span>
                </div>

                {/* Expense */}
                <div className={styles.card}>
                    <h3 className={styles.cardTitle}>Expense ({filterMode})</h3>
                    <div className={styles.totalRow}>
                        <span className={styles.statValue} style={{color:'#ef4444'}}>
                            {loading ? '...' : `₹ ${stats.expense.toLocaleString()}`}
                        </span>
                    </div>
                    <span className={styles.statSub}>Total Costs</span>
                </div>

                {/* Profit */}
                <div className={styles.card} style={{borderColor: stats.profit >= 0 ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}}>
                    <h3 className={styles.cardTitle}>Net Profit</h3>
                    <div className={styles.totalRow}>
                        <span className={styles.statValue} style={{color: stats.profit >= 0 ? '#10b981' : '#ef4444'}}>
                            {loading ? '...' : `${stats.profit >= 0 ? '+' : ''} ₹ ${stats.profit.toLocaleString()}`}
                        </span>
                    </div>
                    <span className={styles.statSub}>Cash Flow</span>
                </div>
            </div>

            {/* ROW 2: LINE CHART & TRANSACTIONS */}
            <div className={styles.gridRowContent}>
                
                {/* LEFT: LINE CHART */}
                <div className={styles.card}>
                    <h3 className={styles.cardTitle}>Income vs Expense Trend</h3>
                    <div className={styles.chartContainer}>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false}/>
                                <XAxis dataKey="name" stroke="#555" tick={{fontSize: 12}} />
                                <YAxis stroke="#555" tick={{fontSize: 12}} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#222', borderColor: '#444', borderRadius: '8px' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Legend verticalAlign="top" height={36}/>
                                
                                <Line 
                                    type="monotone" 
                                    dataKey="Income" 
                                    stroke="#10b981" 
                                    strokeWidth={3}
                                    dot={{r: 4, fill:'#10b981'}}
                                    activeDot={{r: 6}} 
                                />
                                <Line 
                                    type="monotone" 
                                    dataKey="Expense" 
                                    stroke="#ef4444" 
                                    strokeWidth={3} 
                                    dot={{r: 4, fill:'#ef4444'}}
                                    activeDot={{r: 6}}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* RIGHT: RECENT TRANSACTIONS */}
                <div className={styles.card}>
                    <h3 className={styles.cardTitle}>Recent Transactions</h3>
                    <div className={styles.tableContainer}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Details</th>
                                    <th className={styles.textRight}>Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentTx.length === 0 ? (
                                    <tr><td colSpan="3" style={{textAlign:'center', color:'#666', padding:'20px'}}>No data for this period</td></tr>
                                ) : (
                                    recentTx.map((item, idx) => (
                                        <tr key={idx}>
                                            <td style={{color:'#888'}}>
                                                {new Date(item.date).toLocaleDateString(undefined, {month:'short', day:'numeric'})}
                                            </td>
                                            <td>
                                                {item.type === 'INCOME' ? (
                                                    <span>{item.buyerName || 'Sale'} <span style={{fontSize:'0.7em', color:'#666'}}> (Sales)</span></span>
                                                ) : (
                                                    <span>{item.category} <span style={{fontSize:'0.7em', color:'#666'}}> ({item.description?.substring(0,10) || 'Exp'})</span></span>
                                                )}
                                            </td>
                                            <td className={item.type === 'INCOME' ? styles.amountPos : styles.amountNeg}>
                                                {item.type === 'INCOME' ? '+' : '-'} ₹ {(item.grandTotal || item.amount).toLocaleString()}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Dashboard;