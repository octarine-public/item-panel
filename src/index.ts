import "./translations"

import {
	Color,
	DOTAGameState,
	DOTAGameUIState,
	DOTAScriptInventorySlot,
	Entity,
	EventsSDK,
	GameRules,
	GameState,
	GUIInfo,
	Hero,
	Input,
	InputEventSDK,
	Item,
	Menu,
	Rectangle,
	RendererSDK,
	SpiritBear,
	Unit,
	Vector2,
	VMouseKeys
} from "github.com/octarine-public/wrapper/index"

import { KeyMode } from "./enums/KeyMode"
import { MenuManager } from "./menu/index"
import { UnitData } from "./unit"

new (class CItemPanel {
	private dragging = false
	private readonly menu!: MenuManager
	private readonly units = new Map<Unit, UnitData>()
	private readonly totalPosition = new Rectangle()
	private readonly draggingOffset = new Vector2()

	constructor(canBeInitialized: boolean) {
		if (!canBeInitialized) {
			return
		}
		this.menu = new MenuManager()

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

	private get isScoreboardPosition() {
		if (!Input.IsScoreboardOpen) {
			return false
		}
		return this.shouldPosition(GUIInfo.Scoreboard.Background)
	}

	private get isShopPosition() {
		if (!Input.IsShopOpen) {
			return false
		}
		return this.shouldPosition(
			GUIInfo.OpenShopMini.Items,
			GUIInfo.OpenShopMini.Header,
			GUIInfo.OpenShopMini.GuideFlyout,
			GUIInfo.OpenShopMini.ItemCombines,
			GUIInfo.OpenShopMini.PinnedItems,
			GUIInfo.OpenShopLarge.Items,
			GUIInfo.OpenShopLarge.Header,
			GUIInfo.OpenShopLarge.GuideFlyout,
			GUIInfo.OpenShopLarge.PinnedItems,
			GUIInfo.OpenShopLarge.ItemCombines
		)
	}

	private get isPostGame() {
		return (
			GameRules === undefined ||
			GameRules.GameState === DOTAGameState.DOTA_GAMERULES_STATE_POST_GAME
		)
	}

	private get isToggleKeyMode() {
		const menu = this.menu
		const toggleKey = menu.ToggleKey
		// if toggle key is not assigned (setting to "None")
		if (toggleKey.assignedKey < 0) {
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

	private get scalePositionPanel() {
		return GUIInfo.ScaleVector(this.menu.Position.X.value, this.menu.Position.Y.value)
	}

	private get size() {
		const min = 20
		return Math.min(Math.max(this.menu.Size.value + min, min), min * 2)
	}

	private get scaleItemSize() {
		return GUIInfo.ScaleVector(
			GUIInfo.ScaleWidth(this.size * 1.3),
			GUIInfo.ScaleHeight(this.size)
		)
	}

	private get scaleUnitImageSize() {
		return GUIInfo.ScaleVector(
			GUIInfo.ScaleWidth(this.size * 1.6),
			GUIInfo.ScaleHeight(this.size)
		)
	}

	protected Draw() {
		if (!this.state || !this.isInGameUI || this.isPostGame) {
			return
		}
		if (GameState.IsInputCaptured || this.isShopPosition) {
			return
		}
		if (this.isScoreboardPosition || this.isToggleKeyMode) {
			return
		}
		const gap = 2
		const menu = this.menu
		const maxItem: number[] = []
		const position = new Rectangle()

		const positionPanel = this.scalePositionPanel
		const unitImageSize = this.scaleUnitImageSize

		position.x = positionPanel.x
		position.y = positionPanel.y
		position.Width = unitImageSize.x
		position.Height = unitImageSize.y

		this.totalPosition.pos1.CopyFrom(position.pos1)
		this.totalPosition.pos2.CopyFrom(position.pos2)

		this.units.forEach(data =>
			data.Draw(
				gap,
				menu,
				maxItem,
				position,
				this.dragging,
				this.totalPosition,
				this.scaleItemSize
			)
		)

		this.calculateBottomSize(maxItem, position)

		if (!this.dragging) {
			// NOTE: update full panel if added new unit's or items
			this.updateMinMaxPanelPosition(positionPanel)
			return
		}

		this.backgroundDrag()
		const wSize = RendererSDK.WindowSize
		const mousePos = Input.CursorOnScreen
		const toPosition = mousePos
			.SubtractForThis(this.draggingOffset)
			.Min(wSize.Subtract(this.totalPosition.Size))
			.Max(0)
			.CopyTo(positionPanel)
		this.saveNewPosition(toPosition)
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
		if (entity instanceof Unit && this.shouldUnit(entity)) {
			this.units.delete(entity)
		}
		if (!(entity instanceof Item)) {
			return
		}
		let owner = entity.Owner
		if (owner === undefined) {
			return
		}
		if (!(owner instanceof Hero || owner instanceof SpiritBear)) {
			owner = owner.Owner as Nullable<Unit>
		}
		if (
			!(owner instanceof Hero || owner instanceof SpiritBear) ||
			(entity instanceof Hero && !entity.IsRealHero)
		) {
			return
		}
		this.getUnitData(owner)?.EntityDestroyed(entity)
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
		if (!this.shouldInput(key) || !this.dragging) {
			return true
		}
		this.dragging = false
		Menu.Base.SaveConfigASAP = true
		return true
	}

	protected MouseKeyDown(key: VMouseKeys) {
		if (!this.shouldInput(key) || this.dragging) {
			return true
		}
		const menu = this.menu.TouchKeyPanel
		const isTouch = menu.isPressed || menu.assignedKey === -1
		if (!isTouch) {
			return true
		}
		const mouse = Input.CursorOnScreen
		const recPos = this.totalPosition
		if (!mouse.IsUnderRectangle(recPos.x, recPos.y, recPos.Width, recPos.Height)) {
			return true
		}
		this.dragging = true
		mouse.Subtract(recPos.pos1).CopyTo(this.draggingOffset)
		return false
	}

	protected GameEnded() {
		this.restartScale()
		this.resetTempFeature()
	}

	protected GameStarted() {
		this.restartScale()
		this.resetTempFeature()
	}

	protected UnitAbilityDataUpdated() {
		this.menu.HiddenItems.UnitAbilityDataUpdated()
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

	private backgroundDrag() {
		const position = this.totalPosition
		const division = position.Height / 10 - this.menu.Size.value / 3
		RendererSDK.FilledRect(position.pos1, position.Size, Color.Black.SetA(100))
		RendererSDK.TextByFlags(
			Menu.Localization.Localize("ItemPanel_Drag"),
			position,
			Color.White,
			division
		)
	}

	private calculateBottomSize(maxItem: number[], position: Rectangle) {
		const maxEndItem = Math.max(...maxItem)
		const endSize = this.scaleItemSize.x + 1 / 2
		this.totalPosition.Width += endSize * (maxEndItem > 0 ? maxEndItem : 1)
		this.totalPosition.Height -= position.Height - this.units.size
	}

	private shouldPosition(...positions: Rectangle[]) {
		return positions.some(position => this.isContainsPanel(position))
	}

	private isContainsPanel(position: Rectangle) {
		return position.Contains(this.totalPosition.pos1)
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
		if (!this.state || this.isPostGame || key !== VMouseKeys.MK_LBUTTON) {
			return false
		}
		if (!this.isInGameUI) {
			return false
		}
		return true
	}

	private resetTempFeature() {
		this.dragging = false
		this.draggingOffset.toZero()
	}

	private updateMinMaxPanelPosition(position: Vector2) {
		const wSize = RendererSDK.WindowSize
		const totalSize = this.totalPosition.Size
		const newPosition = position
			.Min(wSize.Subtract(totalSize))
			.Max(0)
			.CopyTo(position)
		this.saveNewPosition(newPosition)
	}

	private saveNewPosition(newPosition?: Vector2) {
		const position = newPosition ?? this.scalePositionPanel
		this.menu.Position.Vector = position
			.Clone()
			.DivideScalarX(GUIInfo.GetWidthScale())
			.DivideScalarY(GUIInfo.GetHeightScale())
			.RoundForThis(1)
	}

	private restartScale() {
		this.saveNewPosition()
	}
})(true)
