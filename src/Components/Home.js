import { useState } from 'react';
import '../App.css'
import HereWeGo from './HereWeGo'
import { Link, useNavigate } from 'react-router-dom'; // Import useNavigate

const Home = (props) => {
    const [nearbyLocations, setNearbyLocations] = useState([]);
    console.log('Home received nearby locations:', nearbyLocations);
    const [selectMarker, setSelectMarker] = useState({});
    const user = JSON.parse(sessionStorage.getItem("user"));
    const [tobookspace, setToBookSpace] = useState({});
    const [cost, setCost] = useState(0);
    const [time, setTime] = useState(0);
    const [startTime, setStartTime] = useState('');
    const [vehicleNumber, setVehicleNumber] = useState("");
    const [vehicleType, setVehicleType] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate(); // Initialize useNavigate

    const handleBook = (e) => {
        const { name, value } = e.target;
        if (name === "time") {
            const parkingTime = parseFloat(value) || 0; // Convert to number, default to 0 if invalid
            setTime(parkingTime);
            setCost(parkingTime * parseInt(tobookspace.Price)); // Calculate total cost
        } else if (name === "vehicleNumber") {
            setVehicleNumber(value);
        } else if (name === "startTime") {
            setStartTime(value);
        } else if (name === "vehicleType") {
            setVehicleType(value);
            setError(""); // Clear any existing errors when vehicle type changes
        }
    };

    // Check if space is available for selected vehicle type
    const isVehicleSpaceAvailable = () => {
        if (!vehicleType || !tobookspace || !tobookspace.vehicleSpaces) {
            return false;
        }
        
        // Get allocated spaces and total capacity for this vehicle type
        const allocated = tobookspace.vehicleSpaces[vehicleType] || 0;
        const capacity = tobookspace.vehicleSpaces[`${vehicleType}Capacity`] || tobookspace.capacity || 0;
        
        return allocated < capacity;
    };

    const BookSpace = async (e) => {
        e.preventDefault();
    
    if (!vehicleType) {
        setError("Please select a vehicle type");
        return;
    }
    
    if (!isVehicleSpaceAvailable()) {
        setError(`No spaces available for ${vehicleType}. Please select another vehicle type.`);
        return;
    }
        
        // Get current date in YYYY-MM-DD format
        const today = new Date().toISOString().split('T')[0];
        // Combine today's date with selected time
        const fullStartDateTime = `${today}T${startTime}`;
        
        // Create booking info object
        const bookingInfo = {
            vehicleNumber: vehicleNumber,
            vehicleType: vehicleType,
            price: cost,
            startTime: fullStartDateTime,
            details: {
                "Vehicle Type": vehicleType,
                "Duration": `${time} minutes`,
                "id": selectMarker.id || "id",
                "Start Time": startTime,
                "Parking Type": tobookspace.ParkingType ? tobookspace.ParkingType[0] : "Standard"
            },
            location: selectMarker.parking || "location",
            otherDetails : selectMarker,
        };
        console.log("Booking Info:", bookingInfo);
        
        // Navigate to PaymentGateway page with state
        navigate('/payment-gateway', { 
            state: { bookingInfo } 
        });
    
    }

    const close = (e) => {
        e.preventDefault();
        setCost(0);
        setStartTime('');
        setVehicleType('');
        setError('');
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
            setVehicleType(''); // Reset vehicle type when opening booking form
            setError(''); // Clear any previous errors
            
            // Set default start time to current time (time only)
            const now = new Date();
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const currentTime = `${hours}:${minutes}`;
            setStartTime(currentTime);
            
            document.getElementById('booking-form').style.display = 'block';
            document.getElementById('background-converter').style.display = 'block';
        }else{
            alert("Login to the website first")
        }
    }

    // Get available vehicle types from the selected parking space
    const getAvailableVehicleTypes = () => {
        if (!tobookspace || !tobookspace.ParkingType) {
            return [];
        }
        return tobookspace.ParkingType;
    };

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
                                    {(location?.ParkingType.includes('Twowheels')) && (<i className="fa-solid fa-motorcycle" style={{color: '#ffffff'}}></i>) }
                                    {(location?.ParkingType.includes('FourWheels')) && (<i className="fa-solid fa-car" style={{color: '#ffffff'}}></i>) }
                                    {(location?.ParkingType.includes('Heavy Vehicle')) && (<i className="fa-solid fa-truck" style={{color: '#ffffff'}}></i>) }
                                    {(location?.ParkingType.includes('ThreeWheels')) && (<i className="fa-solid fa-rickshaw" style={{color: '#ffffff'}}></i>) }
                                    </div>
                                    <p>{location.Price}/min</p>
                                    <p>Occupied: {location.vehicleSpaces ? `${location.vehicleSpaces.FourWheels || 0}/${location.vehicleSpaces.FourWheelsCapacity || location.capacity} cars` : `${location.allocated}/${location.capacity}`}</p>
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
            
            <label>Vehicle Type</label>
            <select 
    name='vehicleType' 
    value={vehicleType} 
    onChange={handleBook} 
    required
    style={{padding: '8px', marginBottom: '10px', width: '80%',borderRadius:'8px'}}
>
    <option value="">Select Vehicle Type</option>
    {getAvailableVehicleTypes().map((type, index) => {
        const allocated = tobookspace.vehicleSpaces?.[type] || 0;
        const capacity = tobookspace.vehicleSpaces?.[`${type}Capacity`] || tobookspace.capacity || 0;
        const isFull = allocated >= capacity;
        
        return (
            <option key={index} value={type} disabled={isFull}>
                {type} ({allocated}/{capacity}) {isFull ? '(Full)' : ''}
            </option>
        );
    })}
</select>
            {error && <p style={{color: 'red', fontSize: '14px', margin: '5px 0'}}>{error}</p>}
            
            <label>Start Time</label>
            <input 
                type='time' 
                name='startTime' 
                value={startTime} 
                onChange={handleBook} 
                required
            ></input>
            
            <label>Parking Duration (minutes)</label>
            <input type='number' placeholder='Time in minutes' name='time' value={time} onChange={handleBook} required></input>
            
            <p>Total Cost: {cost}Rs.</p>
            <div style={{display:'flex',gap:'10px'}}>
                <button style={{backgroundColor:'#ffd32c',color:'black'}} onClick={BookSpace}>Book</button>
                <button style={{backgroundColor:'white',color:'black',border:'1px solid black'}} onClick={close}>Cancel</button>
            </div>
        </form>
      </div>
    </>
    );
}
export default Home