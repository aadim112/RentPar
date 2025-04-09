import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { ref,set,get,update } from 'firebase/database';

const PaymentGateway = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = JSON.parse(sessionStorage.getItem("user"));
  const bookingInfo = location.state?.bookingInfo || {
    vehicleNumber: '',
    price: 0,
    details: {}
  };

  // Payment method states
  const [selectedMethod, setSelectedMethod] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [upiId, setUpiId] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [bankSelected, setBankSelected] = useState('');
  const [walletNumber, setWalletNumber] = useState('');

  const Transactionid = Math.random().toString(36).substring(2, 15).toUpperCase();

// Inside PaymentGateway.jsx - Update handlePayment function
// Only showing the modified part, keep the rest of the code the same

const handlePayment = (e) => {
  e.preventDefault();
  setIsProcessing(true);

  const trasactionDetails = {
    vehicleNumber: bookingInfo.vehicleNumber,
    startTime: bookingInfo.startTime,
    price: bookingInfo.price,
    details: bookingInfo.details,
    duration: bookingInfo.details.Duration,
    userId: user.uid,
    paymentMethod: selectedMethod,
    transactionId: Transactionid,
    timestamp: new Date().toISOString(),
    location: bookingInfo.location,
  };

  console.log("Transaction Details:", trasactionDetails);

  const transactionRef = ref(db, `transactions/${Transactionid}`);
  const parkingSpaceRef = ref(db, `parkingSpaces/${bookingInfo.details.id}`);
  const userBookingRef = ref(db, `users/${user.uid}/bookings/${Transactionid}`);

  const addTransactionToRealtimeDB = async () => {
    try {
      // Step 1: Save transaction globally
      await set(transactionRef, trasactionDetails);
      console.log("Transaction saved to /transactions");

      // Step 2: Read current parkingSpace data
      const snapshot = await get(parkingSpaceRef);
      const currentData = snapshot.val();
      const currentAllocated = currentData?.allocated || 0;

      // Step 3: Update parking space (increment + add booking)
      await update(parkingSpaceRef, {
        allocated: currentAllocated + 1,
        [`bookings/${Transactionid}`]: trasactionDetails
      });
      console.log("Parking space updated");

      // Step 4: Save to user's bookings
      await set(userBookingRef, trasactionDetails);
      console.log("Transaction saved under user's bookings");

    } catch (error) {
      console.error("Error during transaction handling:", error);
    }
  };

  // Call it
  addTransactionToRealtimeDB();

  // Simulate payment processing
  setTimeout(() => {
    setIsProcessing(false);
    setShowSuccess(true);

    setTimeout(() => {
      setShowSuccess(false);
      // Replace the navigate('/') with navigation to directions page
      navigate('/directions', { 
        state: { 
          parkingLocation: {
            lat: bookingInfo.location.lat,
            lng: bookingInfo.location.lng,
            address: bookingInfo.location.address || bookingInfo.details.Name
          } 
        }
      });
    }, 5000);
  }, 2000);
};

  
  

  const handleClose = () => {
    navigate(-1);
  };

  const formatCardNumber = (value) => {
    const digits = value.replace(/\D/g, '');
    const formatted = digits.replace(/(\d{4})(?=\d)/g, '$1 ');
    return formatted.substring(0, 19);
  };

  const formatExpiryDate = (value) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length > 2) {
      return `${digits.substring(0, 2)}/${digits.substring(2, 4)}`;
    }
    return digits;
  };

  const renderPaymentMethod = () => {
    switch(selectedMethod) {
      case 'card':
        return (
          <div className="payment-method-content">
            <div className="card-brands">
              <div className="card-brand visa"></div>
              <div className="card-brand mastercard"></div>
              <div className="card-brand amex"></div>
              <div className="card-brand discover"></div>
            </div>
            <div className="form-group">
              <label>Card Number</label>
              <input 
                type="text" 
                value={cardNumber} 
                onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                placeholder="1234 5678 9012 3456" 
                maxLength={19}
              />
            </div>
            <div className="form-group">
              <label>Cardholder Name</label>
              <input 
                type="text" 
                value={cardName} 
                onChange={(e) => setCardName(e.target.value)}
                placeholder="John Doe" 
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Expiry Date</label>
                <input 
                  type="text" 
                  value={expiryDate} 
                  onChange={(e) => setExpiryDate(formatExpiryDate(e.target.value))}
                  placeholder="MM/YY" 
                  maxLength={5}
                />
              </div>
              <div className="form-group">
                <label>CVV</label>
                <input 
                  type="password" 
                  value={cvv} 
                  onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').substring(0, 3))}
                  placeholder="123" 
                  maxLength={3}
                />
              </div>
            </div>
          </div>
        );
      case 'googlePay':
      case 'phonePay':
      case 'paytm':
      case 'amazonPay':
        return (
          <div className="payment-method-content">
            <div className="form-group">
              <label>UPI ID / Mobile Number</label>
              <input 
                type="text" 
                value={upiId} 
                onChange={(e) => setUpiId(e.target.value)}
                placeholder={selectedMethod === 'paytm' ? "Registered Mobile Number" : "yourname@upi"}
              />
            </div>
          </div>
        );
      case 'netBanking':
        return (
          <div className="payment-method-content">
            <div className="form-group">
              <label>Select Bank</label>
              <select 
                value={bankSelected} 
                onChange={(e) => setBankSelected(e.target.value)}
              >
                <option value="">Select a bank</option>
                <option value="sbi">State Bank of India</option>
                <option value="hdfc">HDFC Bank</option>
                <option value="icici">ICICI Bank</option>
                <option value="axis">Axis Bank</option>
                <option value="yes">Yes Bank</option>
                <option value="kotak">Kotak Mahindra Bank</option>
                <option value="pnb">Punjab National Bank</option>
                <option value="idfc">IDFC First Bank</option>
                <option value="bob">Bank of Baroda</option>
              </select>
            </div>
            <p className="info-text">You will be redirected to your bank's secure payment page.</p>
          </div>
        );
      case 'wallet':
        return (
          <div className="payment-method-content">
            <div className="form-group">
              <label>Mobile Number</label>
              <input 
                type="text" 
                value={walletNumber} 
                onChange={(e) => setWalletNumber(e.target.value.replace(/\D/g, '').substring(0, 10))}
                placeholder="10-digit Mobile Number" 
                maxLength={10}
              />
            </div>
            <p className="info-text">OTP will be sent to this mobile number for verification.</p>
          </div>
        );
      case 'emi':
        return (
          <div className="payment-method-content">
            <div className="form-group">
              <label>Select Credit Card</label>
              <select>
                <option value="">Select your bank</option>
                <option value="hdfc">HDFC Credit Card</option>
                <option value="icici">ICICI Credit Card</option>
                <option value="axis">Axis Credit Card</option>
                <option value="sbi">SBI Credit Card</option>
                <option value="amex">American Express</option>
              </select>
            </div>
            <div className="form-group">
              <label>Select EMI Duration</label>
              <div className="emi-options">
                <button type="button">3 Months</button>
                <button type="button">6 Months</button>
                <button type="button">9 Months</button>
                <button type="button">12 Months</button>
                <button type="button">18 Months</button>
                <button type="button">24 Months</button>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  // Inline styles
  const styles = `
    .payment-modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      font-family: 'Poppins';
    }
    
    .payment-modal {
      width: 90%;
      max-width: 500px;
      background-color: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      max-height: 90vh;
      overflow-y: auto;
    }
    
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding-bottom: 15px;
      border-bottom: 1px solid #eee;
    }
    
    .modal-title {
      font-size: 24px;
      font-weight: bold;
      color: #333;
      margin: 0;
    }
    
    .modal-subtitle {
      font-size: 14px;
      color: #666;
      margin: 5px 0 0 0;
      font-family: 'Poppins';
    }
    
    .close-button {
      background: none;
      border: none;
      font-size: 20px;
      color: #999;
      cursor: pointer;
    }
    
    .booking-details {
      background-color: #f9f9f9;
      padding: 15px;
      border-radius: 6px;
      margin-bottom: 20px;
      font-family: 'Poppins';
    }
    
    .booking-title {
      font-size: 18px;
      font-weight: 500;
      color: #444;
      margin-bottom: 10px;
      font-family: 'Poppins';
    }
    
    .booking-item {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
    }
    
    .booking-label {
      color: #666;
    }
    
    .booking-value {
      font-weight: 500;
    }
    
    .total-amount {
      display: flex;
      justify-content: space-between;
      padding-top: 10px;
      margin-top: 10px;
      border-top: 1px solid #eee;
      font-weight: bold;
      font-family: 'Poppins';
    }
    
    .amount-value {
      color: #1a73e8;
    }
    
    .payment-methods {
      margin-bottom: 20px;
      font-family: 'Poppins';
    }
    
    .payment-methods-title {
      font-size: 18px;
      font-weight: 500;
      color: #444;
      margin-bottom: 15px;
      font-family: 'Poppins';
    }
    
    .method-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      margin-bottom: 15px;
    }
    
    .method-button {
      padding: 15px;
      border: 1px solid #ddd;
      border-radius: 6px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      background-color: white;
    }
    
    .method-button.selected {
      border-color: #1a73e8;
      background-color: #e8f0fe;
    }
    
    .method-button:hover {
      background-color: #f5f5f5;
    }
    
    .method-icon {
      font-size: 24px;
      margin-bottom: 5px;
    }
    
    .method-label {
      font-size: 12px;
      font-weight: 500;
      font-family: 'Poppins';
    }
    
    .wallets-section {
      background-color: #f9f9f9;
      padding: 15px;
      border-radius: 6px;
      margin-bottom: 15px;
    }
    
    .wallets-title {
      font-size: 14px;
      font-weight: 500;
      color: #444;
      margin-bottom: 10px;
    }
    
    .wallets-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      font-family: 'Poppins';0
    }
    
    .wallet-button {
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 6px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      background-color: white;
      font-family: 'Poppins';
    }
    
    .wallet-button.selected {
      border-color: #1a73e8;
      background-color: #e8f0fe;
    }
    
    .wallet-button:hover {
      background-color: #f5f5f5;
    }
    
    .wallet-icon {
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 5px;
      font-weight: bold;
      font-size: 16px;
    }
    
    .wallet-label {
      font-size: 12px;
      font-weight: 500;
    }
    
    .payment-method-content {
      background-color: white;
      padding: 15px;
      border: 1px solid #eee;
      border-radius: 6px;
    }
    
    .form-group {
      margin-bottom: 15px;
    }
    
    .form-group label {
      display: block;
      font-size: 14px;
      font-weight: 500;
      color: #444;
      margin-bottom: 5px;
    }
    
    .form-group input,
    .form-group select {
      width: 100%;
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 14px;
    }
    
    .form-row {
      display: flex;
      gap: 15px;
    }
    
    .form-row .form-group {
      flex: 1;
    }
    
    .info-text {
      font-size: 12px;
      color: #666;
      margin-top: 10px;
    }
    
    .submit-button {
      width: 100%;
      padding: 12px;
      background-color: #1a73e8;
      color: white;
      border: none;
      border-radius: 4px;
      font-size: 16px;
      font-weight: 500;
      cursor: pointer;
      margin-top: 20px;
    }
    
    .submit-button:hover {
      background-color: #0d62c9;
    }
    
    .submit-button:disabled {
      background-color: #ccc;
      cursor: not-allowed;
    }
    
    .processing-spinner {
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .spinner {
      animation: spin 1s linear infinite;
      margin-right: 10px;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    .success-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1001;
    }
    
    .success-modal {
      background-color: white;
      padding: 30px;
      border-radius: 8px;
      max-width: 350px;
      text-align: center;
    }
    
    .success-icon {
      width: 64px;
      height: 64px;
      background-color: #e6f4ea;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 20px;
    }
    
    .success-icon svg {
      width: 32px;
      height: 32px;
      color: #34a853;
    }
    
    .success-title {
      font-size: 20px;
      font-weight: bold;
      color: #333;
      margin-bottom: 10px;
    }
    
    .success-message {
      color: #666;
      margin-bottom: 20px;
    }
    
    .transaction-id {
      background-color: #f9f9f9;
      padding: 10px;
      border-radius: 4px;
      margin-bottom: 20px;
      font-size: 14px;
      font-weight: 500;
    }
    
    .redirect-message {
      font-size: 14px;
      color: #666;
    }
    
    .card-brands {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      margin-bottom: 15px;
    }
    
    .card-brand {
      width: 40px;
      height: 24px;
      border-radius: 4px;
    }
    
    .card-brand.visa {
      background-color: #1a1f71;
    }
    
    .card-brand.mastercard {
      background-color: #eb001b;
    }
    
    .card-brand.amex {
      background-color: #016fd0;
    }
    
    .card-brand.discover {
      background-color: #ff6000;
    }
    
    .emi-options {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
      margin-top: 10px;
    }
    
    .emi-options button {
      padding: 8px;
      border: 1px solid #ddd;
      border-radius: 4px;
      background-color: white;
      cursor: pointer;
    }
    
    .emi-options button:hover {
      background-color: #f5f5f5;
    }
  `;

  return (
    <>
      <style>{styles}</style>
      <div className="payment-modal-overlay">
        <div className="payment-modal">
          <div className="modal-header">
            <div>
              <h2 className="modal-title">Checkout</h2>
              <p className="modal-subtitle">Secure Payment Gateway</p>
            </div>
            <button onClick={handleClose} className="close-button">
              ×
            </button>
          </div>
          
          <div className="booking-details">
            <h3 className="booking-title">Booking Details</h3>
            <div className="booking-items">
              <div className="booking-item">
                <span className="booking-label">Vehicle:</span>
                <span className="booking-value">{bookingInfo.vehicleNumber}</span>
              </div>
              {bookingInfo.details && Object.entries(bookingInfo.details).map(([key, value]) => (
                <div key={key} className="booking-item">
                  <span className="booking-label">{key}:</span>
                  <span className="booking-value">{value}</span>
                </div>
              ))}
              <div className="booking-item total-amount">
                <span className="booking-label">Total Amount:</span>
                <span className="booking-value amount-value">₹{bookingInfo.price.toFixed(2)}</span>
              </div>
            </div>
          </div>
          
          <div className="payment-methods">
            <h3 className="payment-methods-title">Select Payment Method</h3>
            <div className="method-grid">
              <button 
                className={`method-button ${selectedMethod === 'card' ? 'selected' : ''}`}
                onClick={() => setSelectedMethod('card')}
                type="button"
              >
                <div className="method-icon">💳</div>
                <span className="method-label">Card</span>
              </button>
              <button 
                className={`method-button ${selectedMethod === 'netBanking' ? 'selected' : ''}`}
                onClick={() => setSelectedMethod('netBanking')}
                type="button"
              >
                <div className="method-icon">🏦</div>
                <span className="method-label">Net Banking</span>
              </button>
              <button 
                className={`method-button ${selectedMethod === 'emi' ? 'selected' : ''}`}
                onClick={() => setSelectedMethod('emi')}
                type="button"
              >
                <div className="method-icon">📅</div>
                <span className="method-label">EMI</span>
              </button>
            </div>
            
            <div className="wallets-section">
              <h4 className="wallets-title">UPI / Wallets</h4>
              <div className="wallets-grid">
                <button 
                  className={`wallet-button ${selectedMethod === 'googlePay' ? 'selected' : ''}`}
                  onClick={() => setSelectedMethod('googlePay')}
                  type="button"
                >
                  <div className="wallet-icon" style={{ color: '#4285F4' }}>G</div>
                  <span className="wallet-label">Google Pay</span>
                </button>
                <button 
                  className={`wallet-button ${selectedMethod === 'phonePay' ? 'selected' : ''}`}
                  onClick={() => setSelectedMethod('phonePay')}
                  type="button"
                >
                  <div className="wallet-icon" style={{ color: '#5F259F' }}>P</div>
                  <span className="wallet-label">PhonePe</span>
                </button>
                <button 
                  className={`wallet-button ${selectedMethod === 'paytm' ? 'selected' : ''}`}
                  onClick={() => setSelectedMethod('paytm')}
                  type="button"
                >
                  <div className="wallet-icon" style={{ color: '#00BAF2' }}>P</div>
                  <span className="wallet-label">Paytm</span>
                </button>
                <button 
                  className={`wallet-button ${selectedMethod === 'amazonPay' ? 'selected' : ''}`}
                  onClick={() => setSelectedMethod('amazonPay')}
                  type="button"
                >
                  <div className="wallet-icon" style={{ color: '#FF9900' }}>A</div>
                  <span className="wallet-label">Amazon</span>
                </button>
                <button 
                  className={`wallet-button ${selectedMethod === 'wallet' ? 'selected' : ''}`}
                  onClick={() => setSelectedMethod('wallet')}
                  type="button"
                >
                  <div className="wallet-icon">💰</div>
                  <span className="wallet-label">E-wallet</span>
                </button>
              </div>
            </div>
          </div>
          
          {selectedMethod && (
            <form onSubmit={handlePayment}>
              <div className="payment-method-content">
                {renderPaymentMethod()}
              </div>
              
              <button 
                type="submit" 
                className="submit-button"
                disabled={isProcessing || 
                  (selectedMethod === 'card' && (!cardNumber || !cardName || !expiryDate || !cvv)) ||
                  ((selectedMethod === 'googlePay' || selectedMethod === 'phonePay' || selectedMethod === 'paytm' || selectedMethod === 'amazonPay') && !upiId) ||
                  (selectedMethod === 'netBanking' && !bankSelected) ||
                  (selectedMethod === 'wallet' && !walletNumber)
                }
              >
                {isProcessing ? (
                  <div className="processing-spinner">
                    <div className="spinner">↻</div>
                    Processing...
                  </div>
                ) : (
                  `Pay ₹${bookingInfo.price.toFixed(2)}`
                )}
              </button>
            </form>
          )}
        </div>
      </div>
      
      {showSuccess && (
        <div className="success-overlay">
          <div className="success-modal">
            <div className="success-icon">
              ✓
            </div>
            <h3 className="success-title">Payment Successful!</h3>
            <p className="success-message">Your payment of ₹{bookingInfo.price.toFixed(2)} has been processed successfully.</p>
            <div className="transaction-id">
              Transaction ID: {Transactionid}
            </div>
            <p className="redirect-message">You'll be redirected shortly...</p>
          </div>
        </div>
      )}
    </>
  );
};

export default PaymentGateway;