(function(root){
  // Exclude visually ambiguous 0/o/1/l; require both a letter and a digit.
  function generate(cryptoSource=globalThis.crypto){
    const alphabet='abcdefghijkmnpqrstuvwxyz23456789';
    const limit=256-256%alphabet.length;
    for(;;){
      let value='';
      while(value.length<6){const bytes=cryptoSource.getRandomValues(new Uint8Array(12));for(const b of bytes){if(b<limit)value+=alphabet[b%alphabet.length];if(value.length===6)break;}}
      if(/[a-z]/.test(value)&&/[2-9]/.test(value))return value;
    }
  }
  if(typeof module!=='undefined')module.exports={generate};
  if(root)root.studentPassword={generate};
})(typeof window==='undefined'?null:window);
