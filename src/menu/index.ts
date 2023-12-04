import {
	ImageData,
	LaneSelection,
	Menu,
	Vector2,
	VKeys
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
	public readonly Opacity: Menu.Slider

	public readonly Reset: Menu.Button
	public readonly ModeKey: Menu.Dropdown
	public readonly ToggleKey: Menu.KeyBind
	public readonly TouchKeyPanel: Menu.KeyBind
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

		const treeBinds = this.tree.AddNode(
			"Binds",
			ImageData.Paths.Icons.icon_svg_keyboard
		)
		treeBinds.SortNodes = false
		this.ToggleKey = treeBinds.AddKeybind("Key", "", "Key turn on/off panel")
		this.TouchKeyPanel = treeBinds.AddKeybind(
			"Touch panel",
			"Ctrl",
			"The button captures the panel\nfor dragging on the screen.\nIf the button is not set, the panel can only\nbe dragged using the mouse"
		)
		this.ModeKey = treeBinds.AddDropdown(
			"Key mode",
			["Hold key", "Toggled"],
			1,
			"Key mode turn on/off panel"
		)

		const settingsTree = this.tree.AddNode(
			"Settings",
			ImageData.Paths.Icons.icon_settings
		)
		settingsTree.SortNodes = false
		this.Size = settingsTree.AddSlider("Size", 0, 0, 20)
		this.Opacity = settingsTree.AddSlider("Opacity", 0, 0, 50)
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
		this.BackPack.value = false
		this.FormatTime.value = false
		this.Size.value = 0
		this.Opacity.value = 0
		this.Position.X.value = 0
		this.Position.Y.value = 600
		this.ModeKey.SelectedID = 1
		this.ToggleKey.assignedKey = -1
		this.ToggleKey.assignedKeyStr = "Ctrl"
		this.ToggleKey.assignedKeyStr = "None"
		this.TouchKeyPanel.assignedKey = VKeys.CONTROL
		this.HiddenItems.ResetSettings()
	}
}
