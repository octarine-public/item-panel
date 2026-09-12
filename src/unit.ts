import { MenuManager } from "./menu"

export function IsBackpackSlot(item: Item): boolean {
	return (
		item.ItemSlot >= DOTAScriptInventorySlot.DOTA_ITEM_SLOT_7 &&
		item.ItemSlot <= DOTAScriptInventorySlot.DOTA_ITEM_SLOT_9
	)
}

export class UnitData {
	public items: Item[] = []
	public readonly visible: Item[] = []

	constructor(public readonly Owner: Unit) {}

	public CollectVisible(menu: MenuManager): number {
		const visible = this.visible
		visible.length = 0
		const hidden = menu.HiddenItems
		const costValue = hidden.Cost.value
		const passiveState = hidden.Passive.value
		const backPack = menu.BackPack.value
		const items = this.items
		for (let index = items.length - 1; index > -1; index--) {
			const item = items[index]
			if (!item.IsValid) {
				items.splice(index, 1)
				continue
			}
			if (!backPack && IsBackpackSlot(item)) {
				continue
			}
			if (
				!this.ShouldDisplayItem(item, costValue, passiveState) ||
				hidden.IsEnabled(item.Name, item.AbilityData)
			) {
				continue
			}
			visible.push(item)
		}
		return visible.length
	}

	public UnitItemsChanged(newItems: Item[]) {
		this.items = newItems
		this.sortItems()
	}

	public EntityDestroyed(item: Item) {
		this.items.remove(item)
		this.visible.remove(item)
	}

	protected ShouldDisplayItem(item: Item, costValue: number, passiveState: boolean) {
		return (
			(costValue <= item.Cost || item.IsNeutralActiveDrop) &&
			(!passiveState ||
				!(
					item.HasBehavior(
						DOTA_ABILITY_BEHAVIOR.DOTA_ABILITY_BEHAVIOR_PASSIVE
					) && item.MaxCooldown === 0
				))
		)
	}

	protected sortItems() {
		this.items.orderBy(x => (x instanceof item_tpscroll ? x.ItemSlot : -x.ItemSlot))
	}
}
