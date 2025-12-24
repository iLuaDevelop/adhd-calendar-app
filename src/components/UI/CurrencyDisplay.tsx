import React, { useState, useEffect } from 'react';
import { getGems, setGems } from '../../services/currency';
import { getXp, setXp } from '../../services/xp';
import PaymentModal from '../PaymentModal/PaymentModal';

const CurrencyDisplay: React.FC = () => {
  const [gems, setGemsState] = useState(getGems());
  const [showPurchaseMenu, setShowPurchaseMenu] = useState(false);
  const [currentXp, setCurrentXp] = useState(getXp());
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<{ amount: number; price: number; label: string } | null>(null);

  useEffect(() => {
    const handleCurrencyUpdate = () => {
      setGemsState(getGems());
    };

    window.addEventListener('currencyUpdated', handleCurrencyUpdate as EventListener);
    return () => window.removeEventListener('currencyUpdated', handleCurrencyUpdate as EventListener);
  }, []);

  const gemPackages = [
    { amount: 50, price: 4.99, label: '50 💎' },
    { amount: 200, price: 14.99, label: '200 💎' },
    { amount: 500, price: 29.99, label: '500 💎' },
    { amount: 1200, price: 59.99, label: '1200 💎' },
  ];

  const handlePurchaseGems = (pkg: { amount: number; price: number; label: string }) => {
    setSelectedPackage(pkg);
    setPaymentModalOpen(true);
  };

  const handleConfirmPayment = () => {
    if (selectedPackage) {
      const newGems = getGems() + selectedPackage.amount;
      setGems(newGems);
      setGemsState(newGems);
      window.dispatchEvent(new Event('currencyUpdated'));
      setShowPurchaseMenu(false);
      setSelectedPackage(null);
    }
  };

  return (
    <>
      <div 
        onClick={() => setShowPurchaseMenu(true)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 12px',
          borderRadius: 6,
          background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%)',
          border: '1px solid rgba(236, 72, 153, 0.3)',
          fontSize: '0.95rem',
          fontWeight: 600,
          color: 'var(--text)',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.background = 'linear-gradient(135deg, rgba(236, 72, 153, 0.2) 0%, rgba(168, 85, 247, 0.2) 100%)';
          (e.currentTarget as HTMLElement).style.borderColor = 'rgba(236, 72, 153, 0.6)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.background = 'linear-gradient(135deg, rgba(236, 72, 153, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%)';
          (e.currentTarget as HTMLElement).style.borderColor = 'rgba(236, 72, 153, 0.3)';
        }}
      >
        <span style={{ fontSize: '1.2rem' }}>💎</span>
        <span>{gems}</span>
      </div>

      {/* Purchase Menu Modal */}
      {showPurchaseMenu && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}
        onClick={() => setShowPurchaseMenu(false)}>
          <div 
            className="panel"
            onClick={(e) => e.stopPropagation()}
            style={{
              padding: 24,
              borderRadius: 12,
              maxWidth: 400,
              backgroundColor: 'var(--panel)',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
            }}>
            <h2 style={{ marginTop: 0, marginBottom: 20, color: 'var(--text)' }}>💎 Buy Gems</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
              {gemPackages.map((pkg) => (
                <button
                  key={pkg.amount}
                  onClick={() => handlePurchaseGems(pkg)}
                  className="btn primary"
                  style={{
                    padding: 16,
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                  }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{pkg.label}</div>
                  <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>${pkg.price}</div>
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowPurchaseMenu(false)}
              className="btn ghost"
              style={{
                width: '100%',
                padding: 12,
              }}>
              Close
            </button>

            <PaymentModal
              isOpen={paymentModalOpen}
              amount={selectedPackage?.amount || 0}
              price={`$${selectedPackage?.price.toFixed(2) || '0.00'}`}
              onClose={() => {
                setPaymentModalOpen(false);
                setSelectedPackage(null);
              }}
              onConfirm={handleConfirmPayment}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default CurrencyDisplay;
