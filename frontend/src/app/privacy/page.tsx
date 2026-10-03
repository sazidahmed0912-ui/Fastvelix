import { Metadata } from 'next';
import PrivacyPolicyPage from '../privacy-policy/page';

export const metadata: Metadata = {
  title: 'Privacy Policy | FastVelix',
  description: 'FastVelix privacy guidelines and personal data protection policy.',
};

export default function Page() {
  return <PrivacyPolicyPage />;
}
