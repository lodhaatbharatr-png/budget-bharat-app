export const INCOME_TYPES = ['INCOME', 'BORROW'];

export const SELECT_STYLE = { colorScheme: 'light' };

export const MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

// Vite bundles the repository icon without embedding a large Base64 string
// in the JavaScript source.
export const APP_ICON_URL = new URL('../assets/icon.png', import.meta.url).href;
export const APP_ICON_WHITE = APP_ICON_URL;
export const APP_LOGO_COLORED = APP_ICON_URL;
export const APP_LOGO_WHITE = APP_ICON_URL;
