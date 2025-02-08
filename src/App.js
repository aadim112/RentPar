import './App.css';
import AddSpace from './Components/AddSpace';
import MapComponent from './Components/MapComponent';

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
            <MapComponent />
        </div>
      </div>
      <AddSpace/>
    </>
  );
}

export default App;
