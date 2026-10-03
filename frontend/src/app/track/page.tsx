import { Metadata } from 'next';
import TrackOrderPage from '../track-order/page';

export const metadata: Metadata = {
  title: 'Track Order | FastVelix',
  description: 'Track your FastVelix cakes and fashion shipment status in real-time.',
};

export default function Page() {
  return <TrackOrderPage />;
}
