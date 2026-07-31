import { useEffect, useState } from 'react'

const MORNING_START = 6 * 60 // 6:00am, band sits near the top
const EVENING_END = 20 * 60 // 8:00pm, band sits near the bottom
const TOP_PERCENT = 8
const BOTTOM_PERCENT = 92

/** Vertical position (0-100) of the yellow band, sliding down as the day goes on. */
function bandPositionFor(date: Date): number {
  const minutes = date.getHours() * 60 + date.getMinutes()

  if (minutes >= MORNING_START && minutes <= EVENING_END) {
    const frac = (minutes - MORNING_START) / (EVENING_END - MORNING_START)
    return TOP_PERCENT + frac * (BOTTOM_PERCENT - TOP_PERCENT)
  }

  // Overnight: ease back from the evening position to the morning position.
  const overnightSpan = 1440 - (EVENING_END - MORNING_START)
  const elapsed = minutes > EVENING_END ? minutes - EVENING_END : minutes + (1440 - EVENING_END)
  const frac = elapsed / overnightSpan
  return BOTTOM_PERCENT - frac * (BOTTOM_PERCENT - TOP_PERCENT)
}

function gradientFor(date: Date): string {
  const band = bandPositionFor(date)
  const before = Math.max(0, band - 22)
  const after = Math.min(100, band + 22)
  return `linear-gradient(180deg, #ffffff 0%, #fef9c3 ${before}%, #fde047 ${band}%, #fef9c3 ${after}%, #ffffff 100%)`
}

export function useSunsetGradient() {
  const [background, setBackground] = useState(() => gradientFor(new Date()))

  useEffect(() => {
    const update = () => setBackground(gradientFor(new Date()))
    update()
    const interval = setInterval(update, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  return background
}
