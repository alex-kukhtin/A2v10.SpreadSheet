
const toolbarTemplate = `
<div class="ss-toolbar">TOOLBAR
	<button @click="toggleBool('Bold')" :class="{checked: isChecked('Bold')}">B</button>
	<button @click="toggleBool('Italic')" :class="{checked: isChecked('Italic')}">I</button>
</div>
`;
export default {
	template: toolbarTemplate,
	props: {
	},
	methods: {
		isChecked(prop) {
			return this.$parent.$getSelProp(prop);
		},
		toggleBool(prop) {
			let sheet = this.$parent.sheet;
			this.$parent.$setSelProp(prop, !this.isChecked(prop));
			return;
			let sel = sheet.$selection;
			if (!sel.length) return;
			let set = true;
			let create = true;
			for (let sr of sel) {
				for (let r = sr.top; r < sr.bottom; r++) {
					for (let c = sr.left; c < sr.right; c++) {
						this.$parent.setProp(c, r, (cell) => Vue.set(cell, prop, set), create)
					}
				}
			}
		}
	}
}
