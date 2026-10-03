import { Metadata } from 'next';
import TermsOfServicePage from '../terms-of-service/page';

export const metadata: Metadata = {
  title: 'Terms of Service | FastVelix',
  description: 'FastVelix user agreement and purchasing conditions.',
};

export default function Page() {
  return <TermsOfServicePage />;
}
