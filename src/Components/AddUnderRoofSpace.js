import { useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { ref, set, push, get, child } from 'firebase/database';
import '../App.css';

const AddUnderRoofSpace = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const orgName = state?.orgName;
  const [orgId, setOrgId] = useState(null);
  const [orgDetails, setOrgDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formVisible, setFormVisible] = useState(false);
  const [parkingSpaces, setParkingSpaces] = useState([]);
  const [bookings, setBookings] = useState({});
  
  // Form state
  const [formData, setFormData] = useState({
    location: '',
    coordinates: { lat: '', lng: '' },
    capacity: '',
    vehicleTypes: [
      { type: 'Car', price: '' },
      { type: 'Motorcycle', price: '' },
      { type: 'Truck', price: '' }
    ],
    termsAndConditions: '',
    parkedVehicles: []
  });

  // Fetch organization details
  useEffect(() => {
    const fetchOrgDetails = async () => {
      if (!orgName) {
        setLoading(false);
        return;
      }
      
      try {
        // First get all organization IDs
        const orgsRef = ref(db, 'organization');
        const orgsSnapshot = await get(orgsRef);
        
        if (orgsSnapshot.exists()) {
          let foundOrgId = null;
          let foundOrgDetails = null;
          
          // Loop through each organization to find the one with matching name
          const organizations = orgsSnapshot.val();
          for (const [id, orgData] of Object.entries(organizations)) {
            // Check if this organization has the name we're looking for
            if (orgData.name === orgName) {
              foundOrgId = id;
              foundOrgDetails = {
                id: id,
                ...orgData
              };
              break;
            }
          }
          
          if (foundOrgId) {
            setOrgId(foundOrgId);
            setOrgDetails(foundOrgDetails);
            
            // Fetch existing parking spaces for this organization
            fetchParkingSpaces(foundOrgId);
          }
        }
      } catch (error) {
        console.error("Error fetching organization:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrgDetails();
  }, [orgName]);

  // Fetch parking spaces
  const fetchParkingSpaces = async (organizationId) => {
    try {
      const parkingRef = ref(db, 'underRoofParking');
      const parkingSnapshot = await get(parkingRef);
      
      const spaces = [];
      if (parkingSnapshot.exists()) {
        const allSpaces = parkingSnapshot.val();
        
        // Filter spaces that belong to this organization
        for (const [id, spaceData] of Object.entries(allSpaces)) {
          if (spaceData.orgId === organizationId) {
            spaces.push({ 
              id, 
              ...spaceData 
            });
          }
        }
      }
      
      setParkingSpaces(spaces);
      
      // Fetch booking counts for each parking space
      spaces.forEach(space => {
        fetchBookingCount(space.id);
      });
      
    } catch (error) {
      console.error("Error fetching parking spaces:", error);
    }
  };
  
  // Fetch booking count for a specific parking space
  const fetchBookingCount = async (parkingId) => {
    try {
      const bookingsRef = ref(db, 'bookings');
      const bookingsSnapshot = await get(bookingsRef);
      
      let count = 0;
      if (bookingsSnapshot.exists()) {
        const allBookings = bookingsSnapshot.val();
        
        // Count bookings for this specific parking space
        for (const bookingData of Object.values(allBookings)) {
          if (bookingData.parkingId === parkingId) {
            count++;
          }
        }
      }
      
      setBookings(prev => ({
        ...prev,
        [parkingId]: count
      }));
      
    } catch (error) {
      console.error("Error fetching bookings:", error);
    }
  };
  
  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle coordinate changes
  const handleCoordinateChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      coordinates: {
        ...prev.coordinates,
        [name]: value
      }
    }));
  };
  
  // Handle vehicle type price changes
  const handleVehicleTypeChange = (index, e) => {
    const { value } = e.target;
    const updated = [...formData.vehicleTypes];
    updated[index] = { ...updated[index], price: value };
    
    setFormData(prev => ({
      ...prev,
      vehicleTypes: updated
    }));
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!orgId) {
      alert("Organization details not found");
      return;
    }
    
    try {
      const parkingData = {
        ...formData,
        orgId: orgId,
        orgName: orgName,
        createdAt: new Date().toISOString(),
      };
      
      // Create a reference to the 'underRoofParking' node in the database
      const parkingListRef = ref(db, 'underRoofParking');
      
      // Push a new entry with a generated unique key
      const newParkingRef = push(parkingListRef);
      
      // Set the data for the new entry
      await set(newParkingRef, parkingData);
      
      alert("Parking space added successfully!");
      
      // Reset form and fetch updated list
      setFormData({
        location: '',
        coordinates: { lat: '', lng: '' },
        capacity: '',
        vehicleTypes: [
          { type: 'Car', price: '' },
          { type: 'Motorcycle', price: '' },
          { type: 'Truck', price: '' }
        ],
        termsAndConditions: '',
        parkedVehicles: []
      });
      
      setFormVisible(false);
      fetchParkingSpaces(orgId);
      
    } catch (error) {
      console.error("Error adding parking space:", error);
      alert("Failed to add parking space. Please try again.");
    }
  };

  if (loading) {
    return <div>Loading organization details...</div>;
  }

  if (!orgDetails) {
    return <div>Organization not found. Please go back and try again.</div>;
  }

  return (
    <div className='UnderRoof-container'>
      <h2>Parking Management for {orgName}</h2>
      <div className="org-details">
        <h3>Organization Details</h3>
        <p><strong>Name:</strong> {orgDetails.name}</p>
        {orgDetails.address && <p><strong>Address:</strong> {orgDetails.address}</p>}
        {orgDetails.contact && <p><strong>Contact:</strong> {orgDetails.contact}</p>}
      </div>
      
      {!formVisible ? (
        <button 
          className="add-parking-btn" 
          onClick={() => setFormVisible(true)}
        >
          Add Parking Space
        </button>
      ) : (
        <form className='underRoof-form' onSubmit={handleSubmit}>
          <h3>Add New Parking Space</h3>
          
          <div className="form-group">
            <label>Location Name</label>
            <input 
              type="text" 
              name="location" 
              value={formData.location}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group coord-group">
            <label>Coordinates</label>
            <div className="coord-inputs">
              <input 
                type="text" 
                name="lat" 
                placeholder="Latitude"
                value={formData.coordinates.lat}
                onChange={handleCoordinateChange}
                required
              />
              <input 
                type="text" 
                name="lng" 
                placeholder="Longitude"
                value={formData.coordinates.lng}
                onChange={handleCoordinateChange}
                required
              />
            </div>
          </div>
          
          <div className="form-group">
            <label>Total Capacity (vehicles)</label>
            <input 
              type="number" 
              name="capacity" 
              value={formData.capacity}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Vehicle Types and Pricing</label>
            {formData.vehicleTypes.map((vehicle, index) => (
              <div key={index} className="vehicle-price-group">
                <span>{vehicle.type}</span>
                <input 
                  type="number" 
                  placeholder={`Price for ${vehicle.type}`}
                  value={vehicle.price}
                  onChange={(e) => handleVehicleTypeChange(index, e)}
                  required
                />
              </div>
            ))}
          </div>
          
          <div className="form-group">
            <label>Terms and Conditions</label>
            <textarea 
              name="termsAndConditions" 
              value={formData.termsAndConditions}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-actions">
            <button type="submit">Save Parking Space</button>
            <button 
              type="button" 
              className="cancel-btn"
              onClick={() => setFormVisible(false)}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
      
      <div className="parking-spaces-list">
        <h3>Your Parking Spaces</h3>
        {parkingSpaces.length === 0 ? (
          <p>No parking spaces added yet.</p>
        ) : (
          <div className="spaces-grid">
            {parkingSpaces.map(space => (
              <div key={space.id} className="parking-space-card">
                <h4>{space.location}</h4>
                <p><strong>Capacity:</strong> {space.capacity} vehicles</p>
                <p><strong>Coordinates:</strong> {space.coordinates.lat}, {space.coordinates.lng}</p>
                <div className="vehicle-pricing">
                  <strong>Pricing:</strong>
                  <ul>
                    {space.vehicleTypes.map((vehicle, idx) => (
                      <li key={idx}>
                        {vehicle.type}: ${vehicle.price}/hour
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="booking-count">
                  <strong>Current Bookings:</strong> {bookings[space.id] || 0}
                </div>
                <button 
                  onClick={() => navigate(`/parking-details/${space.id}`, { state: { parkingSpace: space } })}
                  className="view-details-btn"
                >
                  View Details
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AddUnderRoofSpace;