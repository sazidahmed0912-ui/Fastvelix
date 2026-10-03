import { Metadata } from 'next';
import SecurityPage from '../account/security/page';

export const metadata: Metadata = {
  title: 'Account Security | FastVelix',
  description: 'Manage password, credentials and active sessions on FastVelix.',
};

export default function Page() {
  return <SecurityPage />;
}
