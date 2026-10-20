// Date/time formatting pinned to Baku time, with Azerbaijani month and
// weekday names (Intl's own "az" locale data is patchy across browsers).
const EN_TO_AZ_WEEKDAY = {
  Sunday: 'Bazar',
  Monday: 'Bazar ertəsi',
  Tuesday: 'Çərşənbə axşamı',
  Wednesday: 'Çərşənbə',
  Thursday: 'Cümə axşamı',
  Friday: 'Cümə',
  Saturday: 'Şənbə',
}

const EN_TO_AZ_MONTH = {
  January: 'yanvar',
  February: 'fevral',
  March: 'mart',
  April: 'aprel',
  May: 'may',
  June: 'iyun',
  July: 'iyul',
  August: 'avqust',
  September: 'sentyabr',
  October: 'oktyabr',
  November: 'noyabr',
  December: 'dekabr',
}

function getBakuDateParts(date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Baku',
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).formatToParts(date)
  return Object.fromEntries(parts.map((p) => [p.type, p.value]))
}

export function formatBakuTime(date) {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Baku',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
}

// "Çərşənbə axşamı, 20 oktyabr" / "Tuesday, October 20"
export function formatBakuDay(lang, date) {
  const { weekday, month, day } = getBakuDateParts(date)
  return lang === 'az' ? `${EN_TO_AZ_WEEKDAY[weekday]}, ${day} ${EN_TO_AZ_MONTH[month]}` : `${weekday}, ${month} ${day}`
}
