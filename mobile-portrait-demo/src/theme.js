(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.MobileTheme = factory();
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const NIGHT_COMMUTE_THEME = {
    name: 'night-commute',
    palette: {
      skyTop: 0x070a1f,
      skyBottom: 0x263a66,
      mountainFar: 0x293655,
      mountainNear: 0x46597f,
      city: 0x172638,
      ground: 0x57402b,
      groundDark: 0x251a16,
      panel: 0x101827,
      text: 0xfff0c2,
      ink: 0x050505,
      homeGlow: 0xffd36a,
      warning: 0xff5d5d,
      portalBlue: 0x46a6ff,
      portalOrange: 0xffa332,
      button: 0xd9d0bb,
      buttonActive: 0xffd15f
    }
  };

  return { NIGHT_COMMUTE_THEME };
}));
