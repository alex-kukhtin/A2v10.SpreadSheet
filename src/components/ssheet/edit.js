
import { toPx, toColRef } from '../common/utils';

export default {
	methods: {
		blur(ev) {
			let p = this.$parent;
			p.endEdit(ev.target.innerText);
		}
	},
	render(h) {
		let p = this.$parent;
		let r = p.editRect;
		let cellRef = `${toColRef(r.c)}${r.r + 1}`;
		let cell = p.sheet.Cells[cellRef];
		return h('div', {
			class: 'input cell-edit no-me' + p.cellClass(cell),
			style: { left: toPx(r.l + 1), top: toPx(r.t + 1), width: toPx(r.w - 1), height: toPx(r.h - 1) },
			domProps: { contentEditable: true },
			on: { blur: this.blur }
		}, p.editText);
	},
	mounted() {
		this.$el.focus();
		this.$el.spellcheck = false;
	}
}
