function pad(num) {
  return num < 10 ? `0${num}` : `${num}`;
}

function formatDate(date = new Date()) {
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  return `${year}-${month}-${day}`;
}

function formatDateTime(date = new Date()) {
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${formatDate(date)} ${hours}:${minutes}`;
}

function parseDateKey(dateKey) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function daysBetween(startKey, endKey) {
  const start = parseDateKey(startKey);
  const end = parseDateKey(endKey);
  const diff = end.getTime() - start.getTime();
  return Math.floor(diff / (24 * 60 * 60 * 1000));
}

module.exports = {
  formatDate,
  formatDateTime,
  parseDateKey,
  daysBetween
};
