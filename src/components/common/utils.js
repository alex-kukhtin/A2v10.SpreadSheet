
export const toColRef = (n) => n >= 26 ? String.fromCharCode(Math.floor(n / 26) + 64) + String.fromCharCode(n % 26 + 65) : String.fromCharCode(n + 65);
export const toPx = (n) => n + 'px';

export const rowHeaderWidth = 32;
export const columnHeaderHeigth = 23; // column header height - 1


export function styleHashCode(st) {
	if (!st) return '-';
	let b = st.Bold ? 'B' : '-';
	let i = st.Italic ? 'I' : '-';
	let fs = st.FontSize ? `FS${st.FontSize}` : '-';
	let a = st.Align ? st.Align[0] : '-';
	let va = st.VAlign ? st.VAlign[0] : '-';
	return `${b}:${i}:${fs}:${a}:${va}`;
}

export class StyleProcessor {
	constructor(styles) {
		this.styles = styles;
	}

	findStyle(st) {
		let hash = styleHashCode(st);
		console.dir(st);
		return this.styles[hash] || null;
	}

	setStyle(st, prop, val) {

	}
};
