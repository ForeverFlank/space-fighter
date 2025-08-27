const J2000 = new Date(Date.UTC(2000, 0, 1, 12, 0, 0));

function toDate(time) {
    return new Date(J2000.getTime() + time * 1000);
}

function formatDate(isoString) {
  const date = new Date(isoString);

  const pad = (num) => num.toString().padStart(2, '0');

  const year = date.getUTCFullYear();
  const month = pad(date.getUTCMonth() + 1);
  const day = pad(date.getUTCDate());

  const hours = pad(date.getUTCHours());
  const minutes = pad(date.getUTCMinutes());
  const seconds = pad(date.getUTCSeconds());
  const milliseconds = Math.floor(date.getUTCMilliseconds() / 100);

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds}`;
}

export { J2000, toDate, formatDate }