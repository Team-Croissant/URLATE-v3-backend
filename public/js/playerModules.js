const numberWithCommas = x => {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

const getParam = sname => {
  let params = location.search.substr(location.search.indexOf("?") + 1);
  let sval = "";
  params = params.split("&");
  for (let i = 0; i < params.length; i++) {
      temp = params[i].split("=");
      if ([temp[0]] == sname) { sval = temp[1]; }
  }
  return sval;
};

const getTan = deg => {
  let rad = deg * Math.PI / 180;
  return Math.tan(rad);
};

const calcAngleDegrees = (x, y) => {
  return Math.atan2(y, x) * 180 / Math.PI;
};

const lowerBound = (array, value) => {
  if(value < 0) value = 0;
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
}