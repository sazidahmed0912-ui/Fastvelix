import { Metadata } from 'next';
import ReferralsPage from '../account/referrals/page';

export const metadata: Metadata = {
  title: 'Refer & Earn ₹100 | FastVelix',
  description: 'Invite your friends to FastVelix and earn ₹100 wallet credit on every successful order.',
};

export default function Page() {
  return <ReferralsPage />;
}
