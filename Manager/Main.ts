import {
	AbilityX,
	CourierX,
	EntityManagerX,
	EntityX,
	FlagText,
	HeroX,
	PathX,
	RectangleX,
	SpiritBearX,
	UnitX,
	Util
} from "github.com/octarine-private/immortal-core/index"
import {
	ArrayExtensions,
	Color,
	DOTAGameState,
	DOTAGameUIState,
	GameRules,
	GameState,
	GUIInfo,
	Input,
	Menu,
	Rectangle,
	RendererSDK,
	Vector2,
	VMouseKeys
} from "github.com/octarine-public/wrapper/index"

import { MapDrawable } from "../Drawable/Index"
import { DrwableUnit } from "../Drawable/Items"
import { KeyMode } from "../Enum/KeyMode"
import { ItemModel } from "../Models/Items"
import { UnitModel } from "../Models/Unit"
import { MenuManager } from "./Menu"

export class ItemPanelManager {
	private TotalItems = 0
	private dirtyPosition = false
	private mouseOnPanel = new Vector2()
	private HeroPosition = new Vector2()
	private DrwableUnits: DrwableUnit[] = []
	private readonly units = new Map<UnitX, UnitModel>()

	constructor(protected menu: MenuManager) {}

	private get IsValidShop() {
		return GUIInfo.OpenShopLarge !== undefined && GUIInfo.OpenShopMini !== undefined
	}

	public OnDraw() {
		if (!this.menu.State || GameState.UIState !== DOTAGameUIState.DOTA_GAME_UI_DOTA_INGAME)
			return

		const keyState =
			(this.menu.ModeKey.SelectedID === KeyMode.Toggled && !this.menu.IsToggled) ||
			(this.menu.ModeKey.SelectedID === KeyMode.Pressed && !this.menu.ToggleKey.isPressed)

		if (keyState || this.TotalItems === 0) return

		const HeroSize = this.menu.HeroSize
		const ItemSize = this.menu.ItemSize
		const panel = this.menu.GetItemPanelPos
		const panelPosDraw = panel.Clone()
		const mousePos = Input.CursorOnScreen

		const isValidShop = this.IsValidShop
		if (
			(Input.IsScoreboardOpen && this.IsOpenHud(GUIInfo.Scoreboard.Background)) ||
			(Input.IsShopOpen &&
				isValidShop &&
				(this.IsOpenHud(GUIInfo.OpenShopMini.Items) ||
					this.IsOpenHud(GUIInfo.OpenShopMini.Header) ||
					this.IsOpenHud(GUIInfo.OpenShopMini.GuideFlyout) ||
					this.IsOpenHud(GUIInfo.OpenShopMini.ItemCombines) ||
					this.IsOpenHud(GUIInfo.OpenShopMini.PinnedItems) ||
					this.IsOpenHud(GUIInfo.OpenShopLarge.Items) ||
					this.IsOpenHud(GUIInfo.OpenShopLarge.Header) ||
					this.IsOpenHud(GUIInfo.OpenShopLarge.GuideFlyout) ||
					this.IsOpenHud(GUIInfo.OpenShopLarge.PinnedItems) ||
					this.IsOpenHud(GUIInfo.OpenShopLarge.ItemCombines)))
		)
			return

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
			if (items.length === 0 || (!this.menu.CouriersState.value && unit.IsCourier)) continue

			const vSize = new Vector2(panel.x + HeroSize.x, panel.y)
			const itemsPosition = new RectangleX(vSize, ItemSize)

			if (!unit.IsHero) {
				RendererSDK.FilledRect(panel, HeroSize, Color.Black)
				RendererSDK.Image(
					unit.Textute,
					panel,
					-1,
					HeroSize,
					Color.White,
					0,
					undefined,
					IsHover
				)
				if (!unit.OwnerTextute.includes("unknown_owner")) {
					const [position, size] = this.RightPositionUnit(ItemSize, HeroSize, panel)
					RendererSDK.Image(
						unit.OwnerTextute,
						position,
						-1,
						size,
						Color.White,
						0,
						undefined,
						IsHover
					)
					RendererSDK.FilledRect(
						panel.Clone().SubtractScalarX(3),
						new Vector2(3, HeroSize.y),
						(unit.IsEnemy ? Color.Red : Color.Green).SetA(180)
					)
				}
			} else {
				RendererSDK.Image(
					unit.Textute,
					panel,
					-1,
					HeroSize,
					Color.White,
					0,
					undefined,
					IsHover
				)
				RendererSDK.FilledRect(
					panel.Clone().SubtractScalarX(3),
					new Vector2(3, HeroSize.y),
					unit.PlayerColor.SetA(180)
				)
			}

			this.DrawEmptySlots(ItemSize, itemsPosition, items)

			for (let index = items.length - 1; index > -1; index--) {
				const item = items[index]

				if (item.IsTpScroll && unit.IsHero) {
					const [position, size] = this.RightPositionUnit(ItemSize, HeroSize, panel)
					const rectPosition = new RectangleX(position, size)
					const height = Math.round(rectPosition.Height / 5)
					RectangleX.Image(item.TexturePath, rectPosition, Color.White, 0)

					if (item.RemainingCooldown > 0)
						RendererSDK.Arc(
							-90,
							item.PercentRemainingCooldown,
							rectPosition.pos1,
							rectPosition.pos2,
							false,
							height,
							Color.Red
						)

					continue
				}

				const itemsPosition2 = itemsPosition.Clone().SubtractSize(itemsPosition.Height / 10)

				RectangleX.Image(
					item.TexturePath,
					itemsPosition2,
					Color.White,
					-1,
					item.IsMuted || IsHover || item.IsBackPack
				)

				if (item.RemainingCooldown > 0 && this.menu.CooldwnState.value) {
					const text =
						this.menu.FormatTime.value && item.RemainingCooldown >= 60
							? Util.FormatTime(item.RemainingCooldown)
							: item.RemainingCooldown < 10
							? item.RemainingCooldown.toFixed(1)
							: Math.ceil(item.RemainingCooldown).toFixed()

					RectangleX.Image(
						PathX.Images.softedge_horizontal,
						itemsPosition2,
						Color.Black.SetA(165)
					)
					RectangleX.Text(text, itemsPosition2, Color.White, 1.65)
				}

				if (
					item.RemainingCooldown <= 0 &&
					item.Charges !== 0 &&
					this.menu.ChargeState.value
				)
					RectangleX.Text(
						item.Charges.toFixed(),
						itemsPosition2,
						Color.White,
						2,
						FlagText.BOT_RIGHT,
						{
							filedRect: true
						}
					)

				itemsPosition.pos1.AddScalarX(ItemSize.x)
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
		if (
			GameRules !== undefined &&
			MapDrawable.size !== 0 &&
			GameRules.GameState === DOTAGameState.DOTA_GAMERULES_STATE_WAIT_FOR_PLAYERS_TO_LOAD
		)
			MapDrawable.clear()

		if (!this.menu.State) return

		const arr = [...MapDrawable.values()]
		this.TotalItems = this.Reduce(arr)
		this.DrwableUnits = ArrayExtensions.orderBy(arr, x => !x.IsHero)

		for (const [, model] of this.units) model.OnPostDataUpdate()
	}

	public OnEntityCreated(entity: EntityX) {
		if (entity instanceof AbilityX) this.OnAbilityCreated(entity)
	}

	public OnEntityChanged(entity: EntityX) {
		if (!(entity instanceof UnitX)) return
		if (!this.IsValidOwner(entity)) {
			this.OnEntityDestroyed(entity)
			return
		}
		for (const abil of entity.Abilities.filter(x => x.IsItem)) this.OnEntityCreated(abil)
	}

	public OnLifeStateChanged(entity: EntityX) {
		if (!(entity instanceof SpiritBearX)) return
		const model = this.units.get(entity)
		if (model !== undefined) model.OnLifeStateChanged()
	}

	public OnEntityDestroyed(entity: EntityX) {
		if (entity instanceof AbilityX) this.OnAbilityDestroyed(entity)
		if (!(entity instanceof UnitX)) return
		const model = this.units.get(entity)
		if (model !== undefined) {
			model.OnEntityDestroyed()
			this.units.delete(model.Unit)
		}
	}

	public OnUnitItemsChanged(unit: UnitX, abil?: AbilityX, transferred?: boolean) {
		if (unit.IsIllusion) return
		if (transferred && abil !== undefined) {
			this.OnAbilityChanged(abil, unit)
			return
		}
		for (const item of unit.Abilities.filter(x => x.IsItem)) this.OnAbilityCreated(item)
	}

	public OnUnitAbilitiesChanged(unit: UnitX, abil?: AbilityX, transferred?: boolean) {
		if (unit.IsIllusion) return
		if (transferred && abil !== undefined) {
			this.OnAbilityChanged(abil, unit)
			return
		}
		for (const item of unit.Abilities.filter(x => !x.IsItem)) this.OnAbilityCreated(item)
	}

	public OnMouseKeyDown(key: VMouseKeys) {
		if (!this.IsValidInput(key) || this.dirtyPosition || this.TotalItems === 0) return true

		const HeroSize = this.menu.HeroSize
		const CursorOnScreen = Input.CursorOnScreen
		const panelPosition = this.menu.GetItemPanelPos

		if (
			CursorOnScreen.IsUnderRectangle(
				panelPosition.x,
				panelPosition.y,
				HeroSize.x,
				HeroSize.y
			)
		) {
			this.dirtyPosition = true
			this.mouseOnPanel.CopyFrom(CursorOnScreen.Subtract(this.HeroPosition))
			return false
		}

		const ItemSize = this.menu.ItemSize
		const SizePosition = new Vector2(HeroSize.x + ItemSize.x * 7, HeroSize.y * this.units.size)

		if (!this.menu.PingClick.value) return true

		const rect = new RectangleX(panelPosition, SizePosition)
		if (!rect.Contains(CursorOnScreen)) return true

		const sort = ArrayExtensions.orderBy([...MapDrawable.values()], x => !x.IsHero)

		for (const unit of sort) {
			const items = unit.Items
			if (items.length === 0) continue

			const vSize = new Vector2(panelPosition.x + HeroSize.x, panelPosition.y)
			const itemsPosition = new RectangleX(vSize, ItemSize)

			for (let index = items.length - 1; index > -1; index--) {
				const item = items[index]
				if ((item.IsTownPortalScroll || item.IsTravelBoots) && unit.IsHero) continue
				const itemsPosition2 = itemsPosition.Clone().SubtractSize(itemsPosition.Height / 10)
				if (itemsPosition2.Contains(CursorOnScreen)) {
					EntityManagerX.GetEntity(item.Handle, AbilityX)?.PingAbility()
					return false
				}
				itemsPosition.pos1.AddScalarX(ItemSize.x)
			}
			panelPosition.AddScalarY(HeroSize.y)
		}

		return true
	}

	public OnMouseKeyUp(key: VMouseKeys) {
		if (!this.IsValidInput(key) || !this.dirtyPosition) return true
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

	public OnGameEnded() {
		this.TotalItems = 0
		this.DrwableUnits = []
		this.dirtyPosition = false
		this.menu.OnGameEnded()
	}

	public OnGameStarted() {
		this.dirtyPosition = false
		this.menu.OnGameStarted()
	}

	protected OnAbilityChanged(abil: AbilityX, unit: UnitX) {
		if (!abil.IsItem || abil.IsFake || !abil.CanDrawable) return
		const owner = abil.Owner
		if (owner === undefined) return
		if (!this.IsValidOwner(owner)) {
			this.OnEntityDestroyed(owner)
			return
		}
		const model = this.units.get(unit)
		if (model !== undefined) model.OnAbilityDestroyed(abil)
	}

	protected OnAbilityCreated(abil: AbilityX) {
		if (!abil.IsItem || abil.IsFake || !abil.CanDrawable) return

		const owner = abil.Owner
		if (owner === undefined) return

		if (!this.IsValidOwner(owner)) {
			this.OnEntityDestroyed(owner)
			return
		}

		let model = this.units.get(owner)
		if (model === undefined) {
			model = new UnitModel(owner, this.menu)
			this.units.set(owner, model)
		}

		model.OnAbilityCreated(abil)
	}

	protected OnAbilityDestroyed(abil: AbilityX) {
		if (!abil.IsItem || abil.IsFake || !abil.CanDrawable) return
		const owner = abil.Owner
		if (owner === undefined || !this.IsValidOwner(owner)) return
		const model = this.units.get(owner)
		if (model !== undefined) model.OnAbilityDestroyed(abil)
	}

	protected IsValidOwner(owner: Nullable<UnitX>) {
		return (
			owner instanceof SpiritBearX ||
			(owner instanceof HeroX && owner.IsImportant && !owner.IsClone) ||
			owner instanceof CourierX
		)
	}

	protected DrawEmptySlots(ItemSize: Vector2, position: RectangleX, items: ItemModel[]) {
		const IsTpScroll = items.some(item => item.IsTpScroll)

		const renderCount = this.menu.BackPackState.value ? 9 : 6
		const total = this.menu.EmptySlot.value
			? renderCount - (IsTpScroll ? 1 : 0)
			: items.length - (IsTpScroll ? 2 : 1)

		for (let i = total; i > -1; i--) {
			const newPos = position.Clone()
			newPos.pos1.AddScalarX(ItemSize.x * i)
			RectangleX.Image(PathX.Images.empty_slot, newPos)
		}
	}

	protected RightPositionUnit(ItemSize: Vector2, HeroSize: Vector2, vector: Vector2) {
		const pos = vector.Add(new Vector2(HeroSize.x * 0.65, HeroSize.y * 0.4))
		const size = new Vector2(ItemSize.x * 0.6, ItemSize.x * 0.6)
		return [pos, size]
	}

	private IsValidInput(key: VMouseKeys) {
		return (
			key === VMouseKeys.MK_LBUTTON &&
			GameState.UIState === DOTAGameUIState.DOTA_GAME_UI_DOTA_INGAME
		)
	}

	private Reduce(arr: DrwableUnit[]) {
		let length = 0
		for (const unit of arr) length += unit.Items.length
		return length
	}

	private IsOpenHud(position: Rectangle) {
		return position.Contains(this.menu.GetItemPanelPos)
	}
}
