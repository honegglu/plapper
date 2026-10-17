import { useEffect } from 'react'
import { Celebrations } from './components/Celebrations'
import { Shell } from './components/Shell'
import { Collection } from './screens/Collection'
import { Discover } from './screens/Discover'
import { Home } from './screens/Home'
import { Onboarding } from './screens/Onboarding'
import { Practice } from './screens/Practice'
import { Profile } from './screens/Profile'
import { useStore } from './store'

function useTheme() {
  const theme = useStore((s) => s.theme)
  useEffect(() => {
    const root = document.documentElement
    if (theme === 'system') root.removeAttribute('data-theme')
    else root.setAttribute('data-theme', theme)
  }, [theme])
}

export default function App() {
  const onboarded = useStore((s) => s.onboarded)
  const screen = useStore((s) => s.screen)
  const checkStreak = useStore((s) => s.checkStreak)
  useTheme()

  // Serie prüfen beim Start und wenn die App wieder sichtbar wird (z. B. am nächsten Morgen)
  useEffect(() => {
    checkStreak()
    const onVisible = () => document.visibilityState === 'visible' && checkStreak()
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [checkStreak])

  if (!onboarded) {
    return (
      <>
        <Onboarding />
        <Celebrations />
      </>
    )
  }

  const focus = screen === 'discover' || screen === 'practice'
  return (
    <>
      <Shell focus={focus}>
        {screen === 'home' && <Home />}
        {screen === 'discover' && <Discover />}
        {screen === 'practice' && <Practice />}
        {screen === 'collection' && <Collection />}
        {screen === 'profile' && <Profile />}
      </Shell>
      <Celebrations />
    </>
  )
}
