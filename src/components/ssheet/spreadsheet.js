
import spreadSheetCanvas from './canvas';
import spreadSheetCells from './cells';
import spreadSheetSelection from './selection';
import spreadSheetEdit from './edit';
import spreadSheetToolbar from './toolbar';

import {
	toColRef, fromCellRef, rowHeaderWidth, columnHeaderHeigth, StyleProcessor,
	pt2Px
} from '../common/utils';

const defaultColumWidth = 54; // 56pt = 72px
const defaultRowHeight = 15; // 15pt = 20px;

const rowComboWidth = 75;

function* enumerateSel(sel) {
	if (!sel || !sel.length) return;
	for (let sa of sel)
		for (let r = sa.top; r < sa.bottom; r++)
			for (let c = sa.left; c < sa.right; c++)
				yield `${toColRef(c)}${r + 1}`;
}

const spreadsheetTemplate = `
<div class="ss-container" :class="{editable}">
	<ss-toolbar v-if="editable" />
	<div class="ss-body" :key=updateCount ref=container tabindex=0 :style=bodyStyle
		@pointerup=pointerup @pointerdown=pointerdown @pointermove=pointermove
		@dblclick=dblclick @keydown.self.stop=keydown @wheel.prevent=mousewheel>
		<ss-canvas />
		<ss-rows-combo v-if="rowsCombo" />
		<ss-cells />
		<ss-selection />
		<ss-edit v-if=editing text=editText />
	</div>
	<a2-scroll-bar class="no-me" :horz=true :min="sheet.FixedColumns || 0" :max="sheet.ColumnCount"
		:pos="scrollPos.x" :page="hScrollPageSize()"" :setPos=setPosX></a2-scroll-bar>
	<a2-scroll-bar class="no-me" :horz=false :min="sheet.FixedRows || 0" :max="sheet.RowCount"
		:pos="scrollPos.y" :page="vScrollPageSize()" :setPos=setPosY></a2-scroll-bar>
</div>
`;

Vue.component('a2-spreadsheet', {
	template: spreadsheetTemplate,
	components: {
		'ss-canvas': spreadSheetCanvas,
		'ss-cells': spreadSheetCells,
		'ss-selection': spreadSheetSelection,
		'ss-edit': spreadSheetEdit,
		'ss-toolbar': spreadSheetToolbar
	},
	props: {
		report: Object,
		gridLines: { type: Boolean, default: true },
		headers: { type: Boolean, default: true },
		rowsCombo: Boolean,
		editable: { type: Boolean, default: true }
	},
	data() {
		return {
			updateCount: 0,
			scrollPos: { x: 0, y: 0 },
			editing: false,
			selecting: false,
			editRect: { l: 0, t: 0, w: 0, h: 0, c: '', r: -1 },
			editText: '',
			selStart: { c: 0, r: 0 },
			selection: []
		};
	},
	computed: {
		sheet() {
			return this.report.Workbook;
		},
		startX() {
			return rowHeaderWidth + (this.rowsCombo ? rowComboWidth : 0);
		},
		bodyStyle() {
			console.dir(this.sheet);
			return { fontFamily: this.report.FontFamily, fontSize: `${this.sheet.FontSize}pt` };
		}
	},
	methods: {
		rowFromPoint(pointY) {
			let y = columnHeaderHeigth;
			for (const r of this.renderedRows()) {
				let rh = this.rowHeight(r);
				if (pointY >= y && pointY <= (y + rh))
					return { row: r, top: y, height: rh };
				y += rh;
			}
			return null;
		},
		colFromPoint(pointX) {
			let x = this.startX;
			for (const c of this.renderedColumns()) {
				let cw = this.colWidth(c);
				if (pointX >= x && pointX <= (x + cw))
					return { col: c, left: x, width: cw };
				x += cw;
			}
			return null;
		},
		colWidth(c) {
			let col = this.sheet.Columns[toColRef(c)];
			let cw = this.sheet.ColumnWidth ?? defaultColumWidth;
			if (col && col.Width)
				cw = col.Width == -1 ? 70 : col.Width;
			return pt2Px(cw);
		},
		rowHeight(r) {
			let row = this.sheet.Rows[r + 1];
			let rh = this.sheet.RowHeight ?? defaultRowHeight;
			if (row && row.Height)
				rh = row.Height;
			return pt2Px(rh);
		},
		getOrCreateRow(r) {
			let row = this.sheet.Rows[r + 1];
			if (!row) {
				row = {};
				Vue.set(this.sheet.Rows, r + 1, row);
			}
			return row;
		},
		getOrCreateColumn(c) {
			let colRef = toColRef(c);
			let col = this.sheet.Columns[colRef];
			if (!col) {
				col = {};
				Vue.set(this.sheet.Columns, colRef, col);
			}
			return col;
		},
		selRect(s) {
			let xc = s.left; let xr = s.top;
			let y = columnHeaderHeigth;
			let rect = { left: 0, top: 0, height: 0, width: 0 };
			for (const r of this.renderedRows()) {
				let rh = this.rowHeight(r);
				if (r === xr) {
					rect.top = y; rect.height = rh;
					break;
				}
				else if (r > xr)
					break;
				y += rh;
			}
			let x = this.startX;
			for (const c of this.renderedColumns()) {
				let cw = this.colWidth(c);
				if (c === xc) {
					rect.left = x, rect.width = cw;
					break;
				}
				else if (c > xc)
					break;
				x += cw;
			}
			return rect;
		},
		pointFromEvent(ev) {
			let cont = this.$refs.container;
			let rect = cont.getBoundingClientRect();
			let y = ev.clientY - rect.top;
			let x = ev.clientX - rect.left;
			return { x, y };
		},
		setPosX(pos) {
			this.scrollPos.x = pos;
		},
		setPosY(pos) {
			this.scrollPos.y = pos;
		},
		renderedRows: function* () {
			let sh = this.sheet;
			for (let f = 0; f < sh.FixedRows; f++)
				yield f;
			for (let f = this.scrollPos.y; f < sh.RowCount; /* maxRows ??*/ f++)
				yield f;
		},
		renderedColumns: function* () {
			let sh = this.sheet;
			for (let c = 0; c < sh.FixedColumns; c++)
				yield c;
			for (let c = this.scrollPos.x; c < sh.ColumnCount; /*maxColumns ?? */ c++)
				yield c;
		},
		setPos(c, r) {
			let sa = this.selection;
			if (!sa || !sa.length) return;
			let sel = sa[0];
			let sh = this.sheet;
			let fix = sh.Fixed;
			if (c < 0) c = 0;
			if (c > sh.ColumnCount - 1) c = sh.ColumnCount - 1;
			if (r < 0) r = 0;
			if (r > sh.RowCount - 1) r = sh.RowCount - 1;
			sel.left = c; sel.right = c + 1;
			sel.top = r; sel.bottom = r + 1;
			this.fitScrollPos();
		},
		mousewheel(ev) {
			let deltaY = +(ev.deltaY / 100).toFixed();
			if (deltaY > 0)
				this.scrollPos.y = Math.min(this.scrollPos.y + deltaY, this.sheet.RowCount - this.vScrollPageSize());
			else
				this.scrollPos.y = Math.max(this.scrollPos.y + deltaY, (this.sheet.FixedRows || 0));
		},
		keydown(ev) {
			let sa = this.selection;
			if (!sa || !sa.length) return;
			let sel = sa[0];
			switch (ev.which) {
				case 37: /* left */
					this.setPos(sel.left - 1, sel.top);
					break;
				case 38: /* up */
					this.setPos(sel.left, sel.top - 1);
					break;
				case 39: /* right */
					this.setPos(sel.left + 1, sel.top);
					break;
				case 40: /* down */
					this.setPos(sel.left, sel.top + 1);
					break;
				case 34: /* pgdn */
					this.setPos(sel.left, sel.top + this.vScrollPageSize() + this.sheet.FixedRows /*TODO last visible row*/);
					break;
				case 33: /* pgup */
					this.setPos(sel.left, sel.top - this.vScrollPageSize()/*TODO* first visible row*/);
					break;
				case 36: /* home */
					this.setPos(0, sel.top);
					break;
				case 35: /* end */
					this.setPos(this.sheet.Size.Columns - 1, sel.top);
					break;
				case 113: /* F2 */
					let sr = this.selRect(sel);
					this.doEdit({ col: sel.left, left: sr.left, width: sr.width },
						{ row: sel.top, top: sr.top, heigth: sr.height }
					);
					break;
				default:
					console.dir(ev.which);
					break;
			}
		},
		fitSpan(cp, rp) {
			if (!cp || !rp) return;
			let cellRef = `${toColRef(cp.col)}${rp.row + 1}`;
			let cell = this.sheet.Cells[cellRef];
			if (cell) {
				if (cell.ColSpan > 1)
					for (let c = 1; c < cell.ColSpan; c++)
						cp.width += this.colWidth(cp.col + c);
				if (cell.RowSpan > 1)
					for (let r = 1; r < cell.RowSpan; r++)
						rp.height += this.rowHeight(rp.row + r);
			}
		},
		dblclick(ev) {
			if (ev.srcElement.classList.contains('no-me'))
				return;
			let p = this.pointFromEvent(ev);
			let cp = this.colFromPoint(p.x);
			let rp = this.rowFromPoint(p.y);
			this.fitSpan(cp, rp);
			this.doEdit(cp, rp);
		},
		endEdit(val) {
			let r = this.editRect;
			let cellRef = `${toColRef(r.c)}${r.r + 1}`;
			let cell = this.sheet.Cells[cellRef];
			if (!cell) {
				if (!val) return;
				cell = { Content: val }
				Vue.set(this.sheet.Cells, cellRef, cell);
			}
			Vue.set(cell, 'Value', val);
		},
		startEdit(c, r) {
			return { control: 'editor' };
		},
		cancelEdit() {
			this.editing = false;
			this.editText = '';
		},
		doEdit(cp, rp) {
			if (!cp || !rp) return;
			let res = this.startEdit(toColRef(cp.col), rp.row);
			if (!res)
				return;
			let er = this.editRect;
			er.l = cp.left;
			er.t = rp.top;
			er.w = cp.width;
			er.h = rp.height;
			er.c = cp.col;
			er.r = rp.row;
			let c = this.sheet.Cells[`${toColRef(cp.col)}${rp.row + 1}`];
			if (c)
				this.editText = c.Value;
			else
				this.editText = '';
			this.editing = true;

		},
		$selectCell(c, r, cell) {
			let sht = this.sheet;
			let sa = this.selection;
			this.selecting = true;
			sa.length = 0;
			let sp = { left: c, top: r, right: c + (cell.ColSpan || 1), bottom: r + (cell.RowSpan || 1) };
			sa.push(sp);
		},
		pointerdown(ev) {
			if (ev.srcElement.classList.contains('no-me'))
				return;
			ev.target.setPointerCapture(ev.pointerId);
			this.cancelEdit();
			this.selecting = true;
			let sht = this.sheet;
			let sa = this.selection;
			let p = this.pointFromEvent(ev);
			if (p.x < this.startX) {
				let rp = this.rowFromPoint(p.y);
				sa.length = 0;
				let sp = { left: 0, top: rp.row, right: sht.ColumnCount, bottom: rp.row + 1 };
				sa.push(sp);
			}
			else if (p.y < columnHeaderHeigth) {
				let cp = this.colFromPoint(p.x);
				sa.length = 0;
				let sp = { left: cp.col, top: 0, right: cp.col + 1, bottom: sht.RowCount};
				sa.push(sp);
			}
			else {
				let sp = this.createSelRect(p.x, p.y);
				if (sp) {
					sa.length = 0;
					sa.push(sp);
					this.selStart.x = sp.left;
					this.selStart.y = sp.top;
				}
			}
		},
		pointermove(ev) {
			if (!this.selecting) return;
			if (ev.srcElement.classList.contains('no-me'))
				return;
			let p = this.pointFromEvent(ev);
			let sa = this.selection;
			if (!sa || !sa.length) return;
			let sel = sa[0];
			if (p.x < this.startX) {
				let rp = this.rowFromPoint(p.y);
				console.dir('select rows');
			}
			else if (p.y < columnHeaderHeigth) {
				let cp = this.colFromPoint(p.x);
				console.dir('select columns');
			}
			else {
				let sp = this.createSelRect(p.x, p.y);
				if (sp.left == this.selStart.x) {
					sel.left = sp.left;
					sel.right = sp.right;
				} if (sp.left < this.selStart.x)
					sel.left = sp.left;
				else
					sel.right = sp.right;
				if (sp.top == this.selStart.y) {
					sel.top = sp.top;
					sel.bottom = sp.bottom;
				} else if (sp.top < this.selStart.y)
					sel.top = sp.top;
				else
					sel.bottom = sp.bottom;
				this.fitScrollPos();
			}
		},
		pointerup(ev) {
			ev.target.releasePointerCapture(ev.pointerId);
			this.selecting = false;
			this.selStart.x = 0;
			this.selStart.y = 0;
			this.fitScrollPos();
		},
		fitScrollPos() {
			let sa = this.selection;
			if (!sa || !sa.length) return;
			let sel = sa[0];
			let cont = this.$refs.container;
			let cWidth = cont.clientWidth - 1; //- rowHeaderWidth;
			let cHeight = cont.clientHeight - 1; //- columnHeaderHeigth;
			let fix = { Rows: this.sheet.FixedRows || 0, Columns: this.sheet.FixedColumns|| 0 };
			let sp = this.scrollPos;
			let sr = null;
			if (sp.y > fix.Rows && sel.top < sp.y)
				sp.y = Math.max(sel.top, fix.Rows);
			else {
				sr = sr || this.selRect(sel);
				let b = sr.top + sr.height + 1;
				if (b > cHeight)
					sp.y += 1;
			}
			if (sp.x > fix.Columns && sel.left < sp.x)
				sp.x = Math.max(sel.left, fix.Columns);
			else {
				sr = sr || this.selRect(sel);
				let r = sr.left + sr.width + 1;
				if (r > cWidth)
					sp.x += 1;
			}
		},
		createSelRect(x, y) {
			let rp = this.rowFromPoint(y);
			let cp = this.colFromPoint(x);
			if (cp && rp) {
				let cellRef = `${toColRef(cp.col)}${rp.row + 1}`;
				let cell = this.sheet.Cells[cellRef];
				return { left: cp.col, top: rp.row, right: cp.col + 1 + (cell?.ColSpan - 1 || 0), bottom: rp.row + 1 + (cell?.RowSpan - 1 || 0) };
			}
			return null;
		},
		isInSelection(cb, cell) {
			return this.selection.some(c => cb(c, this.sheet.Cells[`${toColRef(c.left)}${c.top + 1}`]));
		},
		cellClass(cell) {
			if (!cell) return '';
			return this.__sp.cellClass(cell.Style);
		},
		cellStyle(cell) {
			if (!cell) return '';
			return this.__sp.cellStyle(cell.Style);
		},
		cellStyle2(cell) {
			if (!cell) return '';
			return this.__sp.cellStyle2(cell.Style);
		},
		hScrollPageSize() {
			let cont = this.$refs.container;
			if (!cont)
				return 0;
			let x = this.startX;
			let max = cont.clientWidth;
			let cols = 0;
			let fc = this.sheet.FixedColumns || 0;
			for (let c of this.renderedColumns()) {
				x += this.colWidth(c);
				if (x > max)
					break;
				else if (c >= fc)
					cols += 1;
			}
			return cols;
		},
		vScrollPageSize() {
			let cont = this.$refs.container;
			if (!cont)
				return 0;
			let y = columnHeaderHeigth;
			let max = cont.clientHeight;
			let rows = 0;
			let fr = this.sheet.FixedRows || 0;
			for (let r of this.renderedRows()) {
				y += this.rowHeight(r);
				if (y > max)
					break;
				else if (r >= fr)
					rows += 1;
			}
			return rows;
		},
		$getSelProp(prop) {
			let sa = this.selection;
			if (!sa || !sa.length) return false;
			let sel = sa[0];
			let cellRef = `${toColRef(sel.left)}${sel.top+1}`;
			let cell = this.sheet.Cells[cellRef];
			if (!cell || !cell.Style) return false;
			let style = this.sheet.Styles[cell.Style];
			if (!style) return false;
			return style[prop] || false;
		},
		$setSelProp(prop, val) {
			let sel = this.selection;
			for (let cr of enumerateSel(sel)) {
				let cell = this.sheet.Cells[cr];
				if (!cell) {
					cell = { Value: val }
					Vue.set(this.sheet.Cells, cr, cell);
					cell = this.sheet.Cells[cr];
				}
				Vue.set(cell, 'Style', this.__sp.setStyleProp(cell.Style, prop, val));
				/*
				console.dir(cell.Style);
				this.__sp.findStyle(cell.Style);
				console.dir(styleHashCode(cell.Style));
				*/
			}
			return true;
		}
	},
	mounted() {
		this.updateCount += 1;
		let sp = { left: 0, top: 0, right: 1, bottom: 1 };
		// TODO: check span
		this.selection.push(sp);
		this.scrollPos.x = this.sheet.FixedColumns || 0;
		this.scrollPos.y = this.sheet.FixedRows || 0;
		this.__ro = new ResizeObserver(x => {
			this.updateCount += 1;
			this.fitScrollPos();
		});
		this.__ro.observe(this.$el);
		this.__sp = new StyleProcessor(this.sheet.Styles);
		this.__mergeCells = {};
		for (let cr in this.sheet.Cells) {
			let cell = this.sheet.Cells[cr];
			if (cell.ColSpan > 1 || cell.RowSpan > 1) {
				let rowCol = fromCellRef(cr);
				if (cell.RowSpan > 1 && (cell.ColSpan || 1) == 1)
					for (let r = 1; r < (cell.RowSpan || 1); r++)
						this.__mergeCells[`${toColRef(rowCol.c)}${r + rowCol.r}`] = cr;
				else if (cell.ColSpan > 1 && (cell.RowSpan || 1) == 1)
					for (let c = 1; c < (cell.ColSpan || 1); c++)
						this.__mergeCells[`${toColRef(c + rowCol.c)}${rowCol.r}`] = cr;
				else
					for (let c = 1; c < (cell.ColSpan || 1); c++)
						for (let r = 1; r < (cell.RowSpan || 1); r++)
							this.__mergeCells[`${toColRef(c + rowCol.c)}${r + rowCol.r}`] = cr;
			}
		}
		// TODO: auto style
		this.sheet.ColumnCount = Math.max(this.sheet.ColumnCount, 26);
		this.sheet.RowCount = Math.max(this.sheet.RowCount, 100);
	},
	beforeDestroy() {
		if (this.__ro)
			this.__ro.unobserve(this.$el);
	}
});