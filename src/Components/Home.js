import { useState } from 'react';
import '../App.css'
import HereWeGo from './HereWeGo'

const Home = (props) => {
    const [parkingData,setparkingData] = useState([]);
    console.log(parkingData)
    return(
    <>
        <p style={{fontFamily:'poppins',marginLeft:'10px',fontWeight:'bold',fontSize:'25px',marginBottom:'10px',marginTop:'10px'}}> Welcome! {props.name}</p>
        <div className='hero-section'>
            <div className='hero-information'>
                <p>Rent your unused parking space and help reduce traffic.</p>
            </div>
        <div className='hero-book'>
            <HereWeGo allSpaces={parkingData}/>
        </div>
        </div>
      <div className='mid-strip'>
        <img src='https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR9cKxiHkSd5yxc3G6Qnu3lgYaAIWdzy-htFA&s'></img>
        <p>Mapbox</p>
      </div>
    </>
    );
}
export default Home