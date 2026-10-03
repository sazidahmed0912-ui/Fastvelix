/**
 * ─────────────────────────────────────────────────────────────
 * initDefaultUsers — Auto-bootstrap default admin & demo accounts
 *
 * Called once after DB connects. It is a no-op when the accounts
 * already exist, so it is safe to run on every cold start.
 * ─────────────────────────────────────────────────────────────
 */

import { User } from '../models/User';
import { config } from '../config';

interface DefaultAccount {
  name: string;
  email: string;
  password: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'SELLER' | 'CUSTOMER';
}

const DEFAULT_ACCOUNTS: DefaultAccount[] = [
  {
    name: 'FastVelix Admin',
    email: config.admin.email || 'admin@fastvelix.com',
    password: config.admin.password || 'Admin@123',
    role: 'SUPER_ADMIN',
  },
  {
    name: 'Demo Seller',
    email: 'seller@fastvelix.com',
    password: 'Seller@123',
    role: 'SELLER',
  },
  {
    name: 'Demo Customer',
    email: 'customer@fastvelix.com',
    password: 'Customer@123',
    role: 'CUSTOMER',
  },
];

export async function initDefaultUsers(): Promise<void> {
  try {
    for (const account of DEFAULT_ACCOUNTS) {
      const exists = await User.findOne({ email: account.email }).lean();
      if (!exists) {
        await User.create({
          name: account.name,
          email: account.email,
          password: account.password,
          role: account.role,
          isEmailVerified: true,
          isActive: true,
        });
        console.log(`✅ Default account created: ${account.email} (${account.role})`);
      }
      // else: already exists, skip silently
    }

    // Print credential summary
    console.log('\n  ╔══════════════════════════════════════════════════╗');
    console.log('  ║        📋 DEFAULT LOGIN CREDENTIALS             ║');
    console.log('  ╠══════════════════════════════════════════════════╣');
    console.log(`  ║  🔴 Admin     : ${(config.admin.email || 'admin@fastvelix.com').padEnd(28)} ║`);
    console.log(`  ║  Password    : ${(config.admin.password || 'Admin@123').padEnd(28)} ║`);
    console.log('  ╠══════════════════════════════════════════════════╣');
    console.log('  ║  🟡 Seller    : seller@fastvelix.com             ║');
    console.log('  ║  Password    : Seller@123                        ║');
    console.log('  ╠══════════════════════════════════════════════════╣');
    console.log('  ║  🟢 Customer  : customer@fastvelix.com           ║');
    console.log('  ║  Password    : Customer@123                      ║');
    console.log('  ╚══════════════════════════════════════════════════╝\n');
  } catch (err) {
    console.error('⚠️  Failed to initialize default users:', err);
    // Non-fatal: server continues without default accounts
  }
}
