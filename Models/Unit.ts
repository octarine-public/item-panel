import { AbilityX, CourierX, HeroX, PathX, PlayerX, UnitX } from "immortal-core/Imports"
import { ArrayExtensions } from "wrapper/Imports"
import DrawInteraction from "../Drawable/Index"
import DrwableItems, { IDrwableUnit } from "../Drawable/Items"
import MenuManager from "../Manager/Menu"
import ItemModel from "./Items"

export default class UnitModel {

	public items: ItemModel[] = []
	protected DrawInteraction: DrawInteraction

	constructor(
		public Unit: UnitX,
		protected menu: MenuManager,
		public IsAlly = !Unit.IsEnemy(),
	) {
		this.DrawInteraction = new DrawInteraction(Unit)
		this.CreateDraw()
	}

	public get Items() {
		return this.OrderBy(this.items, this.menu.AllyState.value)
	}

	public OnPostDataUpdate() {
		this.DrawInteraction.OnUpdateCallback<DrwableItems>(class_ =>
			class_.UpdateItems(this.Items))
	}

	public async OnAbilityCreated(abil: AbilityX) {
		if (this.items.some(item => item.Equals(abil)))
			return
		this.items.push(new ItemModel(abil))
		await this.menu.OnAddItem(abil)
	}

	public async OnAbilityDestroyed(abil: AbilityX) {
		const item = this.items.find(item_ => item_.Equals(abil))
		if (item !== undefined)
			ArrayExtensions.arrayRemove(this.items, item)
	}

	public OnEntityDestroyed() {
		this.DrawInteraction.Delete()
	}

	/** restart bear */
	public async OnLifeStateChanged() {
		if (!this.Unit.IsAlive) {
			this.OnEntityDestroyed()
			return
		}
		this.CreateDraw()
	}

	protected OrderBy(models: ItemModel[], allyState: boolean) {

		const costValue = this.menu.CostValue.value
		const passiveState = this.menu.PassiveState.value
		const backPackState = this.menu.BackPackState.value
		const orderBy = ArrayExtensions.orderByRevert(models, x => x.AbilitySlot)

		const arr: ItemModel[] = []
		for (const abil of orderBy) {
			if (!abil.ShouldDisplayItem(costValue, passiveState) || this.menu.HiddenItems.IsEnabled(abil.Name))
				continue
			if ((!backPackState && abil.IsBackPack) || !(allyState || abil.Owner?.IsEnemy()))
				continue
			arr.push(abil)
		}
		return arr
	}

	protected CreateDraw() {

		if (this.DrawInteraction.Has())
			return

		let ownerName = this.Unit.Name

		if (!(this.Unit instanceof HeroX))
			ownerName = (this.Unit.Owner instanceof PlayerX)
				? this.Unit.Owner.HeroX?.Name ?? "unknown_owner"
				: this.Unit.Owner?.Name ?? "unknown_owner"

		this.DrawInteraction.Set<IDrwableUnit>(DrwableItems, {
			items: this.Items,
			isHero: this.Unit.IsHero ?? false,
			images: PathX.Unit({ name: this.Unit.Name, team: this.Unit.Team }),
			ownerImages: PathX.Unit({ name: ownerName, team: this.Unit.Team, iconSmall: true }),
			isCourier: this.Unit instanceof CourierX,
		})
	}
}
