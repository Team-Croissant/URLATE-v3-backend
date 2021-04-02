const numberWithCommas = (x) => {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

function convertWordArrayToUint8Array(wordArray) {
  let arrayOfWords = wordArray.hasOwnProperty("words") ? wordArray.words : [];
  let length = wordArray.hasOwnProperty("sigBytes")
    ? wordArray.sigBytes
    : arrayOfWords.length * 4;
  let uInt8Array = new Uint8Array(length),
    index = 0,
    word,
    i;
  for (i = 0; i < length; i++) {
    word = arrayOfWords[i];
    uInt8Array[index++] = word >> 24;
    uInt8Array[index++] = (word >> 16) & 0xff;
    uInt8Array[index++] = (word >> 8) & 0xff;
    uInt8Array[index++] = word & 0xff;
  }
  return uInt8Array;
}

const getTan = (deg) => {
  let rad = (deg * Math.PI) / 180;
  return Math.tan(rad);
};

const calcAngleDegrees = (x, y) => {
  return (Math.atan2(y, x) * 180) / Math.PI;
};

const lowerBound = (array, value) => {
  if (value < 0) value = 0;
  let low = 0;
  let high = array.length;
  while (low < high) {
    const mid = Math.floor(low + (high - low) / 2);
    if (value <= array[mid].ms) {
      high = mid;
    } else {
      low = mid + 1;
    }
  }
  return low;
};

const upperBound = (array, value) => {
  let low = 0;
  let high = array.length;
  while (low < high) {
    const mid = Math.floor(low + (high - low) / 2);
    if (value >= array[mid].ms) {
      low = mid + 1;
    } else {
      high = mid;
    }
  }
  return low;
};
