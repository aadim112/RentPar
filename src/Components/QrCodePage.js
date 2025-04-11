import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';

const QrCodePage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [transaction, setTransaction] = useState(null);
  const [countdown, setCountdown] = useState(3600); // 1 hour in seconds

  useEffect(() => {
    if (location.state?.transaction) {
      setTransaction(location.state.transaction);
    } else {
      navigate('/', { replace: true });
    }
  }, [location, navigate]);

  useEffect(() => {
    if (!transaction) return;
    
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [transaction]);

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!transaction) {
    return <div style={{ padding: 20, textAlign: 'center' }}>Loading...</div>;
  }

  const qrData = JSON.stringify({
    transactionId: transaction.transactionId,
    vehicleNumber: transaction.vehicleNumber,
    mall: transaction.details.Mall,
    validUntil: new Date(new Date().getTime() + (countdown * 1000)).toISOString(),
    entryTime: new Date().toISOString()
  });

  // Define styles as objects
  const styles = {
    container: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      padding: '20px',
      backgroundColor: '#f5f5f5',
      fontFamily: 'Poppins, sans-serif'
    },
    card: {
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
      width: '100%',
      maxWidth: '500px',
      padding: '30px'
    },
    title: {
      textAlign: 'center',
      marginBottom: '20px',
      color: '#333',
      fontSize: '24px'
    },
    details: {
      marginBottom: '20px',
      borderBottom: '1px solid #eee',
      paddingBottom: '20px'
    },
    item: {
      display: 'flex',
      justifyContent: 'space-between',
      marginBottom: '10px'
    },
    label: {
      fontWeight: '500',
      color: '#666'
    },
    value: {
      fontWeight: '600',
      color: '#333'
    },
    qrWrapper: {
      display: 'flex',
      justifyContent: 'center',
      margin: '20px 0',
      padding: '20px',
      border: '2px dashed #ddd',
      borderRadius: '8px',
      backgroundColor: 'white'
    },
    instructions: {
      backgroundColor: '#f9f9f9',
      borderRadius: '6px',
      padding: '15px',
      marginBottom: '20px'
    },
    instructionsH3: {
      marginTop: '0',
      marginBottom: '10px',
      fontSize: '16px',
      color: '#444'
    },
    actions: {
      display: 'flex',
      justifyContent: 'space-between',
      gap: '10px'
    },
    button: {
      flex: '1',
      padding: '12px',
      border: 'none',
      borderRadius: '4px',
      fontWeight: '500',
      cursor: 'pointer',
      backgroundColor: '#1a73e8',
      color: 'white',
      transition: 'background-color 0.2s'
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Parking Confirmation</h2>
        <div style={styles.details}>
          <div style={styles.item}>
            <span style={styles.label}>Vehicle:</span>
            <span style={styles.value}>{transaction.vehicleNumber}</span>
          </div>
          <div style={styles.item}>
            <span style={styles.label}>Location:</span>
            <span style={styles.value}>{transaction.details.Mall}</span>
          </div>
          <div style={styles.item}>
            <span style={styles.label}>Booking Reference:</span>
            <span style={styles.value}>{transaction.transactionId}</span>
          </div>
          <div style={styles.item}>
            <span style={styles.label}>Valid For:</span>
            <span style={styles.value}>{formatTime(countdown)}</span>
          </div>
        </div>
        
        <div style={styles.qrWrapper}>
          <QRCodeSVG
            value={qrData}
            size={250}
            level="H"
            includeMargin={true}
          />
        </div>
        
        <div style={styles.instructions}>
          <h3 style={styles.instructionsH3}>Instructions:</h3>
          <ol>
            <li>Show this QR code at the parking entrance</li>
            <li>Scan at the payment terminal when leaving</li>
            <li>Your booking is valid for {transaction.details.Duration}</li>
            <li>Additional charges may apply for extended stays</li>
          </ol>
        </div>
        
        <div style={styles.actions}>
          <button 
            style={styles.button} 
            onClick={() => window.print()}
          >
            Print Ticket
          </button>
          <button 
            style={styles.button} 
            onClick={() => navigate('/')}
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default QrCodePage;