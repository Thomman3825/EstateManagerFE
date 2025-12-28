import React, { useState } from 'react';
import { AuthService } from '../api/services';
import { useNavigate } from 'react-router-dom';
import styles from '../styles/Auth.module.css';
import { useAuth } from '../context/AuthContext';

const Auth = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false); // 1. Add loading state
    const [formData, setFormData] = useState({ name: '', email: '', password: '' });
    const navigate = useNavigate();

    const { login } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true); // 2. Start loading

        try {
            const res = isLogin 
                ? await AuthService.login({ email: formData.email, password: formData.password })
                : await AuthService.register(formData);
            
            login(res.data.token, res.data.user);
            console.log("Redirecting after login");
            navigate('/'); 
        } catch (err) {
            alert(err.response?.data?.msg || 'Authentication failed');
            setLoading(false); // 3. Stop loading only on error (if success, we redirect anyway)
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <h2 className={styles.title}>
                    {isLogin ? 'Welcome Back' : 'Create Account'}
                </h2>
                
                <form onSubmit={handleSubmit} className={styles.form}>
                    {!isLogin && (
                        <input 
                            className={styles.input}
                            placeholder="Full Name" 
                            value={formData.name} 
                            onChange={e => setFormData({...formData, name: e.target.value})} 
                            required 
                        />
                    )}
                    
                    <input 
                        className={styles.input}
                        type="email" 
                        placeholder="Email Address" 
                        value={formData.email} 
                        onChange={e => setFormData({...formData, email: e.target.value})} 
                        required 
                    />
                    
                    <input 
                        className={styles.input}
                        type="password" 
                        placeholder="Password" 
                        value={formData.password} 
                        onChange={e => setFormData({...formData, password: e.target.value})} 
                        required 
                    />
                    
                    {/* 4. Update Button Logic */}
                    <button 
                        type="submit" 
                        className={styles.submitBtn} 
                        disabled={loading} // Disable button while loading
                    >
                        {loading ? (
                            <span className={styles.loader}></span> 
                        ) : (
                            isLogin ? 'Sign In' : 'Sign Up'
                        )}
                    </button>
                </form>

                <p onClick={() => !loading && setIsLogin(!isLogin)} className={styles.toggleText}>
                    {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Login"}
                </p>
            </div>
        </div>
    );
};

export default Auth;