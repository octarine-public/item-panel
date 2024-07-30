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
	NotificationsSDK,
	Rectangle,
	RendererSDK,
	ResetSettingsUpdated,
	Sleeper,
	SpiritBear,
	Unit,
	Vector2,
	VMouseKeys
} from "github.com/octarine-public/wrapper/index"

import { KeyMode } from "./enums/KeyMode"
import { MenuManager } from "./menu/index"
import { UnitData } from "./unit"

const bootstrap = new (class CItemPanel {
	private dragging = false

	private readonly menu = new MenuManager()
	private readonly sleeper = new Sleeper()
	private readonly units = new Map<Unit, UnitData>()
	private readonly totalPosition = new Rectangle()

	private readonly scaleItemSize = new Vector2()
	private readonly draggingOffset = new Vector2()
	private readonly scalePositionPanel = new Vector2()
	private readonly scaleUnitImageSize = new Vector2()

	constructor() {
		this.menuChanged()
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

	public Draw() {
		if (!this.state || this.isPostGame || this.isToggleKeyMode) {
			return
		}

		if (this.isShopPosition || this.isScoreboardPosition) {
			return
		}

		if (GameState.UIState !== DOTAGameUIState.DOTA_GAME_UI_DOTA_INGAME) {
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

	public UnitItemsChanged(unit: Unit) {
		if (!unit.IsValid || !this.shouldUnit(unit)) {
			return
		}
		const getUnitData = this.getUnitData(unit)
		if (getUnitData !== undefined) {
			getUnitData.UnitItemsChanged(this.getItems(unit))
		}
	}

	public EntityCreated(entity: Entity) {
		if (!(entity instanceof Unit)) {
			return
		}
		const getUnitData = this.getUnitData(entity)
		if (getUnitData !== undefined) {
			getUnitData.UnitItemsChanged(this.getItems(entity))
		}
	}

	public EntityDestroyed(entity: Entity) {
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

	public UnitPropertyChanged(unit: Unit) {
		if (this.shouldUnit(unit)) {
			return
		}
		const getUnitData = this.units.get(unit)
		if (getUnitData !== undefined) {
			getUnitData.items.clear()
		}
		this.units.delete(unit)
	}

	public MouseKeyUp(key: VMouseKeys) {
		if (!this.shouldInput(key) || !this.dragging) {
			return true
		}
		this.dragging = false
		Menu.Base.SaveConfigASAP = true
		return true
	}

	public MouseKeyDown(key: VMouseKeys) {
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

	public GameEnded() {
		this.restartScale()
		this.resetTempFeature()
		this.sleeper.FullReset()
	}

	public GameStarted() {
		this.restartScale()
		this.resetTempFeature()
		this.sleeper.FullReset()
	}

	public UnitAbilityDataUpdated() {
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
		if (GameState.UIState !== DOTAGameUIState.DOTA_GAME_UI_DOTA_INGAME) {
			return false
		}
		return true
	}

	private resetTempFeature() {
		this.dragging = false
		this.draggingOffset.toZero()
	}

	private menuChanged() {
		this.menu.Reset.OnValue(() => this.resetSettings())
		this.menu.Size.OnValue(() => this.updateScaleSize())
		this.menu.Position.X.OnValue(() => this.updateScalePosition())
		this.menu.Position.Y.OnValue(() => this.updateScalePosition())
	}

	private updateScaleSize() {
		const minSize = 20
		const sizeMenu = this.menu.Size.value
		const size = Math.min(Math.max(sizeMenu + minSize, minSize), minSize * 2)

		const sizeY = GUIInfo.ScaleHeight(size)
		this.scaleItemSize.y = this.scaleUnitImageSize.y = sizeY

		this.scaleItemSize.x = GUIInfo.ScaleWidth(size * 1.3)
		this.scaleUnitImageSize.x = GUIInfo.ScaleWidth(size * 1.6)
	}

	private updateScalePosition() {
		const menuPosition = this.menu.Position
		console.log(
			"updateScalePosition: ", this.menu.Position.Vector.toArray(),
			GUIInfo.GetWidthScale(), GUIInfo.GetHeightScale(), new Error().stack
		)

		const valueX = Math.max(GUIInfo.ScaleWidth(menuPosition.X.value), 0)
		this.scalePositionPanel.x = valueX
		const valueY = Math.max(GUIInfo.ScaleHeight(menuPosition.Y.value), 0)
		this.scalePositionPanel.y = valueY
		console.log("this.scalePositionPanel: ", this.scalePositionPanel.toArray(), this.scalePositionPanel)
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
			.RoundForThis()

		//console.log("saving pos: ", newPosition?.toArray(), this.scalePositionPanel.toArray(), this.menu.Position.Vector.toArray())
	}

	private resetSettings() {
		if (this.sleeper.Sleeping("ResetSettings")) {
			return
		}
		this.menu.ResetSettings()
		this.restartScale()
		this.resetTempFeature()
		this.sleeper.Sleep(1000, "ResetSettings")
		NotificationsSDK.Push(new ResetSettingsUpdated())
	}

	private restartScale() {
		this.updateScaleSize()
		this.updateScalePosition()
		this.saveNewPosition()
	}
})()

EventsSDK.on("Draw", () => bootstrap.Draw())

EventsSDK.on("GameEnded", () => bootstrap.GameEnded())

EventsSDK.on("GameStarted", () => bootstrap.GameStarted())

EventsSDK.on("EntityCreated", ent => bootstrap.EntityCreated(ent))

EventsSDK.on("EntityDestroyed", ent => bootstrap.EntityDestroyed(ent))

EventsSDK.on("UnitPropertyChanged", ent => bootstrap.UnitPropertyChanged(ent))

EventsSDK.on("UnitItemsChanged", ent => bootstrap.UnitItemsChanged(ent))

EventsSDK.on("UnitAbilityDataUpdated", () => bootstrap.UnitAbilityDataUpdated())

InputEventSDK.on("MouseKeyUp", key => bootstrap.MouseKeyUp(key))

InputEventSDK.on("MouseKeyDown", key => bootstrap.MouseKeyDown(key))
