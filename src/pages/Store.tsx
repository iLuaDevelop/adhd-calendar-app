import React, { useState, useEffect } from 'react';
import { getXp, setXp } from '../services/xp';
import { getGems, setGems } from '../services/currency';
import Button from '../components/UI/Button';
import { useToast } from '../context/ToastContext';
import LootCrate from '../components/UI/LootCrate';
import PaymentModal from '../components/PaymentModal/PaymentModal';
import { buyPet, PET_SHOP, hasBoughtPetType, getAllPets } from '../services/pet';
import { addToInventory } from '../services/inventory';

const PURCHASES_KEY = 'adhd_purchases';
const PREMIUM_PURCHASES_KEY = 'adhd_premium_purchases';
const SUBSCRIPTION_KEY = 'adhd_plus_subscription';
const BRONZE_CRATE_KEY = 'adhd_bronze_crate_last_opened';

interface StoreItem {
    id: number;
    name: string;
    cost: number;
    description: string;
    type: 'xp' | 'gems';
}

interface Subscription {
    isActive: boolean;
    expiresAt: number;
    lastClaimedMonthlyGems: string;
}

const Store: React.FC = () => {
    const { showToast } = useToast();
    const [currentXp, setCurrentXp] = useState(getXp());
    const [currentGems, setCurrentGems] = useState(getGems());
    const [purchases, setPurchases] = useState<Set<number>>(() => {
        const stored = localStorage.getItem(PURCHASES_KEY);
        return stored ? new Set(JSON.parse(stored)) : new Set();
    });
    const [premiumPurchases, setPremiumPurchases] = useState<Set<number>>(() => {
        const stored = localStorage.getItem(PREMIUM_PURCHASES_KEY);
        return stored ? new Set(JSON.parse(stored)) : new Set();
    });
    const [subscription, setSubscription] = useState<Subscription>(() => {
        const stored = localStorage.getItem(SUBSCRIPTION_KEY);
        if (stored) {
            const sub = JSON.parse(stored);
            return sub;
        }
        return { isActive: false, expiresAt: 0, lastClaimedMonthlyGems: '' };
    });
    const [bronzeCrateLastOpened, setBronzeCrateLastOpened] = useState(() => {
        const stored = localStorage.getItem(BRONZE_CRATE_KEY);
        return stored ? Number(stored) : 0;
    });
    const [ownedPets, setOwnedPets] = useState(() => getAllPets());
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);
    const [selectedGemPackage, setSelectedGemPackage] = useState<{ amount: number; price: string } | null>(null);
    const [subscriptionPaymentOpen, setSubscriptionPaymentOpen] = useState(false);

    const isSubscriptionActive = subscription.isActive && subscription.expiresAt > Date.now();
    const getDaysRemaining = () => {
        if (!isSubscriptionActive) return 0;
        return Math.ceil((subscription.expiresAt - Date.now()) / (1000 * 60 * 60 * 24));
    };

    const getTodayDate = () => new Date().toDateString();
    const canClaimMonthlyGems = isSubscriptionActive && subscription.lastClaimedMonthlyGems !== getTodayDate();

    const xpItems: StoreItem[] = [
        { id: 1, name: 'Theme Unlock: Sunset', cost: 100, description: 'Unlock a warm sunset color theme', type: 'xp' },
        { id: 2, name: 'Theme Unlock: Ocean', cost: 100, description: 'Unlock a cool ocean color theme', type: 'xp' },
        { id: 3, name: 'Custom Avatar Border', cost: 150, description: 'Personalize your profile with a custom border', type: 'xp' },
        { id: 4, name: 'Extra Task Slots', cost: 200, description: 'Double your daily task capacity', type: 'xp' },
        { id: 5, name: 'Custom Avatar Upload', cost: 150, description: 'Upload custom images for your avatar', type: 'xp' },
    ];

    const premiumItems: StoreItem[] = [
        { id: 101, name: 'Premium Avatar Frame', cost: 99, description: 'Exclusive golden frame for your avatar', type: 'gems' },
        { id: 102, name: 'Custom Profile Banner', cost: 149, description: 'Personalize your profile with a custom banner', type: 'gems' },
        { id: 103, name: 'XP Booster (7 days)', cost: 199, description: '+50% XP gain for 7 days', type: 'gems' },
        { id: 104, name: 'Unlimited Tasks', cost: 299, description: 'Unlock unlimited daily tasks', type: 'gems' },
        { id: 105, name: 'Exclusive Badge', cost: 79, description: 'Show off your premium status with an exclusive badge', type: 'gems' },
    ];

    const purchaseItem = (itemId: number, cost: number, itemName: string, type: 'xp' | 'gems') => {
        const purchaseSet = type === 'xp' ? purchases : premiumPurchases;
        
        if (purchaseSet.has(itemId)) {
            showToast('You already own this item!', 'warning');
            return;
        }

        if (type === 'xp') {
            if (currentXp >= cost) {
                const newXp = currentXp - cost;
                setXp(newXp);
                setCurrentXp(newXp);
                const newPurchases = new Set(purchases);
                newPurchases.add(itemId);
                setPurchases(newPurchases);
                localStorage.setItem(PURCHASES_KEY, JSON.stringify(Array.from(newPurchases)));
                showToast(`Purchased: ${itemName}!`, 'success');
                window.dispatchEvent(new Event('profileUpdated'));
            } else {
                showToast('Not enough XP to purchase this item.', 'error');
            }
        } else {
            if (currentGems >= cost) {
                const newGems = currentGems - cost;
                setGems(newGems);
                setCurrentGems(newGems);
                const newPurchases = new Set(premiumPurchases);
                newPurchases.add(itemId);
                setPremiumPurchases(newPurchases);
                localStorage.setItem(PREMIUM_PURCHASES_KEY, JSON.stringify(Array.from(newPurchases)));
                showToast(`Purchased: ${itemName}!`, 'success');
                window.dispatchEvent(new Event('currencyUpdated'));
            } else {
                showToast('Not enough Gems to purchase this item.', 'error');
            }
        }
    };

    const buyGems = (amount: number, price: string) => {
        setSelectedGemPackage({ amount, price });
        setPaymentModalOpen(true);
    };

    const handleConfirmGemPurchase = () => {
        if (selectedGemPackage) {
            const newGems = currentGems + selectedGemPackage.amount;
            setGems(newGems);
            setCurrentGems(newGems);
            setSelectedGemPackage(null);
            window.dispatchEvent(new Event('currencyUpdated'));
        }
    };

    const subscribeToPlus = () => {
        setSubscriptionPaymentOpen(true);
    };

    const handleConfirmSubscription = () => {
        const expiresAt = Date.now() + (30 * 24 * 60 * 60 * 1000); // 30 days from now
        const newSubscription: Subscription = {
            isActive: true,
            expiresAt,
            lastClaimedMonthlyGems: ''
        };
        setSubscription(newSubscription);
        localStorage.setItem(SUBSCRIPTION_KEY, JSON.stringify(newSubscription));
        window.dispatchEvent(new Event('subscriptionUpdated'));
    };

    const claimMonthlyGems = () => {
        if (!canClaimMonthlyGems) {
            showToast('You can only claim daily gems once per day!', 'warning');
            return;
        }

        const newGems = currentGems + 10;
        setGems(newGems);
        setCurrentGems(newGems);

        const updatedSubscription = {
            ...subscription,
            lastClaimedMonthlyGems: getTodayDate()
        };
        setSubscription(updatedSubscription);
        localStorage.setItem(SUBSCRIPTION_KEY, JSON.stringify(updatedSubscription));

        showToast('Claimed 10 daily gems! 💎', 'success');
        window.dispatchEvent(new Event('currencyUpdated'));
    };

    const isPurchased = (itemId: number, type: 'xp' | 'gems') => {
        const purchaseSet = type === 'xp' ? purchases : premiumPurchases;
        return purchaseSet.has(itemId);
    };

    const handleBuyPet = async (petShopId: string, petName: string, cost: number) => {
        if (currentXp < cost) {
            showToast('Not enough XP to buy this pet!', 'error');
            return;
        }

        const newPet = await buyPet(petShopId);
        if (newPet) {
            const updatedXp = getXp();
            setCurrentXp(updatedXp);
            setOwnedPets(getAllPets());
            showToast(`Welcome ${petName}! Your new companion has arrived! 🎉`, 'success');
            window.dispatchEvent(new Event('currencyUpdated'));
        }
    };

    return (
        <div className="container">
            <div className="header" style={{textAlign:'center'}}>
                <h1 style={{fontSize:'2.5rem',marginBottom:16}}>Store</h1>
                <div className="subtle" style={{fontSize:'1.1rem'}}>Spend your hard-earned XP and Gems on exclusive items</div>
            </div>

            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:24,gap:16,flexWrap:'wrap'}}>
                <div className="panel" style={{padding:16}}>
                    <h3 style={{margin:0}}>Your XP</h3>
                    <div style={{fontSize:'2rem',fontWeight:'bold',color:'#6366f1',marginTop:8}}>{currentXp} XP</div>
                </div>
                <div className="panel" style={{padding:16}}>
                    <h3 style={{margin:0}}>Your Gems</h3>
                    <div style={{fontSize:'2rem',fontWeight:'bold',color:'#ec4899',marginTop:8}}>💎 {currentGems}</div>
                </div>
            </div>

            {/* Plus Subscription Section */}
            <div style={{marginBottom:32}}>
                <div className="panel" style={{
                    padding: 24,
                    background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%)',
                    border: '2px solid rgba(236, 72, 153, 0.5)',
                    borderRadius: 12,
                    position: 'relative'
                }}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:20}}>
                        <div style={{flex:1}}>
                            <h2 style={{margin:'0 0 8px 0',fontSize:'1.8rem'}}>✨ ADHD Plus</h2>
                            <div className="subtle" style={{fontSize:'1rem',marginBottom:16}}>Unlock exclusive benefits and monthly rewards</div>
                            
                            <div style={{marginBottom:16}}>
                                <h4 style={{margin:'0 0 12px 0',color:'#ec4899'}}>✅ Benefits:</h4>
                                <ul style={{margin:0,paddingLeft:20,lineHeight:'1.8'}}>
                                    <li>📦 <strong>10 Gems Daily</strong> - Claim once per day</li>
                                    <li>⭐ <strong>2x XP Multiplier</strong> - Earn XP faster</li>
                                    <li>🎨 <strong>Exclusive Themes</strong> - Premium color schemes</li>
                                    <li>🏆 <strong>Premium Badge</strong> - Show your VIP status</li>
                                    <li>🎁 <strong>Bonus Items</strong> - Early access to new store items</li>
                                </ul>
                            </div>
                        </div>

                        <div style={{minWidth:320,display:'flex',flexDirection:'column',justifyContent:'center',alignItems:'flex-start',paddingTop:40}}>
                            {!isSubscriptionActive ? (
                                <div style={{
                                    background: 'var(--panel)',
                                    padding: 32,
                                    borderRadius: 8,
                                    textAlign: 'center',
                                    width: '100%'
                                }}>
                                    <div style={{fontSize:'2.5rem',fontWeight:'bold',color:'#ec4899',marginBottom:16}}>$9.99/mo</div>
                                    <Button onClick={subscribeToPlus} style={{width:'100%',marginBottom:8}}>
                                        Subscribe Now
                                    </Button>
                                    <div className="subtle" style={{fontSize:'0.85rem'}}>Cancel anytime</div>
                                </div>
                            ) : (
                                <div style={{
                                    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%)',
                                    padding: 16,
                                    borderRadius: 8,
                                    textAlign: 'center',
                                    border: '2px solid #6366f1'
                                }}>
                                    <div style={{color:'#6366f1',fontWeight:'bold',marginBottom:12}}>✓ Active Subscription</div>
                                    <div className="subtle" style={{marginBottom:12}}>Expires in {getDaysRemaining()} days</div>
                                    <Button 
                                        onClick={claimMonthlyGems}
                                        disabled={!canClaimMonthlyGems}
                                        style={{width:'100%'}}
                                    >
                                        {canClaimMonthlyGems ? '🎁 Claim 10 Gems' : '✓ Gems Claimed Today'}
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Gem Purchase Section */}
            <div style={{marginBottom:32}}>
                <h2 style={{marginBottom:16}}>Get Premium Gems</h2>
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))',gap:16,marginBottom:24}}>
                    <div className="panel" style={{padding:16,display:'flex',flexDirection:'column',justifyContent:'space-between'}}>
                        <div>
                            <h4 style={{margin:'0 0 8px 0'}}>💎 100 Gems</h4>
                            <div className="subtle" style={{fontSize:'0.9rem'}}>Starter Pack</div>
                        </div>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:12}}>
                            <span style={{fontSize:'1.1rem',fontWeight:'bold',color:'#ec4899'}}>$4.99</span>
                            <Button onClick={() => buyGems(100, '$4.99')} style={{fontSize:'0.85rem'}}>Buy</Button>
                        </div>
                    </div>
                    <div className="panel" style={{padding:16,display:'flex',flexDirection:'column',justifyContent:'space-between',border:'2px solid #ec4899'}}>
                        <div>
                            <h4 style={{margin:'0 0 8px 0'}}>💎 550 Gems</h4>
                            <div className="subtle" style={{fontSize:'0.9rem',color:'#ec4899'}}>⭐ Best Value (+50 bonus)</div>
                        </div>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:12}}>
                            <span style={{fontSize:'1.1rem',fontWeight:'bold',color:'#ec4899'}}>$19.99</span>
                            <Button onClick={() => buyGems(550, '$19.99')} style={{fontSize:'0.85rem'}}>Buy</Button>
                        </div>
                    </div>
                    <div className="panel" style={{padding:16,display:'flex',flexDirection:'column',justifyContent:'space-between'}}>
                        <div>
                            <h4 style={{margin:'0 0 8px 0'}}>💎 1200 Gems</h4>
                            <div className="subtle" style={{fontSize:'0.9rem'}}>Premium Pack</div>
                        </div>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:12}}>
                            <span style={{fontSize:'1.1rem',fontWeight:'bold',color:'#ec4899'}}>$39.99</span>
                            <Button onClick={() => buyGems(1200, '$39.99')} style={{fontSize:'0.85rem'}}>Buy</Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Loot Crates Section */}
            <div style={{marginBottom:32}}>
                <h2 style={{marginBottom:16}}>🎲 Loot Crates - Random Rewards!</h2>
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill, minmax(260px, 1fr))',gap:16,marginBottom:24}}>
                    <LootCrate
                        tier="bronze"
                        cost={25}
                        costType="gems"
                        isFree={true}
                        cooldownMs={12 * 60 * 60 * 1000}
                        lastOpenedTime={bronzeCrateLastOpened}
                        rewards={[
                            { type: 'gems', amount: 10 },
                            { type: 'gems', amount: 15 },
                            { type: 'xp', amount: 50 },
                            { type: 'xp', amount: 75 },
                            { type: 'gems', amount: 20 },
                            { type: 'xp', amount: 100 },
                        ]}
                        onOpen={(reward) => {
                            if (reward.type === 'xp') {
                                const newXp = currentXp + reward.amount;
                                setXp(newXp);
                                setCurrentXp(newXp);
                            } else {
                                const newGems = currentGems + reward.amount;
                                setGems(newGems);
                                setCurrentGems(newGems);
                            }
                            setBronzeCrateLastOpened(Date.now());
                            localStorage.setItem(BRONZE_CRATE_KEY, String(Date.now()));
                            window.dispatchEvent(new Event('currencyUpdated'));
                        }}
                        isDisabled={false}
                    />
                    <LootCrate
                        tier="silver"
                        cost={60}
                        costType="gems"
                        rewards={[
                            { type: 'gems', amount: 30 },
                            { type: 'gems', amount: 50 },
                            { type: 'xp', amount: 150 },
                            { type: 'xp', amount: 200 },
                            { type: 'gems', amount: 75 },
                            { type: 'xp', amount: 250 },
                            { type: 'gems', amount: 100 },
                        ]}
                        onOpen={(reward) => {
                            if (reward.type === 'xp') {
                                const newXp = currentXp + reward.amount;
                                setXp(newXp);
                                setCurrentXp(newXp);
                            } else {
                                const newGems = currentGems + reward.amount;
                                setGems(newGems);
                                setCurrentGems(newGems);
                            }
                            window.dispatchEvent(new Event('currencyUpdated'));
                        }}
                        isDisabled={currentGems < 60}
                    />
                    <LootCrate
                        tier="gold"
                        cost={150}
                        costType="gems"
                        rewards={[
                            { type: 'gems', amount: 100 },
                            { type: 'gems', amount: 150 },
                            { type: 'xp', amount: 400 },
                            { type: 'xp', amount: 500 },
                            { type: 'gems', amount: 200 },
                            { type: 'xp', amount: 600 },
                            { type: 'gems', amount: 250 },
                            { type: 'xp', amount: 750 },
                        ]}
                        onOpen={(reward) => {
                            if (reward.type === 'xp') {
                                const newXp = currentXp + reward.amount;
                                setXp(newXp);
                                setCurrentXp(newXp);
                            } else {
                                const newGems = currentGems + reward.amount;
                                setGems(newGems);
                                setCurrentGems(newGems);
                            }
                            window.dispatchEvent(new Event('currencyUpdated'));
                        }}
                        isDisabled={currentGems < 150}
                    />
                </div>
            </div>

            {/* Premium Store Section */}
            <div style={{marginBottom:32}}>
                <h2 style={{marginBottom:16}}>Premium Items (Gems)</h2>
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))',gap:16}}>
                    {premiumItems.map((item) => (
                        <div key={item.id} className="panel" style={{padding:16,display:'flex',flexDirection:'column',border:'1px solid rgba(236, 72, 153, 0.3)'}}>
                            <h4 style={{margin:'0 0 8px 0'}}>{item.name}</h4>
                            <p style={{margin:'0 0 12px 0',color:'#9ca3af'}}>{item.description}</p>
                            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:'auto'}}>
                                <span style={{fontSize:'1.25rem',fontWeight:'bold',color:'#ec4899'}}>💎 {item.cost}</span>
                                <Button 
                                    onClick={() => purchaseItem(item.id, item.cost, item.name, 'gems')}
                                    variant={isPurchased(item.id, 'gems') ? 'ghost' : (currentGems >= item.cost ? undefined : 'ghost')}
                                    disabled={isPurchased(item.id, 'gems') || currentGems < item.cost}
                                >
                                    {isPurchased(item.id, 'gems') ? 'Owned' : 'Buy'}
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Pet Shop Section */}
            <div style={{marginBottom: 32}}>
                <h2 style={{marginBottom: 16}}>Pet Shop (Companion Pets)</h2>
                <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16}}>
                    {PET_SHOP.map((petShop) => {
                        const owned = hasBoughtPetType(petShop.petId);
                        return (
                            <div key={petShop.petId} className="panel" style={{padding: 16, display: 'flex', flexDirection: 'column'}}>
                                <div style={{fontSize: '3rem', marginBottom: 12, textAlign: 'center'}}>{petShop.emoji}</div>
                                <h4 style={{margin: '0 0 8px 0'}}>{petShop.name}</h4>
                                <p style={{margin: '0 0 12px 0', color: '#9ca3af', fontSize: '0.9rem'}}>
                                    Starts at Level {petShop.presetLevel}
                                </p>
                                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto'}}>
                                    <span style={{fontSize: '1.25rem', fontWeight: 'bold', color: '#6366f1'}}>{petShop.cost} XP</span>
                                    <Button 
                                        onClick={() => handleBuyPet(petShop.petId, petShop.name, petShop.cost)}
                                        variant={owned ? 'ghost' : (currentXp >= petShop.cost ? undefined : 'ghost')}
                                        disabled={owned || currentXp < petShop.cost}
                                    >
                                        {owned ? 'Owned' : 'Buy'}
                                    </Button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* XP Store Section */}
            <div style={{marginBottom: 120}}>
                <h2 style={{marginBottom:16}}>Free Items (XP)</h2>
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))',gap:16}}>
                    {xpItems.map((item) => (
                        <div key={item.id} className="panel" style={{padding:16,display:'flex',flexDirection:'column'}}>
                            <h4 style={{margin:'0 0 8px 0'}}>{item.name}</h4>
                            <p style={{margin:'0 0 12px 0',color:'#9ca3af'}}>{item.description}</p>
                            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:'auto'}}>
                                <span style={{fontSize:'1.25rem',fontWeight:'bold',color:'#6366f1'}}>{item.cost} XP</span>
                                <Button 
                                    onClick={() => purchaseItem(item.id, item.cost, item.name, 'xp')}
                                    variant={isPurchased(item.id, 'xp') ? 'ghost' : (currentXp >= item.cost ? undefined : 'ghost')}
                                    disabled={isPurchased(item.id, 'xp') || currentXp < item.cost}
                                >
                                    {isPurchased(item.id, 'xp') ? 'Purchased' : 'Buy'}
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <PaymentModal
              isOpen={paymentModalOpen}
              amount={selectedGemPackage?.amount || 0}
              price={selectedGemPackage?.price || '$0.00'}
              onClose={() => {
                setPaymentModalOpen(false);
                setSelectedGemPackage(null);
              }}
              onConfirm={handleConfirmGemPurchase}
            />

            <PaymentModal
              isOpen={subscriptionPaymentOpen}
              amount={0}
              price="$9.99/month"
              onClose={() => setSubscriptionPaymentOpen(false)}
              onConfirm={handleConfirmSubscription}
            />
        </div>
    );
};

export default Store;
