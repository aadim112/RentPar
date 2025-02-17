import { useState } from 'react';
import '../App.css'
import HereWeGo from './HereWeGo'

const Home = (props) => {
    const [nearbyLocations, setNearbyLocations] = useState([]);
    console.log('Home received nearby locations:', nearbyLocations);
    return(
    <>
        <p style={{fontFamily:'poppins',marginLeft:'10px',fontWeight:'bold',fontSize:'25px',marginBottom:'10px',marginTop:'10px'}}> Welcome! {props.name}</p>
        <div className='hero-section'>
                <div className='hero-information'>
                    <p style={{width:'500px',marginLeft:'30px',fontSize:'27px',fontFamily:'poppins',fontWeight:'bold'}}>Rent your unused parking space and help reduce traffic.</p>
                    <div>
                    {/* {nearbyLocations.length > 0 ? (
                        nearbyLocations.map((location, index) => (
                        <p key={index}>{location.name || `Parking Space ${index + 1}`}</p>
                        ))
                    ) : (
                        <p>No nearby parking spaces found.</p>
                    )} */}
                    <div className='nearby-location'>
                        {nearbyLocations.length > 0 ?(nearbyLocations.map((location,index)=> (
                            <div className='location-container' key={index}>
                                <div className='parking-name'><p>{`Parking ${index+1}`}</p></div>
                                <p style={{color:'white',fontFamily:'poppins'}}>{location.Price}/hr</p>
                                <p style={{color:'white',fontFamily:'poppins'}}>Occupied: {location.allocated}/{location.capacity}</p>
                                <div className='book-button'>Book</div>
                            </div>
                        ))):(<p style={{marginLeft:'30px',fontFamily:'poppins',color:'white'}}>No Parking at searched location</p>)}
                    </div>
                </div>
            </div>
        <div className='hero-book'>
            <HereWeGo onNearbyLocation={setNearbyLocations}/>
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