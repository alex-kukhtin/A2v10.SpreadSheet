
import { toPx } from '../common/utils';

export default {
	render(h) {
		let sel = this.$parent.selection;
		let ch = [];
		for (let i = 0; i < sel.length; i++) {
			let s = sel[i];
			let r = this.$parent.selRect(s);
			if (r && r.left >= 0 && r.top >= 0) {
				for (let cx = s.left + 1; cx < s.right; cx++)
					r.width += this.$parent.colWidth(cx);
				for (let rx = s.top + 1; rx < s.bottom; rx++)
					r.height += this.$parent.rowHeight(rx);
				let cls = 'sel';
				if (s.bottom > s.top + 1 || s.right > s.left + 1)
					cls += ' multiply';
				ch.push(h('div', { class: cls, style: { left: toPx(r.left), top: toPx(r.top), width: toPx(r.width + 1), height: toPx(r.height + 1) } }));
			}
		}
		return h('div', { class: 'selections' }, ch);
	}
}
