import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from 'react-router-dom';

const HERE_API_KEY = "Wg3pz1QB8K94uq0TJtlVr2nFXSDRu8-rYR9JALszcR8";

const DirectionsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const userMarkerRef = useRef(null);
  const routeRef = useRef(null);
  const watchPositionIdRef = useRef(null);
  const parkingLocation = location.state?.parkingLocation || null;
  
  const [routeSummary, setRouteSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [navigationActive, setNavigationActive] = useState(false);
  const [currentManeuver, setCurrentManeuver] = useState(null);
  const [maneuverList, setManeuverList] = useState([]);
  const [nextManeuverDistance, setNextManeuverDistance] = useState(null);
  const [estimatedArrival, setEstimatedArrival] = useState(null);
  const [userPosition, setUserPosition] = useState(null);

  useEffect(() => {
    if (!parkingLocation) {
      console.error("No parking location provided");
      navigate('/');
      return;
    }

    // Initialize HERE Map
    const platform = new window.H.service.Platform({
      apikey: HERE_API_KEY,
    });

    const defaultLayers = platform.createDefaultLayers();
    const map = new window.H.Map(
      mapContainerRef.current,
      defaultLayers.vector.normal.map,
      {
        center: { 
          lat: parseFloat(parkingLocation.lat), 
          lng: parseFloat(parkingLocation.lng) 
        },
        zoom: 15,
        pixelRatio: window.devicePixelRatio || 1
      }
    );
    mapRef.current = map;

    // Enable zoom & pan controls
    const ui = window.H.ui.UI.createDefault(map, defaultLayers);
    new window.H.mapevents.Behavior(new window.H.mapevents.MapEvents(map));

    // Add parking marker
    const parkingMarker = new window.H.map.Marker({
      lat: parseFloat(parkingLocation.lat),
      lng: parseFloat(parkingLocation.lng)
    });
    map.addObject(parkingMarker);

    // Setup initial route
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;
        setUserPosition({ lat: userLat, lng: userLng });
        
        // Create user marker with custom icon
        const svgMarkup = '<svg width="24" height="24" xmlns="http://www.w3.org/2000/svg">' +
          '<circle cx="12" cy="12" r="10" fill="#1a73e8" stroke="white" stroke-width="2"/>' +
          '<circle cx="12" cy="12" r="3" fill="white"/>' +
          '</svg>';
        const icon = new window.H.map.Icon(svgMarkup);
        const userMarker = new window.H.map.Marker(
          { lat: userLat, lng: userLng },
          { icon: icon }
        );
        userMarkerRef.current = userMarker;
        map.addObject(userMarker);
        
        // Calculate and show the route
        calculateRoute(userLat, userLng, platform);
      },
      (error) => {
        console.error('Error getting current position:', error);
        setIsLoading(false);
      },
      { enableHighAccuracy: true }
    );

    return () => {
      // Clean up on unmount
      if (watchPositionIdRef.current) {
        navigator.geolocation.clearWatch(watchPositionIdRef.current);
      }
      map.dispose();
    };
  }, [parkingLocation, navigate]);

  const calculateRoute = (startLat, startLng, platform) => {
    const router = platform.getRoutingService(null, 8);
    
    const routingParameters = {
      'routingMode': 'fast',
      'transportMode': 'car',
      'origin': `${startLat},${startLng}`,
      'destination': `${parkingLocation.lat},${parkingLocation.lng}`,
      'return': 'polyline,turnByTurnActions,actions,instructions,travelSummary'
    };
    
    router.calculateRoute(routingParameters, onRouteSuccess, onError);
  };

  const onRouteSuccess = (result) => {
    if (result.routes.length) {
      const route = result.routes[0];
      
      // Create route polyline
      const routeLineString = new window.H.geo.LineString();
      route.sections[0].polyline.points.forEach((point) => {
        const parts = point.split(',');
        routeLineString.pushLatLngAlt(parseFloat(parts[0]), parseFloat(parts[1]));
      });
      
      // Add route to the map
      if (routeRef.current) {
        mapRef.current.removeObject(routeRef.current);
      }
      
      const routeLine = new window.H.map.Polyline(routeLineString, {
        style: { strokeColor: '#0099FF', lineWidth: 6 }
      });
      routeRef.current = routeLine;
      mapRef.current.addObject(routeLine);
      
      // Zoom the map to fit the route
      mapRef.current.getViewModel().setLookAtData({
        bounds: routeLine.getBoundingBox()
      });
      
      // Extract route information
      const distance = route.sections[0].travelSummary.length / 1000; // km
      const duration = Math.ceil(route.sections[0].travelSummary.duration / 60); // minutes
      
      // Process maneuvers
      if (route.sections[0].actions) {
        const maneuvers = route.sections[0].actions.map(action => ({
          instruction: action.instruction,
          position: {
            lat: action.position.lat,
            lng: action.position.lng
          },
          offset: action.offset, // meters from start
          direction: getDirectionType(action.direction),
          nextRoad: action.nextRoad?.name || '',
          distance: action.length // distance until next action
        }));
        
        setManeuverList(maneuvers);
        if (maneuvers.length > 0) {
          setCurrentManeuver(maneuvers[0]);
          setNextManeuverDistance(maneuvers[0].distance);
        }
      }
      
      // Calculate ETA
      const now = new Date();
      const arrivalTime = new Date(now.getTime() + (duration * 60 * 1000));
      setEstimatedArrival(formatTime(arrivalTime));
      
      // Update route summary
      setRouteSummary({
        distance,
        duration
      });
      
      setIsLoading(false);
    }
  };

  const onError = (error) => {
    console.error('Error calculating route:', error);
    setIsLoading(false);
  };

  const startNavigation = () => {
    setNavigationActive(true);
    
    // Start tracking user position
    if (navigator.geolocation) {
      watchPositionIdRef.current = navigator.geolocation.watchPosition(
        updateUserPosition,
        (error) => console.error("Error watching position:", error),
        { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
      );
    }
  };

  const stopNavigation = () => {
    setNavigationActive(false);
    
    if (watchPositionIdRef.current) {
      navigator.geolocation.clearWatch(watchPositionIdRef.current);
      watchPositionIdRef.current = null;
    }
  };

  const updateUserPosition = (position) => {
    const { latitude, longitude } = position.coords;
    setUserPosition({ lat: latitude, lng: longitude });
    
    // Update user marker position
    if (userMarkerRef.current && mapRef.current) {
      userMarkerRef.current.setGeometry({ lat: latitude, lng: longitude });
      
      // Center map on user in active navigation mode
      if (navigationActive) {
        mapRef.current.setCenter({ lat: latitude, lng: longitude });
        mapRef.current.setZoom(18);
      }
      
      // Find the current/next maneuver based on user position
      if (maneuverList.length > 0) {
        updateCurrentManeuver(latitude, longitude);
      }
    }
  };

  const updateCurrentManeuver = (userLat, userLng) => {
    // Simple distance to destination
    const distToDest = calculateDistance(
      userLat, 
      userLng, 
      parseFloat(parkingLocation.lat), 
      parseFloat(parkingLocation.lng)
    );
    
    // If very close to destination
    if (distToDest < 0.05) { // 50 meters
      setNextManeuverDistance(distToDest * 1000);
      setCurrentManeuver({
        instruction: "You have arrived at your destination",
        direction: "arrive"
      });
      return;
    }
    
    // Find the next maneuver
    for (let i = 0; i < maneuverList.length - 1; i++) {
      const current = maneuverList[i];
      const next = maneuverList[i + 1];
      
      const distToNext = calculateDistance(
        userLat, 
        userLng, 
        next.position.lat, 
        next.position.lng
      );
      
      // If we're closer to the next maneuver than the current one
      if (i === 0 || distToNext < 0.3) { // Within 300m
        setCurrentManeuver(next);
        setNextManeuverDistance(distToNext * 1000); // Convert to meters
        return;
      }
    }
    
    // Default to first maneuver if no clear match
    setCurrentManeuver(maneuverList[0]);
    setNextManeuverDistance(
      calculateDistance(
        userLat, 
        userLng, 
        maneuverList[0].position.lat, 
        maneuverList[0].position.lng
      ) * 1000
    );
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth radius in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
    return R * c; // Distance in km
  };

  const deg2rad = (deg) => {
    return deg * (Math.PI / 180);
  };

  const getDirectionType = (direction) => {
    if (!direction) return "straight";
    
    const directionMap = {
      left: "left",
      right: "right",
      slightlyLeft: "slight-left",
      slightlyRight: "slight-right",
      hardLeft: "sharp-left",
      hardRight: "sharp-right",
      uTurnLeft: "u-turn",
      uTurnRight: "u-turn",
    };
    
    return directionMap[direction] || "straight";
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleBackToHome = () => {
    stopNavigation();
    navigate('/');
  };

  const getDirectionIcon = (direction) => {
    const iconMap = {
      "left": "↰",
      "right": "↱",
      "slight-left": "↖",
      "slight-right": "↗",
      "sharp-left": "⬅",
      "sharp-right": "➡",
      "u-turn": "↩",
      "straight": "⬆",
      "arrive": "🏁"
    };
    
    return iconMap[direction] || "⬆";
  };

  // Styles
  const styles = `
    .directions-container {
      font-family: 'Poppins', sans-serif;
      max-width: 800px;
      margin: 0 auto;
      height: 100vh;
      display: flex;
      flex-direction: column;
    }
    
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px;
      background-color: #fff;
      border-bottom: 1px solid #eee;
      z-index: 10;
    }
    
    .title {
      font-size: 18px;
      font-weight: 600;
      color: #333;
      margin: 0;
    }
    
    .back-button {
      background-color: transparent;
      border: none;
      padding: 8px;
      cursor: pointer;
      font-size: 20px;
    }
    
    .map-container {
      flex: 1;
      width: 100%;
      position: relative;
    }
    
    .loading-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(255, 255, 255, 0.8);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    }
    
    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid rgba(0, 0, 0, 0.1);
      border-radius: 50%;
      border-left-color: #1a73e8;
      animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    .navigation-panel {
      background-color: white;
      padding: 16px;
      border-top: 1px solid #eee;
      box-shadow: 0 -2px 10px rgba(0,0,0,0.1);
    }
    
    .navigation-panel.active {
      background-color: #1a73e8;
      color: white;
    }
    
    .route-summary {
      display: flex;
      justify-content: space-between;
      margin-bottom: 16px;
    }
    
    .detail-item {
      text-align: center;
      flex: 1;
    }
    
    .detail-label {
      font-size: 12px;
      color: ${navigationActive ? 'rgba(255,255,255,0.8)' : '#666'};
      margin-bottom: 4px;
    }
    
    .detail-value {
      font-size: 18px;
      font-weight: 600;
      color: ${navigationActive ? 'white' : '#1a73e8'};
    }
    
    .navigation-action {
      background-color: ${navigationActive ? 'white' : '#1a73e8'};
      color: ${navigationActive ? '#1a73e8' : 'white'};
      border: none;
      padding: 12px;
      border-radius: 4px;
      font-size: 16px;
      font-weight: 500;
      cursor: pointer;
      width: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 8px;
    }
    
    .navigation-action:hover {
      background-color: ${navigationActive ? '#f5f5f5' : '#0d62c9'};
    }
    
    .maneuver-display {
      position: absolute;
      top: 16px;
      left: 16px;
      right: 16px;
      background-color: white;
      border-radius: 8px;
      padding: 16px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      display: ${navigationActive ? 'block' : 'none'};
      z-index: 100;
    }
    
    .direction-icon {
      font-size: 24px;
      margin-right: 12px;
      display: inline-block;
      width: 36px;
      height: 36px;
      background-color: #1a73e8;
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .maneuver-instructions {
      display: flex;
      align-items: center;
      margin-bottom: 8px;
    }
    
    .instruction-text {
      font-size: 16px;
      flex: 1;
    }
    
    .distance-to-maneuver {
      font-weight: 600;
      color: #1a73e8;
      font-size: 18px;
      text-align: right;
    }
    
    .next-road {
      color: #666;
      font-size: 14px;
      margin-left: 48px;
    }
    
    .arrive-time {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 0;
      border-top: 1px solid #eee;
      margin-top: 8px;
    }
    
    .arrive-label {
      color: #666;
      font-size: 14px;
    }
    
    .arrive-value {
      font-weight: 600;
      font-size: 16px;
    }
  `;

  return (
    <>
      <style>{styles}</style>
      <div className="directions-container">
        <div className="header">
          <button className="back-button" onClick={handleBackToHome}>
            ←
          </button>
          <h1 className="title">
            {navigationActive ? "Navigation" : "Directions to Parking"}
          </h1>
          <div style={{ width: 24 }}></div> {/* Empty div for flex spacing */}
        </div>
        
        {navigationActive && currentManeuver && (
          <div className="maneuver-display">
            <div className="maneuver-instructions">
              <div className="direction-icon">
                {getDirectionIcon(currentManeuver.direction)}
              </div>
              <div className="instruction-text">
                {currentManeuver.instruction}
              </div>
              <div className="distance-to-maneuver">
                {nextManeuverDistance < 1000 
                  ? `${Math.round(nextManeuverDistance)} m` 
                  : `${(nextManeuverDistance / 1000).toFixed(1)} km`
                }
              </div>
            </div>
            
            {currentManeuver.nextRoad && (
              <div className="next-road">
                Continue onto {currentManeuver.nextRoad}
              </div>
            )}
            
            <div className="arrive-time">
              <span className="arrive-label">Estimated arrival</span>
              <span className="arrive-value">{estimatedArrival}</span>
            </div>
          </div>
        )}
        
        <div className="map-container" ref={mapContainerRef}>
          {isLoading && (
            <div className="loading-overlay">
              <div className="spinner"></div>
            </div>
          )}
        </div>
        
        <div className={`navigation-panel ${navigationActive ? 'active' : ''}`}>
          {!isLoading && routeSummary && (
            <div className="route-summary">
              <div className="detail-item">
                <div className="detail-label">Distance</div>
                <div className="detail-value">{routeSummary.distance.toFixed(1)} km</div>
              </div>
              <div className="detail-item">
                <div className="detail-label">Duration</div>
                <div className="detail-value">{routeSummary.duration} min</div>
              </div>
              <div className="detail-item">
                <div className="detail-label">Arrival</div>
                <div className="detail-value">{estimatedArrival}</div>
              </div>
            </div>
          )}
          
          <button 
            className="navigation-action"
            onClick={navigationActive ? stopNavigation : startNavigation}
          >
            {navigationActive ? (
              <>
                <span>End Navigation</span>
              </>
            ) : (
              <>
                <span>Start Navigation</span>
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
};

export default DirectionsPage;