
export const toColRef = (n) => n >= 26 ? String.fromCharCode(Math.floor(n / 26) + 64) + String.fromCharCode(n % 26 + 65) : String.fromCharCode(n + 65);
export const toPx = (n) => n + 'px';

export const rowHeaderWidth = 32;
export const columnHeaderHeigth = 23; // column header height - 1

export function fromCellRef(ref) { 
	const match = ref.match(/^([A-Z]+)(\d+)$/);
	if (!match)
		throw new Error(`Invalid cell reference: ${ref}`);

	const c = match[1];
	const rn = parseInt(match[2], 10);

	// (A=1, B=2, ..., Z=26, AA=27 ..)
	let cn = 0;
	for (let i = 0; i < c.length; i++) {
		cn *= 26;
		cn += c.charCodeAt(i) - 64; // 'A'.charCodeAt(0) === 65
	}

	return { r: rn, c: cn - 1 };
}


export function pt2Px(p) {
	return Math.round(p * 1.33333 * 100) / 100; // pt * (96 / 72);
}

export function px2Pt(px) {
	return px * .75; // px * (72 / 96)
}

export function isObjectEmpty(obj) {
	return Object.keys(obj).length === 0;
}

const EMPTY_STYLE = '-:-:-:-:-:-:-';

export class StyleProcessor {
	constructor(styles) {
		this.styles = styles;
		this.stylesMap = Object.keys(this.styles).reduce((p, c) => {
			let st = this.styles[c];
			let sc = this.styleHashCode(st);
			p[sc] = c;
			return p;
		}, {});
	}

	defaultStyle() {
		return {};		
	}


	styleHashCode(st) {
		if (!st) return '-';
		let b = st.Bold ? 'B' : '-';
		let i = st.Italic ? 'I' : '-';
		let fs = st.FontSize ? `FS${st.FontSize}` : '-';
		let a = st.Align ? st.Align[0] : '-';
		let va = st.VAlign ? st.VAlign[0] : '-';
		let brd = st.Border || '-';
		let bg = st.BackgroundColor ? `BG${st.Background}` : '-';
		// change empty style!
		return `${b}:${i}:${fs}:${a}:${va}:${brd}:${bg}`;
	}

	cellClass(key) {
		let st = this.styles[key];
		let c = '';
		if (!st) return c;
		if (st.Bold)
			c += ' c-bold';
		if (st.Italic)
			c += ' c-italic';
		if (st.Align)
			c += ` c-text-${st.Align.toLowerCase()}`;
		if (st.VAlign)
			c += ` c-align-${st.VAlign.toLowerCase()}`;
		return c;
	}

	cellStyle(key) {
		let st = this.styles[key];
		let c = {};
		if (!st) return c;
		if (st.FontSize)
			c.fontSize = `${st.FontSize}pt`;
		if (st.FontName) {
			c.fontFamily = st.FontName;
			console.dir(c);
		}

		function setBorder(name, val) {
			val = +val;
			if (!val)
				return;
			if (val === .2)
				c[name] = "1px solid black";
			else if (val === 1)
				c[name] = "2px solid black";
		}

		if (st.Border) {
			let bx = st.Border.split(',');
			if (bx.length === 1) {
				if (+bx[0] === 0.2)
					c.border = "1px solid black";
				else if (+bx[0] === 1)
					c.border = "3px solid black";
			}
			else if (bx.length === 4) {
				setBorder('borderTop', bx[0]);
				setBorder('borderRight', bx[1]);
				setBorder('borderBottom', bx[2]);
				setBorder('borderLeft', bx[3]);
			}
		}
		if (st.Background)
			c.backgroundColor = "#" + st.Background;
		return c;
	}

	cellStyle2(key) {
		let st = this.styles[key];
		let c = {};
		if (!st) return c;
		if (st.FontSize)
			c.fontSize = `${st.FontSize}pt`;
		if (st.FontName) {
			c.fontFamily = st.FontName;
		}
		if (st.Background)
			c.backgroundColor = "#" + st.Background;
		return c;
	}

	appendNewStyle(styleObj, hashCode) {
		function getNextKey(obj) {
			let i = 1;
			while (obj.hasOwnProperty(`S${i}`)) {
				i++;
			}
			return `S${i}`;
		}
		let skey = getNextKey(this.styles);
		Vue.set(this.styles, skey, styleObj);
		this.stylesMap[hashCode] = skey;
		return skey;
	}

	setStyleProp(st, prop, val) {
		let sobj = Object.assign({}, this.styles[st] || this.defaultStyle());
		sobj[prop] = val;
		let shc = this.styleHashCode(sobj);
		if (shc === EMPTY_STYLE) // check length
			return undefined;
		let ns = this.stylesMap[shc];
		return ns || this.appendNewStyle(sobj, shc);
	}
};
