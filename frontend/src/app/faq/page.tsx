import { Metadata } from 'next';
import HelpCenterPage from '../help-center/page';

export const metadata: Metadata = {
  title: 'Frequently Asked Questions & Support | FastVelix',
  description: 'Find answers to common questions about orders, cakes, delivery, returns and payments.',
};

export default function Page() {
  return <HelpCenterPage />;
}
