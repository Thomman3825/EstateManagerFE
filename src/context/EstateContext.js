import React, { createContext, useState, useContext, useEffect } from 'react';

const EstateContext = createContext();

export const EstateProvider = ({ children }) => {
    // Try to load last selected estate from LocalStorage so it persists on refresh
    const [selectedEstate, setSelectedEstate] = useState(() => {
        const saved = localStorage.getItem('selectedEstate');
        return saved ? JSON.parse(saved) : null;
    });

    const switchEstate = (estate) => {
        setSelectedEstate(estate);
        localStorage.setItem('selectedEstate', JSON.stringify(estate));
    };

    return (
        <EstateContext.Provider value={{ selectedEstate, switchEstate }}>
            {children}
        </EstateContext.Provider>
    );
};

export const useEstate = () => useContext(EstateContext);