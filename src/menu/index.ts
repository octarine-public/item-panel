import { HiddenItems } from "./hidden"
import { PanelIcons } from "./icons"
import { TextStyleMenu } from "./style"

export class MenuManager {
	public IsToggled = true
	public readonly Ally: Menu.Toggle
	public readonly State: Menu.Toggle
	public readonly Charge: Menu.Toggle
	public readonly BackPack: Menu.Toggle
	public readonly Cooldown: Menu.Toggle
	public readonly FormatTime: Menu.Toggle
	public readonly Animation: Menu.Toggle

	public readonly ModeKey: Menu.Dropdown
	public readonly ToggleKey: Menu.KeyBind
	public readonly TouchKeyPanel: Menu.KeyBind
	public readonly HiddenItems: HiddenItems
	public readonly Style: TextStyleMenu

	public readonly Overlay: MenuSDK.OverlayMenu
	public readonly Tree: Menu.Node

	private readonly entries = Menu.AddEntry("Visual")

	constructor() {
		this.Tree = this.entries.AddNode("Item Panel", PanelIcons.ItemPanel)
		this.Tree.SortNodes = false

		// the script's own switch rides the top bar beside the breadcrumb and gates the page
		this.State = this.Tree.AddToggle("State", true, undefined, -1, PanelIcons.State)
		this.Tree.HeaderControl = this.State
		this.Tree.Gate = this.State
		this.Ally = this.Tree.AddToggle(
			"Allies",
			false,
			"Show allies",
			-1,
			PanelIcons.Allies
		)
		this.BackPack = this.Tree.AddToggle(
			"Backpack",
			false,
			"Show backpack",
			-1,
			PanelIcons.Backpack
		)
		this.Charge = this.Tree.AddToggle(
			"ItemPanel_Charge_State",
			true,
			undefined,
			-1,
			PanelIcons.Charges
		)
		this.Cooldown = this.Tree.AddToggle(
			"ItemPanel_Cooldwn_State",
			true,
			undefined,
			-1,
			PanelIcons.Cooldown
		)
		this.FormatTime = this.Tree.AddToggle(
			"Cooldown format time",
			false,
			"Show cooldown format time (min:sec)",
			-1,
			PanelIcons.FormatTime
		)

		this.Animation = this.Tree.AddToggle(
			"Animation",
			true,
			"Bring a new item onto the panel instead of\nswitching it on: the cell fades into its\nslot and is rung in, and its neighbours glide",
			-1,
			PanelIcons.Animation
		)

		this.HiddenItems = new HiddenItems(this.Tree)
		this.Style = new TextStyleMenu(this.Tree)

		const treeBinds = this.Tree.AddNode("Binds", PanelIcons.Binds)
		treeBinds.SortNodes = false
		this.ToggleKey = treeBinds.AddKeybind("Key", "None", "Key turn on/off panel")
		this.ToggleKey.IconPath = PanelIcons.Key
		this.TouchKeyPanel = treeBinds.AddKeybind(
			"Touch panel",
			"Ctrl",
			"The button captures the panel\nfor dragging on the screen.\nIf the button is not set, the panel can only\nbe dragged using the mouse"
		)
		// ctrl is the game's own key too, so the press has to reach both
		this.TouchKeyPanel.ClaimsKey = false
		this.TouchKeyPanel.IconPath = PanelIcons.TouchPanel
		this.ModeKey = treeBinds.AddDropdown(
			"Key mode",
			["Hold key", "Toggled"],
			1,
			"Key mode turn on/off panel"
		)
		this.ModeKey.IconPath = PanelIcons.KeyMode

		this.Overlay = new MenuSDK.OverlayMenu(this.Tree, 0, 547)

		this.ToggleKey.OnRelease(() => (this.IsToggled = !this.IsToggled))
		this.State.OnValue(control => this.Overlay.SetHidden(!control.value))
		this.Overlay.SetHidden(!this.State.value)
	}

	public get IsOpen(): boolean {
		return MenuSDK.MenuManager.IsOpen && this.Tree.IsOpen
	}
}
