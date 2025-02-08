import React, { useEffect, useRef,useState } from "react";
import mapboxgl from "mapbox-gl";
import MapboxGeocoder from "@mapbox/mapbox-gl-geocoder";
import "mapbox-gl/dist/mapbox-gl.css";
import "@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css"; // Import Geocoder CSS

const MapComponent = () => {
  const [query, setQuery] = useState("");

  //Getting users live location:
  const [location, setLocation] = useState({ lat: null, lng: null });
  const [suggestions, setSuggestions] = useState([]); // Store place suggestions
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    if (!mapContainerRef.current) return; // Ensure ref is available

    mapboxgl.accessToken = "pk.eyJ1IjoiYWFkaXR5YTE0OSIsImEiOiJjbTV3Mmt5azUwNHNsMm9zNGdtbHd2NjR4In0.HC2t664_Z1Uw6ANn1oUD8A"; // Replace with your API key

    // Initialize map
    const map = new mapboxgl.Map({
      container: mapContainerRef.current, // Ensure it's not null
      style: "mapbox://styles/mapbox/streets-v12",
      marker : true,
      center: [location.lat, location.lng],
      zoom: 14,
    });


    // Store map reference
    mapRef.current = map;

    // Cleanup on component unmount
    return () => {
      map.remove();
    };
  }, [location]);

  const handleSearch = async (input) => {
    if (!input.trim()) return; // Prevent empty searches

    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          input
        )}.json?access_token=pk.eyJ1IjoiYWFkaXR5YTE0OSIsImEiOiJjbTV3Mmt5azUwNHNsMm9zNGdtbHd2NjR4In0.HC2t664_Z1Uw6ANn1oUD8A`
      );
      const data = await response.json();

      if (data.features.length > 0) {
        setSuggestions(data.features); // Store all suggestions
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
      handleSearch(inputValue); // Fetch places as user types (after 2+ chars)
    } else {
      setSuggestions([]); // Clear suggestions if input is too short
    }
  };

  const handleSelect = (place) => {
    setQuery(place.place_name); // Set the selected place in the input
    setLocation({lat:place.center[0],lng:place.center[1]});
    console.log(location)
    setSuggestions([]); // Clear suggestions
  };



  // fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/Akurdi.json?access_token=pk.eyJ1IjoiYWFkaXR5YTE0OSIsImEiOiJjbTV3Mmt5azUwNHNsMm9zNGdtbHd2NjR4In0.HC2t664_Z1Uw6ANn1oUD8A`)
  //   .then(response => response.json())
  //   .then(data => console.log(data.features[0].place_name));


  return (
    <div className='map-container'>
    <form className='search-state'>
      <input type="text" placeholder="Destination" onChange={handleInputChange} value={query}></input>
      {suggestions.length > 0 && (
  <div className="searched-list">
    {suggestions.map((place) => (
      <div className="suggestion-place" key={place.id} onClick={() => handleSelect(place)}>
        <p style={{ fontWeight: "bold", fontSize: "15px" }}>{place.place_name}</p>
        {/* <p style={{ fontSize: "12px" }}>sdhfkshklfhsdklfhsdkfh</p> */}
      </div>
    ))}
  </div>
)}
    </form>
    <div
      ref={mapContainerRef}
      style={{ width: "100%", height: "290px",borderRadius:'9px',marginTop:'10px' }} // Ensure it has a height
    />
    </div>
  );
};

export default MapComponent;
