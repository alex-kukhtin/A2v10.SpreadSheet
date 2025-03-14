
import { columnHeaderHeigth, toColRef, toPx } from '../common/utils';

export default {
	render(h) {
		let p = this.$parent;
		let sh = p.sheet;
		let cont = p.$refs.container;
		if (!cont)
			return;
		let maxWidth = cont.clientWidth;
		let maxHeigth = cont.clientHeight;
		let elems = [];
		let y = columnHeaderHeigth;
		const startX = p.startX;
		for (const r of p.renderedRows()) {
			let x = startX;
			let rh = this.$parent.rowHeight(r);
			for (const c of p.renderedColumns()) {
				let colRef = toColRef(c)
				let cw = p.colWidth(c);
				const cellRef = `${colRef}${r + 1}`;
				let cell = sh.Cells[cellRef];
				if (cell) {
					let nw = cw;
					let nh = rh;
					let cellCls = 'cell' + p.cellClass(cell);
					if (cell.ColSpan > 1 || cell.RowSpan > 1) {
						for (let sc = 1; sc < cell.ColSpan; sc++)
							nw += p.colWidth(sc + c);
						for (let sr = 1; sr < cell.RowSpan; sr++)
							nh += p.rowHeight(sr + r);
						cellCls += ' span';
						elems.push(h('div', {
							class: 'cell-ph',
							style: { left: toPx(x + 1), top: toPx(y + 1), width: toPx(nw - 1), height: toPx(nh - 1) },
						}));
					}
					elems.push(h('div', {
						class: cellCls,
						style: { left: toPx(x), top: toPx(y), width: toPx(nw + 1), height: toPx(nh + 1) },
						on: { pointerdown: (ev) => this.clickPh(c, r, cell, ev) }
					},
					cell.Content));
				}
				x += cw;
				if (x >= maxWidth)
					break;
			}
			y += rh;
			if (y >= maxHeigth)
				break;
		}
		return h('div', { class: 'cells' }, elems);
	},
	methods: {
		clickPh(c, r, cell, ev) {
			ev.preventDefault();
			ev.stopPropagation();
			this.$parent.$selectCell(c, r, cell);
		}
	}
}
