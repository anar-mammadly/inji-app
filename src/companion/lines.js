// Everything Sədəf, Inji's companion pearl, can say — in both app languages.
//
// Each event has a small pool; the same line is never said twice in a row.
// Placeholders: {min} minutes of the block or break, {left} blocks still to go,
// {time} a clock time.
// Keep the two languages in step: lines.test.js fails if an event exists in
// one language but not the other.
export const COMPANION_LINES = {
  az: {
    // ── greetings ──
    hello: ['Salam! Mən Sədəfəm. Vaxtı mən sayaram.', 'Gəldim. Nədən başlayırıq?', 'Buradayam. Lazım olsam, mənə toxun.'],
    helloMorning: ['Sabahın xeyir! Günün ilk incisi səni gözləyir.', 'Sabahın xeyir! Bu gün nə planlaşdırmısan?'],
    helloEvening: ['Axşamın xeyir. Bir az da işləyək, sonra dincələrsən.'],
    helloNight: ['Gecdir. Bir blok edək, sonra yat.'],
    // ── a focus block ──
    focusStart: [
      '{min} dəqiqə başladı. Uğurlar!',
      'Mən susuram ki, fikrin dağılmasın.',
      'Bildirişləri bağla. Getdik.',
      'İnci qat-qat böyüyür. Yaxşı iş də elədir.',
    ],
    lastBlock: ['Bu, bugünkü sonuncu blokdur.', 'Sonuncu blok. Boyunbağıya bir inci qaldı.'],
    focusSoon: ['Bu blok bitmək üzrədir. Sakitcə yekunlaşdır.', 'Bir azdan fasilə. Harada qaldığını qeyd et.'],
    focusDone: [
      'Blok bitdi. Ayağa qalxmaq vaxtıdır.',
      '{min} dəqiqəlik fasilə qazandın. Qalx!',
      'Fasilə vaxtıdır. Mən hazıram.',
      'Bu qədər bəsdir. İndi bir az hərəkət.',
    ],
    // ── overtime: the block is over but nobody stood up ──
    overtime: [
      'Vaxt çoxdan bitib. Qısa bir gəzinti kifayətdir.',
      'Mən solğunlaşıram, sən yorulursan. Fasilə verək.',
      'İş qaçmır. Əvvəlcə bir az hərəkət.',
      'Fasiləsiz işləmək səmərəni azaldır. Qalx.',
      'Hələ buradayıq? Ayağa qalxmaq cəmi bir saniyədir.',
    ],
    wearDull: ['Tozlanmağa başladım…', 'Parıltım getdikcə azalır.'],
    wearClosing: ['Balıqqulağım bağlanır. Qalx ki, açılım.'],
    wearShut: ['Qapandım. Məni açmaq üçün ayağa qalx.'],
    snooze: ['Yaxşı, beş dəqiqə də. Sonra mütləq qalxırıq.'],
    // ── standing up and the break ──
    standUp: ['Afərin, qalxdın!', 'Tozumu silkələdim. Hərəkət vaxtıdır.', 'Əla qərar. Bir az gəzək.', 'Budur! Bədənin sevinir.'],
    standUpEarly: ['Blok yarımçıq qaldı, amma fasilə də işin bir hissəsidir.'],
    longBreak: ['{min} dəqiqəlik uzun fasilə. Bunu qazanmısan.'],
    walkTip: [
      'Mətbəxə get, su iç və qayıt.',
      'Bir dəqiqəlik açıq havaya çıx.',
      'Otağı iki dəfə dolan.',
      'Uzaqdakı bir nöqtəyə bax, gözlərini dincəlt.',
      'Yüz addım at, sayaraq.',
      'Pəncərəni aç və dərindən nəfəs al.',
      'Gəzərkən çiyinlərini boşalt.',
    ],
    stretchTip: [
      'Kürəyini düzəlt, çiyinlərini geri çək.',
      'Başını yavaşca dairəvi hərəkətlə döndər.',
      'Biləklərini silkələ, barmaqlarını uzat.',
      'Ayaqlarını masanın altında uzat, on saniyə saxla.',
      'Əllərini arxada birləşdir, sinəni aç.',
      'Üç dəfə yavaş və dərin nəfəs al.',
      'Oturduğun yerdə belini sağa və sola bur.',
    ],
    breakDone: ['Fasilə tamam oldu. Növbəti bloka keçək?', 'Dincəldik. Hazır olanda davam edək.'],
    backToFocus: ['Yenidən işdəyik.', 'Gəzinti yaxşı oldu. İndi fokus.', 'Qarşıda {left} blok var.', 'Boyunbağıya bir inci də düzüldü.'],
    fact: [
      'Qısa və tez-tez fasilələr bir uzun fasilədən faydalıdır.',
      'Bir neçə dəqiqəlik gəzinti qan dövranını canlandırır.',
      'Hərəkətdən sonra fikir daha aydın olur. Hiss etdin?',
    ],
    // ── the end of a run, milestones ──
    runDone: ['Bütün bloklar tamamlandı. Əla iş!', 'Boyunbağı hazırdır!'],
    firstRun: ['İlk tam seansın! Yaxşı başlanğıcdır.'],
    streak7: ['Bir həftədir fasilələri buraxmırsan. Belə davam!'],
    blocks50: ['50 blok! Bu artıq vərdişdir.'],
    blocks100: ['100 blok. Sən əsl ustasan.'],
    // ── everything else ──
    muteOn: ['Səssiz rejim: saat {time}-dək narahat etmirəm.'],
    muteOff: ['Səs yenidən açıqdır.'],
    paused: ['Dayandıq. Hazır olanda davam et.', 'Fasilə verdin. Gözləyirəm.'],
    resumed: ['Davam!', 'Yenə işdəyik.'],
    cancelled: ['Blok dayandı. Eybi yox, yenisini başlayarıq.', 'Bu dəfə alınmadı. Hazır olanda yenidən cəhd edərik.'],
    taskDone: ['Bir inci də bankada!', 'Afərin! Tapşırıq bitdi.', 'Tıq! Banka dolur.', 'Bir iş azaldı.'],
    goalReached: ['Günlük hədəf tamamdır! Səninlə fəxr edirəm.'],
    tap: ['Bəli?', 'Nə lazımdır?', 'Dinləyirəm.', 'Salam!'],
    tickle: ['Ay, yuvarlandım!', 'Bəsdir, başım gicəlləndi!', 'Belə oynamaq olmaz!'],
    moved: ['Buranı bəyəndim.', 'Yaxşı yerdir.'],
  },
  en: {
    hello: ["Hi! I'm Sadaf. I'll keep the time.", "I'm here. What are we starting with?", 'Here I am. Tap me if you need me.'],
    helloMorning: ['Good morning! The first pearl of the day is waiting.', 'Good morning! What is the plan for today?'],
    helloEvening: ['Good evening. A little more work, then you rest.'],
    helloNight: ["It's late. One block, then sleep."],
    focusStart: [
      '{min} minutes, starting now. Good luck!',
      "I'll stay quiet so you can think.",
      "Notifications off. Let's go.",
      'A pearl grows layer by layer. So does good work.',
    ],
    lastBlock: ["This is today's last block.", 'Last block. One pearl left on the string.'],
    focusSoon: ['This block is nearly over. Wind down calmly.', 'A break is coming. Note where you are.'],
    focusDone: [
      'Block finished. Time to get up.',
      'You have earned a {min}-minute break. Up!',
      "Break time. I'm ready.",
      'That is enough for now. Go and move a little.',
    ],
    overtime: [
      'Time ran out a while ago. A short walk is enough.',
      "I'm fading and you're tiring. Let's take the break.",
      "The work isn't going anywhere. Move first.",
      'Working without breaks gets you less done. Up.',
      'Still here? Standing up takes one second.',
    ],
    wearDull: ["I'm starting to gather dust…", 'My shine is going.'],
    wearClosing: ['My shell is closing. Stand up and it opens.'],
    wearShut: ["I've closed up. Stand up to open me."],
    snooze: ['All right, five more minutes. Then we really get up.'],
    standUp: ['Well done, you are up!', 'Dust shaken off. Time to move.', "Good call. Let's walk a little.", 'There! Your body is glad.'],
    standUpEarly: ['The block was cut short, but a break is part of the work too.'],
    longBreak: ['A long break: {min} minutes. You have earned it.'],
    walkTip: [
      'Walk to the kitchen, drink some water, come back.',
      'Step outside for a minute of fresh air.',
      'Go round the room twice.',
      'Look at something far away and rest your eyes.',
      'Take a hundred steps, counting.',
      'Open the window and breathe in deeply.',
      'Let your shoulders drop as you walk.',
    ],
    stretchTip: [
      'Straighten your back and pull your shoulders back.',
      'Slowly roll your head in a circle.',
      'Shake out your wrists and stretch your fingers.',
      'Stretch your legs under the desk and hold for ten seconds.',
      'Clasp your hands behind you and open your chest.',
      'Take three slow, deep breaths.',
      'Twist your waist to the right and to the left, in your seat.',
    ],
    breakDone: ['The break is over. On to the next block?', "Rested. Let's carry on when you're ready."],
    backToFocus: ['Back at it.', 'That walk helped. Now focus.', '{left} blocks to go.', 'One more pearl on the string.'],
    fact: [
      'Short, frequent breaks do more good than one long one.',
      'A few minutes of walking gets the blood moving.',
      'Thinking is clearer after moving. Did you notice?',
    ],
    runDone: ['Every block is done. Great work!', 'The string of pearls is complete!'],
    firstRun: ['Your first full session! A good start.'],
    streak7: ['A week without skipping your breaks. Keep going!'],
    blocks50: ['50 blocks! This is a habit now.'],
    blocks100: ['100 blocks. You are a master at this.'],
    muteOn: ["Quiet mode: I won't disturb you until {time}."],
    muteOff: ['Sound is back on.'],
    paused: ["Paused. Carry on when you're ready.", "On hold. I'll wait."],
    resumed: ['And we are back.', 'On we go.'],
    cancelled: ["Block stopped. That's fine, we'll start another.", "Not this time. We'll try again when you're ready."],
    taskDone: ['One more pearl in the jar!', 'Well done! Task finished.', 'Plink! The jar is filling up.', 'One less thing to do.'],
    goalReached: ["Daily goal reached! I'm proud of you."],
    tap: ['Yes?', 'What do you need?', 'Listening.', 'Hello!'],
    tickle: ['Whoa, I rolled over!', 'Enough, I am dizzy!', 'That is no way to play!'],
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
