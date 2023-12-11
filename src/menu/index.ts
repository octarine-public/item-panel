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
		this.ToggleKey = treeBinds.AddKeybind("Key", "None", "Key turn on/off panel")
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
		this.Size = settingsTree.AddSlider("Size", 6, 0, 20)
		this.Opacity = settingsTree.AddSlider("Opacity", 0, 0, 50)
		this.Position = this.tree.AddVector2(
			"Settings",
			new Vector2(0, 547),
			new Vector2(0, 0),
			new Vector2(1920, 1080)
		)

		this.Reset = this.tree.AddButton("Reset", "Reset settings")
		this.ToggleKey.OnRelease(() => (this.IsToggled = !this.IsToggled))
	}

	public ResetSettings() {
		this.IsToggled = true
		this.State.value = this.State.defaultValue
		this.Ally.value = this.Ally.defaultValue
		this.Charge.value = this.Charge.defaultValue
		this.Cooldown.value = this.Cooldown.defaultValue
		this.BackPack.value = this.BackPack.defaultValue
		this.FormatTime.value = this.FormatTime.defaultValue
		this.Size.value = this.Size.defaultValue
		this.Opacity.value = this.Opacity.defaultValue
		this.Position.X.value = this.Position.X.defaultValue
		this.Position.Y.value = this.Position.Y.defaultValue
		this.ModeKey.SelectedID = this.ModeKey.defaultValue
		this.TouchKeyPanel.assignedKey = VKeys.CONTROL
		this.TouchKeyPanel.assignedKeyStr = this.TouchKeyPanel.defaultKey
		this.ToggleKey.assignedKey = -1
		this.ToggleKey.assignedKeyStr = this.ToggleKey.defaultKey
		this.HiddenItems.ResetSettings()
	}
}
