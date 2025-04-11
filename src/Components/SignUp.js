import {  useState ,useEffect} from 'react'
import '../App.css'
import { useNavigate } from 'react-router-dom';
import {auth} from '../firebase'
import { db } from '../firebase';
import { ref,getDatabase,set } from 'firebase/database';
import { signInWithEmailAndPassword,updateProfile } from 'firebase/auth';
import { createUserWithEmailAndPassword } from 'firebase/auth';

const SignUp = ({ onSetUser }) =>{
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [name,setName] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [action,setAction] = useState('Login');

    const [sessionUser, setSessionUser] = useState(() => {
        const storedUser = sessionStorage.getItem("user");
        return storedUser ? JSON.parse(storedUser) : null;
    });

    const navigate = useNavigate();

    useEffect(() => {
        if (onSetUser) {
          onSetUser(sessionUser);
        }
    }, [sessionUser, onSetUser]);

    function manageAccount(value){
        setAction(value);
        console.log(action);
    }

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
          await signInWithEmailAndPassword(auth, email, password);
          const userCredendail = await signInWithEmailAndPassword(auth,email,password);
          const user = userCredendail.user;
          await updateProfile(user, { displayName: name });

        
        //Storing the sessional data
        const userData = {
            uid: user.uid,
            name: user.displayName || "Unknown", // Handle missing name
            email: user.email,
            spaces : []
        };
        setSessionUser(userData);
        sessionStorage.setItem("user", JSON.stringify(userData));

        navigate('/');
        } catch (err) {
          setError('Invalid Credentials');
        }
    };
      
    const handleSignup = async (e) => {
        e.preventDefault();
        
        // Basic validations
        if (!name || !email || !password || !phoneNumber) {
            setError("All fields are required");
            return;
        }
        
        // Validate phone number (simple check for now)
        if (!/^\d{10}$/.test(phoneNumber)) {
            setError("Please enter a valid 10-digit phone number");
            return;
        }
        
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // 🔹 Update user profile in Firebase Auth
            await updateProfile(user, { displayName: name });

            // 🔹 Store user in Firebase Realtime Database with phone number
            const db = getDatabase();
            set(ref(db, "users/" + user.uid), {
                uid: user.uid,
                name: name,
                email: email,
                phone: phoneNumber,
                createdAt: new Date().toISOString(),
                space: []
            });

            // 🔹 Store session data
            const userData = {
                uid: user.uid,
                name: name,
                email: email,
                phone: phoneNumber,
                spaces: []
            };

            setSessionUser(userData);
            sessionStorage.setItem("user", JSON.stringify(userData));

            alert("Account Created Successfully!");
            navigate('/')
        } catch (err) {
            setError(err.message);
        }
    };

    return(
        <div style={{width:'100%',height:'auto',display:'flex',alignItems:'center',justifyContent:'center'}}>
        <div className='account-contianer'>
        {error && <p style={{ color: "red", fontFamily:'poppins',fontWeight:'bold',marginLeft:'20px'}}>{error}</p>}
            {action === 'Login' ? (
                <form className='login' id='login'>
                    <p style={{fontFamily:'Poppins',fontSize:'25px',marginBottom:'0px',fontWeight:'bold',marginLeft:'20px'}}>Login</p>
                    <label>Email:</label>
                    <input type='email' placeholder='Email' name='email' value={email} onChange={(e) => setEmail(e.target.value)} required></input>
                    <label>Password:</label>
                    <input type='password' placeholder='Password' name='password' value={password} onChange={(e) => setPassword(e.target.value)} required></input>
                    <button type='submit' onClick={(e)=>(handleLogin(e))}>Login</button>
                    <span style={{display:'flex',alignItems:'center',fontFamily:'poppins',marginLeft:'20px'}}><p style={{fontSize:'15px'}}>Don't have account?</p><p style={{textDecoration:'none',fontSize:'15px',marginLeft:'2px',cursor:'pointer',color:'blue'}} onClick={() => manageAccount('Signup')}>SignUp</p></span>
                </form>
            ) : (
                <form className='signup' id='signup'>
                    <p style={{fontFamily:'Poppins',fontSize:'25px',marginBottom:'0px',fontWeight:'bold',marginLeft:'20px'}}>Signup</p>
                    <label>Full Name</label>
                    <input type='text' placeholder='Full Name' name='name' value={name} onChange={(e) => setName(e.target.value)} required></input>
                    <label>Email</label>
                    <input type='email' placeholder='Email' name='email' value={email} onChange={(e) => setEmail(e.target.value)} required></input>
                    <label>Phone Number</label>
                    <input 
                        type='tel' 
                        placeholder='10-digit phone number' 
                        name='phone' 
                        value={phoneNumber} 
                        onChange={(e) => setPhoneNumber(e.target.value)} 
                        pattern="[0-9]{10}" 
                        required
                    ></input>
                    <label>Password</label>
                    <input type='Password' placeholder='Password' name='password' value={password} onChange={(e) => setPassword(e.target.value)} required></input>
                    <input type='Password' placeholder='Confirm Password'></input>
                    <button type='submit' onClick={(e) => (handleSignup(e))}>SignUp</button>
                    <span style={{display:'flex',alignItems:'center',fontFamily:'poppins',marginLeft:'20px'}}><p style={{fontSize:'15px'}} >Already have account?</p><p style={{textDecoration:'none',fontSize:'15px',marginLeft:'2px',cursor:'pointer',color:'blue'}} onClick={() => manageAccount('Login')}>Login</p></span>
                </form>
            )}
        </div>
        </div>
    );
};

export default SignUp