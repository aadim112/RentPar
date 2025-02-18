import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import "@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css"; 

const MapComponent = ({ onSetLocation }) => {
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState({ lat: 23.0225, lng: 72.5714 }); // Default to Ahmedabad
  const [suggestions, setSuggestions] = useState([]);
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null); // Reference for the marker

  useEffect(() => {
    if (onSetLocation) {
      onSetLocation(location);
    }
  }, [location]);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    mapboxgl.accessToken = "pk.eyJ1IjoiYWFkaXR5YTE0OSIsImEiOiJjbTV3Mmt5azUwNHNsMm9zNGdtbHd2NjR4In0.HC2t664_Z1Uw6ANn1oUD8A";

    // Initialize the map
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [location.lng, location.lat], // Longitude, Latitude order
      zoom: 14,
    });

    // Store map reference
    mapRef.current = map;

    // Add Marker
    markerRef.current = new mapboxgl.Marker()
      .setLngLat([location.lng, location.lat])
      .addTo(map);

    // Click event to get coordinates
    map.on("click", (e) => {
      const { lng, lat } = e.lngLat;
      setLocation({ lat, lng });

      // Move existing marker
      if (markerRef.current) {
        markerRef.current.setLngLat([lng, lat]);
      }
    });

    // Cleanup function
    return () => map.remove();
  }, [location]);

  const handleSearch = async (input) => {
    if (!input.trim()) return;

    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(input)}.json?access_token=pk.eyJ1IjoiYWFkaXR5YTE0OSIsImEiOiJjbTV3Mmt5azUwNHNsMm9zNGdtbHd2NjR4In0.HC2t664_Z1Uw6ANn1oUD8A`
      );
      const data = await response.json();

      if (data.features.length > 0) {
        setSuggestions(data.features);
      } else {
        setSuggestions([]);
      }
    } catch (error) {
      console.error("Error fetching location:", error);
      setSuggestions([]);
    }
  };

  const handleInputChange = (event) => {
    const inputValue = event.target.value;
    setQuery(inputValue);

    if (inputValue.length > 2) {
      handleSearch(inputValue);
    } else {
      setSuggestions([]);
    }
  };

  const handleSelect = (place) => {
    setQuery(place.place_name);
    setLocation({ lat: place.center[1], lng: place.center[0] }); // Reverse center order
    setSuggestions([]);

    if (markerRef.current) {
      markerRef.current.setLngLat(place.center);
    }
  };

  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLocation({ lat: latitude, lng: longitude });

          // Move marker to new location
          if (markerRef.current) {
            markerRef.current.setLngLat([longitude, latitude]);
          }

          // Move map center
          if (mapRef.current) {
            mapRef.current.flyTo({ center: [longitude, latitude], zoom: 14 });
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
    <div className="map-container">
      <form className="search-state">
        <div style={{width:'auto',display:'flex',alignItems:'center'}}>
          <input type="text" placeholder="Search Location" onChange={handleInputChange} value={query} />
          <div style={{marginLeft:'15px',width:'40px',height:'40px',backgroundColor:'white',borderRadius:'7px',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}} onClick={handleGetCurrentLocation}>
          <i class="fa-solid fa-crosshairs fa-lg" style={{color: "grey"}}></i>
        </div>
        </div>
        {suggestions.length > 0 && (
          <div className="searched-list">
            {suggestions.map((place) => (
              <div className="suggestion-place" key={place.id} onClick={() => handleSelect(place)}>
                <p style={{ fontWeight: "bold", fontSize: "15px" }}>{place.place_name}</p>
              </div>
            ))}
          </div>
        )}
      </form>
      <div ref={mapContainerRef} style={{ width: "100%", height: "290px", borderRadius: "9px", marginTop: "10px" }} />
    </div>
  );
};

export default MapComponent;
