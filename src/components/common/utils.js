
export const toColRef = (n) => n >= 26 ? String.fromCharCode(Math.floor(n / 26) + 64) + String.fromCharCode(n % 26 + 65) : String.fromCharCode(n + 65);
export const toPx = (n) => n + 'px';

export const rowHeaderWidth = 32;
export const columnHeaderHeigth = 23; // column header height - 1



