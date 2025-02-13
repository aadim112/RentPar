import './App.css';
import AddSpace from './Components/AddSpace';
import MapComponent from './Components/MapComponent';
import HereWeGo from './Components/HereWeGo';

function App() {
  return (
    <>
      <header>
        <p className='logo'>RentPar</p>
        <div className='menu-bar'>
          <a href=''>Home</a>
          <a href=''>About</a>
          <a href=''>Contact</a>
          <a href=''>Add Space</a>
        </div>
      </header>
      <div className='hero-section'>
        <div className='hero-information'>
          <p>Rent your unused parking space and help reduce traffic.</p>
        </div>
        <div className='hero-book'>
            <HereWeGo />
        </div>
      </div>
      <div className='mid-strip'>
        <img src='https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR9cKxiHkSd5yxc3G6Qnu3lgYaAIWdzy-htFA&s'></img>
        <p>Mapbox</p>
      </div>
      <AddSpace/>
    </>
  );
}

export default App;
