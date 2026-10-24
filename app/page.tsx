import { RootGate } from '@/components/root-gate'
import { getFamousAthletes } from '@/lib/wikipedia'

export default async function Page() {
  const athletes = await getFamousAthletes()
  return <RootGate athletes={athletes} />
}
