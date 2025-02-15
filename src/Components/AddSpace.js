import { useState,useEffect  } from 'react';
import '../App.css'
import { db } from '../firebase';
import MapComponent from './MapComponent';
import { onValue,ref,getDatabase,set } from 'firebase/database';
import { v4 as uuidv4 } from "uuid"; // Generate unique IDs


function AddSpace(){

  const [Lcn,setSetLocation] = useState({lat:0,lng:0})
  const [data,setData] = useState({})
  const [decoration, setDecoration] = useState({ display: "none",color:'red',fontWeight:'bold' });
  const [warning, setWaring] = useState({ display: "none" });
  const [spacedetails, setSpaceDetails] = useState({
    fullname: "",
    age: 0,
    parking: { lat: "", lng: "" },
    SpaceBelonging: "",
    ParkingType: [],
    capacity: 1,
    Price: 0,
    AccountNumber: 0,
    IFSC: "",
    image: null, // Store uploaded image
    allocated : 0
  });

    // Sync Lcn with spacedetails.parking when Lcn changes
    useEffect(() => {
      setSpaceDetails((prev) => ({
        ...prev,
        parking: { lat: Lcn.lat, lng: Lcn.lng },
      }));
    }, [Lcn]);

  const Validite = () => {
    const IfscInput = document.getElementById('ifsc-input');
    if( IfscInput.value.length === 11){
      fetch(`https://ifsc.razorpay.com/${IfscInput.value}`)
      .then(response => response.json())
      .then(data => {
      console.log(data)
        setData(data); // Set bank data
        setDecoration({ display: "block" });
        setWaring({display: "none",color:'red',fontWeight:'bold'});
      }).catch(error => console.error("Error fetching data:", error));
    }else{
      setWaring({display: "block",color:'red',fontWeight:'bold'});
    }
  };
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (type === "checkbox") {
      setSpaceDetails((prevDetail) => ({
        ...prevDetail,
        ParkingType: checked
          ? [...prevDetail.ParkingType, name]
          : prevDetail.ParkingType.filter((item) => item !== name),
      }));
    } else if (name === "parking") {
      console.log("parking changed");
      const [lat, lng] = value.split(",").map((coord) => parseFloat(coord.trim())); // Convert string to numbers
      if (!isNaN(lat) && !isNaN(lng)) {
        setSpaceDetails((prevDetail) => ({
          ...prevDetail,
          parking: { lat, lng },
        }));
      }
    } else {
      setSpaceDetails((prevDetail) => ({
        ...prevDetail,
        [name]: value,
      }));
    }
  };


  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSpaceDetails((prevDetails) => ({
        ...prevDetails,
        image: file, // Store file in state
      }));
    }
  };

 // Submit form and save data to Firebase Realtime Database
 const UploadSpace = (event) => {
  event.preventDefault();

  const db = getDatabase();
  const spaceId = uuidv4(); // Unique ID for each entry
  const imageName = spacedetails.image ? `${spaceId}-${spacedetails.image.name}` : "";

  const newSpaceDetails = {
    ...spacedetails,
    image: imageName, // Save image name only
  };

  set(ref(db, `parkingSpaces/${spaceId}`), newSpaceDetails)
    .then(() => alert("Parking space added successfully!"))
    .catch((error) => console.error("Error saving data:", error));

  console.log("Save image manually as:", `/src/assets/${imageName}`);
};

  return (
    <>
      <div className='add-space-container'>
        <div style={{width:'100%',height:'20px'}}></div>
        <p style={{marginLeft:'30px',fontFamily:'poppins',fontSize:'25px',fontWeight:'bolder'}}>Add Your Parking Space</p>
        <form className='add-space-form'>
            <label>Full Name</label>
            <input type='text' placeholder='Full Name*' name='fullname' onChange={handleChange}></input>
            <label>Age*</label>
            <input type='number' placeholder='Age*' name='age' onChange={handleChange}></input>
             <label>Add parking Location(stay near the parking location to ge the location)</label>
            <input type='text' placeholder='Parking Location' name='parking' value={`${spacedetails.parking.lat}, ${spacedetails.parking.lng}`}></input>
            <div className='park-space-search'>
              <MapComponent onSetLocation={setSetLocation} />
            </div>
            <span style={{marginTop:'20px'}}>
                <label style={{fontWeight:'bolder'}}>Do you own this space?</label>
                <span>
                    <label style={{marginLeft:'10px',fontWeight:'400'}}><input type='radio' name='space' onChange={handleChange} required></input>No</label>
                    <label style={{marginLeft:'10px',fontWeight:'400'}}><input type='radio' name='space' onChange={handleChange} required></input>Yes</label>
                </span>
            </span>
            <label style={{marginTop:'20px',fontWeight:'bold'}}>Upload Image</label>

            <input type="file" id="file-upload" className="file-input" onChange={handleImageUpload} />
            <label htmlFor="file-upload" className="custom-file-label" style={{marginTop:'10px'}}>Upload Parking Space Image</label>

            <span style={{marginTop:'20px'}}>
              <label style={{fontFamily:'poppins',fontWeight:'bold'}}>Type Of Parking</label>
              <div className='space-type'>
              <input type="checkbox" className="btn-check" id="btn-check-2w" autoComplete="off" name='Twowheels' onChange={handleChange} />
              <label className="btn btn-primary" htmlFor="btn-check-2w">Two Wheeler</label>

              <input type="checkbox" className="btn-check" id="btn-check-3w" autoComplete="off" name='ThreeWheels' onChange={handleChange}  />
              <label className="btn btn-primary" htmlFor="btn-check-3w">Three Wheeler</label>

              <input type="checkbox" className="btn-check" id="btn-check-4w" autoComplete="off" name='FourWheels' onChange={handleChange}  />
              <label className="btn btn-primary" htmlFor="btn-check-4w">Four Wheeler</label>

              <input type="checkbox" className="btn-check" id="btn-check-hv" autoComplete="off" name='Heavy Vehicle' onChange={handleChange}  />
              <label className="btn btn-primary" htmlFor="btn-check-hv">Heavy Vehicle</label>
              </div>
            </span>
              <label style={{marginTop:'30px'}}>Capacity OF Parking Space</label>
              <input type='number' placeholder='Capacity of Space' name='capacity' onChange={handleChange} required></input>

              <label>Rent Per Slot</label>
              <input type='number' placeholder='Rent Per Slot' name='Price' onChange={handleChange} required></input>

              <label>Add Your Banking Details</label>
              <span>
                <input type='number' placeholder='Accound Number' name='AccountNumber' onChange={handleChange}></input>
                <input type='text' placeholder='IFSC Code' id='ifsc-input' style={{marginLeft:'10px'}} name='IFSC' onChange={handleChange}></input>
                <input type='button' value={'Check'} style={{marginLeft:'10px',width:'100px'}} onClick={Validite}></input>
              </span>
              <span id='bank-details' style={decoration} className='bank-details'>
                <label>Bank Name: {data.BANK}</label>
              </span>
              <label style={warning}>Enter Correct IFSC Code or Account Number</label>
              <label><input type='checkbox' checked></input>I agree to the policies offer by the website</label>
              <button type='submit' onClick={UploadSpace}  className='upload'>Register Place</button>
        </form>
      </div>
    </>
  )
}

export default AddSpace