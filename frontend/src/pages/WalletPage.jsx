import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const WalletContainer = styled.div`
  max-width: 600px;
  margin: 20px auto;
  padding: 20px;
`;

const BalanceCard = styled.div`
  background: linear-gradient(135deg, #FF6B35 0%, #ff8555 100%);
  border-radius: 12px;
  padding: 30px;
  color: white;
  margin-bottom: 30px;
  box-shadow: 0 4px 15px rgba(255, 107, 53, 0.3);
`;

const BalanceLabel = styled.div`
  font-size: 14px;
  opacity: 0.9;
  margin-bottom: 8px;
`;

const BalanceAmount = styled.div`
  font-size: 48px;
  font-weight: bold;
  margin-bottom: 20px;
`;

const BalanceSubtext = styled.div`
  font-size: 12px;
  opacity: 0.8;
`;

const ActionButtons = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 30px;
`;

const Button = styled.button`
  padding: 12px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const PrimaryButton = styled(Button)`
  background-color: #FF6B35;
  color: white;

  &:hover:not(:disabled) {
    background-color: #e55a2a;
  }
`;

const SecondaryButton = styled(Button)`
  background-color: #1a1a1a;
  color: #fff;
  border: 1px solid #333;

  &:hover:not(:disabled) {
    border-color: #FF6B35;
  }
`;

const Section = styled.div`
  background-color: #0a0a0a;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
`;

const SectionTitle = styled.h3`
  color: #fff;
  margin: 0 0 15px 0;
  font-size: 16px;
`;

const TransactionList = styled.div`
  max-height: 300px;
  overflow-y: auto;
`;

const TransactionItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #1a1a1a;

  &:last-child {
    border-bottom: none;
  }
`;

const TransactionInfo = styled.div`
  flex: 1;
`;

const TransactionType = styled.div`
  color: #fff;
  font-size: 14px;
  font-weight: 500;
`;

const TransactionDate = styled.div`
  color: #666;
  font-size: 12px;
  margin-top: 4px;
`;

const TransactionAmount = styled.div`
  font-size: 14px;
  font-weight: 600;
  ${props => props.credit ? 'color: #88ff88;' : 'color: #ff9999;'}
`;

const WithdrawalForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const Input = styled.input`
  padding: 10px 12px;
  background-color: #1a1a1a;
  border: 1px solid #333;
  border-radius: 6px;
  color: #fff;
  font-size: 14px;

  &:focus {
    outline: none;
    border-color: #FF6B35;
    background-color: #222;
  }

  &::placeholder {
    color: #666;
  }
`;

const Select = styled.select`
  padding: 10px 12px;
  background-color: #1a1a1a;
  border: 1px solid #333;
  border-radius: 6px;
  color: #fff;
  font-size: 14px;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: #FF6B35;
  }

  option {
    background-color: #1a1a1a;
    color: #fff;
  }
`;

const SuccessMessage = styled.div`
  background-color: #1a3a1a;
  color: #88ff88;
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 15px;
`;

const ErrorMessage = styled.div`
  background-color: #3d1700;
  color: #ff9999;
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 15px;
`;

const WarningText = styled.p`
  color: #ff9999;
  font-size: 12px;
  margin-top: 8px;
`;

const InfoBox = styled.div`
  background-color: #111;
  border-left: 3px solid #FF6B35;
  padding: 12px;
  border-radius: 4px;
  margin-top: 12px;
  font-size: 12px;
  color: #888;
`;

function WalletPage({ token }) {
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showWithdrawal, setShowWithdrawal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState('stripe');
  const [withdrawing, setWithdrawing] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
    setLoading(true);
    try {
      const [walletRes, transRes] = await Promise.all([
        fetch('http://localhost:8000/wallet', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('http://localhost:8000/wallet/transactions', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (walletRes.ok) {
        const walletData = await walletRes.json();
        setWallet(walletData);
      }

      if (transRes.ok) {
        const transData = await transRes.json();
        setTransactions(transData.transactions || []);
      }
    } catch (err) {
      setError('Failed to load wallet data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();
    
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (!wallet || amount > wallet.balance) {
      setError('Insufficient balance');
      return;
    }

    setWithdrawing(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(
        'http://localhost:8000/wallet/withdraw',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            amount_cents: Math.round(amount * 100),
            method: withdrawMethod
          })
        }
      );

      const data = await response.json();

      if (response.ok) {
        setSuccess(`Withdrawal request submitted! Transaction ID: ${data.transaction_id}`);
        setWithdrawAmount('');
        setShowWithdrawal(false);
        
        // Refresh wallet data
        setTimeout(fetchWalletData, 1000);
      } else {
        setError(data.detail || 'Withdrawal failed');
      }
    } catch (err) {
      setError(`Error: ${err.message}`);
    } finally {
      setWithdrawing(false);
    }
  };

  if (loading) {
    return (
      <WalletContainer>
        <div style={{ textAlign: 'center', color: '#888', paddingTop: '40px' }}>
          Loading wallet data...
        </div>
      </WalletContainer>
    );
  }

  const balanceInDollars = wallet ? (wallet.balance / 100).toFixed(2) : '0.00';

  return (
    <WalletContainer>
      {/* Balance Card */}
      <BalanceCard>
        <BalanceLabel>Available Balance</BalanceLabel>
        <BalanceAmount>${balanceInDollars}</BalanceAmount>
        <BalanceSubtext>
          {wallet?.pending_balance ? 
            `${(wallet.pending_balance / 100).toFixed(2)} pending` : 
            'No pending transactions'
          }
        </BalanceSubtext>
      </BalanceCard>

      {/* Action Buttons */}
      <ActionButtons>
        <PrimaryButton 
          onClick={() => setShowWithdrawal(!showWithdrawal)}
          disabled={!wallet || wallet.balance < 500} // Minimum $5 withdrawal
        >
          💰 Withdraw
        </PrimaryButton>
        <SecondaryButton onClick={fetchWalletData}>
          🔄 Refresh
        </SecondaryButton>
      </ActionButtons>

      {/* Withdrawal Form */}
      {showWithdrawal && (
        <Section>
          <SectionTitle>Withdraw Funds</SectionTitle>
          
          {success && <SuccessMessage>{success}</SuccessMessage>}
          {error && <ErrorMessage>{error}</ErrorMessage>}

          <WithdrawalForm onSubmit={handleWithdraw}>
            <div>
              <label style={{ color: '#888', fontSize: '12px', display: 'block', marginBottom: '6px' }}>
                Amount (USD)
              </label>
              <Input
                type="number"
                step="0.01"
                min="5"
                max={balanceInDollars}
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="Enter amount (minimum $5)"
              />
              <WarningText>
                Minimum withdrawal: $5.00 | Available: ${balanceInDollars}
              </WarningText>
            </div>

            <div>
              <label style={{ color: '#888', fontSize: '12px', display: 'block', marginBottom: '6px' }}>
                Payment Method
              </label>
              <Select
                value={withdrawMethod}
                onChange={(e) => setWithdrawMethod(e.target.value)}
              >
                <option value="stripe">Stripe (Bank Transfer)</option>
                <option value="paypal">PayPal</option>
                <option value="crypto">Crypto Wallet</option>
              </Select>
            </div>

            <InfoBox>
              ⚠️ Withdrawals typically process within 3-5 business days. A processing fee of 2% applies.
            </InfoBox>

            <PrimaryButton type="submit" disabled={withdrawing}>
              {withdrawing ? 'Processing...' : 'Request Withdrawal'}
            </PrimaryButton>
          </WithdrawalForm>
        </Section>
      )}

      {/* Transaction History */}
      <Section>
        <SectionTitle>📊 Recent Transactions</SectionTitle>
        {transactions.length === 0 ? (
          <div style={{ color: '#666', fontSize: '14px' }}>No transactions yet</div>
        ) : (
          <TransactionList>
            {transactions.map((tx, idx) => (
              <TransactionItem key={idx}>
                <TransactionInfo>
                  <TransactionType>
                    {tx.type === 'view' && '👁️ Video View'}
                    {tx.type === 'like' && '❤️ Like Reward'}
                    {tx.type === 'referral' && '🎯 Referral Bonus'}
                    {tx.type === 'withdrawal' && '💸 Withdrawal'}
                    {tx.type === 'refund' && '↩️ Refund'}
                  </TransactionType>
                  <TransactionDate>
                    {new Date(tx.created_at || Date.now()).toLocaleDateString()}
                  </TransactionDate>
                </TransactionInfo>
                <TransactionAmount credit={tx.amount > 0}>
                  {tx.amount > 0 ? '+' : ''} ${(tx.amount / 100).toFixed(2)}
                </TransactionAmount>
              </TransactionItem>
            ))}
          </TransactionList>
        )}
      </Section>

      {/* Payment Methods Section */}
      <Section>
        <SectionTitle>💳 Payment Methods</SectionTitle>
        <div style={{ fontSize: '12px', color: '#666', lineHeight: '1.6' }}>
          <p>
            <strong style={{ color: '#fff' }}>🏦 Stripe (Bank Transfer)</strong>
            <br />Link your bank account for fast transfers
          </p>
          <SecondaryButton style={{ width: '100%', marginTop: '8px' }}>
            Connect Bank Account
          </SecondaryButton>
        </div>
      </Section>

      {/* Rewards Tracker */}
      <Section>
        <SectionTitle>🎯 Rewards Summary (This Week)</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div style={{ backgroundColor: '#111', padding: '12px', borderRadius: '6px' }}>
            <div style={{ color: '#666', fontSize: '12px' }}>Views</div>
            <div style={{ color: '#88ff88', fontSize: '20px', fontWeight: 'bold' }}>+$2.50</div>
          </div>
          <div style={{ backgroundColor: '#111', padding: '12px', borderRadius: '6px' }}>
            <div style={{ color: '#666', fontSize: '12px' }}>Likes</div>
            <div style={{ color: '#88ff88', fontSize: '20px', fontWeight: 'bold' }}>+$0.75</div>
          </div>
        </div>
      </Section>
    </WalletContainer>
  );
}

export default WalletPage;
