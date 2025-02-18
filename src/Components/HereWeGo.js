import React, { useEffect, useRef, useState } from "react";
import { onValue,ref,getDatabase,set } from 'firebase/database';
import { db} from '../firebase';
import { get } from "firebase/database";

const HERE_API_KEY = "Wg3pz1QB8K94uq0TJtlVr2nFXSDRu8-rYR9JALszcR8";

const HereMapComponent = ({onNearbyLocation,markerLocation }) => {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [selectedCoordinate,setSelectedCordinates] = useState({lat:null,lng:null});
  const [filteredLocations,setFilteredLocations] = useState([]);
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const markersRef = useRef([]); // 🔹 Store multiple markers

  //Loading the map scripts
  

  // Custom marker icons
  const redIcon = new window.H.map.Icon(
    "https://maps.gstatic.com/mapfiles/ms2/micons/red-dot.png"
  );
  const greenIcon = new window.H.map.Icon(
    "https://maps.gstatic.com/mapfiles/ms2/micons/green-dot.png"
  );

  useEffect(()=>{
    console.log("props",markerLocation)
  },[markerLocation])

  useEffect(() => {
    if (selectedCoordinate.lat !== null && selectedCoordinate.lng !== null) {
      getNearbyLocations(selectedCoordinate.lat, selectedCoordinate.lng).then((nearbyLocations) => {
        console.log("Nearby Locations:", nearbyLocations); // Check the output in the browser console
      });
    }
  }, [selectedCoordinate]);

  useEffect(() => {
    console.log("Updated Coordinates:", selectedCoordinate);
  }, [selectedCoordinate]);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize HERE Map
    const platform = new window.H.service.Platform({
      apikey: HERE_API_KEY,
    });

    const defaultLayers = platform.createDefaultLayers();
    const map = new window.H.Map(
      mapContainerRef.current,
      defaultLayers.vector.normal.map,
      {
        center: { lat: 18.64641, lng: 73.75907 }, // Default to India
        zoom: 16,
      }
    );

    // Enable zoom & pan controls
    const ui = window.H.ui.UI.createDefault(map, defaultLayers);
    new window.H.mapevents.Behavior(new window.H.mapevents.MapEvents(map));

    mapRef.current = map;

    return () => {
      map.dispose(); // Cleanup on unmount
    };
  }, []);

  const handleSearch = async (input) => {
    if (!input.trim()) return;

    try {
      const response = await fetch(`https://discover.search.hereapi.com/v1/discover?at=20.5937,78.9629&q=${encodeURIComponent(input)}&apiKey=${HERE_API_KEY}`);
      const data = await response.json();

      if (data.items.length > 0) {
        setSuggestions(data.items);
        console.log(data.items)
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

  const handleSelect = async (place) => {
    setQuery(place.title);
    setSuggestions([]);
    const { lat, lng } = place.position;
    setSelectedCordinates({ lat, lng });
  
    console.log("Selected Coordinates:", lat, lng);
  
    if (mapRef.current) {
      mapRef.current.setCenter({ lat, lng });
      mapRef.current.setZoom(16);
  
      if (markerRef.current) {
        mapRef.current.removeObject(markerRef.current);
      }
      const marker = new window.H.map.Marker({ lat, lng });
      mapRef.current.addObject(marker);
      markerRef.current = marker;
    }
  
    // Fetch nearby locations and wait for the result
    const nearbyLocations = await getNearbyLocations(lat, lng);
    
    setFilteredLocations(nearbyLocations); // Update state
  
    console.log("Nearby Locations:", nearbyLocations);
  
    if (onNearbyLocation) {
      onNearbyLocation(nearbyLocations); // Pass the actual fetched data
    }
  };

  useEffect(() => {
    if (!mapRef.current) return;
  
    // 🔹 Remove previous markers before adding new ones
    if (markerRef.current) {
      mapRef.current.removeObject(markerRef.current);
    }
    if (markerRef.parkingMarker) {
      mapRef.current.removeObject(markerRef.parkingMarker);
    }
  
    // Add searched location marker (Red)
    if (selectedCoordinate.lat && selectedCoordinate.lng) {
      const redIcon = new window.H.map.Icon(
        "https://maps.google.com/mapfiles/ms/icons/red-dot.png"
      );
  
      const searchedMarker = new window.H.map.Marker(
        { lat: selectedCoordinate.lat, lng: selectedCoordinate.lng },
        { icon: redIcon }
      );
  
      mapRef.current.addObject(searchedMarker);
      markerRef.current = searchedMarker; // Store reference for removal
    }
  
    // 🟢 Add selected parking location marker (Green)
    if (markerLocation?.parking?.lat && markerLocation?.parking?.lng) {
      const greenIcon = new window.H.map.Icon(
        "https://maps.google.com/mapfiles/ms/icons/green-dot.png"
      );
  
      const parkingMarker = new window.H.map.Marker(
        { lat: parseFloat(markerLocation.parking.lat), lng: parseFloat(markerLocation.parking.lng) },
        { icon: greenIcon }
      );
  
      mapRef.current.addObject(parkingMarker);
      markerRef.parkingMarker = parkingMarker;
    }
  
  }, [selectedCoordinate, markerLocation]);
  

  const getDistance = (lat1, lng1, lat2,lng2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLng = (lng2 - lng1) * (Math.PI / 180);
    const a = Math.sin(dLat /2 ) * Math.sin(dLat / 2) + Math.cos(lat1 * (Math.PI) / 180) * Math.cos(lat2 * (Math.PI / 180)) *Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };


  const getNearbyLocations = async (selectedLat, selectedLng, radius = 1) => {
    if (!selectedLat || !selectedLng) return []; // Ensure valid coordinates
  
    const dbRef = ref(db, "parkingSpaces"); // Ensure correct reference
  
    try {
      const snapshot = await get(dbRef);
      if (snapshot.exists()) {
        const locations = snapshot.val();
        const nearbyLocations = Object.keys(locations)
          .map((key) => ({
            id: key,
            ...locations[key], // Spread to include all properties
          }))
          .filter((location) => {
            if (location.parking?.lat && location.parking?.lng) {
              const distance = getDistance(
                selectedLat,
                selectedLng,
                parseFloat(location.parking.lat),
                parseFloat(location.parking.lng)
              );
              return distance <= radius; // Filter within the radius
            }
            return false;
          });
  
        return nearbyLocations; // Return complete object of each found space
      } else {
        console.log("No parking spaces found.");
        return [];
      }
    } catch (error) {
      console.error("Error fetching parking spaces:", error);
      return [];
    }
  };
  

  return (
    <>
    <div className="map-container">
      <form className="search-state">
        <input type="text" placeholder="Search a Destination..." onChange={handleInputChange} value={query}/>
        {suggestions.length > 0 && (
          <div className="searched-list">
            {suggestions.map((place) => (
              <div className="suggestion-place"  key={place.id}  onClick={() => handleSelect(place)}>
                <p style={{ fontWeight: "bold", fontSize: "15px" }}>{place.title}</p>
              </div>
            ))}
          </div>
        )}
      </form>
      <div id="map" ref={mapContainerRef} style={{width: "100%", height: "300px",borderRadius: "7px",marginTop: "10px",}}/>
    </div>
    {/* <div className="space-list"></div> */}
    </>
  );
};

export default HereMapComponent;
