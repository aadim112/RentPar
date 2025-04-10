import '../App.css';
import { set, ref, get } from 'firebase/database';
import { db } from '../firebase';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Profile = (props) => {
  const [userdata, setUserData] = useState({});
  const [userSpaces, setUserSpaces] = useState([]);
  const [userBookings, setUserBookings] = useState([]);
  const [spaceBookings, setSpaceBookings] = useState([]);
  const [selectedSpaceName, setSelectedSpaceName] = useState('');
  const [showModal, setShowModal] = useState(false);
  
  const navigate = useNavigate();
  const uid = props.user.uid;

  const getUserData = async (uid) => {
    try {
      const userRef = ref(db, `users/${uid}`);
      const snapshot = await get(userRef);
      if (snapshot.exists()) {
        setUserData(snapshot.val());
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  const getUserBookings = async (uid) => {
    try {
      const userBookingRef = ref(db, `users/${uid}/bookings`);
      const snapshot = await get(userBookingRef);
      if (snapshot.exists()) {
        const bookingsObj = snapshot.val();
        const bookingsArray = Object.values(bookingsObj);
        setUserBookings(bookingsArray);
      }
    } catch (error) {
      console.error("Error fetching user bookings:", error);
    }
  };

  const getUserSpaces = async (Userspaces) => {
    try {
      const fetchedSpaces = [];
      for (const spaceId of Userspaces) {
        const spaceRef = ref(db, `parkingSpaces/${spaceId}`);
        const snapshot = await get(spaceRef);
        if (snapshot.exists()) {
          fetchedSpaces.push({ id: spaceId, ...snapshot.val() });
        }
      }
      setUserSpaces(fetchedSpaces);
    } catch (error) {
      alert(error);
    }
  };

  const handleSpaceClick = async (spaceId, spaceName) => {
    try {
      const bookingRef = ref(db, `parkingSpaces/${spaceId}/bookings`);
      const snapshot = await get(bookingRef);
      if (snapshot.exists()) {
        const bookingsObj = snapshot.val();
        const bookingsArray = Object.values(bookingsObj);
        setSpaceBookings(bookingsArray);
        setSelectedSpaceName(spaceName);
        setShowModal(true);
      } else {
        setSpaceBookings([]);
        setSelectedSpaceName(spaceName);
        setShowModal(true);
      }
    } catch (err) {
      console.error("Error fetching space bookings:", err);
    }
  };

  const handleNavigateToDirections = (booking) => {
    // Check if the booking has location data
    if (booking.location && booking.location.lat && booking.location.lng) {
      navigate('/directions', {
        state: {
          parkingLocation: {
            lat: booking.location.lat,
            lng: booking.location.lng,
            name: booking.details.fullname || 'Parking Space'
          }
        }
      });
    } else {
      // If no location data in booking details, attempt to fetch from space ID
      fetchSpaceLocation(booking.spaceId);
    }
  };

  const fetchSpaceLocation = async (spaceId) => {
    if (!spaceId) {
      alert('No location data available for this booking');
      return;
    }

    try {
      const spaceRef = ref(db, `parkingSpaces/${spaceId}`);
      const snapshot = await get(spaceRef);
      
      if (snapshot.exists()) {
        const spaceData = snapshot.val();
        
        if (spaceData.latitude && spaceData.longitude) {
          navigate('/directions', {
            state: {
              parkingLocation: {
                lat: spaceData.latitude,
                lng: spaceData.longitude,
                name: spaceData.fullname || 'Parking Space'
              }
            }
          });
        } else {
          alert('Location data not available for this space');
        }
      } else {
        alert('Parking space not found');
      }
    } catch (error) {
      console.error('Error fetching space location:', error);
      alert('Failed to get directions: ' + error.message);
    }
  };

  useEffect(() => {
    if (uid) {
      getUserData(uid);
      getUserBookings(uid);
    }
  }, [uid]);

  useEffect(() => {
    if (userdata?.space?.length) {
      getUserSpaces(userdata.space);
    }
  }, [userdata.space]);

  return (
    <div className='profile-container'>
      <h2 className='section-title'>Profile</h2>
      <div className='info-box'>
        <p><strong>Name:</strong> {userdata.name}</p>
        <p><strong>Email:</strong> {userdata.email}</p>
      </div>

      {/* Listed Spaces */}
      <div className='section'>
        <h2 className='section-title'>My Listed Spaces</h2>
        {userSpaces.length > 0 ? (
          <div className='card-list'>
            {userSpaces.map((space, index) => (
              <div
                className='card clickable'
                key={index}
                onClick={() => handleSpaceClick(space.id, space.fullname)}
              >
                <p><strong>{space.fullname}</strong></p>
                <p>₹{space.Price}/min</p>
                <p>Capacity: {space.capacity}</p>
                <p>Booked: {space.allocated}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className='empty-msg'>No spaces added yet</p>
        )}
      </div>

      {/* My Bookings */}
      <div className='section'>
        <h2 className='section-title'>My Bookings</h2>
        {userBookings.length > 0 ? (
          <div className='card-list'>
            {userBookings.map((booking, index) => (
              <div className='card' key={index}>
                <p><strong>Vehicle:</strong> {booking.vehicleNumber}</p>
                <p><strong>Space:</strong> {booking.details?.fullname}</p>
                <p><strong>Duration:</strong> {booking.duration} min</p>
                <p><strong>Time:</strong> {new Date(booking.timestamp).toLocaleString()}</p>
                <button 
                  className='navigate-btn'
                  onClick={() => handleNavigateToDirections(booking)}
                >
                  Get Directions
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className='empty-msg'>No bookings made yet</p>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className='modal-overlay'>
          <div className='modal'>
            <div className='modal-header'>
              <h3>Bookings for {selectedSpaceName}</h3>
              <button onClick={() => setShowModal(false)} className='close-btn'>×</button>
            </div>
            {spaceBookings.length > 0 ? (
              spaceBookings.map((booking, i) => (
                <div key={i} className='modal-booking'>
                  <p><strong>User:</strong> {booking.userId}</p>
                  <p><strong>Vehicle:</strong> {booking.vehicleNumber}</p>
                  <p><strong>Duration:</strong> {booking.duration} mins</p>
                  <p><strong>Time:</strong> {new Date(booking.timestamp).toLocaleString()}</p>
                </div>
              ))
            ) : (
              <p>No bookings found for this space.</p>
            )}
          </div>
        </div>
      )}

      {/* Add CSS for the navigate button */}
      <style>
        {`
        .navigate-btn {
          background-color: #4285F4;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 8px 16px;
          margin-top: 8px;
          cursor: pointer;
          font-weight: 500;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
        }
        
        .navigate-btn:hover {
          background-color: #3367D6;
        }
        `}
      </style>
    </div>
  );
};

export default Profile;