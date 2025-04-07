import '../App.css'
import { set,ref,get } from 'firebase/database'
import { db } from '../firebase'
import { use, useEffect, useState } from 'react'

const Profile = (props) => {
    const [userdata,setUserData] = useState({});
    const [userSpaces,setUserSpaces] = useState([]);
    const uid = props.user.uid;

    const getUserData = async (uid) => {
        try {
          const userRef = ref(db, `users/${uid}`); // Path to user's data
          const snapshot = await get(userRef);
          
          if (snapshot.exists()) {
            console.log("User Data:", snapshot.val());
            setUserData(snapshot.val());
          } else {
            console.log("No user found with this UID.");
            return null;
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          return null;
        }
      };
      useEffect(() => {
        if (uid) {
          getUserData(uid);
        }
      }, [uid]); // Fetch user data when UID changes
      
      useEffect(() => {
        if (userdata?.space?.length) {
          getUserSpaces(userdata.space);
        }
      }, [userdata.space]); // Trigger when userdata.space is updated

      useEffect(() => {
        console.log("User spaces:", userSpaces);
      },[userSpaces]);
      
      
      const getUserSpaces = async (Userspaces) => {
        try {
          const fetchedSpaces = [];
      
          for (const spaceId of Userspaces) {
            const userRef = ref(db, `parkingSpaces/${spaceId}`);
            const snapshot = await get(userRef);
      
            if (snapshot.exists()) {
              console.log(`Got user space: ${spaceId}`);
              fetchedSpaces.push({ id: spaceId, ...snapshot.val() }); // Ensure each entry has an ID
            } else {
              console.log(`No user space found for: ${spaceId}`);
            }
          }
      
          // Remove duplicates by using a Set based on space ID
          setUserSpaces((prevUserSpaces) => {
            const combinedSpaces = [...prevUserSpaces, ...fetchedSpaces];
            const uniqueSpaces = Array.from(new Map(combinedSpaces.map(space => [space.id, space])).values());
            return uniqueSpaces;
          });
      
        } catch (error) {
          alert(error);
        }
      };
      
      


  return (
    <>
    <div className='profile-details'>
        <h2>Profile</h2>
        <div className='info-container'>
            <p>Name : {userdata.name}</p>
            <p>Email: {userdata.email}</p>
        </div>
        <div className='Space-details'>
          <h2>My Listed Spaces</h2>
          {userSpaces.length > 0 ?(
            <div className='space-l'>
              <div className='space-header'>
                <p>Full Name</p>
                <p>Price/min</p>
                <p>Capacity</p>
                <p>Booked</p>
              </div>
            {userSpaces.map((space, index) => (
              <div className='space'>
                <p>{space.fullname}</p>
                <p>{space.Price}/min</p>
                <p>{space.capacity}</p>
                <p>{space.allocated}</p>
              </div>
            ))}
          </div>
          ):(<p style={{textAlign:'center',fontFamily:'poppins',fontWeight:'bold'}}>No spaces added yet</p>)}
        </div>
    </div>
    </>
  )
}

export default Profile
