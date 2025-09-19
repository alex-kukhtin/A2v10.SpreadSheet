
export const toColRef = (n) => n >= 26 ? String.fromCharCode(Math.floor(n / 26) + 64) + String.fromCharCode(n % 26 + 65) : String.fromCharCode(n + 65);
export const toPx = (n) => n + 'px';

export const rowHeaderWidth = 32;
export const columnHeaderHeigth = 23; // column header height - 1


export function pt2Px(p) {
	return Math.round(p * 1.33333 * 100) / 100; // pt * (96 / 72);
}

export function px2Pt(px) {
	return px * .75; // px * (72 / 96)
}

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
		return `${b}:${i}:${fs}:${a}:${va}:${brd}`;
	}

	cellClass(key) {
		let st = this.styles[key];
		let c = '';
		if (!st) return c;
		if (st.Bold)
			c += ' bold';
		if (st.Italic)
			c += ' italic';
		if (st.Align)
			c += ` text-${st.Align.toLowerCase()}`;
		if (st.VAlign)
			c += ` align-${st.VAlign.toLowerCase()}`;
		return c;
	}

	cellStyle(key) {
		let st = this.styles[key];
		let c = {};
		if (!st) return c;
		if (st.FontSize)
			c.fontSize = `${st.FontSize}pt`;

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
			}
			else if (bx.length === 4) {
				setBorder('borderTop', bx[0]);
				setBorder('borderRight', bx[1]);
				setBorder('borderBottom', bx[2]);
				setBorder('borderLeft', bx[3]);
			}
		}
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
		if (shc === '-:-:-:-:-:-')
			return undefined;
		let ns = this.stylesMap[shc];
		return ns || this.appendNewStyle(sobj, shc);
	}
};
