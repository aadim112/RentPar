import './App.css';
import AddSpace from './Components/AddSpace';
import MapComponent from './Components/MapComponent';
import HereWeGo from './Components/HereWeGo';
import SignUp from './Components/SignUp';
import { useEffect, useState } from 'react';
import Home from './Components/Home';
import PublicSpace from './Components/PublicSpace';
import Profile from './Components/Profile';
import { HashRouter as Router, Route, Routes,Link } from "react-router-dom";
import logo from './Assets/park white.png'
import svglogo from './Assets/park.svg'
import OrganisationalParking from './Components/OrganisationalParking';
import PaymentGateway from './Components/PaymentGateway';


function App() {
  const [sessionUser, setSessionUser] = useState({ uid: null });
  const [actionState, setActionState] = useState(false);
  const [status, setStatus] = useState('Login');

  // Check for user on initial load and whenever sessionStorage changes
  useEffect(() => {
    const checkUserSession = () => {
      const storedUser = JSON.parse(sessionStorage.getItem("user"));
      if (storedUser && storedUser.uid) {
        setSessionUser(storedUser);
        setActionState(true);
        setStatus('Logout');
      } else {
        setSessionUser({ uid: null });
        setActionState(false);
        setStatus('Login');
      }
    };

    // Run immediately on component mount
    checkUserSession();

    // Set up a storage event listener to detect changes in sessionStorage
    window.addEventListener('storage', checkUserSession);
    
    return () => {
      window.removeEventListener('storage', checkUserSession);
    };
  }, []);

  const handleLogout = (e) => {
    e.preventDefault();
    sessionStorage.removeItem("user");
    setSessionUser({ uid: null });
    setActionState(false);
    setStatus('Login');
  };

  // Update setSessionUser to also update actionState and status
  const handleSetUser = (user) => {
    setSessionUser(user);
    if (user && user.uid) {
      setActionState(true);
      setStatus('Logout');
    }
  };

  const controlmenu = () => {
    document.querySelector('#header').classList.toggle('headeractive');
    document.querySelector('#menu-bar').classList.toggle('menuactive');
    document.querySelector('#drop-down').classList.toggle('droprotate');
  };

  return (
    <div style={{ width: '100%' }}>
      <header id='header'>
        <div className='logo-bar'>
          <img src={svglogo} alt="Park logo"></img>
          <p className='logo'>Parkhere.</p>
        </div>
        <div className='menu-bar' id='menu-bar'>
          <Link to='/'>Home</Link>
          <Link to=''>Contact</Link>
          <Link to='/OrganisationParking'>Underoof Space</Link>
          {actionState && <Link to='/addSpace'>Add Space</Link>}
          {actionState && <Link to='/profile'>Profile</Link>}
          <Link to='/account' onClick={(e) => { if (actionState) {e.preventDefault(); handleLogout(e);}}}><p className='login-button'>{status}</p></Link>
        </div>
        <div className='drop-down' id='drop-down' onClick={controlmenu}>
          <i className="fa-solid fa-caret-down fa-lg" style={{color: "#ffffff"}}></i>
        </div>
      </header>
      <Routes>
        <Route path="/addSpace" element={actionState ? <AddSpace user={sessionUser.uid} /> : <SignUp onSetUser={handleSetUser} />} />
        <Route path="/account" element={<SignUp onSetUser={handleSetUser} />} />
        <Route path="/" element={<Home name={sessionUser && sessionUser.email} />} />
        <Route path='/publicspace' element={<PublicSpace/>}></Route>
        <Route path='/profile' element={actionState ? <Profile user={sessionUser}/> : <SignUp onSetUser={handleSetUser} />}></Route>
        <Route path='/OrganisationParking' element={<OrganisationalParking/>}></Route>
        <Route path='/payment-gateway' element={<PaymentGateway/>}></Route>
      </Routes>
      <footer>
        <p>The Website is held to copyright.</p>
      </footer>
    </div>
  );
}

export default App;
