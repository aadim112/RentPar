import '../App.css'
import { set,ref,get } from 'firebase/database'
import { db } from '../firebase'
import { useEffect, useState } from 'react'

const Profile = (props) => {
    const [userdata,setUserData] = useState({});
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
        getUserData(uid);
      }, [uid]);



  return (
    <>
    <div className='profile-details'>
        <h2>Profile</h2>
        <div className='info-container'>
            <p>Name : {userdata.name}</p>
            <p>Email: {userdata.email}</p>
        </div>
    </div>
    </>
  )
}

export default Profile
