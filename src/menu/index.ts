import {
	ImageData,
	LaneSelection,
	Menu,
	Vector2
} from "github.com/octarine-public/wrapper/index"

import { HiddenItems } from "./hidden"

export class MenuManager {
	public IsToggled = true
	public readonly Ally: Menu.Toggle
	public readonly State: Menu.Toggle
	public readonly Charge: Menu.Toggle
	public readonly BackPack: Menu.Toggle
	public readonly Cooldown: Menu.Toggle
	public readonly FormatTime: Menu.Toggle

	public readonly ModeKey: Menu.Dropdown
	public readonly ToggleKey: Menu.KeyBind
	public readonly HiddenItems: HiddenItems

	public readonly Size: Menu.Slider

	public readonly Position: {
		X: Menu.Slider
		Y: Menu.Slider
		Vector: Vector2
	}

	private readonly tree: Menu.Node

	constructor() {
		const entries = Menu.AddEntry("Visual")
		this.tree = entries.AddNode(
			"Item Panel",
			ImageData.Paths.Icons.icon_svg_hamburger
		)

		this.tree.SortNodes = false
		this.State = this.tree.AddToggle("State", true)
		this.Ally = this.tree.AddToggle(
			"Allies",
			false,
			"Show allies",
			-1,
			ImageData.GetRankTexture(LaneSelection.HARD_SUPPORT)
		)

		this.BackPack = this.tree.AddToggle(
			"Backpack",
			false,
			"Show backpack",
			-1,
			ImageData.Paths.Icons.icon_brackets
		)

		this.Charge = this.tree.AddToggle(
			"ItemPanel_Charge_State",
			true,
			undefined,
			-1,
			ImageData.Paths.Icons.icon_svg_charges
		)
		this.Cooldown = this.tree.AddToggle(
			"ItemPanel_Cooldwn_State",
			true,
			undefined,
			-1,
			ImageData.Paths.Icons.icon_svg_duration
		)

		this.FormatTime = this.tree.AddToggle(
			"Cooldown format time",
			false,
			"Show cooldown format time (min:sec)",
			-1,
			ImageData.Paths.Icons.icon_svg_format_time
		)

		const KeysTree = this.tree.AddNode(
			"ItemPanel_Keys",
			ImageData.Paths.Icons.icon_svg_keyboard
		)
		this.ToggleKey = KeysTree.AddKeybind(
			"ItemPanel_Key",
			"",
			"Key bind turn on/off panel"
		)
		this.ModeKey = KeysTree.AddDropdown(
			"ItemPanel_KeyMode",
			["Hold key", "Toggled"],
			1
		)

		this.HiddenItems = new HiddenItems(this.tree)

		const settingsTree = this.tree.AddNode(
			"Settings",
			ImageData.Paths.Icons.icon_settings
		)
		settingsTree.SortNodes = false

		this.Size = settingsTree.AddSlider("Size", 0, 0, 20)
		this.Position = this.tree.AddVector2(
			"Settings",
			new Vector2(0, 600),
			new Vector2(0, 0),
			new Vector2(1920, 1080)
		)

		this.ToggleKey.OnRelease(() => (this.IsToggled = !this.IsToggled))
	}
}
