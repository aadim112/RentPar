import './App.css';
import AddSpace from './Components/AddSpace';
import MapComponent from './Components/MapComponent';
import HereWeGo from './Components/HereWeGo';
import SignUp from './Components/SignUp';
import { HashRouter as Router, Route, Routes,Link } from "react-router-dom";
import { useEffect, useState } from 'react';
import Home from './Components/Home';
import PublicSpace from './Components/PublicSpace';

function App() {

  
  const [sessionUser, setSessionUser] = useState({ uid: null });
  const [actionState, setActionState] = useState(false);
  const [status,seStatus] = useState('Login')

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


  return (
    <div style={{ width: '100%' }}>
      <header>
        <p className='logo'>RentPar</p>
        <div className='menu-bar'>
          <Link to='/'>Home</Link>
          <Link to=''>Contact</Link>
          <Link to='/publicspace'>Underoof Space</Link>
          <Link to='/addSpace'>Add Space</Link>
          <Link to='/account' onClick={(e) => { if (actionState) {e.preventDefault(); handleLogout(e);}}}><p className='login-button'>{status}</p></Link>
        </div>
      </header>
        <Routes>
          <Route path="/addSpace" element={actionState ? <AddSpace /> : <SignUp onSetUser={setSessionUser} />} />
          <Route path="/account" element={<SignUp onSetUser={setSessionUser} />} />
          <Route path="/" element={<Home name={sessionUser && sessionUser.email} />} />
          <Route path='/publicspace' element={<PublicSpace/>}></Route>
        </Routes>
      <footer>
        <p>The Website is held to copyright.</p>
      </footer>
    </div>
  );
}

export default App;
