import "./translations"

import { KeyMode } from "./enums/KeyMode"
import { GUIHelper } from "./gui"
import { MenuManager } from "./menu/index"
import { UnitData } from "./unit"

new (class CItemPanel {
	private readonly menu = new MenuManager()
	private readonly gui = new GUIHelper(this.menu)
	private readonly units = new Map<Unit, UnitData>()
	private readonly rows: UnitData[] = []

	constructor() {
		InputEventSDK.on("MouseKeyUp", this.MouseKeyUp.bind(this))
		InputEventSDK.on("MouseKeyDown", this.MouseKeyDown.bind(this))

		EventsSDK.on("Draw", this.Draw.bind(this))
		EventsSDK.on("GameEnded", this.GameEnded.bind(this))
		EventsSDK.on("GameStarted", this.GameStarted.bind(this))
		EventsSDK.on("EntityCreated", this.EntityCreated.bind(this))
		EventsSDK.on("EntityDestroyed", this.EntityDestroyed.bind(this))
		EventsSDK.on("UnitPropertyChanged", this.UnitPropertyChanged.bind(this))
		EventsSDK.on("UnitItemsChanged", this.UnitItemsChanged.bind(this))
		EventsSDK.on("UnitAbilityDataUpdated", this.UnitAbilityDataUpdated.bind(this))
	}

	private get state() {
		return this.menu.State.value
	}
	private get isPostGame() {
		return (
			Dota2SDK.GameRules === undefined ||
			Dota2SDK.GameRules.GameState === DOTAGameState.DOTA_GAMERULES_STATE_POST_GAME
		)
	}
	private get isToggleKeyMode() {
		const menu = this.menu
		const toggleKey = menu.ToggleKey
		if (toggleKey.assignedKey <= 0) {
			return false
		}
		const keyModeID = menu.ModeKey.SelectedID
		return (
			(keyModeID === KeyMode.Toggled && !menu.IsToggled) ||
			(keyModeID === KeyMode.Pressed && !toggleKey.isPressed)
		)
	}
	private get isInGameUI() {
		return GameState.UIState === DOTAGameUIState.DOTA_GAME_UI_DOTA_INGAME
	}
	private get canDrawLive() {
		return this.isInGameUI && !this.isPostGame && !this.isToggleKeyMode
	}
	private get isTouchMode() {
		const touchKey = this.menu.TouchKeyPanel
		return touchKey.isPressed || touchKey.assignedKey <= 0
	}
	protected Draw() {
		if (!this.state) {
			this.gui.Reset()
			return
		}
		if (this.canDrawLive) {
			const maxItems = this.collectRows()
			if (this.rows.length > 0) {
				this.gui.Draw(this.rows, maxItems)
				return
			}
		}
		if (this.menu.IsOpen) {
			this.gui.DrawPreview()
			return
		}
		this.gui.Reset()
	}
	protected UnitItemsChanged(unit: Unit) {
		if (!unit.IsValid || !this.shouldUnit(unit)) {
			return
		}
		const getUnitData = this.getUnitData(unit)
		if (getUnitData !== undefined) {
			getUnitData.UnitItemsChanged(this.getItems(unit))
		}
	}
	protected EntityCreated(entity: Entity) {
		if (!(entity instanceof Unit)) {
			return
		}
		const getUnitData = this.getUnitData(entity)
		if (getUnitData !== undefined) {
			getUnitData.UnitItemsChanged(this.getItems(entity))
		}
	}
	protected EntityDestroyed(entity: Entity) {
		if (entity instanceof Unit) {
			this.units.delete(entity)
		}
		if (!(entity instanceof Item)) {
			return
		}
		for (const unit of this.units.values()) {
			unit.EntityDestroyed(entity)
		}
	}
	protected UnitPropertyChanged(unit: Unit) {
		if (this.shouldUnit(unit)) {
			return
		}
		const getUnitData = this.units.get(unit)
		if (getUnitData !== undefined) {
			getUnitData.items.clear()
		}
		this.units.delete(unit)
	}
	protected MouseKeyUp(key: VMouseKeys) {
		if (!this.shouldInput(key)) {
			return true
		}
		return this.gui.MouseKeyUp(key)
	}
	protected MouseKeyDown(key: VMouseKeys) {
		if (!this.shouldInput(key)) {
			return true
		}
		if (key === VMouseKeys.MK_LBUTTON && !this.isTouchMode) {
			return true
		}
		return this.gui.MouseKeyDown(key)
	}
	protected GameEnded() {
		this.units.clear()
		this.rows.length = 0
		this.gui.Reset()
	}
	protected GameStarted() {
		this.gui.Reset()
	}
	protected UnitAbilityDataUpdated() {
		this.menu.HiddenItems.UnitAbilityDataUpdated()
	}
	private collectRows() {
		const rows = this.rows
		rows.length = 0
		let maxItems = 0
		const showAlly = this.menu.Ally.value
		for (const data of this.units.values()) {
			if (!data.Owner.IsValid) {
				this.units.delete(data.Owner)
				continue
			}
			if (!showAlly && !data.Owner.IsEnemy()) {
				continue
			}
			maxItems = Math.max(maxItems, data.CollectVisible(this.menu))
			rows.push(data)
		}
		return maxItems
	}
	private getUnitData(unit: Unit) {
		if (!this.shouldUnit(unit)) {
			return
		}
		if (!unit.IsValid) {
			this.units.delete(unit)
			return
		}
		let unitData = this.units.get(unit)
		if (unitData === undefined) {
			unitData = new UnitData(unit)
			this.units.set(unit, unitData)
		}
		return unitData
	}
	private getItems(unit: Nullable<Unit>) {
		if (unit === undefined) {
			return []
		}
		const inventory = unit.Inventory
		return inventory
			.GetItems(
				DOTAScriptInventorySlot.DOTA_ITEM_SLOT_1,
				DOTAScriptInventorySlot.DOTA_ITEM_SLOT_9
			)
			.concat(
				inventory.GetItems(
					DOTAScriptInventorySlot.DOTA_ITEM_TP_SCROLL,
					DOTAScriptInventorySlot.DOTA_ITEM_NEUTRAL_SLOT
				)
			)
	}
	private shouldUnit(unit: Unit): unit is SpiritBear | Hero {
		if (unit.IsIllusion || unit.IsClone || unit.IsStrongIllusion) {
			return false
		}
		if (unit instanceof SpiritBear) {
			return unit.ShouldRespawn
		}
		return unit.IsHero
	}
	private shouldInput(key: VMouseKeys) {
		if (!this.state) {
			return false
		}
		if (key !== VMouseKeys.MK_LBUTTON && key !== VMouseKeys.MK_RBUTTON) {
			return false
		}
		return this.canDrawLive || this.menu.IsOpen
	}
})()
