import { AbilitySlot, AbilityX, EntityX, TownPortalScroll, TravelBoots, TravelBoots2 } from "immortal-core/Imports"
import { DOTA_ABILITY_BEHAVIOR } from "wrapper/Imports"

export default class ItemModel {

	public IsEnabled = true
	public IsTravelBoots = false
	public IsTownPortalScroll = false

	protected readonly TownPortalScroll: Nullable<TownPortalScroll>

	constructor(protected Item: AbilityX) {
		this.IsTownPortalScroll = Item instanceof TownPortalScroll
		this.IsTravelBoots = Item instanceof TravelBoots || Item instanceof TravelBoots2
	}

	public get Handle() {
		return this.Item.Handle
	}

	public get RemainingCooldown() {
		if (this.IsTravelBoots)
			return this.Owner?.GetAbilityByClass(TownPortalScroll)
				?.RemainingCooldown ?? 0
		return this.Item.RemainingCooldown
	}

	public get PercentRemainingCooldown() {
		return this.Item.PercentRemainingCooldown
	}

	public get Name() {
		return this.Item.Name
	}

	public get Charges() {
		return this.Item.Charges
	}

	public get IsTpScroll() {
		if (!this.IsTownPortalScroll)
			return false
		return this.Item.IsUsable
	}

	public get HasTravelBoots() {
		if (!this.IsTravelBoots)
			return false
		return this.Item.IsUsable
	}

	public get AbilitySlot() {
		return this.Item.AbilitySlot
	}

	public get IsBackPack() {
		return this.Item.AbilitySlot >= AbilitySlot.SLOT_7 && this.Item.AbilitySlot <= AbilitySlot.SLOT_9
			&& this.Item.AbilitySlot !== AbilitySlot.SLOT_16
			&& this.Item.AbilitySlot !== AbilitySlot.SLOT_17
	}

	public get TexturePath() {
		return this.Item.TexturePath
	}

	public get IsMuted() {
		return this.Item.IsMutedItem
	}

	public get Owner() {
		return this.Item.Owner
	}

	public get IsHero() {
		return this.Item.Owner?.IsHero ?? false
	}

	protected get ShouldDisplay() {
		if (!this.IsEnabled || !this.Item.IsValid || this.AbilitySlot <= AbilitySlot.NONE)
			return false
		return this.Item.IsAvailable || this.IsBackPack
	}

	public ShouldDisplayItem(costValue: number, PassiveState: boolean) {
		return this.ShouldDisplay
			&& (costValue <= (this.Item.Cost || this.Item.IsNeutralDrop))
			&& (!PassiveState || !(this.Item.HasBehavior(DOTA_ABILITY_BEHAVIOR.DOTA_ABILITY_BEHAVIOR_PASSIVE) && this.Item.MaxCooldown === 0))
	}

	public Equals(ent?: EntityX) {
		return this.Item.Equals(ent)
	}

	public Ping() {
		this.Item.PingAbility()
	}
}
