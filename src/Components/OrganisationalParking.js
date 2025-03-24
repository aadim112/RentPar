import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { ref, onValue } from 'firebase/database';
import '../App.css'

function OrganisationalParking() {
  const [organisations, setOrganisations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const orgRef = ref(db, "UnderRoofParking/malls");

    onValue(orgRef, (snapshot) => {
      if (snapshot.exists()) {
        const mallsData = snapshot.val();
        setOrganisations(mallsData);
        console.log('Fetched malls data:', mallsData);
      } else {
        console.log('No malls data available');
        setOrganisations([]);
      }
      setLoading(false);
    });
  }, []);

  // Function to calculate the percentage of occupied spaces
  const calculateOccupancyPercentage = (booked, total) => {
    return Math.round((booked / total) * 100);
  };

  const handleBooking = (mallName) => {
    console.log(`Booking parking at ${mallName}`);
    // Add your booking logic here
    alert(`Booking initiated for ${mallName}`);
  };

  return (
    <div className="organisation-container">
      <h2 className="organisation-heading">Organisational Parking</h2>
      {loading ? (
        <p className="organisation-loading">Loading parking data...</p>
      ) : organisations.length === 0 ? (
        <p className="organisation-empty">No organisational parking data available.</p>
      ) : (
        <div className="organisation-grid">
          {organisations.map((org, index) => (
            <div key={index} className="organisation-card">
              <h3 className="organisation-card-title">{org.name}</h3>
              <div>
                <div className="organisation-stats-row">
                  <p className="organisation-stats-label">Total Spaces:</p>
                  <p className="organisation-stats-value">{org.totalParking}</p>
                </div>
                
                <div className="organisation-stats-row">
                  <p className="organisation-stats-label">Booked:</p>
                  <p className="organisation-stats-value">{org.bookedParking?.count || 0}</p>
                </div>
                
                <div className="organisation-stats-row">
                  <p className="organisation-stats-label">Available:</p>
                  <p className="organisation-stats-value">{org.remainingParking?.count || 0}</p>
                </div>
                
                <div className="organisation-progress-container">
                  <div className="organisation-progress-header">
                    <span className="organisation-stats-label">Occupancy</span>
                    <span className="organisation-stats-value">
                      {calculateOccupancyPercentage(org.bookedParking?.count || 0, org.totalParking)}%
                    </span>
                  </div>
                  <div className="organisation-progress-bar-bg">
                    <div 
                      className="organisation-progress-bar" 
                      style={{ width: `${calculateOccupancyPercentage(org.bookedParking?.count || 0, org.totalParking)}%` }}
                    ></div>
                  </div>
                </div>

                <div className="organisation-footer">
                  <span className="organisation-badge organisation-badge-available">
                    {org.remainingParking?.count || 0} available
                  </span>
                  <button 
                    className="organisation-book-button"
                    onClick={() => handleBooking(org.name)}
                  >
                    Book Now
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default OrganisationalParking;