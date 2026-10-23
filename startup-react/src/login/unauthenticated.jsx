import React from 'react';
import { useNavigate } from 'react-router-dom';

import Button from 'react-bootstrap/Button';
import { MessageDialog } from './messageDialog';

export function Unauthenticated(props) {
    const [userName, setUserName] = React.useState(props.userName);
    const [password, setPassword] = React.useState('');
    const [displayError, setDisplayError] = React.useState(null);
    const navigate = useNavigate();

    async function loginUser() {
        localStorage.setItem('userName', userName);
        props.onLogin(userName);
        navigate('/dashboard');
    }

    async function createUser() {
        localStorage.setItem('userName', userName);
        props.onLogin(userName);
        navigate('/dashboard');
    }

    return (
        <>
            <div>
                <div className='input-group mb-3'>
                    <span className='input-group-text'>Username</span>
                    <input className='form-control' type='text' value={userName} onChange={(e) => setUserName(e.target.value)} />
                </div>
                <div className='input-group mb-3'>
                    <span className='input-group-text'>Password</span>
                    <input className='form-control' type='password' value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <Button variant='primary' onClick={() => loginUser()}>
                    Login
                </Button>
                <Button variant='primary' onClick={() => createUser()}>
                    Register
                </Button>
            </div>
        </>
    );
}
