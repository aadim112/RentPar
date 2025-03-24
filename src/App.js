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


function App(){
  
  const [sessionUser, setSessionUser] = useState({ uid: null });
  const [actionState, setActionState] = useState(false);
  const [status,seStatus] = useState('Login')

  useEffect(() => {
    const storedUser = JSON.parse(sessionStorage.getItem("user"));
    if(storedUser && storedUser.uid) {
      setSessionUser(storedUser);
      setActionState(true)
      seStatus('Logout');
      console.log(sessionUser);
    }
  }, [actionState,status]);


  const handleLogout = (e) => {
    e.preventDefault();
    console.log('logout called');
    if (actionState) {
      sessionStorage.removeItem("user");  
      setSessionUser({ uid: null });
      setActionState(false);
      seStatus('Login');
      console.log("User logged out");
    }
  };

  const controlmenu = () => {
    document.querySelector('#header').classList.toggle('headeractive');
    document.querySelector('#menu-bar').classList.toggle('menuactive');
    document.querySelector('#drop-down').classList.toggle('droprotate');
  }


  return (
    <div style={{ width: '100%' }}>
      <header id='header'>
        <div className='logo-bar'>
          <img src={svglogo}></img>
          <p className='logo'>Parkhere.</p>
        </div>
        <div className='menu-bar' id='menu-bar'>
          <Link to='/'>Home</Link>
          <Link to=''>Contact</Link>
          <Link to='/OrganisationParking'>Underoof Space</Link>
          <Link to='/addSpace'>Add Space</Link>
          {actionState && <Link to='/profile'>Profile</Link>}
          <Link to='/account' onClick={(e) => { if (actionState) {e.preventDefault(); handleLogout(e);}}}><p className='login-button'>{status}</p></Link>
        </div>
        <div className='drop-down' id='drop-down' onClick={controlmenu}>
        <i class="fa-solid fa-caret-down fa-lg" style={{color: "#ffffff"}}></i>
        </div>
      </header>
        <Routes>
          <Route path="/addSpace" element={actionState ? <AddSpace user={sessionUser.uid} /> : <SignUp onSetUser={setSessionUser} />} />
          <Route path="/account" element={<SignUp onSetUser={setSessionUser} />} />
          <Route path="/" element={<Home name={sessionUser && sessionUser.email} />} />
          <Route path='/publicspace' element={<PublicSpace/>}></Route>
          <Route path='/profile' element={actionState? <Profile user={sessionUser}/> :  <SignUp onSetUser={setSessionUser} /> }></Route>
          <Route path='/OrganisationParking' element={<OrganisationalParking/>}></Route>
        </Routes>
      <footer>
        <p>The Website is held to copyright.</p>
      </footer>
    </div>
  );
}

export default App;
