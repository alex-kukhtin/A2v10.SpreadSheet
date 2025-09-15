
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
	let brd = st.Border || '-';
	return `${b}:${i}:${fs}:${a}:${va}:${brd}`;
}

export class StyleProcessor {
	constructor(styles) {
		this.styles = styles;
		this.stylesMap = Object.keys(this.styles).reduce((p, c) => {
			let st = this.styles[c];
			let sc = styleHashCode(st);
			p[sc] = c;
			return p;
		}, {});
	}

	defaultStyle() {
		return {};		
	}

	appendNewStyle(styleObj, hashCode) {
		let ix = Object.keys(this.styles).length + 1;
		let skey = '';
		do {
			skey = `S${ix}`;
			ix += 1;
		} while (this.styles[skey]);
		Vue.set(this.styles, skey, styleObj);
		this.stylesMap[hashCode] = skey;
		return skey;
	}

	setStyleProp(st, prop, val) {
		let sobj = Object.assign({}, this.styles[st] || this.defaultStyle());
		sobj[prop] = val;
		let shc = styleHashCode(sobj);
		if (shc === '-:-:-:-:-:-')
			return undefined;
		let ns = this.stylesMap[shc];
		return ns || this.appendNewStyle(sobj, shc);
	}
};
