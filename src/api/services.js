import api from './axiosConfig';

export const EstateService = {
    getAll: () => api.get('/estates/getAll'),
    create: (data) => api.post('/estates/create', data),
};

export const WorkerService = {
    // Get workers for a specific estate
    getByEstate: (estateId) => api.get(`/workers/${estateId}`),
    
    // Create new worker
    create: (data) => api.post('/workers', data),
    
    // Pay worker
    pay: (data) => api.post('/workers/pay', data),
};

// Placeholder for future Expense/Sales services
export const ReportService = {
    getMonthly: () => api.get('/reports/monthly'), // We will build this backend route later
};

export const ExpenseService = {
    // Generic Expense (Fertilizer, Tools)
    create: (data) => api.post('/expenses/create', data),
    
    // The "Tracker" Report Call
    getReport: (params) => api.get('/expenses/report', { params }), // params: { estates, from, to }
};

export const SaleService = {
    create: (data) => api.post('/sales', data),
    getReport: (params) => api.get('/sales/report', { params }),
};