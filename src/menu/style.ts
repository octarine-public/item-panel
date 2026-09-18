import { PanelIcons } from "./icons"

/** The weights the dropdown offers, lightest first; the HUD's own bold is the third of them. */
const WEIGHTS = [400, 500, MenuSDK.HudBold, 700]
const WEIGHT_NAMES = ["Regular", "Medium", "Semi-bold", "Bold"]

/** Where the rows stand until a player moves them: the one place the panel's own look is set. */
const DEFAULT_FONT = 0
const DEFAULT_SIZE = 100
const DEFAULT_WEIGHT = 2
const DEFAULT_COLOR = Color.White
const DEFAULT_EFFECT = MenuSDK.EHudTextEffect.Outline
const DEFAULT_SHADE = 100

/** How far the size slider lets a reading shrink or grow, in percent of its design size. */
const SIZE_MIN = 70
const SIZE_MAX = 150

/**
 * The type the readings on the cells are set in: a face, a size relative to the reading's own
 * design size, a weight, a colour and the shade under the glyphs - the same page the cooldowns
 * script carries, on the HUD's own text rather than a canvas of its own.
 */
export class TextStyleMenu {
	public readonly Node: Menu.Node
	public readonly Font: Menu.Dropdown
	public readonly Size: Menu.Slider
	public readonly Weight: Menu.Dropdown
	public readonly Color: Menu.ColorPicker
	public readonly Effect: Menu.Dropdown
	public readonly EffectOpacity: Menu.Slider

	private readonly families = MenuSDK.MenuFontFamilies()

	constructor(parent: Menu.Node) {
		const node = parent.AddNode("Style", PanelIcons.Style)
		this.Node = node
		node.SortNodes = false

		this.Font = node.AddDropdown("Font", ["Default", ...this.families], DEFAULT_FONT)
		this.Font.IconPath = PanelIcons.Font
		this.Size = node.AddSlider(
			"Text size",
			DEFAULT_SIZE,
			SIZE_MIN,
			SIZE_MAX,
			0,
			"Scales the cooldowns and charges on the cells"
		)
		this.Size.Suffix = "%"
		this.Size.IconPath = PanelIcons.TextSize
		this.Weight = node.AddDropdown("Weight", WEIGHT_NAMES, DEFAULT_WEIGHT)
		this.Weight.IconPath = PanelIcons.Weight
		this.Color = node.AddColorPicker("Text color", DEFAULT_COLOR).SolidOnly()
		this.Color.IconPath = PanelIcons.TextColor
		this.Effect = node.AddDropdown(
			"Under text",
			MenuSDK.HudTextEffectNames,
			DEFAULT_EFFECT,
			"What the glyphs are cut against the item art with"
		)
		this.Effect.IconPath = PanelIcons.TextEffect
		this.EffectOpacity = node.AddSlider(
			"Text shade opacity",
			DEFAULT_SHADE,
			0,
			100,
			0,
			"How dark the shade under the glyphs is drawn"
		)
		this.EffectOpacity.Suffix = "%"
		this.EffectOpacity.IconPath = PanelIcons.Opacity

		// the shade row says nothing while no effect is drawn
		const syncEffect = () => {
			this.EffectOpacity.IsHidden = this.EffectKind === MenuSDK.EHudTextEffect.None
			node.Update()
		}
		this.Effect.OnValue(syncEffect)
		syncEffect()
	}

	/** The face the readings are set in, or nothing for the HUD's own. */
	public get FontFamily(): Nullable<string> {
		return this.families[this.Font.SelectedID - 1]
	}

	public get FontWeight(): number {
		return WEIGHTS[this.Weight.SelectedID] ?? MenuSDK.HudBold
	}

	/** The factor the size slider scales a reading's design size by. */
	public get Scale(): number {
		return this.Size.value / 100
	}

	/** Which effect the glyphs are cut against the art with. */
	public get EffectKind(): MenuSDK.EHudTextEffect {
		return this.Effect.SelectedID as MenuSDK.EHudTextEffect
	}

	/** How dark that effect is drawn, 0 to 1. */
	public get Shade(): number {
		return this.EffectOpacity.value / 100
	}
}
