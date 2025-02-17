import { useEffect, useState } from 'react';
import '../App.css'
import HereWeGo from './HereWeGo'
const Home = (props) => {
    const [nearbyLocations, setNearbyLocations] = useState([]);
    console.log('Home received nearby locations:', nearbyLocations);
    const [selectMarker,setSelectMarker] = useState({});
    const user = JSON.parse(sessionStorage.getItem("user"));


    function handleSelectedLocation(nearbyLocations){
        setSelectMarker(nearbyLocations);
        console.log("marker details",selectMarker)
    }
    function handleBooking(bookingLocation){
        if(user){
            alert("You booked the location for: "+bookingLocation.Price+' for 1hr');
        }else{
            alert("Login to the website first")
        }
    }
    return(
    <>
        <p style={{fontFamily:'poppins',marginLeft:'10px',fontWeight:'bold',fontSize:'25px',marginBottom:'10px',marginTop:'10px'}}> Welcome! {props.name}</p>
        <div className='hero-section'>
                <div className='hero-information'>
                    <p style={{width:'500px',marginLeft:'30px',fontSize:'27px',fontFamily:'poppins',fontWeight:'bold'}}>Rent your unused parking space and help reduce traffic.</p>
                    <div>
                        <div className='nearby-location'>
                            {nearbyLocations.length > 0 ?(nearbyLocations.map((location,index)=> (
                                <div className='location-container' key={index} onClick={() => handleSelectedLocation(location)}>
                                    <div className='parking-name'><p>{`Parking ${index+1}`}</p></div>
                                    <div className='parking-type'></div>
                                    {(location?.ParkingType[0] ==='Twowheels') && (<i class="fa-solid fa-motorcycle" style={{color: '#ffffff'}}></i>) }
                                    {(location?.ParkingType[0] === 'FourWheels' || location?.ParkingType[1] ==='FourWheels') && (<i class="fa-solid fa-car" style={{color: '#ffffff'}}></i>) }
                                    {(location?.ParkingType[0] === 'Heavy Vehicle' || location?.ParkingType[1] ==='Heavy Vehicle' || location?.ParkingType[2] ==='Heavy Vehicle') && (<i class="fa-solid fa-truck" style={{color: '#ffffff'}}></i>) }
                                    <p style={{color:'white',fontFamily:'poppins'}}>{location.Price}/hr</p>
                                    <p style={{color:'white',fontFamily:'poppins'}}>Occupied: {location.allocated}/{location.capacity}</p>
                                    <div className='book-button' onClick={()=>handleBooking(location)}>Book</div>
                                </div>
                            ))):(<p style={{marginLeft:'30px',fontFamily:'poppins',color:'white'}}>No Parking at searched location</p>)}
                        </div>
                </div>
            </div>
        <div className='hero-book'>
            <HereWeGo onNearbyLocation={setNearbyLocations} markerLocation={selectMarker} />
        </div>
        </div>
        <div className='public-banner'>
            <div>
            <span style={{fontFamily:'poppins',fontWeight:'bold',marginLeft:'0px',fontSize:'30px'}}>Help</span><span style={{fontFamily:'poppins',fontWeight:'bold',marginLeft:'5px',fontSize:'30px',color:'#ffd32c'}}>Us</span><span style={{fontFamily:'poppins',fontWeight:'bold',marginLeft:'5px',fontSize:'30px'}}>Get Better!</span>
            <span style={{fontFamily:'poppins',fontWeight:'bold',marginLeft:'10px',fontSize:'30px'}}>Help</span><span style={{fontFamily:'poppins',fontWeight:'bold',marginLeft:'5px',fontSize:'30px',color:'#ffd32c'}}>Yourself</span><span style={{fontFamily:'poppins',fontWeight:'bold',marginLeft:'5px',fontSize:'30px'}}>Get Better</span><span style={{fontFamily:'poppins',fontWeight:'bold',marginLeft:'5px',fontSize:'30px',color:'#1A7499'}}> Space!</span>
            </div>
            <div className='public-help-button'><a href='/publicspace'>Add Space</a></div>
        </div>
      <div className='mid-strip'>
        <img src='https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR9cKxiHkSd5yxc3G6Qnu3lgYaAIWdzy-htFA&s' alt='map-image'></img>
        <p>Mapbox</p>
      </div>
    </>
    );
}
export default Home