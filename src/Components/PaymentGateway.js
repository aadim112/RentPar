import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { ref, set, get, update } from 'firebase/database';

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
  const [arrivalPaymentOption, setArrivalPaymentOption] = useState('cash'); // New state for arrival payment preference

  const Transactionid = Math.random().toString(36).substring(2, 15).toUpperCase();

  const handlePayment = (e) => {
    e.preventDefault();
    setIsProcessing(true);

    const transactionDetails = {
      vehicleNumber: bookingInfo.vehicleNumber,
      startTime: bookingInfo.startTime,
      price: bookingInfo.price,
      details: bookingInfo.details,
      duration: bookingInfo.details.Duration,
      userId: user.uid,
      paymentMethod: selectedMethod,
      paymentPreference: selectedMethod === 'onArrival' ? arrivalPaymentOption : null, // Store payment preference
      transactionId: Transactionid,
      timestamp: new Date().toISOString(),
      location: bookingInfo.location,
      paymentStatus: selectedMethod === 'onArrival' ? 'pending' : 'completed'
    };

    console.log("Transaction Details:", transactionDetails);

    const transactionRef = ref(db, `transactions/${Transactionid}`);
    const parkingSpaceRef = ref(db, `parkingSpaces/${bookingInfo.details.id}`);
    const userBookingRef = ref(db, `users/${user.uid}/bookings/${Transactionid}`);

    const addTransactionToRealtimeDB = async () => {
      try {
        // Step 1: Save transaction globally
        await set(transactionRef, transactionDetails);
        console.log("Transaction saved to /transactions");

        // Step 2: Read current parkingSpace data
        const snapshot = await get(parkingSpaceRef);
        const currentData = snapshot.val();
        const currentAllocated = currentData?.allocated || 0;

        // Step 3: Update parking space (increment + add booking)
        await update(parkingSpaceRef, {
          allocated: currentAllocated + 1,
          [`bookings/${Transactionid}`]: transactionDetails
        });
        console.log("Parking space updated");

        // Step 4: Save to user's bookings
        await set(userBookingRef, transactionDetails);
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
      case 'onArrival':
        return (
          <div className="payment-method-content">
            <div className="on-arrival-notice">
              <h4>Pay When You Arrive</h4>
              <p>Choose this option to pay at the parking location when you arrive.</p>
              
              <div className="form-group">
                <label>Payment Preference</label>
                <div className="arrival-payment-options">
                  <button 
                    type="button" 
                    className={`arrival-option ${arrivalPaymentOption === 'cash' ? 'selected' : ''}`}
                    onClick={() => setArrivalPaymentOption('cash')}
                  >
                    <div className="option-icon">💵</div>
                    <span>Cash</span>
                  </button>
                  <button 
                    type="button" 
                    className={`arrival-option ${arrivalPaymentOption === 'card' ? 'selected' : ''}`}
                    onClick={() => setArrivalPaymentOption('card')}
                  >
                    <div className="option-icon">💳</div>
                    <span>Card</span>
                  </button>
                  <button 
                    type="button" 
                    className={`arrival-option ${arrivalPaymentOption === 'upi' ? 'selected' : ''}`}
                    onClick={() => setArrivalPaymentOption('upi')}
                  >
                    <div className="option-icon">📱</div>
                    <span>UPI</span>
                  </button>
                </div>
              </div>
              
              <ul>
                <li>Present your booking confirmation at the entrance</li>
                <li>Payment will be collected when you exit</li>
                <li>Look for "Pay on Arrival" signs at the venue</li>
              </ul>
              <p><strong>Note:</strong> A ₹50 convenience fee will be added for on-arrival payments.</p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  // Inline styles
  const styles = `
    /* Base Modal Styles */
    .payment-modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
      font-family: 'Poppins';
    }
    
    .payment-modal {
      background-color: #fff;
      border-radius: 12px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
      width: 90%;
      max-width: 550px;
      max-height: 90vh;
      overflow-y: auto;
      padding: 0;
      position: relative;
      font-family: 'Poppins';
    }
    
    /* Header Styles */
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 25px;
      border-bottom: 1px solid #eaeaea;
      background-color: #f8f9fa;
      border-radius: 12px 12px 0 0;
    }
    
    .modal-title {
      margin: 0;
      font-size: 24px;
      color: #333;
      font-family: 'Poppins';
    }
    
    .modal-subtitle {
      margin: 5px 0 0;
      color: #666;
      font-size: 14px;
      font-family: 'Poppins';
    }
    
    .close-button {
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      color: #666;
      font-family: 'Poppins';
    }
    
    /* Booking Details Styles */
    .booking-details {
      padding: 20px 25px;
      border-bottom: 1px solid #eaeaea;
      background-color: #f8f9fa;
      font-family: 'Poppins';
    }
    
    .booking-title {
      margin: 0 0 15px;
      font-size: 18px;
      color: #333;
      font-family: 'Poppins';
    }
    
    .booking-item {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
    }
    
    .booking-label {
      color: #666;
      font-size: 14px;
      font-family: 'Poppins';
    }
    
    .booking-value {
      font-weight: 500;
      color: #333;
      font-size: 14px;
    }
    
    .total-amount {
      margin-top: 15px;
      padding-top: 10px;
      border-top: 1px dashed #ddd;
    }
    
    .amount-value {
      font-size: 18px;
      font-weight: 600;
      color: #0a66c2;
      font-family: 'Poppins';
    }
    
    /* Payment Methods Styles */
    .payment-methods {
      padding: 20px 25px;
      font-family: 'Poppins';
    }
    
    .payment-methods-title {
      margin: 0 0 15px;
      font-size: 18px;
      color: #333;
      font-family: 'Poppins';
    }
    
    .method-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      margin-bottom: 20px;
    }
    
    .method-button {
      border: 1px solid #ddd;
      background-color: white;
      border-radius: 8px;
      padding: 10px;
      cursor: pointer;
      transition: all 0.2s;
      text-align: center;
    }
    
    .method-button.selected {
      border-color: #0a66c2;
      background-color: #e6f2ff;
    }
    
    .method-icon {
      font-size: 24px;
      margin-bottom: 5px;
      font-family: 'Poppins';
    }
    
    .method-label {
      display: block;
      font-size: 12px;
      color: #333;
      font-family: 'Poppins';
    }
    
    /* Wallets Section Styles */
    .wallets-section {
      margin-top: 20px;
    }
    
    .wallets-title {
      margin: 0 0 10px;
      font-size: 16px;
      color: #333;
    }
    
    .wallets-grid {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 10px;
    }
    
    .wallet-button {
      border: 1px solid #ddd;
      background-color: white;
      border-radius: 8px;
      padding: 10px 5px;
      cursor: pointer;
      transition: all 0.2s;
      text-align: center;
    }
    
    .wallet-button.selected {
      border-color: #0a66c2;
      background-color: #e6f2ff;
    }
    
    .wallet-icon {
      font-size: 18px;
      margin-bottom: 5px;
      font-weight: bold;
    }
    
    .wallet-label {
      display: block;
      font-size: 11px;
      color: #333;
    }
    
    /* Form Styles */
    .payment-method-content {
      padding: 20px 25px;
      border-top: 1px solid #eaeaea;
    }
    
    .form-group {
      margin-bottom: 15px;
    }
    
    .form-group label {
      display: block;
      margin-bottom: 5px;
      font-size: 14px;
      color: #666;
    }
    
    .form-group input,
    .form-group select {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid #ddd;
      border-radius: 6px;
      font-size: 14px;
    }
    
    .form-row {
      display: flex;
      gap: 15px;
    }
    
    .form-row .form-group {
      flex: 1;
    }
    
    .card-brands {
      display: flex;
      gap: 10px;
      margin-bottom: 15px;
    }
    
    .info-text {
      color: #666;
      font-size: 13px;
      margin-top: 10px;
    }
    
    .emi-options {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
    }
    
    .emi-options button {
      border: 1px solid #ddd;
      background-color: white;
      border-radius: 6px;
      padding: 8px;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .emi-options button:hover {
      background-color: #f5f5f5;
    }
    
    /* Submit Button Styles */
    .submit-button {
      background-color: #0a66c2;
      color: white;
      border: none;
      border-radius: 6px;
      padding: 12px;
      font-size: 16px;
      font-weight: 500;
      cursor: pointer;
      width: 100%;
      margin-top: 15px;
      transition: background-color 0.2s;
    }
    
    .submit-button:disabled {
      background-color: #cccccc;
      cursor: not-allowed;
    }
    
    /* Processing and Success Modal Styles */
    .processing-spinner {
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .spinner {
      margin-right: 10px;
      animation: spin 1s linear infinite;
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
      background-color: rgba(0, 0, 0, 0.7);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1100;
    }
    
    .success-modal {
      background-color: white;
      border-radius: 12px;
      padding: 30px;
      text-align: center;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
      max-width: 400px;
      width: 90%;
    }
    
    .success-icon {
      background-color: #4caf50;
      color: white;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      display: flex;
      justify-content: center;
      align-items: center;
      font-size: 30px;
      margin: 0 auto 20px;
    }
    
    .success-title {
      color: #333;
      margin: 0 0 10px;
      font-size: 24px;
    }
    
    .success-message {
      color: #666;
      margin-bottom: 20px;
    }
    
    .transaction-id {
      background-color: #f5f5f5;
      padding: 10px;
      border-radius: 6px;
      margin-bottom: 20px;
      font-family: monospace;
      font-size: 14px;
      color: #333;
    }
    
    .redirect-message {
      color: #999;
      font-size: 14px;
      margin: 0;
    }
    
    /* On Arrival Payment Option Styles */
    .on-arrival-notice {
      background-color: #fff8e1;
      padding: 15px;
      border-radius: 6px;
      margin-top: 15px;
      border-left: 4px solid #ffc107;
    }
    
    .on-arrival-notice h4 {
      margin-top: 0;
      color: #ff6f00;
    }
    
    .on-arrival-notice ul {
      margin-bottom: 0;
      padding-left: 20px;
    }
    
    /* New styles for Arrival Payment Options */
    .arrival-payment-options {
      display: flex;
      gap: 10px;
      margin: 10px 0 15px;
    }
    
    .arrival-option {
      flex: 1;
      border: 1px solid #ddd;
      background-color: white;
      border-radius: 8px;
      padding: 10px;
      cursor: pointer;
      transition: all 0.2s;
      text-align: center;
    }
    
    .arrival-option.selected {
      border-color: #ff6f00;
      background-color: #fff3e0;
    }
    
    .option-icon {
      font-size: 20px;
      margin-bottom: 5px;
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
              <button 
                className={`method-button ${selectedMethod === 'onArrival' ? 'selected' : ''}`}
                onClick={() => setSelectedMethod('onArrival')}
                type="button"
              >
                <div className="method-icon">💰</div>
                <span className="method-label">Pay On Arrival</span>
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
                  selectedMethod === 'onArrival' ? 'Confirm Booking' : `Pay ₹${bookingInfo.price.toFixed(2)}`
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
            <h3 className="success-title">
              {selectedMethod === 'onArrival' ? 'Booking Confirmed!' : 'Payment Successful!'}
            </h3>
            <p className="success-message">
              {selectedMethod === 'onArrival' 
                ? `Please pay ₹${bookingInfo.price.toFixed(2)} ${arrivalPaymentOption === 'cash' ? 'in cash' : 
                   arrivalPaymentOption === 'card' ? 'by card' : 'using UPI'} when you arrive`
                : `Your payment of ₹${bookingInfo.price.toFixed(2)} has been processed successfully.`}
            </p>
            <div className="transaction-id">
              Transaction ID: {Transactionid}
            </div>
            <p className="redirect-message">You'll be redirected to directions shortly...</p>
          </div>
        </div>
      )}
    </>
  );
};

export default PaymentGateway;