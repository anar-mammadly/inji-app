// Everything Sədəf, Inji's companion pearl, can say — in both app languages.
//
// Each event has a small pool; the same line is never said twice in a row.
// {min} is filled with the length of the session or break that is starting.
// Keep the two languages in step: lines.test.js fails if an event exists in
// one language but not the other.
export const COMPANION_LINES = {
  az: {
    hello: ['Salam! Mən Sədəfəm. Sən işlə, vaxta mən baxım.', 'Gəldim. Nədən başlayırıq?', 'Buradayam. Lazım olsam, mənə toxun.'],
    helloMorning: ['Sabahın xeyir! Günün ilk incisi səni gözləyir.', 'Sabahın xeyir. Ən çətin işdən başlayaq?'],
    helloEvening: ['Axşamın xeyir. Bir az da işləyək, sonra dincələrsən.'],
    helloNight: ['Gecdir. Bir sessiya edək, sonra yat.'],
    focusStart: [
      'Başladıq. {min} dəqiqə, yalnız bir iş.',
      'Mən susuram, sən diqqətini topla.',
      'Telefonu əl çatmayan yerə qoy. Getdik.',
      'İnci qat-qat böyüyür. Yaxşı iş də elədir.',
    ],
    focusAlmost: ['Son dəqiqə. Fikrini tamamla.', 'Az qaldı. Yarımçıq cümləni bitir.'],
    breakStart: [
      'Vaxt bitdi! Qalx, {min} dəqiqə fasilədir.',
      'Əla işlədin. İndi ayağa qalx.',
      'Fasilə! Stuldan uzaqlaş.',
      'Bir qat da hazırdır. İndi bədənini tərpət.',
    ],
    breakTip: [
      'Bir stəkan su iç.',
      'Pəncərədən uzağa bax, gözlərin dincəlsin.',
      'Çiyinlərini on dəfə geriyə fırlat.',
      'Otaqda bir dövrə vur.',
      'Əllərini yuxarı uzat və dərindən nəfəs al.',
      'Boynunu yavaşca sağa, sonra sola əy.',
      'Bir neçə dəfə barmaq uclarında qalx.',
    ],
    focusResume: ['Fasilə bitdi. Davam edək.', 'Təzələndik. Növbəti sessiya başladı.', 'Xoş gəldin. Qaldığımız yerdən davam.'],
    paused: ['Dayandıq. Hazır olanda davam et.', 'Fasilə verdin. Gözləyirəm.'],
    resumed: ['Davam!', 'Yenə işdəyik.'],
    cancelled: ['Sessiya dayandı. Eybi yox, yenisini başlayarıq.', 'Bu dəfə alınmadı. Hazır olanda yenidən cəhd edərik.'],
    taskDone: ['Bir inci də bankada!', 'Afərin! Tapşırıq bitdi.', 'Tıq! Banka dolur.', 'Bir iş azaldı.'],
    goalReached: ['Günlük hədəf tamamdır! Səninlə fəxr edirəm.'],
    tap: ['Hə?', 'Buradayam.', 'Eşidirəm.', 'Gözüm səndədir.'],
    tickle: ['Qıdıqlanıram! Dayan!', 'Hahaha, bəsdir!', 'Başım fırlandı.'],
    moved: ['Buranı bəyəndim.', 'Yaxşı yerdir.'],
  },
  en: {
    hello: ["Hi! I'm Sadaf. You work, I'll watch the clock.", "I'm here. What are we starting with?", 'Here I am. Tap me if you need me.'],
    helloMorning: ['Good morning! The first pearl of the day is waiting.', 'Good morning. Shall we start with the hardest thing?'],
    helloEvening: ['Good evening. A little more work, then you rest.'],
    helloNight: ["It's late. One session, then sleep."],
    focusStart: [
      'Off we go. {min} minutes, one task.',
      "I'll stay quiet. You concentrate.",
      "Put the phone out of reach. Let's go.",
      'A pearl grows layer by layer. So does good work.',
    ],
    focusAlmost: ['Last minute. Finish your thought.', 'Almost there. Wrap up that sentence.'],
    breakStart: [
      "Time's up! Stand up, it's a {min}-minute break.",
      'Nice work. Now get on your feet.',
      'Break! Step away from the chair.',
      'One more layer done. Now move your body.',
    ],
    breakTip: [
      'Drink a glass of water.',
      'Look out the window, far away. Let your eyes rest.',
      'Roll your shoulders back ten times.',
      'Take a lap around the room.',
      'Reach your arms up and breathe in deeply.',
      'Tilt your neck gently to the right, then to the left.',
      'Rise onto your toes a few times.',
    ],
    focusResume: ['Break is over. Back to it.', 'Refreshed. The next session is on.', 'Welcome back. Right where we left off.'],
    paused: ["Paused. Carry on when you're ready.", "On hold. I'll wait."],
    resumed: ['And we are back.', 'On we go.'],
    cancelled: ["Session stopped. That's fine, we'll start another.", "Not this time. We'll try again when you're ready."],
    taskDone: ['One more pearl in the jar!', 'Well done! Task finished.', 'Plink! The jar is filling up.', 'One less thing to do.'],
    goalReached: ["Daily goal reached! I'm proud of you."],
    tap: ['Yes?', "I'm here.", 'Listening.', "I've got my eye on you."],
    tickle: ['That tickles! Stop!', 'Hahaha, enough!', "I'm dizzy."],
    moved: ['I like it here.', 'Nice spot.'],
  },
}

// Picks a line for an event, avoiding the one used last time for that event.
// `memory` is a plain object the caller keeps between calls.
export function pickLine(lang, event, memory = {}, vars = {}, random = Math.random) {
  const pool = (COMPANION_LINES[lang] || COMPANION_LINES.az)[event]
  if (!pool || pool.length === 0) return ''
  let index = Math.floor(random() * pool.length)
  if (pool.length > 1 && index === memory[event]) index = (index + 1) % pool.length
  memory[event] = index
  return pool[index].replace(/\{(\w+)\}/g, (_, name) => String(vars[name] ?? ''))
}

// Which greeting fits the hour (0–23).
export function greetingEvent(hour) {
  if (hour < 5) return 'helloNight'
  if (hour < 11) return 'helloMorning'
  if (hour >= 19) return 'helloEvening'
  return 'hello'
}
