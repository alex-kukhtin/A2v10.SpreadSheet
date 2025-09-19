
import { toColRef, toPx, rowHeaderWidth, columnHeaderHeigth, px2Pt } from '../common/utils';

export default {
	data() {
		return {
			rType: '',
			rItem: -1,
			rPt: -1,
			rSize: -1,
			delta: 0,
		}
	},
	methods: {
		clearData() {
			this.rType = '';
			this.rItem = -1;
			this.rSize = 0;
			this.rPt = 0;
			this.delta = 0;
		},
		onUp(ev, cb) {
			ev.target.releasePointerCapture(ev.pointerId);
			ev.stopPropagation();
			if (this.rItem < 0)
				return;
			let ns = this.rPt - this.rSize;
			if (ns < 5)
				ns = 5;
			cb(ns)
			this.clearData();
		},
		hMouseDown(ev) {
			ev.stopPropagation();
			let ep = this.$parent.pointFromEvent(ev);
			let col = this.$parent.colFromPoint(ep.x);
			if (!col) return;
			ev.target.setPointerCapture(ev.pointerId);
			this.rType = 'C';
			this.rItem = col.col;
			this.rPt = col.left + col.width;
			this.rSize = col.left;
			this.delta = this.rPt - ev.clientX;
		},
		hMouseUp(ev) {
			this.onUp(ev, nw => {
				let cw = px2pt(nw);
				// TODO: check DEFAULT width
				let col = this.$parent.getOrCreateColumn(this.rItem);
				Vue.set(col, 'Width', cw);
			});
		},
		hMouseMove(ev) {
			if (this.rItem < 0)
				return;
			this.rPt = ev.clientX + this.delta;
		},
		vMouseDown(ev) {
			ev.stopPropagation();
			let ep = this.$parent.pointFromEvent(ev);
			let row = this.$parent.rowFromPoint(ep.y);
			if (!row) return;
			ev.target.setPointerCapture(ev.pointerId);
			this.rType = 'R';
			this.rItem = row.row;
			this.rPt = row.top + row.height;
			this.rSize = row.top;
			this.delta = this.rPt - ev.clientY;
		},
		vMouseUp(ev) {
			this.onUp(ev, nh => {
				let row = this.$parent.getOrCreateRow(this.rItem);
				Vue.set(row, 'Height', px2Pt(nh));
			});
		},
		vMouseMove(ev) {
			if (this.rItem < 0)
				return;
			this.rPt = ev.clientY + this.delta;
		},
	},
	render(h) {
		let parent = this.$parent;
		let sh = parent.sheet;
		let cont = parent.$refs.container;
		if (!cont)
			return;
		let maxWidth = cont.clientWidth;
		let maxHeigth = cont.clientHeight;
		let elems = [];
		let self = this;
		let startX = parent.startX;

		let maxPos = { right: 0, bottom: 0 };

		function vLines() {
			let x = startX; // row header width
			for (const c of parent.renderedColumns()) {
				x += parent.colWidth(c);
				if (x >= maxWidth)
					break;
				let cls = 'vline';
				if (c == sh.FixedColumns - 1)
					cls += ' freeze';
				elems.push(h('div', { class: cls, style: { left: toPx(x), height: toPx(maxPos.bottom) } }));
			}
		}

		function hLines() {
			let y = columnHeaderHeigth;
			for (const r of parent.renderedRows()) {
				let rh = parent.rowHeight(r);
				y += rh;
				if (y >= maxHeigth)
					break;
				let cls = 'hline';
				if (r === sh.FixedRows - 1)
					cls += ' freeze';
				elems.push(h('div', { class: cls, style: { top: toPx(y), width: toPx(maxPos.right) } }));
			}
		}

		function topHeader() {
			let x = startX; // row header width
			for (const c of parent.renderedColumns()) {
				let colRef = toColRef(c);
				let cw = parent.colWidth(c);
				let cls = 'thc';
				if (parent.isInSelection((sel, cell) => c >= sel.left && c <= sel.left + (cell?.ColSpan - 1 || 0)))
					cls += ' thc-sel';
				if (c === sh.ColumnCount - 1) {
					cls += ' last';
					cw += 1;
				}
				elems.push(h('div', { class: cls, style: { width: toPx(cw), left: toPx(x) } }, [colRef,
					h('div', {
						class: 'h-size no-me',
						on: { pointerdown: self.hMouseDown, pointerup: self.hMouseUp, pointermove: self.hMouseMove }
					})]));
				x += cw;
				if (x >= maxWidth)
					break;
			}
			maxPos.right = x - rowHeaderWidth - 1; /* without combo! */
		}

		function leftHeader() {
			let y = columnHeaderHeigth;
			for (const r of parent.renderedRows()) {
				let rh = parent.rowHeight(r);
				let cls = 'thr'
				if (parent.isInSelection((sel, cell) => r >= sel.top && r <= sel.top + (cell?.RowSpan - 1 || 0)))
					cls += ' thr-sel'
				if (r === sh.RowCount - 1) {
					cls += ' last';
					rh += 1;
				}
				elems.push(h('div', { class: cls, style: { height: toPx(rh), top: toPx(y) } }, ['' + (r + 1),
				h('div', {
					class: 'v-size no-me',
					on: { pointerdown: self.vMouseDown, pointerup: self.vMouseUp, pointermove: self.vMouseMove }
				})]));
				y += rh;
				if (y >= maxHeigth) {
					break;
				}
			}
			maxPos.bottom = y - columnHeaderHeigth - 1;
		}

		if (parent.headers) {
			elems.push(h('div', { class: 'r-top' }));
			topHeader();
			leftHeader();
		} else if (parent.gridLines) {
			console.dir('calc maxPos')
		}

		if (parent.gridLines) {
			vLines();
			hLines();
		}

		if (this.rItem >= 0) {
			if (this.rType == 'C')
				elems.push(h('div', { class: 'h-resize-line', style: { left: toPx(this.rPt) } }));
			else
				elems.push(h('div', { class: 'v-resize-line', style: { top: toPx(this.rPt) } }));
		}


		return h('div', { class: 'canvas' }, elems);
	}
};
