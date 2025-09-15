
const toolbarTemplate = `
<div class="ss-toolbar">TOOLBAR
	<button @click="toggleBool('Bold')" :class="{checked: isChecked('Bold', true)}">B</button>
	<button @click="toggleBool('Italic')" :class="{checked: isChecked('Italic', true)}">I</button>
	<span>|</span>
	<button @click="setProp('Align', '')" :class="{checked: isCheckedProp('Align', '')}">L</button>
	<button @click="setProp('Align', 'Center')" :class="{checked: isCheckedProp('Align', 'Center')}">C</button>
	<button @click="setProp('Align', 'Right')" :class="{checked: isCheckedProp('Align', 'Right')}">R</button>
	<span>|</span>
	<button @click="setProp('VAlign', '')" :class="{checked: isCheckedProp('VAlign', '')}">T</button>
	<button @click="setProp('VAlign', 'Middle')" :class="{checked: isCheckedProp('VAlign', 'Middle')}">M</button>
	<button @click="setProp('VAlign', 'Bottom')" :class="{checked: isCheckedProp('VAlign', 'Bottom')}">B</button>
</div>
`;
export default {
	template: toolbarTemplate,
	props: {
	},
	methods: {
		isChecked(prop, val) {
			return this.$parent.$getSelProp(prop, val);
		},
		isCheckedProp(prop, val) {
			return (this.$parent.$getSelProp(prop) || '') === val;
		},
		toggleBool(prop) {
			this.$parent.$setSelProp(prop, !this.isChecked(prop));
		},
		setProp(prop, val) {
			this.$parent.$setSelProp(prop, val);
		}
	}
}
