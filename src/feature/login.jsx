import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';

function Login() {
    const [credentials, setCredentials] = useState({
        'email': 'doctor4@lucy.com',
        'password': 'secret123'
    });
    const navigate = useNavigate();
    const { setIsAuthenticated } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await api.auth.login(credentials);
            if (response.accessToken) {
                localStorage.setItem('token', response.accessToken);
                await window.electron.saveToken(response.accessToken);
                setIsAuthenticated(true);
                navigate('/');
            }
          } catch (error) {
            alert(JSON.stringify(error));
          }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="max-w-md w-full space-y-8 p-6 bg-white rounded-lg shadow-md">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <input
                        type="text"
                        placeholder="email"
                        className="w-full px-3 py-2 border rounded-md"
                        value={credentials.email}
                        onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        className="w-full px-3 py-2 border rounded-md"
                        value={credentials.password}
                        onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                    />
                    <button
                        type="submit"
                        className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                        Login
                    </button>
                </form>
            </div>
        </div>
    );
}

export default Login;