
import { toPx } from './utils';

Vue.component('a2-scroll-bar', {
	template: `
<div class="a2-sb" :class="sbClass">
	<button @click.stop=dec :disabled=decDisabled v-text=decLabel></button>
	<div class="sb-body" @click.self="clickBody" ref=body>
		<div class="thumb" @pointerdown.self.stop=thumbDown
			@pointerup.self.stop=thumbUp @pointermove.self.stop=thumbMove
			:style=thumbStyle :class="{horz: horz, vert: !horz }"></div>
	</div>
	<button @click.stop=inc :disabled=incDisabled v-text=incLabel></button>
</div>
`,
	props: {
		horz: Boolean,
		page: Number,
		pos: Number,
		min: Number,
		max: Number,
		setPos: Function
	},
	data() {
		return {
			tempClientSize: 0,
			moving: false,
			delta: 0,
			thumbMovePos: 0
		};
	},
	computed: {
		sbClass() {
			return this.horz ? 'horz' : 'vert';
		},
		thumbPos() {
			if (this.moving)
				return this.thumbMovePos;
			let step = (this.clientSize) / (this.size);
			return step * (this.pos - this.min);
		},
		size() {
			return this.max - this.min;
		},
		clientSize() {
			let s = this.tempClientSize;
			if (this.$refs.body)
				s = (this.horz ? this.$refs.body.clientWidth : this.$refs.body.clientHeight);
			return s;
		},
		thumbSize() {
			let sz = this.clientSize;
			return this.page * sz / this.size;
		},
		thumbStyle() {
			if (this.horz)
				return { left: toPx(this.thumbPos), width: toPx(this.thumbSize) };
			else
				return { top: toPx(this.thumbPos), height: toPx(this.thumbSize) };
		},
		decDisabled() {
			return this.pos <= this.min;
		},
		incDisabled() {
			return this.pos >= this.max - this.page;
		},
		decLabel() { return this.horz ? '◂' : '▴'; },
		incLabel() { return this.horz ? '▸' : '▾'; }
	},
	methods: {
		dec() {
			this.setPosCheck(this.pos - 1);
		},
		inc() {
			this.setPosCheck(this.pos + 1);
		},
		setPosCheck(np) {
			if (np < this.min)
				np = this.min;
			if (np > this.max - this.page)
				np = this.max - this.page;
			this.setPos(np);
		},
		clickBody(ev) {
			let dx = this.horz ? ev.offsetX : ev.offsetY;
			let np = 0;
			if (dx < this.thumbPos)
				np = this.pos - this.page;
			else
				np = this.pos + this.page;
			this.setPosCheck(np);
		},
		thumbDown(ev) {
			ev.target.setPointerCapture(ev.pointerId);
			this.delta = this.hors ? ev.offsetX : ev.offsetY;
			this.thumbMovePos = this.thumbPos;
			this.moving = true;
		},
		thumbMove(ev) {
			if (!this.moving) return;
			let rect = this.$refs.body.getBoundingClientRect();
			let tpos = this.horz ? ev.clientX - this.delta - rect.left : ev.clientY - this.delta - rect.top;
			if (tpos < 0) tpos = 0;
			let ths = this.thumbSize;
			let maxPos = this.horz ? rect.width - ths : rect.height - ths;
			if (tpos > maxPos) tpos = maxPos;
			this.thumbMovePos = tpos;
		},
		thumbUp(ev) {
			ev.target.releasePointerCapture(ev.pointerId);
			let pos = this.thumbMovePos;
			this.moving = false;
			let step = this.clientSize / (this.max - this.min);
			let np = Math.min(+ (pos / step).toFixed(), this.max - this.page);
			this.setPosCheck(np + this.min);
		}
	},
	mounted() {
		this.tempClientSize = (this.horz ? this.$refs.body.clientWidth : this.$refs.body.clientHeight);
	}
});