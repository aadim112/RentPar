import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import "@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css"; 
import { db } from '../firebase';
import { ref, onValue } from 'firebase/database';

const PublicSpaceMap = () => {
  const [location, setLocation] = useState({ lat: 23.0225, lng: 72.5714 }); // Default to Ahmedabad
  const [publicSpaces, setPublicSpaces] = useState([]);
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);

  useEffect(() => {
    // Fetch public spaces from Firebase
    const publicSpacesRef = ref(db, 'publicSpace/');
    const unsubscribe = onValue(publicSpacesRef, (snapshot) => {
      const spaces = [];
      snapshot.forEach((childSnapshot) => {
        const spaceData = childSnapshot.val();
        if (spaceData.parking && spaceData.parking.lat && spaceData.parking.lang) {
          spaces.push({
            id: childSnapshot.key,
            ...spaceData
          });
        }
      });
      setPublicSpaces(spaces);
    });

    // Cleanup subscription
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    mapboxgl.accessToken = "pk.eyJ1IjoiYWFkaXR5YTE0OSIsImEiOiJjbTV3Mmt5azUwNHNsMm9zNGdtbHd2NjR4In0.HC2t664_Z1Uw6ANn1oUD8A";

    // Initialize the map
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [location.lng, location.lat],
      zoom: 15,
    });

    mapRef.current = map;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add markers for public spaces
    publicSpaces.forEach(space => {
      const { lat, lang } = space.parking;
      const marker = new mapboxgl.Marker()
        .setLngLat([lang, lat])
        .setPopup(new mapboxgl.Popup().setHTML(`
          <div>
            <strong>Parking Capacity:</strong> ${space.capacity}<br>
            <strong>Votes:</strong> ${space.votes}
          </div>
        `))
        .addTo(map);
      
      markersRef.current.push(marker);
    });

    // Cleanup function
    return () => map.remove();
  }, [location, publicSpaces]);

  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLocation({ lat: latitude, lng: longitude });

          // Move map center
          if (mapRef.current) {
            mapRef.current.flyTo({ center: [longitude, latitude], zoom: 16 });
          }
        },
        (error) => {
          console.error("Error getting location:", error);
          alert("Unable to retrieve your location.");
        }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  };

  return (
    <div className="map-container" style={{ position: 'relative', width: '100%', maxWidth: '500px',marginLeft:'30px' }}>
      <div 
        style={{
          width:'35px',
          height:'35px',
          backgroundColor:'white',
          borderRadius:'7px',
          display:'flex',
          alignItems:'center',
          justifyContent:'center',
          cursor:'pointer',
          position: 'absolute',
          zIndex: 1,
          top: '10px',
          right: '10px',
          boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
        }} 
        onClick={handleGetCurrentLocation}
      >
        <i className="fa-solid fa-crosshairs fa-sm" style={{color: "grey"}}></i>
      </div>
      <div 
        ref={mapContainerRef} 
        style={{ 
          width: "100%", 
          height: "250px", 
          borderRadius: "9px",
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }} 
      />
    </div>
  );
};

export default PublicSpaceMap;