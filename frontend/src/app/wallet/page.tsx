import { Metadata } from 'next';
import WalletPage from '../account/wallet/page';

export const metadata: Metadata = {
  title: 'My Wallet & Passbook | FastVelix',
  description: 'Manage your FastVelix Store Wallet balance, transaction history, and instant cashbacks.',
};

export default function Page() {
  return <WalletPage />;
}
