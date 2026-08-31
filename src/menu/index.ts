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
	public readonly TouchKeyPanel: Menu.KeyBind
	public readonly HiddenItems: HiddenItems

	public readonly Overlay: MenuSDK.OverlayMenu
	public readonly Tree: Menu.Node

	private readonly entries = Menu.AddEntry("Visual")

	constructor() {
		this.Tree = this.entries.AddNode("Item Panel", ImageData.Icons.icon_svg_hamburger)
		this.Tree.SortNodes = false

		this.State = this.Tree.AddToggle("State", true)
		this.Ally = this.Tree.AddToggle(
			"Allies",
			false,
			"Show allies",
			-1,
			ImageData.GetRankTexture(LaneSelection.HARD_SUPPORT)
		)

		this.BackPack = this.Tree.AddToggle(
			"Backpack",
			false,
			"Show backpack",
			-1,
			ImageData.Icons.icon_brackets
		)

		this.Charge = this.Tree.AddToggle(
			"ItemPanel_Charge_State",
			true,
			undefined,
			-1,
			ImageData.Icons.icon_svg_charges
		)
		this.Cooldown = this.Tree.AddToggle(
			"ItemPanel_Cooldwn_State",
			true,
			undefined,
			-1,
			ImageData.Icons.icon_svg_duration
		)

		this.FormatTime = this.Tree.AddToggle(
			"Cooldown format time",
			false,
			"Show cooldown format time (min:sec)",
			-1,
			ImageData.Icons.icon_svg_format_time
		)

		this.HiddenItems = new HiddenItems(this.Tree)

		const treeBinds = this.Tree.AddNode("Binds", ImageData.Icons.icon_svg_keyboard)
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

		this.Overlay = new MenuSDK.OverlayMenu(this.Tree, 0, 547)

		this.ToggleKey.OnRelease(() => (this.IsToggled = !this.IsToggled))
		this.State.OnValue(control => this.Overlay.SetHidden(!control.value))
		this.Overlay.SetHidden(!this.State.value)
	}

	public get IsOpen(): boolean {
		return MenuSDK.MenuManager.IsOpen && this.Tree.IsOpen
	}
}
