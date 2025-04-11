import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { ref, onValue } from 'firebase/database';
import { useNavigate } from 'react-router-dom';
import '../App.css';

function OrganisationalParking() {
  const [organisations, setOrganisations] = useState([]);
  const [filteredOrganisations, setFilteredOrganisations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOption, setFilterOption] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    const orgRef = ref(db, "UnderRoofParking/malls");

    onValue(orgRef, (snapshot) => {
      if (snapshot.exists()) {
        const mallsData = snapshot.val();
        setOrganisations(mallsData);
        setFilteredOrganisations(mallsData);
        console.log('Fetched malls data:', mallsData);
      } else {
        console.log('No malls data available');
        setOrganisations([]);
        setFilteredOrganisations([]);
      }
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, filterOption, organisations]);

  // Function to apply filters based on search term and filter option
  const applyFilters = () => {
    let filtered = [...organisations];

    // Apply name search filter
    if (searchTerm.trim() !== '') {
      filtered = filtered.filter(org => 
        org.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply availability filter
    switch (filterOption) {
      case 'available':
        filtered = filtered.filter(org => (org.remainingParking?.count || 0) > 0);
        break;
      case 'full':
        filtered = filtered.filter(org => (org.remainingParking?.count || 0) === 0);
        break;
      case 'highAvailability':
        filtered = filtered.filter(org => {
          const availablePercentage = ((org.remainingParking?.count || 0) / org.totalParking) * 100;
          return availablePercentage >= 50;
        });
        break;
      default:
        // 'all' - no filtering needed
        break;
    }

    setFilteredOrganisations(filtered);
  };

  // Function to calculate the percentage of occupied spaces
  const calculateOccupancyPercentage = (booked, total) => {
    return Math.round((booked / total) * 100);
  };

  const handleBooking = (org) => {
    // Get user's vehicle number (this would typically come from a form or user profile)
    const vehicleNumber = prompt("Enter your vehicle number:", "MH01AB1234");
    
    if (!vehicleNumber) return; // User cancelled
    
    // Calculate parking fee (this is a sample calculation, adjust as needed)
    const basePrice = 50; // Base price in rupees
    const parkingFee = basePrice + (org.totalParking > 100 ? 20 : 0); // Premium for larger parking
    
    // Create transaction object with a random transaction ID
    const transactionId = "TRX" + Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    
    const transaction = {
      transactionId: transactionId,
      vehicleNumber: vehicleNumber,
      price: parkingFee,
      startTime: new Date().toISOString(),
      details: {
        Mall: org.name,
        Location: org.location || "Not specified",
        Duration: "2 hours", // Default duration
        id: org.id || `mall-${org.name.toLowerCase().replace(/\s+/g, "-")}`,
      },
      location: {
        lat: org.coordinates?.lat || 0,
        lng: org.coordinates?.lng || 0,
        address: org.address || org.name
      }
    };
    
    // Navigate directly to QR code page instead of payment gateway
    navigate('/qr-code', { state: { transaction } });
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleFilterChange = (e) => {
    setFilterOption(e.target.value);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterOption('all');
  };

  return (
    <div className="organisation-container">
      <h2 className="organisation-heading">Organisational Parking</h2>
      
      {/* Search and Filter Section */}
      <div className="search-filter-container">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search by mall name..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="search-input"
          />
        </div>
        
        <div className="filter-options">
          <select 
            value={filterOption} 
            onChange={handleFilterChange}
            className="filter-select"
          >
            <option value="all">All Parking</option>
            <option value="available">Available Parking</option>
            <option value="full">Full Parking</option>
            <option value="highAvailability">High Availability (≥50%)</option>
          </select>
          
          <button 
            onClick={clearFilters} 
            className="clear-filters-button"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Results Section */}
      {loading ? (
        <p className="organisation-loading">Loading parking data...</p>
      ) : filteredOrganisations.length === 0 ? (
        <div className="no-results">
          <p className="organisation-empty">No matching parking spaces found.</p>
          <button 
            onClick={clearFilters} 
            className="clear-filters-button"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <>
          <p className="results-count">{filteredOrganisations.length} parking location(s) found</p>
          <div className="organisation-grid">
            {filteredOrganisations.map((org, index) => (
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
                    <span className={`organisation-badge ${(org.remainingParking?.count || 0) > 0 ? 'organisation-badge-available' : 'organisation-badge-full'}`}>
                      {(org.remainingParking?.count || 0) > 0 ? `${org.remainingParking?.count} available` : 'Full'}
                    </span>
                    <button 
                      className="organisation-book-button"
                      onClick={() => handleBooking(org)}
                      disabled={(org.remainingParking?.count || 0) === 0}
                    >
                      {(org.remainingParking?.count || 0) > 0 ? 'Book Now' : 'Full'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default OrganisationalParking;