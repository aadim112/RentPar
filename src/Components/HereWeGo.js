import React, { useEffect, useRef, useState } from "react";

const HERE_API_KEY = "Wg3pz1QB8K94uq0TJtlVr2nFXSDRu8-rYR9JALszcR8"; // Replace with your HERE API Key

const HereMapComponent = () => {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  
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
      const response = await fetch(`https://discover.search.hereapi.com/v1/discover?at=20.5937,78.9629&q=${encodeURIComponent(input)}&apiKey=${HERE_API_KEY}`
);
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

  const handleSelect = (place) => {
    setQuery(place.title);
    setSuggestions([]);

    const { lat, lng } = place.position;

    if (mapRef.current) {
      mapRef.current.setCenter({ lat, lng });
      mapRef.current.setZoom(14);

      if (markerRef.current) {
        mapRef.current.removeObject(markerRef.current);
      }
      const marker = new window.H.map.Marker({ lat, lng });
      mapRef.current.addObject(marker);
      markerRef.current = marker;
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
      <div ref={mapContainerRef} style={{width: "100%", height: "300px",borderRadius: "7px",marginTop: "10px",}}/>
    </div>
    {/* <div className="space-list"></div> */}
    </>
  );
};

export default HereMapComponent;
