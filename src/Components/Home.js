import { useEffect, useState } from 'react';
import '../App.css'
import HereWeGo from './HereWeGo'
import { Link } from 'react-router-dom';
import { ref } from 'firebase/database';
import { db } from '../firebase';

const Home = (props) => {
    const [nearbyLocations, setNearbyLocations] = useState([]);
    console.log('Home received nearby locations:', nearbyLocations);
    const [selectMarker,setSelectMarker] = useState({});
    const user = JSON.parse(sessionStorage.getItem("user"));
    const [tobookspace,setToBookSpace] = useState({});
    const [cost, setCost] = useState(0);
    const [time, setTime] = useState(0);
    const [vehicleNumber, setVehicleNumber] = useState("");


    const handleBook = (e) => {
        const { name, value } = e.target;
        if (name === "time") {
        const parkingTime = parseFloat(value) || 0; // Convert to number, default to 0 if invalid
        setTime(parkingTime);
        setCost(parkingTime * parseInt(tobookspace.Price)); // Calculate total cost
        } else if (name === "vehicleNumber"){
        setVehicleNumber(value);
        }
    };

    const close = (e) => {
        e.preventDefault();
        setCost(0);
        document.getElementById('booking-form').style.display = 'none';
        document.getElementById('background-converter').style.display = 'none';
    }

    function handleSelectedLocation(nearbyLocations){
        setSelectMarker(nearbyLocations);
        console.log("marker details",selectMarker)
    }
    function handleBooking(bookingLocation){
        if(user){
            setToBookSpace(bookingLocation);
            document.getElementById('booking-form').style.display = 'block';
            document.getElementById('background-converter').style.display = 'block';
        }else{
            alert("Login to the website first")
        }
    }
    return(
    <>
        <p className='user'> Welcome! {props.name}</p>
        <div className='hero-section'>
                <div className='hero-information'>
                    <p className="hero-text">Rent your unused parking space and help reduce traffic.</p>
                    <div>
                        <div className='nearby-location'>
                            {nearbyLocations.length > 0 ?(nearbyLocations.map((location,index)=> (
                                <div className='location-container' key={index} onClick={() => handleSelectedLocation(location)}>
                                    <div className='parking-name'><p>{`Parking ${index+1}`}</p></div>
                                    <div className='parking-type'>
                                    {(location?.ParkingType[0] ==='Twowheels') && (<i class="fa-solid fa-motorcycle" style={{color: '#ffffff'}}></i>) }
                                    {(location?.ParkingType[0] === 'FourWheels' || location?.ParkingType[1] ==='FourWheels') && (<i class="fa-solid fa-car" style={{color: '#ffffff'}}></i>) }
                                    {(location?.ParkingType[0] === 'Heavy Vehicle' || location?.ParkingType[1] ==='Heavy Vehicle' || location?.ParkingType[2] ==='Heavy Vehicle') && (<i class="fa-solid fa-truck" style={{color: '#ffffff'}}></i>) }
                                    </div>
                                    <p>{location.Price}/min</p>
                                    <p>Occupied: {location.allocated}/{location.capacity}</p>
                                    <div className='book-button' onClick={()=>handleBooking(location)}>Book</div>
                                </div>
                            ))):(<p style={{marginLeft:'30px',fontFamily:'poppins',color:'white'}}>No Parking at searched location</p>)}
                        </div>
                </div>
            </div>
        <div className='hero-book'>
            <HereWeGo onNearbyLocation={setNearbyLocations}  markerLocation={selectMarker} />
        </div>
        </div>
        <div className='public-banner'>
            <div className='help-span'>
            <span style={{fontFamily:'poppins',fontWeight:'bold',marginLeft:'0px'}}>Help</span><span style={{fontFamily:'poppins',fontWeight:'bold',marginLeft:'5px',color:'#ffd32c'}}>Us</span><span style={{fontFamily:'poppins',fontWeight:'bold',marginLeft:'5px',}}>Get Better!</span>
            <span style={{fontFamily:'poppins',fontWeight:'bold',marginLeft:'10px'}}>Help</span><span style={{fontFamily:'poppins',fontWeight:'bold',marginLeft:'5px',color:'#ffd32c'}}>Yourself</span><span style={{fontFamily:'poppins',fontWeight:'bold',marginLeft:'5px',}}>Get Better</span><span style={{fontFamily:'poppins',fontWeight:'bold',marginLeft:'5px',color:'#1A7499'}}> Space!</span>
            </div>
            <div className='public-help-button'><Link to='/publicspace'>Add Space</Link></div>
        </div>
      <div className='mid-strip'>
        <img src='https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR9cKxiHkSd5yxc3G6Qnu3lgYaAIWdzy-htFA&s' alt='map-image'></img>
        <p>Mapbox</p>
      </div>
      <div className='background-converter' id='background-converter'></div>
      <div className='booking-form' id='booking-form'>
        <p>About Parking</p>
        <p>Price: {tobookspace.Price}/min</p>
        <form className='booking-f'>
            <label>Vehicle Number</label>
            <input type='text' placeholder='Enter your vehicle number' name='vehicleNumber' value={vehicleNumber} onChange={handleBook} required></input>
            <label>For how much time you will park</label>
            <input type='number' placeholder='Time' name='time' value={time} onChange={handleBook} required></input>
            <p>Total Cost: {cost}Rs.</p>
            <div style={{display:'flex',gap:'10px'}}>
                <button style={{backgroundColor:'#ffd32c',color:'black'}}>Book</button>
                <button style={{backgroundColor:'white',color:'black',border:'1px solid black'}} onClick={close}>Cancel</button>
            </div>
        </form>
      </div>
    </>
    );
}
export default Home
