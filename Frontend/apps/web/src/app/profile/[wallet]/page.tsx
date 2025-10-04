import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { walletAddressSchema } from '@elementalsouls/shared';
import { ProfileClient } from './profile-client.jsx';

interface Props {
  params: { wallet: string };
}

export const metadata: Metadata = {
  title: 'Wallet profile • ElementalSouls'
};

const ProfilePage = ({ params }: Props) => {
  const parsed = walletAddressSchema.safeParse(`0x${params.wallet.replace(/^0x/, '')}`);
  if (!parsed.success) {
    notFound();
  }

  return <ProfileClient wallet={parsed.data} />;
};

export default ProfilePage;
