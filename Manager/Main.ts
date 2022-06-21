import { AbilityX, CourierX, EntityManagerX, EntityX, FlagText, HeroX, PathX, RectangleX, SpiritBearX, UnitX, Util } from "immortal-core/Imports"
import { ArrayExtensions, Color, DOTAGameUIState_t, DOTA_GameState, GameRules, GameState, GUIInfo, Input, Menu, RendererSDK, Vector2, VMouseKeys } from "wrapper/Imports"
import { MapDrawable } from "../Drawable/Index"
import DrwableUnit from "../Drawable/Items"
import { KeyMode } from "../Enum/KeyMode"
import ItemModel from "../Models/Items"
import UnitModel from "../Models/Unit"
import MenuManager from "./Menu"

export default class ItemPanelManager {

	private TotalItems = 0
	private dirtyPosition = false
	private mouseOnPanel = new Vector2()
	private HeroPosition = new Vector2()
	private DrwableUnits: DrwableUnit[] = []
	private readonly units = new Map<UnitX, UnitModel>()

	constructor(protected menu: MenuManager) { }

	public OnDraw() {

		if (!this.menu.State || GameState.UIState !== DOTAGameUIState_t.DOTA_GAME_UI_DOTA_INGAME)
			return

		const keyState = (this.menu.ModeKey.selected_id === KeyMode.Toggled && !this.menu.IsToggled)
			|| (this.menu.ModeKey.selected_id === KeyMode.Pressed && !this.menu.ToggleKey.is_pressed)

		if (keyState || this.TotalItems === 0)
			return

		const HeroSize = this.menu.HeroSize
		const ItemSize = this.menu.ItemSize
		const panel = this.menu.GetItemPanelPos
		const panelPosDraw = panel.Clone()
		const mousePos = Input.CursorOnScreen

		const IsHover = mousePos.IsUnderRectangle(panel.x, panel.y, HeroSize.x, HeroSize.y)
		if (this.dirtyPosition) {
			panel.CopyFrom(mousePos.Subtract(this.mouseOnPanel))
			this.menu.Position.Vector = panel
				.Clone()
				.DivideScalarX(GUIInfo.GetWidthScale())
				.DivideScalarY(GUIInfo.GetHeightScale())
				.RoundForThis(1)
		}

		for (const unit of this.DrwableUnits) {

			const items = unit.Items
			if (items.length === 0 || (!this.menu.CouriersState.value && unit.IsCourier))
				continue

			const vSize = new Vector2(panel.x + HeroSize.x, panel.y)
			const items_position = new RectangleX(vSize, ItemSize)

			if (!unit.IsHero) {
				RendererSDK.FilledRect(panel, HeroSize, Color.Black)
				RendererSDK.Image(unit.Textute, panel, -1, HeroSize, Color.White, 0, undefined, IsHover)
				if (!unit.OwnerTextute.includes("unknown_owner")) {
					const [position, size] = this.RightPositionUnit(ItemSize, HeroSize, panel)
					RendererSDK.Image(unit.OwnerTextute, position, -1, size, Color.White, 0, undefined, IsHover)
				}
			} else
				RendererSDK.Image(unit.Textute, panel, -1, HeroSize, Color.White, 0, undefined, IsHover)

			this.DrawEmptySlots(ItemSize, items_position, items)

			for (let index = items.length - 1; index > -1; index--) {

				const item = items[index]

				if ((item.IsTpScroll || item.IsTravelBoots) && unit.IsHero) {

					const [position, size] = this.RightPositionUnit(ItemSize, HeroSize, panel)
					const rectPosition = new RectangleX(position, size)
					const height = Math.round(rectPosition.Height / 5)
					RectangleX.Image(item.TexturePath, rectPosition, Color.White, 0)

					if (item.RemainingCooldown > 0)
						RendererSDK.Arc(-90, item.PercentRemainingCooldown, rectPosition.pos1, rectPosition.pos2, false, height, Color.Red)

					continue
				}

				const items_position_2 = items_position.Clone()
					.SubtractSize(items_position.Height / 10)

				RectangleX.Image(item.TexturePath, items_position_2, Color.White, -1, item.IsMuted || IsHover || item.IsBackPack)

				if (item.RemainingCooldown > 0 && this.menu.CooldwnState.value) {

					const text = this.menu.FormatTime.value && item.RemainingCooldown >= 60
						? Util.FormatTime(item.RemainingCooldown)
						: item.RemainingCooldown < 10 ? item.RemainingCooldown.toFixed(1) : Math.ceil(item.RemainingCooldown).toFixed()

					RectangleX.Image(PathX.Images.softedge_horizontal, items_position_2, Color.Black.SetA(165))
					RectangleX.Text(text, items_position_2, Color.White, 1.65)
				}

				if (item.RemainingCooldown <= 0 && item.Charges !== 0 && this.menu.ChargeState.value)
					RectangleX.Text(item.Charges.toFixed(), items_position_2, Color.White, 2, FlagText.BOT_RIGHT, {
						filedRect: true,
					})

				items_position.pos1.AddScalarX(ItemSize.x)
			}

			panel.AddScalarY(HeroSize.y)
		}

		if (IsHover) {
			this.HeroPosition.CopyFrom(panelPosDraw)
			const rec = new RectangleX(panelPosDraw, HeroSize)
			RectangleX.FilledRect(rec, Color.Black.SetA(180))
			RectangleX.Text(Menu.Localization.Localize("ItemPanel_Drag"), rec, Color.White)
		}
	}

	public OnPostDataUpdate() {

		if (GameRules !== undefined && MapDrawable.size !== 0
			&& GameRules.GameState === DOTA_GameState.DOTA_GAMERULES_STATE_WAIT_FOR_PLAYERS_TO_LOAD)
			MapDrawable.clear()

		if (!this.menu.State)
			return

		const arr = [...MapDrawable.values()]
		this.TotalItems = this.Reduce(arr)
		this.DrwableUnits = ArrayExtensions.orderBy(arr, x => !x.IsHero)

		for (const [, model] of this.units)
			model.OnPostDataUpdate()
	}

	public async OnEntityCreated(entity: EntityX) {
		if (entity instanceof AbilityX)
			await this.OnAbilityCreated(entity)
	}

	public async OnEntityChanged(entity: EntityX) {
		if (!(entity instanceof UnitX) || !this.IsValidOwner(entity))
			return
		for (const abil of entity.Abilities.filter(x => x.IsItem))
			await this.OnEntityCreated(abil)
	}

	public async OnLifeStateChanged(entity: EntityX) {
		if (!(entity instanceof SpiritBearX))
			return
		const model = this.units.get(entity)
		if (model !== undefined)
			await model.OnLifeStateChanged(entity, this.units)
	}

	public async OnEntityDestroyed(entity: EntityX) {
		if (entity instanceof AbilityX)
			await this.OnAbilityDestroyed(entity)
		if (!(entity instanceof UnitX))
			return
		const model = this.units.get(entity)
		if (model !== undefined) {
			model.OnEntityDestroyed()
			this.units.delete(model.Unit)
		}
	}

	public async OnUnitItemsChanged(unit: UnitX, abil?: AbilityX, transferred?: boolean) {
		if (unit.IsIllusion)
			return
		if (transferred && abil !== undefined) {
			await this.OnAbilityChanged(abil, unit)
			return
		}
		for (const item of unit.Abilities.filter(x => x.IsItem))
			await this.OnAbilityCreated(item)
	}

	public async OnUnitAbilitiesChanged(unit: UnitX, abil?: AbilityX, transferred?: boolean) {
		if (unit.IsIllusion)
			return
		if (transferred && abil !== undefined) {
			await this.OnAbilityChanged(abil, unit)
			return
		}
		for (const item of unit.Abilities.filter(x => !x.IsItem))
			await this.OnAbilityCreated(item)
	}

	public OnMouseKeyDown(key: VMouseKeys) {
		if (!this.IsValidInput(key) || this.TotalItems === 0)
			return true

		const HeroSize = this.menu.HeroSize
		const ItemSize = this.menu.ItemSize
		const panelPosition = this.menu.GetItemPanelPos
		const CursorOnScreen = Input.CursorOnScreen

		const SizePosition = new Vector2(
			HeroSize.x + ItemSize.x * 7,
			HeroSize.y * this.units.size,
		)

		if (Input.CursorOnScreen.IsUnderRectangle(panelPosition.x, panelPosition.y, HeroSize.x, HeroSize.y)) {
			this.dirtyPosition = true
			this.mouseOnPanel.CopyFrom(Input.CursorOnScreen.Subtract(this.HeroPosition))
			return false
		}

		if (!this.menu.PingClick.value)
			return true

		const rect = new RectangleX(panelPosition, SizePosition)
		if (!rect.Contains(CursorOnScreen))
			return true

		const sort = ArrayExtensions.orderBy([...MapDrawable.values()], x => !x.IsHero)

		for (const unit of sort) {
			const items = unit.Items
			if (items.length === 0)
				continue

			const vSize = new Vector2(panelPosition.x + HeroSize.x, panelPosition.y)
			const items_position = new RectangleX(vSize, ItemSize)

			for (let index = items.length - 1; index > -1; index--) {
				const item = items[index]
				if ((item.IsTownPortalScroll || item.IsTravelBoots) && unit.IsHero)
					continue
				const items_position_2 = items_position.Clone()
					.SubtractSize(items_position.Height / 10)
				if (items_position_2.Contains(CursorOnScreen)) {
					EntityManagerX.GetEntity(item.Handle, AbilityX)?.PingAbility()
					return false
				}
				items_position.pos1.AddScalarX(ItemSize.x)
			}
			panelPosition.AddScalarY(HeroSize.y)
		}

		return true
	}

	public OnMouseKeyUp(key: VMouseKeys) {
		if (!this.IsValidInput(key))
			return true
		this.dirtyPosition = false
		Menu.Base.SaveConfigASAP = true
		const panel = this.menu.GetItemPanelPos
		this.menu.Position.Vector = panel
			.Clone()
			.DivideScalarX(GUIInfo.GetWidthScale())
			.DivideScalarY(GUIInfo.GetHeightScale())
			.RoundForThis(1)
		return true
	}

	public async OnGameEnded() {
		this.TotalItems = 0
		this.DrwableUnits = []
		this.dirtyPosition = false
		await this.menu.OnGameEnded()
	}

	public OnGameStarted() {
		this.dirtyPosition = false
		this.menu.OnGameStarted()
	}

	protected async OnAbilityChanged(abil: AbilityX, unit: UnitX) {
		if (!abil.IsItem || abil.IsFake || !abil.CanDrawable)
			return
		const owner = abil.Owner
		if (owner === undefined || !this.IsValidOwner(owner))
			return
		const model = this.units.get(unit)
		if (model !== undefined)
			await model.OnAbilityDestroyed(abil)
	}

	protected async OnAbilityCreated(abil: AbilityX) {
		if (!abil.IsItem || abil.IsFake || !abil.CanDrawable)
			return

		const owner = abil.Owner
		if (owner === undefined)
			return

		if (!this.IsValidOwner(owner)) {
			await this.OnEntityDestroyed(owner)
			return
		}

		let model = this.units.get(owner)
		if (model === undefined) {
			model = new UnitModel(owner, this.menu)
			this.units.set(owner, model)
		}

		await model.OnAbilityCreated(abil)
	}

	protected async OnAbilityDestroyed(abil: AbilityX) {
		if (!abil.IsItem || abil.IsFake || !abil.CanDrawable)
			return
		const owner = abil.Owner
		if (owner === undefined || !this.IsValidOwner(owner))
			return
		const model = this.units.get(owner)
		if (model !== undefined)
			await model.OnAbilityDestroyed(abil)
	}

	protected IsValidOwner(owner: Nullable<UnitX>) {
		return (owner instanceof SpiritBearX
			|| (owner instanceof HeroX && owner.IsImportant && !owner.IsClone) || owner instanceof CourierX)
			&& !owner.CommandRestricted
	}

	protected DrawEmptySlots(ItemSize: Vector2, position: RectangleX, items: ItemModel[]) {
		const renderCount = this.menu.BackPackState.value ? 10 : 7
		const isTravel = items.some(x => x.HasTravelBoots && !x.IsHero)
		const isTpScroll = items.some(x => x.IsTpScroll && !x.IsHero)
		for (let i = (this.menu.EmptySlot.value ? renderCount : (items.length - 1)) - (isTravel ? isTpScroll ? 2 : 1 : 1); i > -1; i--) {
			const coutsPosition = position.Clone()
			coutsPosition.pos1.AddScalarX(ItemSize.x * i)
			RectangleX.Image(PathX.Images.empty_slot, coutsPosition)
		}
	}

	protected RightPositionUnit(ItemSize: Vector2, HeroSize: Vector2, vector: Vector2) {
		const pos = vector.Add(new Vector2(HeroSize.x * 0.65, HeroSize.y * 0.4))
		const size = new Vector2(ItemSize.x * 0.6, ItemSize.x * 0.6)
		return [pos, size]
	}

	private IsValidInput(key: VMouseKeys) {
		return key === VMouseKeys.MK_LBUTTON
			&& GameState.UIState === DOTAGameUIState_t.DOTA_GAME_UI_DOTA_INGAME
	}

	private Reduce(arr: DrwableUnit[]) {
		let length = 0
		for (const unit of arr)
			length += unit.Items.length
		return length
	}
}
