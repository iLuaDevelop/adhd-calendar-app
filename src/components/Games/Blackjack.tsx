import React, { useState, useEffect } from 'react';
import Button from '../UI/Button';
import { useToast } from '../../context/ToastContext';
import { getGems, addGems } from '../../services/currency';
import { recordCasinoGameResult } from '../../services/casinoStats';

type CardSuit = '♠' | '♥' | '♦' | '♣';
type CardRank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

interface Card {
  suit: CardSuit;
  rank: CardRank;
}

interface BlackjackProps {
  onCancel: () => void;
  onGameEnd: (gemsWon: number, gemsLost: number) => void;
}

export const Blackjack: React.FC<BlackjackProps> = ({ onCancel, onGameEnd }) => {
  const { showToast } = useToast();
  const [gameState, setGameState] = useState<'betting' | 'playing' | 'result'>('betting');
  const [bet, setBet] = useState(10);
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [dealerHand, setDealerHand] = useState<Card[]>([]);
  const [playerTotal, setPlayerTotal] = useState(0);
  const [dealerTotal, setDealerTotal] = useState(0);
  const [result, setResult] = useState<'win' | 'lose' | 'push' | null>(null);
  const [gems, setGems] = useState(getGems());
  const [dealerRevealed, setDealerRevealed] = useState(false);

  const suits: CardSuit[] = ['♠', '♥', '♦', '♣'];
  const ranks: CardRank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

  const drawCard = (): Card => {
    const suit = suits[Math.floor(Math.random() * suits.length)];
    const rank = ranks[Math.floor(Math.random() * ranks.length)];
    return { suit, rank };
  };

  const getCardValue = (card: Card): number => {
    if (card.rank === 'A') return 11;
    if (['J', 'Q', 'K'].includes(card.rank)) return 10;
    return parseInt(card.rank);
  };

  const calculateTotal = (hand: Card[]): number => {
    let total = 0;
    let aces = 0;

    for (const card of hand) {
      const value = getCardValue(card);
      if (card.rank === 'A') aces++;
      total += value;
    }

    // Adjust for aces if busting
    while (total > 21 && aces > 0) {
      total -= 10;
      aces--;
    }

    return total;
  };

  const startGame = () => {
    if (bet < 5 || bet > 500) {
      showToast('Bet must be between 5 and 500 gems', 'error');
      return;
    }

    if (bet > gems) {
      showToast("You don't have enough gems!", 'error');
      return;
    }

    // Remove bet from gems
    addGems(-bet);
    setGems(getGems());

    // Deal initial hands
    const pHand = [drawCard(), drawCard()];
    const dHand = [drawCard(), drawCard()];

    setPlayerHand(pHand);
    setDealerHand(dHand);
    setPlayerTotal(calculateTotal(pHand));
    setDealerTotal(calculateTotal([dHand[0]])); // Only show first card initially
    setGameState('playing');
    setResult(null);
    setDealerRevealed(false);

    // Check for blackjack
    if (calculateTotal(pHand) === 21 && pHand.length === 2) {
      setTimeout(() => endGame(calculateTotal(pHand), calculateTotal(dHand), true), 1000);
    }
  };

  const hit = () => {
    const newHand = [...playerHand, drawCard()];
    setPlayerHand(newHand);
    const total = calculateTotal(newHand);
    setPlayerTotal(total);

    if (total > 21) {
      setTimeout(() => endGame(total, calculateTotal(dealerHand)), 500);
    }
  };

  const stand = () => {
    dealerPlay();
  };

  const dealerPlay = () => {
    setDealerRevealed(true);
    let dHand = [...dealerHand];
    let dTotal = calculateTotal(dHand);

    // Dealer hits on 16 or less
    while (dTotal < 17) {
      dHand = [...dHand, drawCard()];
      dTotal = calculateTotal(dHand);
    }

    setDealerHand(dHand);
    setDealerTotal(dTotal);

    setTimeout(() => endGame(playerTotal, dTotal), 1000);
  };

  const endGame = (pTotal: number, dTotal: number, isBlackjack = false) => {
    let resultType: 'win' | 'lose' | 'push';
    let winnings = 0;

    if (pTotal > 21) {
      resultType = 'lose';
    } else if (dTotal > 21) {
      resultType = 'win';
      winnings = isBlackjack ? Math.floor(bet * 2.5) : bet * 2; // Blackjack pays 1.5x, normal win pays 1x
    } else if (pTotal > dTotal) {
      resultType = 'win';
      winnings = bet * 2;
    } else if (pTotal < dTotal) {
      resultType = 'lose';
    } else {
      resultType = 'push';
      winnings = bet; // Return the bet
    }

    if (resultType === 'win') {
      addGems(winnings);
      setGems(getGems());
    } else if (resultType === 'push') {
      addGems(winnings);
      setGems(getGems());
    }

    setResult(resultType);
    setGameState('result');
  };

  const renderCard = (card: Card, hidden = false) => {
    if (hidden) {
      return (
        <div style={{
          width: '60px',
          height: '90px',
          background: 'linear-gradient(135deg, #7c5cff, #5a4a8a)',
          border: '2px solid rgba(124, 92, 255, 0.6)',
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontSize: '2rem',
        }}>
          ?
        </div>
      );
    }

    const isRed = card.suit === '♥' || card.suit === '♦';
    return (
      <div style={{
        width: '60px',
        height: '90px',
        background: '#fff',
        border: `2px solid ${isRed ? '#e74c3c' : '#000'}`,
        borderRadius: 8,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '4px',
        fontSize: '0.85rem',
        fontWeight: 'bold',
        color: isRed ? '#e74c3c' : '#000',
      }}>
        <div>{card.rank}</div>
        <div>{card.suit}</div>
        <div>{card.rank}</div>
      </div>
    );
  };

  // Betting screen
  if (gameState === 'betting') {
    return (
      <div style={{
        background: 'linear-gradient(135deg, rgba(124, 92, 255, 0.1) 0%, rgba(74, 222, 128, 0.05) 100%)',
        padding: 40,
        borderRadius: 20,
        border: '1px solid rgba(124, 92, 255, 0.2)',
        maxWidth: '500px',
        margin: '0 auto',
      }}>
        <h2 style={{ textAlign: 'center', marginBottom: 24 }}>♠️ Blackjack ♠️</h2>

        <div style={{ marginBottom: 24 }}>
          <div style={{
            background: 'rgba(124, 92, 255, 0.1)',
            padding: 12,
            borderRadius: 8,
            marginBottom: 16,
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '0.9rem', color: 'var(--muted)', marginBottom: 4 }}>Your Gems</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#06b6d4' }}>{gems}</div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: '0.9rem', color: 'var(--muted)' }}>Place Your Bet</label>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <input
                type="number"
                min="5"
                max="500"
                value={bet}
                onChange={(e) => setBet(Math.min(500, Math.max(5, parseInt(e.target.value) || 5)))}
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  background: 'rgba(0, 0, 0, 0.2)',
                  border: '1px solid rgba(124, 92, 255, 0.3)',
                  borderRadius: 8,
                  color: '#fff',
                  fontSize: '1rem',
                }}
              />
              <div style={{ fontSize: '1.2rem' }}>💎</div>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: 4 }}>Min 5 • Max 500</div>
          </div>

          {/* Quick bet buttons */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            {[10, 25, 50].map(amount => (
              <button
                key={amount}
                onClick={() => setBet(Math.min(gems, amount))}
                style={{
                  padding: '8px 0',
                  background: 'rgba(124, 92, 255, 0.15)',
                  border: '1px solid rgba(124, 92, 255, 0.3)',
                  borderRadius: 6,
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: '500',
                }}
              >
                {amount}
              </button>
            ))}
          </div>
        </div>

        {/* Odds display */}
        <div style={{
          background: 'rgba(0, 0, 0, 0.2)',
          padding: 12,
          borderRadius: 8,
          marginBottom: 20,
          fontSize: '0.85rem',
          color: 'var(--muted)',
        }}>
          <div style={{ marginBottom: 6 }}>📊 Odds</div>
          <div>Win: 48% • Lose: 48% • Push: 4%</div>
          <div style={{ marginTop: 4, fontSize: '0.8rem' }}>Blackjack pays 1.5x • Normal win pays 1x</div>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <Button variant="ghost" onClick={onCancel} style={{ flex: 1 }}>
            Cancel
          </Button>
          <Button variant="primary" onClick={startGame} style={{ flex: 1 }}>
            Deal 🎴
          </Button>
        </div>
      </div>
    );
  }

  // Playing screen
  if (gameState === 'playing') {
    return (
      <div style={{
        background: 'linear-gradient(180deg, rgba(0, 100, 0, 0.2) 0%, rgba(0, 50, 0, 0.15) 100%)',
        padding: 40,
        borderRadius: 20,
        border: '1px solid rgba(100, 200, 100, 0.2)',
        maxWidth: '700px',
        margin: '0 auto',
      }}>
        <h2 style={{ textAlign: 'center', marginBottom: 8 }}>♠️ Blackjack ♠️</h2>
        <div style={{ textAlign: 'center', color: 'var(--muted)', marginBottom: 24 }}>Bet: {bet} 💎</div>

        {/* Dealer's hand */}
        <div style={{ marginBottom: 40 }}>
          <h3 style={{ marginBottom: 12, marginTop: 0 }}>Dealer</h3>
          <div style={{ display: 'flex', gap: 12, marginBottom: 8, flexWrap: 'wrap' }}>
            {dealerHand.map((card, idx) => (
              <div key={idx}>
                {renderCard(card, !dealerRevealed && idx === 1)}
              </div>
            ))}
          </div>
          <div style={{ fontSize: '0.9rem', color: 'var(--muted)' }}>
            Total: {dealerRevealed ? dealerTotal : (dealerHand.length > 0 ? `${getCardValue(dealerHand[0])}+?` : '0')}
          </div>
        </div>

        {/* Player's hand */}
        <div style={{ marginBottom: 32 }}>
          <h3 style={{ marginBottom: 12, marginTop: 0 }}>You</h3>
          <div style={{ display: 'flex', gap: 12, marginBottom: 8, flexWrap: 'wrap' }}>
            {playerHand.map((card, idx) => (
              <div key={idx}>{renderCard(card)}</div>
            ))}
          </div>
          <div style={{
            fontSize: '1.2rem',
            fontWeight: 'bold',
            color: playerTotal > 21 ? '#e74c3c' : 'var(--accent)',
          }}>
            Total: {playerTotal}
            {playerTotal > 21 && ' - BUST!'}
            {playerTotal === 21 && playerHand.length === 2 && ' - BLACKJACK!'}
          </div>
        </div>

        {/* Action buttons */}
        {playerTotal <= 21 && (
          <div style={{ display: 'flex', gap: 12 }}>
            <Button variant="primary" onClick={hit} style={{ flex: 1 }}>
              Hit 🎴
            </Button>
            <Button variant="secondary" onClick={stand} style={{ flex: 1 }}>
              Stand ✋
            </Button>
          </div>
        )}
      </div>
    );
  }

  // Result screen
  return (
    <div style={{
      padding: 40,
      borderRadius: 20,
      maxWidth: '500px',
      margin: '0 auto',
      textAlign: 'center',
      background: result === 'win'
        ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(74, 222, 128, 0.05) 100%)'
        : result === 'push'
        ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(96, 165, 250, 0.05) 100%)'
        : 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(248, 113, 113, 0.05) 100%)',
      border: `1px solid ${
        result === 'win'
          ? 'rgba(34, 197, 94, 0.3)'
          : result === 'push'
          ? 'rgba(59, 130, 246, 0.3)'
          : 'rgba(239, 68, 68, 0.3)'
      }`,
    }}>
      <div style={{ fontSize: '3rem', marginBottom: 16 }}>
        {result === 'win' ? '🎉' : result === 'push' ? '🤝' : '😢'}
      </div>

      <h2 style={{ marginBottom: 8, fontSize: '2rem' }}>
        {result === 'win' ? 'You Won!' : result === 'push' ? "It's a Tie!" : 'You Lost!'}
      </h2>

      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: '0.9rem', color: 'var(--muted)', marginBottom: 4 }}>Gems Change</div>
        <div style={{
          fontSize: '2rem',
          fontWeight: 'bold',
          color: result === 'win' ? '#22c55e' : result === 'push' ? '#06b6d4' : '#ef4444',
        }}>
          {result === 'win' ? '+' : ''}{result === 'lose' ? '-' : ''}{result === 'push' ? '±' : ''}{Math.abs(bet)}
        </div>
      </div>

      <div style={{
        background: 'rgba(0, 0, 0, 0.2)',
        padding: 12,
        borderRadius: 8,
        marginBottom: 20,
        fontSize: '0.85rem',
      }}>
        <div>Player: {playerTotal} | Dealer: {dealerTotal}</div>
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <Button
          variant="ghost"
          onClick={() => {
            setGameState('betting');
            setBet(10);
          }}
          style={{ flex: 1 }}
        >
          Play Again
        </Button>
        <Button variant="secondary" onClick={() => {
          const gemsWon = result === 'win' ? bet * 2 : 0;
          const gemsLost = result === 'lose' ? bet : 0;
          
          // Record to casino stats
          recordCasinoGameResult(gemsWon, gemsLost, 'blackjack');
          
          onGameEnd(gemsWon, gemsLost);
        }} style={{ flex: 1 }}>
          Back
        </Button>
      </div>
    </div>
  );
};
