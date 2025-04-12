import '../App.css';
import { set, ref, get, update } from 'firebase/database';
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
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundReason, setRefundReason] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelBooking, setCancelBooking] = useState(null);
  const [showCancelSuccess, setShowCancelSuccess] = useState(false);
  
  const navigate = useNavigate();
  const uid = props.user.uid;

  // Get user data from Firebase
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

  // Get user's bookings from Firebase
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

  // Get user's listed parking spaces
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

  // Handle click on a parking space to show its bookings
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

  // Navigate to directions page for a booking
  const handleNavigateToDirections = (booking) => {
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
      fetchSpaceLocation(booking.spaceId);
    }
  };

  // Fetch space location if not in booking data
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

  // Check if a booking is expired
  const isBookingExpired = (booking) => {
    const startTimeStr = booking.startTime;
    let durationInMinutes = 0;
    
    if (booking.details && booking.details.Duration) {
      const durationMatch = booking.details.Duration.match(/(\d+)/);
      if (durationMatch && durationMatch[1]) {
        durationInMinutes = parseInt(durationMatch[1], 10);
      }
    } else if (booking.duration) {
      durationInMinutes = booking.duration;
    }
    
    if (!startTimeStr || !durationInMinutes) {
      return false;
    }
    
    const startTime = new Date(startTimeStr);
    const bookingEndTime = startTime.getTime() + (durationInMinutes * 60 * 1000);
    const currentTime = new Date().getTime();
    
    return currentTime > bookingEndTime;
  };

  // Check if a booking is upcoming (hasn't started yet)
  const isBookingUpcoming = (booking) => {
    const startTimeStr = booking.startTime;
    
    if (!startTimeStr) {
      return false;
    }
    
    const startTime = new Date(startTimeStr);
    const currentTime = new Date().getTime();
    
    return currentTime < startTime.getTime();
  };

  // Handle refund request initiation
  const handleRefundRequest = (booking) => {
    setSelectedBooking(booking);
    setShowRefundModal(true);
  };

  // Handle cancel booking
  const handleCancelBooking = (booking) => {
    setCancelBooking(booking);
    setShowCancelModal(true);
  };

  // Submit refund request to Firebase
  const submitRefundRequest = async () => {
    if (!refundReason.trim()) {
      alert('Please provide a reason for refund');
      return;
    }

    try {
      // Update transaction record
      const transactionRef = ref(db, `transactions/${selectedBooking.transactionId}`);
      await update(transactionRef, {
        refundRequested: true,
        refundReason: refundReason,
        refundStatus: 'pending',
        refundRequestDate: new Date().toISOString()
      });

      // Update user's booking record
      const userBookingRef = ref(db, `users/${uid}/bookings/${selectedBooking.transactionId}`);
      await update(userBookingRef, {
        refundRequested: true,
        refundReason: refundReason,
        refundStatus: 'pending'
      });

      // Update parking space's booking record if spaceId exists
      if (selectedBooking.spaceId) {
        const spaceBookingRef = ref(db, `parkingSpaces/${selectedBooking.spaceId}/bookings/${selectedBooking.transactionId}`);
        await update(spaceBookingRef, {
          refundRequested: true,
          refundReason: refundReason,
          refundStatus: 'pending'
        });
      }

      // Show success and reset form
      setShowRefundModal(false);
      setRefundReason('');
      setShowSuccess(true);
      
      // Refresh bookings data
      getUserBookings(uid);

      // Hide success message after 3 seconds
      setTimeout(() => {
        setShowSuccess(false);
      }, 3000);

    } catch (error) {
      console.error("Error processing refund request:", error);
      alert("Failed to process refund request. Please try again.");
    }
  };

  // Submit booking cancellation
  const submitCancellation = async () => {
    try {
      const originalPrice = cancelBooking.price || 0;
      const penaltyAmount = originalPrice * 0.1; // 10% penalty
      const refundAmount = originalPrice - penaltyAmount;

      // Update transaction record
      const transactionRef = ref(db, `transactions/${cancelBooking.transactionId}`);
      await update(transactionRef, {
        cancelled: true,
        cancellationDate: new Date().toISOString(),
        refundAmount: refundAmount.toFixed(2),
        penaltyAmount: penaltyAmount.toFixed(2),
        status: 'cancelled'
      });

      // Update user's booking record
      const userBookingRef = ref(db, `users/${uid}/bookings/${cancelBooking.transactionId}`);
      await update(userBookingRef, {
        cancelled: true,
        cancellationDate: new Date().toISOString(),
        refundAmount: refundAmount.toFixed(2),
        penaltyAmount: penaltyAmount.toFixed(2),
        status: 'cancelled'
      });

      // Update parking space's booking record if spaceId exists
      if (cancelBooking.spaceId) {
        const spaceBookingRef = ref(db, `parkingSpaces/${cancelBooking.spaceId}/bookings/${cancelBooking.transactionId}`);
        await update(spaceBookingRef, {
          cancelled: true,
          cancellationDate: new Date().toISOString(),
          status: 'cancelled'
        });

        // Update space allocations
        const spaceRef = ref(db, `parkingSpaces/${cancelBooking.spaceId}`);
        const spaceSnapshot = await get(spaceRef);
        if (spaceSnapshot.exists()) {
          const spaceData = spaceSnapshot.val();
          const currentAllocated = spaceData.allocated || 0;
          if (currentAllocated > 0) {
            await update(spaceRef, {
              allocated: currentAllocated - 1
            });
          }
        }
      }

      // Show success and reset form
      setShowCancelModal(false);
      setShowCancelSuccess(true);
      
      // Refresh bookings data
      getUserBookings(uid);

      // Hide success message after 3 seconds
      setTimeout(() => {
        setShowCancelSuccess(false);
      }, 3000);

    } catch (error) {
      console.error("Error cancelling booking:", error);
      alert("Failed to cancel booking. Please try again.");
    }
  };

  // Load user data and bookings on component mount
  useEffect(() => {
    if (uid) {
      getUserData(uid);
      getUserBookings(uid);
    }
  }, [uid]);

  // Load user's parking spaces when user data changes
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

      {/* Listed Spaces Section */}
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

      {/* My Bookings Section */}
      <div className='section'>
        <h2 className='section-title'>My Bookings</h2>
        {userBookings.length > 0 ? (
          <div className='card-list'>
            {userBookings.map((booking, index) => {
              const expired = isBookingExpired(booking);
              const upcoming = isBookingUpcoming(booking);
              const canRequestRefund = !booking.refundRequested && 
                                      !expired && 
                                      booking.paymentStatus === 'completed';
              const canCancel = !booking.cancelled && 
                               upcoming && 
                               booking.paymentStatus === 'completed';
              const refundPending = booking.refundRequested && 
                                   booking.refundStatus === 'pending';
              const refundProcessed = booking.refundRequested && 
                                     booking.refundStatus === 'processed';
              const isCancelled = booking.cancelled === true;

              return (
                <div className={`card ${expired ? 'expired-card' : ''} ${isCancelled ? 'cancelled-card' : ''}`} key={index}>
                  <p><strong>Vehicle:</strong> {booking.vehicleNumber}</p>
                  <p><strong>Space:</strong> {booking.details?.fullname}</p>
                  <p><strong>Duration:</strong> {booking.details?.Duration || booking.duration + " min"}</p>
                  <p><strong>Time:</strong> {booking.startTime ? new Date(booking.startTime).toLocaleString() : new Date(booking.timestamp).toLocaleString()}</p>
                  <p><strong>Amount:</strong> ₹{booking.price?.toFixed(2) || 'N/A'}</p>
                  <p><strong>Status:</strong> {isCancelled ? 'Cancelled' : booking.paymentStatus || 'completed'}</p>
                  
                  {expired && <p className="expired-tag">EXPIRED</p>}
                  {upcoming && !isCancelled && <p className="upcoming-tag">UPCOMING</p>}
                  {refundPending && <p className="refund-pending-tag">REFUND PENDING</p>}
                  {refundProcessed && <p className="refund-processed-tag">REFUND PROCESSED</p>}
                  {isCancelled && <p className="cancelled-tag">CANCELLED</p>}
                  
                  <div className="booking-actions">
                    <button 
                      className={`navigate-btn ${expired || isCancelled ? 'disabled-btn' : ''}`}
                      onClick={() => !expired && !isCancelled && handleNavigateToDirections(booking)}
                      disabled={expired || isCancelled}
                    >
                      Get Directions
                    </button>
                    
                    {canRequestRefund && (
                      <button 
                        className="refund-btn"
                        onClick={() => handleRefundRequest(booking)}
                      >
                        Request Refund
                      </button>
                    )}

                    {canCancel && (
                      <button 
                        className="cancel-btn"
                        onClick={() => handleCancelBooking(booking)}
                      >
                        Cancel Booking
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className='empty-msg'>No bookings made yet</p>
        )}
      </div>

      {/* Space Bookings Modal */}
      {showModal && (
        <div className='modal-overlay'>
          <div className='modal'>
            <div className='modal-header'>
              <h3>Bookings for {selectedSpaceName}</h3>
              <button onClick={() => setShowModal(false)} className='close-btn'>×</button>
            </div>
            {spaceBookings.length > 0 ? (
              spaceBookings.map((booking, i) => {
                const expired = isBookingExpired(booking);
                const isCancelled = booking.cancelled === true;
                return (
                  <div key={i} className={`modal-booking ${expired ? 'expired-booking' : ''} ${isCancelled ? 'cancelled-booking' : ''}`}>
                    <p><strong>User:</strong> {booking.userId}</p>
                    <p><strong>Vehicle:</strong> {booking.vehicleNumber}</p>
                    <p><strong>Duration:</strong> {booking.details?.Duration || booking.duration + " mins"}</p>
                    <p><strong>Time:</strong> {booking.startTime ? new Date(booking.startTime).toLocaleString() : new Date(booking.timestamp).toLocaleString()}</p>
                    {expired && <p className="expired-tag">EXPIRED</p>}
                    {isCancelled && <p className="cancelled-tag">CANCELLED</p>}
                  </div>
                );
              })
            ) : (
              <p>No bookings found for this space.</p>
            )}
          </div>
        </div>
      )}

      {/* Refund Request Modal */}
      {showRefundModal && (
        <div className='modal-overlay'>
          <div className='modal'>
            <div className='modal-header'>
              <h3>Request Refund</h3>
              <button onClick={() => setShowRefundModal(false)} className='close-btn'>×</button>
            </div>
            <div className='modal-content'>
              <p>You are requesting a refund for booking:</p>
              <p><strong>Vehicle:</strong> {selectedBooking?.vehicleNumber}</p>
              <p><strong>Amount:</strong> ₹{selectedBooking?.price?.toFixed(2) || 'N/A'}</p>
              
              <div className='form-group'>
                <label htmlFor='refundReason'>Reason for refund:</label>
                <textarea
                  id='refundReason'
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="Please explain why you're requesting a refund"
                  rows={4}
                />
              </div>
              
              <button 
                className='submit-btn'
                onClick={submitRefundRequest}
              >
                Submit Refund Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Booking Modal */}
      {showCancelModal && cancelBooking && (
        <div className='modal-overlay'>
          <div className='modal'>
            <div className='modal-header'>
              <h3>Cancel Booking</h3>
              <button onClick={() => setShowCancelModal(false)} className='close-btn'>×</button>
            </div>
            <div className='modal-content'>
              <div className='warning-icon'>⚠️</div>
              <h4>Are you sure you want to cancel this booking?</h4>
              <p><strong>Vehicle:</strong> {cancelBooking?.vehicleNumber}</p>
              <p><strong>Space:</strong> {cancelBooking?.details?.fullname}</p>
              <p><strong>Time:</strong> {cancelBooking?.startTime ? new Date(cancelBooking.startTime).toLocaleString() : 'N/A'}</p>
              
              <div className='penalty-notice'>
                <p><strong>Please Note:</strong> A cancellation penalty of 10% will be charged.</p>
                <p><strong>Original Amount:</strong> ₹{cancelBooking?.price?.toFixed(2) || '0.00'}</p>
                <p><strong>Penalty (10%):</strong> ₹{(cancelBooking?.price * 0.1).toFixed(2) || '0.00'}</p>
                <p><strong>Refund Amount:</strong> ₹{(cancelBooking?.price * 0.9).toFixed(2) || '0.00'}</p>
              </div>
              
              <div className='action-buttons'>
                <button 
                  className='cancel-action-btn'
                  onClick={() => setShowCancelModal(false)}
                >
                  No, Keep Booking
                </button>
                <button 
                  className='confirm-cancel-btn'
                  onClick={submitCancellation}
                >
                  Yes, Cancel Booking
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Refund Success Modal */}
      {showSuccess && (
        <div className='modal-overlay'>
          <div className='modal success-modal'>
            <div className='modal-header'>
              <h3>Refund Request Submitted</h3>
            </div>
            <div className='modal-content'>
              <div className='success-icon'>✓</div>
              <p>Your refund request has been submitted successfully.</p>
              <p>₹{selectedBooking?.price?.toFixed(2)} will be refunded to your original payment method within 5-7 business days.</p>
              <button 
                className='close-success-btn'
                onClick={() => setShowSuccess(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancellation Success Modal */}
      {showCancelSuccess && (
        <div className='modal-overlay'>
          <div className='modal success-modal'>
            <div className='modal-header'>
              <h3>Booking Cancelled</h3>
            </div>
            <div className='modal-content'>
              <div className='success-icon'>✓</div>
              <p>Your booking has been cancelled successfully.</p>
              <p>₹{(cancelBooking?.price * 0.9).toFixed(2)} will be refunded to your original payment method within 5-7 business days.</p>
              <button 
                className='close-success-btn'
                onClick={() => setShowCancelSuccess(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSS Styles */}
      <style>
        {`
        .profile-container {
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
        }
        
        .section-title {
          color: #333;
          margin-bottom: 20px;
          font-size: 24px;
        }
        
        .info-box {
          background-color: #f8f9fa;
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 30px;
        }
        
        .section {
          margin-bottom: 40px;
        }
        
        .card-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
        }
        
        .card {
          background-color: white;
          border-radius: 8px;
          padding: 15px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          position: relative;
        }
        
        .clickable {
          cursor: pointer;
          transition: transform 0.2s;
        }
        
        .clickable:hover {
          transform: translateY(-3px);
        }
        
        .empty-msg {
          color: #666;
          font-style: italic;
        }
        
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0,0,0,0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }
        
        .modal {
          background-color: white;
          border-radius: 8px;
          width: 90%;
          max-width: 600px;
          max-height: 80vh;
          overflow-y: auto;
        }
        
        .modal-header {
          padding: 15px 20px;
          border-bottom: 1px solid #eee;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .modal-header h3 {
          margin: 0;
        }
        
        .close-btn {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #666;
        }
        
        .modal-booking {
          padding: 15px;
          border-bottom: 1px solid #eee;
        }
        
        .expired-card {
          background-color: #fff5f5;
        }
        
        .expired-booking {
          border-left: 3px solid #ff6b6b;
          background-color: #fff5f5;
        }
        
        .cancelled-card {
          background-color: #f8f9fa;
          opacity: 0.8;
        }
        
        .cancelled-booking {
          border-left: 3px solid #6c757d;
          background-color: #f8f9fa;
        }
        
        .expired-tag, .cancelled-tag, .upcoming-tag, .refund-pending-tag, .refund-processed-tag {
          position: absolute;
          top: 10px;
          right: 10px;
          padding: 3px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: bold;
        }
        
        .expired-tag {
          background-color: #ff6b6b;
          color: white;
        }
        
        .cancelled-tag {
          background-color: #6c757d;
          color: white;
        }
        
        .upcoming-tag {
          background-color: #17a2b8;
          color: white;
        }
        
        .booking-actions {
          display: flex;
          gap: 10px;
          margin-top: 10px;
          flex-wrap: wrap;
        }
        
        .navigate-btn {
          background-color: #4CAF50;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 8px 16px;
          cursor: pointer;
          flex: 1;
        }
        
        .navigate-btn:hover {
          background-color: #45a049;
        }
        
        .disabled-btn {
          background-color: #cccccc !important;
          cursor: not-allowed;
        }
        
        .refund-btn {
          background-color: #f8f9fa;
          color: #dc3545;
          border: 1px solid #dc3545;
          border-radius: 4px;
          padding: 8px 16px;
          cursor: pointer;
          flex: 1;
        }
        
        .refund-btn:hover {
          background-color: #dc3545;
          color: white;
        }
        
        .cancel-btn {
          background-color: #f8f9fa;
          color: #6c757d;
          border: 1px solid #6c757d;
          border-radius: 4px;
          padding: 8px 16px;
          cursor: pointer;
          flex: 1;
        }
        
        .cancel-btn:hover {
          background-color: #6c757d;
          color: white;
        }
        
        .refund-pending-tag {
          background-color: #ffc107;
          color: black;
        }
        
        .refund-processed-tag {
          background-color: #28a745;
          color: white;
        }
        
        .modal-content {
          padding: 20px;
        }
        
        .form-group {
          margin-bottom: 15px;
        }
        
        .form-group label {
          display: block;
          margin-bottom: 5px;
          font-weight: 500;
        }
        
        .form-group textarea {
          width: 100%;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          resize: vertical;
          min-height: 100px;
        }
        
        .submit-btn {
          background-color: #007bff;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 10px 20px;
          cursor: pointer;
          width: 100%;
        }
        
        .submit-btn:hover {
          background-color: #0069d9;
        }
        
        .success-modal {
          text-align: center;
        }
        
        .success-icon {
          font-size: 48px;
          color: #28a745;
          margin: 15px 0;
        }
        
        .warning-icon {
          font-size: 48px;
          color: #ffc107;
          margin: 15px 0;
          text-align: center;
        }
        
        .close-success-btn {
          background-color: #6c757d;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 10px 20px;
          cursor: pointer;
          margin-top: 15px;
        }
        
        .close-success-btn:hover {
          background-color: #5a6268;
        }
        
        .penalty-notice {
          background-color: #fff3cd;
          border: 1px solid #ffeeba;
          border-radius: 4px;
          padding: 15px;
          margin: 15px 0;
        }
        
        .action-buttons {
          display: flex;
          gap: 10px;
          margin-top: 20px;
        }
        
        .cancel-action-btn {
          background-color: #f8f9fa;
          color: #6c757d;
          border: 1px solid #6c757d;
          border-radius: 4px;
          padding: 10px 20px;
          cursor: pointer;
          flex: 1;
        }
        
        .cancel-action-btn:hover {
          background-color: #e2e6ea;
        }
        
        .confirm-cancel-btn {
          background-color: #dc3545;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 10px 20px;
          cursor: pointer;
          flex: 1;
        }
        
        .confirm-cancel-btn:hover {
          background-color: #c82333;
        }
        
        @media (max-width: 768px) {
          .card-list {
            grid-template-columns: 1fr;
          }
          
          .booking-actions {
            flex-direction: column;
          }
          
          .modal {
            width: 95%;
          }
          
          .action-buttons {
            flex-direction: column;
          }
        }
        
        /* Additional styles for different status indicators */
        .status-indicator {
          display: inline-block;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          margin-right: 5px;
        }
        
        .status-active {
          background-color: #28a745;
        }
        
        .status-pending {
          background-color: #ffc107;
        }
        
        .status-completed {
          background-color: #17a2b8;
        }
        
        /* Styles for the empty state suggestions */
        .empty-suggestions {
          text-align: center;
          padding: 20px;
          background-color: #f8f9fa;
          border-radius: 8px;
          margin-top: 15px;
        }
        
        .suggestion-btn {
          background-color: #007bff;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 10px 15px;
          cursor: pointer;
          margin-top: 10px;
        }
        
        .suggestion-btn:hover {
          background-color: #0069d9;
        }
        `}
      </style>
    </div>
  );
};

export default Profile;