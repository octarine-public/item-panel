import { AbilityX } from "github.com/octarine-private/immortal-core/index"
import { ArrayExtensions, GUIInfo, Menu, Vector2 } from "github.com/octarine-public/wrapper/index"

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
	public CouriersState: Menu.Toggle
	public BackPackState: Menu.Toggle
	public PingClick: Menu.Toggle
	public CooldwnState: Menu.Toggle
	public ChargeState: Menu.Toggle
	public EmptySlot: Menu.Toggle
	public Position: {
		X: Menu.Slider
		Y: Menu.Slider
		Vector: Vector2,
	}
	public FormatTime: Menu.Toggle

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
		this.CouriersState = this.Tree.AddToggle("Couriers")
		this.BackPackState = this.Tree.AddToggle("Backpack")
		this.PingClick = this.Tree.AddToggle("ItemPanel_PingClick2", false)
		this.CooldwnState = this.Tree.AddToggle("ItemPanel_Cooldwn_State", true)
		this.ChargeState = this.Tree.AddToggle("ItemPanel_Charge_State", true)
		this.EmptySlot = this.Tree.AddToggle("ItemPanel_EmptySlot")
		this.FormatTime = this.Tree.AddToggle("Cooldown format time", false, "Show cooldown format time (min:sec)")

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

		this.Size = SettingsTree.AddSlider("Size", 28, 20, 60)
		this.Position = this.Tree.AddVector2("Settings", new Vector2(7, 512), new Vector2(0, 0), new Vector2(1920, 1080))

		this.ToggleKey.OnRelease(() => this.IsToggled = !this.IsToggled)
	}

	public get State() {
		return this.IState.value
	}

	public get GetItemPanelPos() {
		return new Vector2(
			GUIInfo.ScaleWidth(this.Position.X.value),
			GUIInfo.ScaleHeight(this.Position.Y.value),
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

	public  OnAddItem(abil: AbilityX) {
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
		this.HiddenItems.Update()
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

	public  OnGameEnded() {

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
			this.HiddenItems.Update()
			ArrayExtensions.arrayRemove(this.CachedItemNames, name)
		}
	}
}
