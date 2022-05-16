import { AbilityX } from "immortal-core/Imports"
import { ArrayExtensions, GUIInfo, Menu, Vector2 } from "wrapper/Imports"

export default class MenuManager {

	public Tree: Menu.Node
	public IsToggled = true
	public ModeKey: Menu.Dropdown
	public ToggleKey: Menu.KeyBind
	public HiddenItems: Menu.ImageSelector
	public CachedItemNames: string[] = []
	public CostValue: Menu.Slider
	public PassiveState: Menu.Toggle

	public AllyState: Menu.Toggle
	public BackPackState: Menu.Toggle
	public PingClick: Menu.Toggle
	public CooldwnState: Menu.Toggle
	public ChargeState: Menu.Toggle
	public EmptySlot: Menu.Toggle
	public PositionX: Menu.Slider
	public PositionY: Menu.Slider

	protected IState: Menu.Toggle
	protected Size: Menu.Slider

	protected HiddenItemTree: Menu.Node
	protected HiddenItemsInfo: Menu.ImageSelector

	constructor() {

		this.Tree = Menu.AddEntryDeep(
			["Visual", "Item Panel"],
			["panorama/images/control_icons/hamburger_png.vtex_c"],
		)

		this.Tree.sort_nodes = false
		this.IState = this.Tree.AddToggle("State", true)

		this.AllyState = this.Tree.AddToggle("Ally")
		this.BackPackState = this.Tree.AddToggle("Backpack", true)
		this.PingClick = this.Tree.AddToggle("ItemPanel_PingClick", true)
		this.CooldwnState = this.Tree.AddToggle("ItemPanel_Cooldwn_State", true)
		this.ChargeState = this.Tree.AddToggle("ItemPanel_Charge_State", true)
		this.EmptySlot = this.Tree.AddToggle("ItemPanel_EmptySlot")

		const KeysTree = this.Tree.AddNode("ItemPanel_Keys")
		this.HiddenItemTree = this.Tree.AddNode("Hide items")

		this.PassiveState = this.HiddenItemTree.AddToggle("Passive items", false, "Hide passive items that\nhave no cooldown")
		this.PassiveState.IsHidden = true
		this.CostValue = this.HiddenItemTree.AddSlider("Hide by item cost", 0, 0, 8000, 0, "Hide an item if its cost is less")
		this.CostValue.IsHidden = true

		this.HiddenItems = this.HiddenItemTree.AddImageSelector(
			"Items", [], new Map(),
			"Select items for hide on panel",
		)
		this.HiddenItems.IsHidden = true

		this.HiddenItemsInfo = this.HiddenItemTree.AddImageSelector("Need lobby & heroes", [])
		this.HiddenItemsInfo.IsHidden = true

		this.ToggleKey = KeysTree.AddKeybind("ItemPanel_Key", "", "Key bind turn on/off panel")
		this.ModeKey = KeysTree.AddDropdown("ItemPanel_KeyMode", ["Hold key", "Toggled"], 1)

		const SettingsTree = this.Tree.AddNode("Settings")

		this.Size = SettingsTree.AddSlider("Size", 35, 20, 60)
		this.PositionX = SettingsTree.AddSlider("Position: X", 100, 0, 1920)
		this.PositionY = SettingsTree.AddSlider("Position: Y", 100, 0, 1080)

		this.ToggleKey.OnRelease(() => this.IsToggled = !this.IsToggled)
	}

	public get State() {
		return this.IState.value
	}

	public get GetItemPanelPos() {
		return new Vector2(
			GUIInfo.ScaleWidth(this.PositionX.value),
			GUIInfo.ScaleHeight(this.PositionY.value),
		)
	}

	public get HeroSize() {
		return new Vector2(
			GUIInfo.ScaleWidth(this.Size.value * 1.6),
			GUIInfo.ScaleHeight(this.Size.value),
		)
	}

	public get ItemSize() {
		return new Vector2(
			GUIInfo.ScaleWidth(this.Size.value),
			GUIInfo.ScaleHeight(this.Size.value),
		)
	}

	public async OnAddItem(abil: AbilityX) {
		if (this.CachedItemNames.includes(abil.Name))
			return

		if (this.HiddenItems.IsHidden)
			this.HiddenItems.IsHidden = false

		if (this.PassiveState.IsHidden)
			this.PassiveState.IsHidden = false

		if (this.CostValue.IsHidden)
			this.CostValue.IsHidden = false

		if (!this.HiddenItemsInfo.IsHidden)
			this.HiddenItemsInfo.IsHidden = true

		this.HiddenItems.values.push(abil.Name)
		await this.HiddenItems.Update()
		this.CachedItemNames.push(abil.Name)
	}

	public OnGameStarted() {

		if (this.PassiveState.IsHidden)
			this.PassiveState.IsHidden = false

		if (this.CostValue.IsHidden)
			this.CostValue.IsHidden = false

		if (this.HiddenItems.IsHidden)
			this.HiddenItems.IsHidden = false

		if (!this.HiddenItemsInfo.IsHidden)
			this.HiddenItemsInfo.IsHidden = true
	}

	public async OnGameEnded() {

		if (!this.HiddenItems.IsHidden)
			this.HiddenItems.IsHidden = true

		if (!this.PassiveState.IsHidden)
			this.PassiveState.IsHidden = true

		if (!this.CostValue.IsHidden)
			this.CostValue.IsHidden = true

		if (this.HiddenItemsInfo.IsHidden)
			this.HiddenItemsInfo.IsHidden = false

		for (const name of this.CachedItemNames) {
			ArrayExtensions.arrayRemove(this.HiddenItems.values, name)
			await this.HiddenItems.Update()
			ArrayExtensions.arrayRemove(this.CachedItemNames, name)
		}
	}
}
