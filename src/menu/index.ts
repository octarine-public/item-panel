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

	public readonly Reset: Menu.Button
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

		this.HiddenItems = new HiddenItems(this.tree)

		const settingsTree = this.tree.AddNode(
			"Settings",
			ImageData.Paths.Icons.icon_settings
		)
		settingsTree.SortNodes = false

		this.ToggleKey = settingsTree.AddKeybind(
			"ItemPanel_Key",
			"",
			"Key bind turn on/off panel"
		)
		this.ModeKey = settingsTree.AddDropdown(
			"ItemPanel_KeyMode",
			["Hold key", "Toggled"],
			1
		)

		this.Size = settingsTree.AddSlider("Size", 0, 0, 20)
		this.Position = this.tree.AddVector2(
			"Settings",
			new Vector2(0, 600),
			new Vector2(0, 0),
			new Vector2(1920, 1080)
		)

		this.Reset = this.tree.AddButton("Reset", "Reset settings")
		this.ToggleKey.OnRelease(() => (this.IsToggled = !this.IsToggled))
	}

	public ResetSettings() {
		this.IsToggled = true
		this.State.value = true
		this.Ally.value = false
		this.Charge.value = true
		this.Cooldown.value = true
		this.BackPack.value = true
		this.FormatTime.value = false
		this.Size.value = 0
		this.Position.X.value = 0
		this.Position.Y.value = 600
		this.ModeKey.SelectedID = 1
		this.ToggleKey.assignedKey = -1
		this.ToggleKey.assignedKeyStr = "None"
		this.HiddenItems.ResetSettings()
	}
}
