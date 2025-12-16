import React, { useState } from 'react';
import { AuthService } from '../api/services';
import { useNavigate } from 'react-router-dom';
import styles from '../styles/Auth.module.css';
import { useAuth } from '../context/AuthContext';

const Auth = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({ name: '', email: '', password: '' });
    const navigate = useNavigate();

    const {login} = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = isLogin 
                ? await AuthService.login({ email: formData.email, password: formData.password })
                : await AuthService.register(formData);
            
            // Store Token
            login(res.data.token, res.data.user);
            console.log("Redirecting after login")
            // Redirect to Estate Selector (Home)
            navigate('/'); 
        } catch (err) {
            alert(err.response?.data?.msg || 'Authentication failed');
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
                    
                    <button type="submit" className={styles.submitBtn}>
                        {isLogin ? 'Sign In' : 'Sign Up'}
                    </button>
                </form>

                <p onClick={() => setIsLogin(!isLogin)} className={styles.toggleText}>
                    {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Login"}
                </p>
            </div>
        </div>
    );
};

export default Auth;