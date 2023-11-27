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

const bootstrap = new (class CItemPanel {
	private dragging = false
	private draggingOffset = new Vector2()

	private readonly menu = new MenuManager()
	private readonly units = new Map<Unit, UnitData>()
	private readonly totalPosition = new Rectangle()

	private readonly scaleItemSize = new Vector2()
	private readonly scalePositionPanel = new Vector2()
	private readonly scaleUnitImageSize = new Vector2()

	constructor() {
		this.menuChanged()
	}

	protected get State() {
		return this.menu.State.value
	}

	protected get IsPostGame() {
		return (
			GameRules === undefined ||
			GameRules.GameState === DOTAGameState.DOTA_GAMERULES_STATE_POST_GAME
		)
	}

	private get shouldBindDisplayPanel() {
		const menu = this.menu
		const toggleKey = menu.ToggleKey
		if (toggleKey.assignedKey < 0) {
			return true
		}
		const keyModeID = menu.ModeKey.SelectedID
		return !(
			(keyModeID === KeyMode.Toggled && !menu.IsToggled) ||
			(keyModeID === KeyMode.Pressed && !toggleKey.isPressed)
		)
	}

	public Draw() {
		if (!this.State || this.IsPostGame || !this.shouldBindDisplayPanel) {
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

		if (this.dragging) {
			this.renderMoveBackground()
			const wSize = RendererSDK.WindowSize
			const mousePos = Input.CursorOnScreen
			const toPosition = mousePos
				.SubtractForThis(this.draggingOffset)
				.Min(wSize.Subtract(this.totalPosition.Size))
				.Max(0)
				.CopyTo(positionPanel)
			this.saveNewPosition(toPosition)
		}
	}

	public UnitItemsChanged(unit: Unit) {
		if (!unit.IsValid || !this.isShouldUnit(unit)) {
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
		if (entity instanceof Unit && this.isShouldUnit(entity)) {
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
		if (!(unit instanceof SpiritBear)) {
			return
		}
		if (unit.IsIllusion || unit.IsClone) {
			return
		}
		if (!unit.ShouldRespawn) {
			this.units.delete(unit)
		}
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
		this.resetTempFeature()
	}

	public GameStarted() {
		this.resetTempFeature()
	}

	public UnitAbilityDataUpdated() {
		this.menu.HiddenItems.UnitAbilityDataUpdated()
	}

	private isShouldUnit(unit: Unit): unit is SpiritBear | Hero {
		if (unit.IsIllusion || unit.IsClone) {
			return false
		}
		if (unit instanceof SpiritBear) {
			return unit.ShouldRespawn
		}
		return unit.IsHero
	}

	private getUnitData(unit: Unit) {
		if (!this.isShouldUnit(unit)) {
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

	private renderMoveBackground() {
		const position = this.totalPosition
		RendererSDK.FilledRect(position.pos1, position.Size, Color.Black.SetA(100))
		RendererSDK.TextByFlags(
			Menu.Localization.Localize("ItemPanel_Drag"),
			position,
			Color.White,
			10
		)
	}

	private calculateBottomSize(maxItem: number[], position: Rectangle) {
		const maxEndItem = Math.max(...maxItem)
		const endSize = this.scaleItemSize.x + 1 / 2
		this.totalPosition.Width += endSize * (maxEndItem > 0 ? maxEndItem : 1)
		this.totalPosition.Height -= position.Height - this.units.size
	}

	private updateScaleImageItem(call: Menu.Slider) {
		const size = Math.min(Math.max(call.value + 20, 20), 40)
		const sizeX = GUIInfo.ScaleWidth(size * 1.3)
		const sizeY = GUIInfo.ScaleHeight(size)
		this.scaleItemSize.x = sizeX
		this.scaleItemSize.y = sizeY
	}

	private updateScaleImageUnit(call: Menu.Slider) {
		const size = Math.min(Math.max(call.value + 20, 20), 40)
		const sizeX = GUIInfo.ScaleWidth(size * 1.6)
		const sizeY = GUIInfo.ScaleHeight(size)
		this.scaleUnitImageSize.x = sizeX
		this.scaleUnitImageSize.y = sizeY
	}

	private shouldInput(key: VMouseKeys) {
		return (
			!this.IsPostGame &&
			key === VMouseKeys.MK_LBUTTON &&
			GameState.UIState === DOTAGameUIState.DOTA_GAME_UI_DOTA_INGAME
		)
	}

	private saveNewPosition(newPosition?: Vector2) {
		const position = newPosition ?? this.scalePositionPanel
		this.menu.Position.Vector = position.RoundForThis(1)
	}
	private resetTempFeature() {
		this.dragging = false
		this.draggingOffset.toZero()
	}

	private menuChanged() {
		this.menu.Size.OnValue(call => {
			this.updateScaleImageUnit(call)
			this.updateScaleImageItem(call)
		})
		this.menu.Position.X.OnValue(
			call => (this.scalePositionPanel.x = GUIInfo.ScaleWidth(call.value))
		)
		this.menu.Position.Y.OnValue(
			call => (this.scalePositionPanel.y = GUIInfo.ScaleHeight(call.value))
		)
	}
})()

EventsSDK.on("Draw", () => bootstrap.Draw())

EventsSDK.on("EntityCreated", ent => bootstrap.EntityCreated(ent))

EventsSDK.on("EntityDestroyed", ent => bootstrap.EntityDestroyed(ent))

EventsSDK.on("UnitPropertyChanged", ent => bootstrap.UnitPropertyChanged(ent))

EventsSDK.on("UnitItemsChanged", ent => bootstrap.UnitItemsChanged(ent))

EventsSDK.on("GameEnded", () => bootstrap.GameEnded())

EventsSDK.on("GameStarted", () => bootstrap.GameStarted())

EventsSDK.on("UnitAbilityDataUpdated", () => bootstrap.UnitAbilityDataUpdated())

InputEventSDK.on("MouseKeyUp", key => bootstrap.MouseKeyUp(key))

InputEventSDK.on("MouseKeyDown", key => bootstrap.MouseKeyDown(key))
