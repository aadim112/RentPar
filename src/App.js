import './App.css';
import AddSpace from './Components/AddSpace';
import MapComponent from './Components/MapComponent';
import HereWeGo from './Components/HereWeGo';
import SignUp from './Components/SignUp';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useState } from 'react';

function App() {
  const [sessionUser,setSessionUser] = useState({})
  return (
    <div style={{width:'100%'}}>
      <Router>
            <Routes>
                <Route path="/addSpace" element={<AddSpace />} />
                <Route path="/account" element={<SignUp />} />
            </Routes>
        </Router>
      <header>
        <p className='logo'>RentPar</p>
        <div className='menu-bar'>
          <a href='/'>Home</a>
          <a href=''>About</a>
          <a href=''>Contact</a>
          <a href='/addSpace'>Add Space</a>
          <a href='/account'>Login/Signup</a>
        </div>
      </header>
      <SignUp/>
      <div className='hero-section'>
        <div className='hero-information'>
          <p>Rent your unused parking space and help reduce traffic.</p>
        </div>
        <div className='hero-book'>
            <HereWeGo/>
        </div>
      </div>
      <div className='mid-strip'>
        <img src='https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR9cKxiHkSd5yxc3G6Qnu3lgYaAIWdzy-htFA&s'></img>
        <p>Mapbox</p>
      </div>
    </div>
  );
}

export default App;
