import React, { useEffect, useState } from 'react';
import { EstateService } from '../api/services';
import { useEstate } from '../context/EstateContext';
import { useNavigate } from 'react-router-dom';

const EstateSelector = () => {
    const [estates, setEstates] = useState([]);
    const { switchEstate } = useEstate();
    const navigate = useNavigate();

    useEffect(() => {
        // Fetch estates from backend on load
        EstateService.getAll().then(res => setEstates(res.data));
    }, []);

    const handleSelect = (estate) => {
        switchEstate(estate);
        navigate('/dashboard'); // Go to dashboard after selecting
    };

    return (
        <div style={{ padding: '2rem' }}>
            <h2>Select Your Estate</h2>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                {estates.map(estate => (
                    <div 
                        key={estate._id} 
                        onClick={() => handleSelect(estate)}
                        style={{ border: '1px solid #ccc', padding: '1rem', cursor: 'pointer' }}
                    >
                        <h3>{estate.name}</h3>
                        <p>{estate.location}</p>
                    </div>
                ))}
            </div>
            {/* Simple Form to Add New Estate */}
            <button onClick={async () => {
                const name = prompt("Enter New Estate Name:");
                if(name) {
                    await EstateService.create({ name, location: 'Kerala' });
                    window.location.reload();
                }
            }}>+ Create New Estate</button>
        </div>
    );
};

export default EstateSelector;