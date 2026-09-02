import { useEffect } from 'react'

const CHECK_INTERVAL_MS = 60 * 1000

export function canUseNotifications() {
  return typeof window !== 'undefined' && 'Notification' in window
}

export async function requestNotificationPermission() {
  if (!canUseNotifications()) return false
  if (Notification.permission === 'granted') return true
  const result = await Notification.requestPermission()
  return result === 'granted'
}

// Best-effort reminders: only fires while this tab is open and not throttled
// by the browser. There is no service worker, so closing the tab silently
// stops reminders — this is a known v1 limitation, not a bug.
export function useReminders(learningGoals, markReminded) {
  useEffect(() => {
    if (!canUseNotifications()) return

    const id = setInterval(() => {
      const now = Date.now()
      learningGoals.forEach((goal) => {
        if (!goal.reminderIntervalMinutes) return
        const last = goal.lastReminderAt ? new Date(goal.lastReminderAt).getTime() : 0
        const dueMs = goal.reminderIntervalMinutes * 60 * 1000
        if (now - last >= dueMs) {
          if (Notification.permission === 'granted') {
            new Notification(goal.title, { body: `${goal.currentProgress}/${goal.targetProgress}` })
          }
          markReminded(goal.id)
        }
      })
    }, CHECK_INTERVAL_MS)

    return () => clearInterval(id)
  }, [learningGoals, markReminded])
}
