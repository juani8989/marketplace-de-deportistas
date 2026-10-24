import { RootGate } from '@/components/root-gate'
import { getFamousAthletes } from '@/lib/wikipedia'
import { getCurrentAccount } from '@/lib/current-account'

export default async function Page() {
  const [athletes, account] = await Promise.all([getFamousAthletes(), getCurrentAccount()])
  return <RootGate athletes={athletes} account={account} />
}
