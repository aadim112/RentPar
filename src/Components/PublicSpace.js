import { useState } from 'react';
import { db } from '../firebase';
import { set, ref, push, get, update } from 'firebase/database';
import '../App.css';

function PublicSpace() {
    const [publicSpace, setPublicSpace] = useState({
        capacity: '',
        parking: { lat: '', lang: '' },
        votes: 0,
    });

    const fetchLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    setPublicSpace((prevState) => ({
                        ...prevState,
                        parking: { lat: latitude, lang: longitude },
                    }));
                },
                (error) => {
                    console.error("Error fetching location: ", error);
                }
            );
        } else {
            alert("Geolocation is not supported by your browser.");
        }
    };

    const checkChange = (e) => {
        const { name, value } = e.target;
        setPublicSpace((prevState) => ({
            ...prevState,
            [name]: value,
        }));
    };

    const handleAddSpace = async (e) => {
        e.preventDefault(); // Prevent default form submission

        const dbRef = ref(db, "publicSpace/");
        try {
            const snapshot = await get(dbRef);
            if (snapshot.exists()) {
                let existingEntryKey = null;

                snapshot.forEach((childSnapshot) => {
                    const data = childSnapshot.val();
                    const { lat, lang } = data.parking;
                    
                    // Check if the coordinates match or are very close (threshold ~0.0001 for slight variations)
                    if (
                        Math.abs(lat - publicSpace.parking.lat) <= 0.0001 &&
                        Math.abs(lang - publicSpace.parking.lang) <= 0.0001
                    ) {
                        existingEntryKey = childSnapshot.key; // Store the key of existing entry
                    }
                });

                if (existingEntryKey) {
                    // If found, increment votes by 1
                    const existingRef = ref(db, `publicSpace/${existingEntryKey}`);
                    update(existingRef, { votes: snapshot.child(existingEntryKey).val().votes + 1 })
                        .then(() => alert("Thanks for contribution. Go can go back"))
                        .catch((error) => console.error("Error updating votes: ", error));
                    return;
                }
            }

            // If no matching entry found, create a new one
            const newSpaceRef = push(dbRef);
            set(newSpaceRef, { ...publicSpace, votes: 1 }) // Start with 1 vote for new space
                .then(() => {
                    alert("Public space added successfully!");
                    setPublicSpace({
                        capacity: '',
                        parking: { lat: '', lang: '' },
                        votes: 0,
                    });
                })
                .catch((error) => console.error("Error adding public space: ", error));
        } catch (error) {
            console.error("Error fetching data: ", error);
        }
    };

    return (
        <div className='add-public-space'>
            <p style={{ marginLeft: '20px', fontFamily: 'Poppins', fontSize: '19px' }}>
                Thanks for taking efforts to add the public space. This will help others and you to discover the public space.
            </p>
            <p style={{ fontWeight: 'bold', fontFamily: 'Poppins', marginLeft: '20px', fontSize: '19px' }}>Instructions</p>
            <p style={{ fontFamily: 'Poppins', fontSize: '19px', marginLeft: '30px' }}>
                Stand at the exact place to add the space.
            </p>
            <form className='public-form' onSubmit={handleAddSpace}>
                <label>Capacity Of Parking</label>
                <input 
                    type='number' 
                    placeholder='Capacity' 
                    name='capacity' 
                    required 
                    value={publicSpace.capacity}
                    onChange={checkChange}
                />
                <input 
                    type='text' 
                    placeholder='Location' 
                    value={`${publicSpace.parking.lat}, ${publicSpace.parking.lang}`} 
                    readOnly 
                />
                <div className='get-location' onClick={fetchLocation}>Fetch location</div>
                <button type='submit'>Add Space</button>
            </form>
        </div>
    );
}

export default PublicSpace;
