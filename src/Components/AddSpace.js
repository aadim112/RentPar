import '../App.css'

function AddSpace(){
  return (
    <>
    <div className='add-space-container'>
        <div style={{width:'100%',height:'20px'}}></div>
        <p style={{marginLeft:'30px',fontFamily:'poppins',fontSize:'25px',fontWeight:'bolder'}}>Add Your Parking Space</p>
        <form className='add-space-form'>
            <label>Full Name</label>
            <input type='text' placeholder='Full Name*'></input>
            <label>Age*</label>
            <input type='text' placeholder='Age*'></input>
            <label>Add parking Location</label>
            <input type='text' placeholder='Age*'></input>
            <span>
                <label style={{fontWeight:'bolder'}}>Do you own this space?</label>
                <span>
                    <label style={{marginLeft:'10px',fontWeight:'400'}}><input type='radio' name='space'></input>No</label>
                    <label style={{marginLeft:'10px',fontWeight:'400'}}><input type='radio' name='space'></input>Yes</label>
                </span>
            </span>
        </form>
    </div>
    </>
  )
}

export default AddSpace