
const toolbarTemplate = `
<div class="ss-toolbar">TOOLBAR
	<button @click="forAll('Bold')">B</button>
	<button @click="forAll('Italic')">I</button>
</div>
`;
export default {
	template: toolbarTemplate,
	props: {
	},
	methods: {
		forAll(prop) {
			let sheet = this.$parent.sheet;
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
