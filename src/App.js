import './App.css';
import AddSpace from './Components/AddSpace';
import MapComponent from './Components/MapComponent';
import HereWeGo from './Components/HereWeGo';
import SignUp from './Components/SignUp';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useEffect, useState } from 'react';
import Home from './Components/Home';

function App() {
  const [sessionUser, setSessionUser] = useState({ uid: null });
  const [actionState, setActionState] = useState(false);
  const [status,seStatus] = useState('Login/Singup')

  useEffect(() => {
    const storedUser = JSON.parse(sessionStorage.getItem("user"));
    if (storedUser) {
      setSessionUser(storedUser);
      setActionState(true)
      seStatus('Logout');
    }
  }, [actionState,status]);


  const handleLogout = (e) => {
    e.preventDefault();
    console.log('logout called');
    if (actionState) {
      sessionStorage.removeItem("user");  
      setSessionUser({ uid: null });
      setActionState(true)
      seStatus('Login/Signup');
      console.log("User logged out");
    }
  };

  console.log(sessionUser)

  return (
    <div style={{ width: '100%' }}>
      <header>
        <p className='logo'>RentPar</p>
        <div className='menu-bar'>
          <a href='/'>Home</a>
          <a href=''>About</a>
          <a href=''>Contact</a>
          <a href='/addSpace'>Add Space</a>
          <a href='/account' onClick={(e) => { if (actionState) {e.preventDefault(); handleLogout(e);}}}><p>{status}</p></a>
        </div>
      </header>
      <Router>
        <Routes>
          <Route path="/addSpace" element={actionState ? <AddSpace /> : <SignUp onSetUser={setSessionUser} />} />
          <Route path="/account" element={<SignUp onSetUser={setSessionUser} />} />
          <Route path="/" element={<Home name={sessionUser && sessionUser.email} />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
