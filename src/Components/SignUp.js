import {  useState ,useEffect} from 'react'
import '../App.css'
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
    const [action,setAction] = useState('Login');

    const [sessionUser, setSessionUser] = useState(() => {
        const storedUser = sessionStorage.getItem("user");
        return storedUser ? JSON.parse(storedUser) : null;
    });


      useEffect(() => {
        if (onSetUser) {
          onSetUser(sessionUser);
        }
      }, [sessionUser]);

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
            email: user.email
        };
        setSessionUser(userData);
        sessionStorage.setItem("user", JSON.stringify(userData));

        //   //storing the sessional data
        //   sessionStorage.setItem("user", JSON.stringify({
        //     uid : user.uid,
        //     name : user.displayName,
        //     email: user.email
        //   }));
        alert("Login Successful!");
        
        } catch (err) {
          setError('Invalid Credentials');
        }
      };
      const handleSignup = async (e) => {
        e.preventDefault();
        try {
          const userCredendail = await createUserWithEmailAndPassword(auth, email, password);
          const user = userCredendail.user;

        //Storing the sessional data
        const userData = {
            uid: user.uid,
            name: user.displayName || "Unknown", // Handle missing name
            email: user.email
        };
        setSessionUser(userData);
        sessionStorage.setItem("user", JSON.stringify(userData));
        
        //storing the sessional data
          sessionStorage.setItem("user", JSON.stringify({
            uid : user.uid,
            name : user.displayName,
            email: user.email
          }));
        
          alert("Account Created Successfully!");
        } catch (err) {
          setError('Invalid Credentials');
        }
      };

            // //Checking user in the session or not
            // const user = JSON.parse(sessionStorage.getItem("user"));
            // if (user) {
            //     console.log("Logged-in user:", user.name);
            // } else {
            //     console.log("No user logged in");
            // }
        

    return(
        <div style={{width:'100%',height:'auto',display:'flex',alignItems:'center',justifyContent:'center'}}>
        <div className='account-contianer'>
        {error && <p style={{ color: "red", fontFamily:'poppins',fontWeight:'bold',marginLeft:'20px'}}>{error}</p>}
            {action === 'Login' ? (
                <form className='login' id='login' style={{width:'550px',height:'auto',backgroundColor:'#ffd32c',borderRadius:'9px',display:'flex',flexDirection:'column'}}>
                    <p style={{fontFamily:'Poppins',fontSize:'25px',marginBottom:'0px',fontWeight:'bold',marginLeft:'20px'}}>Login</p>
                    <label>Email:</label>
                    <input type='email' placeholder='Email' name='email' value={email} onChange={(e) => setEmail(e.target.value)} required></input>
                    <label>Password:</label>
                    <input type='password' placeholder='Password' name='password' value={password} onChange={(e) => setPassword(e.target.value)} required></input>
                    <button type='submit' onClick={(e)=>(handleLogin(e))}>Login</button>
                    <span style={{display:'flex',alignItems:'center',fontFamily:'poppins',marginLeft:'20px'}}><p style={{fontSize:'15px'}}>Don't have account?</p><p style={{textDecoration:'none',fontSize:'15px',marginLeft:'2px',cursor:'pointer',color:'blue'}} onClick={() => manageAccount('Signup')}>SignUp</p></span>
                </form>
            ) : (
                <form className='signup' id='signup' style={{width:'550px',height:'auto',backgroundColor:'#ffd32c',borderRadius:'9px',display:'flex',flexDirection:'column'}}>
                    <p style={{fontFamily:'Poppins',fontSize:'25px',marginBottom:'0px',fontWeight:'bold',marginLeft:'20px'}}>Signup</p>
                    <label>Full Name</label>
                    <input type='text' placeholder='Full Name' name='name' value={name} onChange={(e) => setName(e.target.value)} required></input>
                    <label>Email</label>
                    <input type='email' placeholder='Email' name='email' value={email} onChange={(e) => setEmail(e.target.value)} required></input>
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