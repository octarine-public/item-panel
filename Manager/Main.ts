import { AbilityX, CourierX, EntityManagerX, EntityX, FlagText, HeroX, PathX, RectangleX, SpiritBearX, UnitX } from "immortal-core/Imports"
import { ArrayExtensions, Color, DOTAGameUIState_t, DOTA_GameState, GameRules, GameState, Input, Menu, RendererSDK, Vector2, VMouseKeys } from "wrapper/Imports"
import { MapDrawable } from "../Drawable/Index"
import { KeyMode } from "../Enum/KeyMode"
import { DrawItems } from "../ITypes"
import UnitModel from "../Models/Unit"
import MenuManager from "./Menu"

export default class ItemPanelManager {

	private dirtyPosition = false
	private mouseOnPanel = new Vector2()
	private HeroPosition = new Vector2()
	private units = new Map<UnitX, UnitModel>()

	constructor(protected menu: MenuManager) { }

	public OnDraw() {

		if (!this.menu.State || GameState.UIState !== DOTAGameUIState_t.DOTA_GAME_UI_DOTA_INGAME)
			return

		const keyState = (this.menu.ModeKey.selected_id === KeyMode.Toggled && !this.menu.IsToggled)
			|| (this.menu.ModeKey.selected_id === KeyMode.Pressed && !this.menu.ToggleKey.is_pressed)

		if (keyState)
			return

		const HeroSize = this.menu.HeroSize
		const ItemSize = this.menu.ItemSize
		const panel = this.menu.GetItemPanelPos
		const panelPosDraw = panel.Clone()
		const mousePos = Input.CursorOnScreen
		const IsHover = mousePos.IsUnderRectangle(panel.x, panel.y, HeroSize.x, HeroSize.y)

		if (this.dirtyPosition) {
			Menu.Base.SaveConfigASAP = true
			panel.CopyFrom(mousePos.Subtract(this.mouseOnPanel))
			this.menu.PositionX.value = panel.Round(1).x
			this.menu.PositionY.value = panel.Round(1).y
		}

		const sort = ArrayExtensions.orderBy([...MapDrawable.values()], x => !x.IsHero)

		for (const unit of sort) {

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

				const [texture, charge, remaining, isTpScroll, isTravelBoots, cooldown_ratio, , isMuted, , IsBackPack] = items[index]

				if ((isTpScroll || isTravelBoots) && unit.IsHero) {
					const [position, size] = this.RightPositionUnit(ItemSize, HeroSize, panel)
					const rectPosition = new RectangleX(position, size)
					const height = Math.round(rectPosition.Height / 5)
					RectangleX.Image(texture, rectPosition, Color.White, 0, IsHover)
					if (remaining > 0)
						RendererSDK.Arc(-90, cooldown_ratio, rectPosition.pos1, rectPosition.pos2, false, height, Color.Red)
					continue
				}

				const items_position_2 = items_position.Clone()
					.SubtractSize(items_position.Height / 10)

				RectangleX.Image(texture, items_position_2, Color.White, -1, isMuted || IsHover || IsBackPack)

				if (remaining > 0 && this.menu.CooldwnState.value) {

					const text = remaining > 60
						? this.secondToMin(remaining)
						: remaining < 10 ? remaining.toFixed(1) : Math.ceil(remaining).toFixed()

					RectangleX.Image(PathX.Images.softedge_horizontal, items_position_2, Color.Black.SetA(165))
					RectangleX.Text(text, items_position_2)
				}

				if (remaining <= 0 && charge !== 0 && this.menu.ChargeState.value)
					RectangleX.Text(charge.toFixed(), items_position_2, Color.White, 2, FlagText.BOT_RIGHT, {
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

		for (const [, model] of this.units)
			model.OnPostDataUpdate()
	}

	public async OnEntityCreated(entity: EntityX) {
		if (entity instanceof AbilityX)
			await this.OnAbilityCreated(entity)
	}

	public async OnLifeStateChanged(entity: EntityX) {
		if (!(entity instanceof SpiritBearX))
			return
		const model = this.units.get(entity)
		if (model !== undefined) {
			await model.OnLifeStateChanged(entity, this.units)
			return
		}
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

	public async OnAbilityChanged(abil: AbilityX, unit: UnitX, oldOwner: boolean) {
		if (!abil.IsItem || abil.IsFake || !abil.CanDrawable)
			return
		const owner = abil.Owner
		if (owner === undefined || !this.IsValidOwner(owner))
			return
		const model = this.units.get(unit)
		if (model !== undefined)
			oldOwner ? await model.OnAbilityDestroyed(abil) : await model.OnAbilityCreated(abil)
	}

	public OnMouseKeyDown(key: VMouseKeys) {
		if (!this.IsValidInput(key) || !this.menu.PingClick.value)
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
		}

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
				const [, , , isTpScroll, isTravelBoots, , , , handle] = items[index]
				if ((isTpScroll || isTravelBoots) && unit.IsHero)
					continue
				const items_position_2 = items_position.Clone()
					.SubtractSize(items_position.Height / 10)
				if (items_position_2.Contains(CursorOnScreen)) {
					EntityManagerX.GetEntity(handle, AbilityX)?.PingAbility()
					return false
				}
				items_position.pos1.AddScalarX(ItemSize.x)
			}
			panelPosition.AddScalarY(HeroSize.y)
		}
		return true
	}

	public OnMouseKeyUp(key: VMouseKeys) {
		if (!this.IsValidInput(key) || !this.menu.PingClick.value)
			return true
		this.dirtyPosition = false
		return true
	}

	public async OnGameEnded() {
		this.dirtyPosition = false
		await this.menu.OnGameEnded()
	}

	public OnGameStarted() {
		this.dirtyPosition = false
		this.menu.OnGameStarted()
	}

	protected async OnAbilityCreated(abil: AbilityX) {
		if (!abil.IsItem || abil.IsFake || !abil.CanDrawable)
			return

		const owner = abil.Owner
		if (owner === undefined || !this.IsValidOwner(owner))
			return

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
		return (owner instanceof SpiritBearX || owner instanceof HeroX || owner instanceof CourierX)
			&& !owner.CommandRestricted
	}

	protected DrawEmptySlots(ItemSize: Vector2, position: RectangleX, items: DrawItems[]) {
		const renderCount = this.menu.BackPackState.value ? 10 : 7
		const isTravel = items.some(x => x[4] && !x[6])
		const isTpScroll = items.some(x => x[3] && !x[6])
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

	private secondToMin(time: number, chat: boolean = false) {
		time = Math.floor(time)
		return ~~(time / 60) + (!chat ? ":" : "") + (time % 60 < 10 ? "0" : "") + time % 60
	}

	private IsValidInput(key: VMouseKeys) {
		return key === VMouseKeys.MK_LBUTTON
			&& GameState.UIState === DOTAGameUIState_t.DOTA_GAME_UI_DOTA_INGAME
	}
}
