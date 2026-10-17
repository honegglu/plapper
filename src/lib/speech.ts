/** Vorlesen über die Sprachausgabe des Geräts (Web Speech API), falls vorhanden. */

export function canSpeak(): boolean {
  try {
    return typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined'
  } catch {
    return false
  }
}

function germanVoice(): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices()
  return (
    voices.find((v) => v.lang === 'de-CH') ??
    voices.find((v) => v.lang === 'de-DE') ??
    voices.find((v) => v.lang.toLowerCase().startsWith('de'))
  )
}

export function speak(text: string) {
  if (!canSpeak()) return
  try {
    const synth = window.speechSynthesis
    synth.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'de-DE'
    const voice = germanVoice()
    if (voice) u.voice = voice
    u.rate = 0.9
    synth.speak(u)
  } catch {
    /* Sprachausgabe nicht verfügbar */
  }
}
