import { AbilityX, HeroX, PathX, PlayerX, UnitX } from "immortal-core/Imports"
import { ArrayExtensions } from "wrapper/Imports"
import DrawInteraction from "../Drawable/Index"
import DrwableItems, { IDrwableUnit } from "../Drawable/Items"
import { DrawItems } from "../ITypes"
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
		this.DrawInteraction.OnUpdateCallback<DrwableItems>(objData => {
			objData.UpdateItems(this.Items)
		})
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

	public async OnLifeStateChanged(unit: UnitX, models: Map<UnitX, UnitModel>) {
		if (!unit.IsAlive) {
			this.DrawInteraction.Delete()
			models.delete(this.Unit)
			return
		}
		const getDraw = this.DrawInteraction.Get()
		if (getDraw === undefined) {
			this.CreateDraw()
			return
		}
	}

	protected DrawTypeMap(models: ItemModel[]): DrawItems[] {
		return models.map(model => [
			model.TexturePath,
			model.RemainingCooldown,
			model.Charges,
			model.IsTpScroll,
			model.HasTravelBoots,
			model.RemainingCooldown,
			model.IsHero,
			model.IsMuted,
			model.Handle,
			model.IsBackPack,
		])
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
			if (!backPackState && abil.IsBackPack || !(allyState || abil.Owner?.IsEnemy()))
				continue
			arr.push(abil)
		}
		return this.DrawTypeMap(arr)
	}

	protected CreateDraw() {

		if (this.DrawInteraction.Has)
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
		})
	}
}
