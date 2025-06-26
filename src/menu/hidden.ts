import { AbilityData, ImageData, Menu } from "github.com/octarine-public/wrapper/index"

export class HiddenItems {
	public readonly Cost: Menu.Slider
	public readonly Passive: Menu.Toggle
	public readonly NeutralItems: Menu.ImageSelector
	public readonly RareItems: Menu.ImageSelector
	public readonly CommonItems: Menu.ImageSelector

	public readonly HideAllCommon: Menu.Toggle
	public readonly HideAllRare: Menu.Toggle
	public readonly HideAllNeutral: Menu.Toggle

	constructor(menu: Menu.Node) {
		const tree = menu.AddNode(
			"Hide items",
			ImageData.Icons.icon_close_cross_eye_hidden
		)
		tree.SortNodes = false
		this.Passive = tree.AddToggle(
			"Passive items",
			false,
			"Hide passive items that\nhave no cooldown",
			-1,
			ImageData.GetItemTexture("item_branches"),
			0
		)

		this.HideAllCommon = tree.AddToggle(
			"Hide all common items",
			false,
			"Hide all common items",
			-1,
			ImageData.GetItemTexture("item_blink"),
			0
		)

		this.HideAllRare = tree.AddToggle(
			"Hide all rare items",
			false,
			"Hide all rare items",
			-1,
			ImageData.GetItemTexture("item_rapier"),
			0
		)

		this.HideAllNeutral = tree.AddToggle(
			"Hide all neutral items",
			false,
			"Hide all neutral items",
			-1,
			ImageData.GetItemTexture("item_spy_gadget")
		)

		this.Cost = tree.AddSlider(
			"Hide by item cost",
			0,
			0,
			8000,
			0,
			"Hide an item if its cost is less"
		)

		const rareTree = tree.AddNode(
			"Rare items",
			ImageData.GetItemTexture("item_rapier"),
			undefined,
			0
		)
		rareTree.IsHidden = true

		this.RareItems = rareTree.AddImageSelector(
			"Rare items",
			[],
			new Map(),
			"Select items for hide on panel"
		)

		const commonTree = tree.AddNode(
			"Common items",
			ImageData.GetItemTexture("item_blink"),
			undefined,
			0
		)
		commonTree.IsHidden = true

		this.CommonItems = commonTree.AddImageSelector(
			"Common items",
			[],
			new Map(),
			"Select items for hide on panel"
		)

		const neutralTree = tree.AddNode(
			"Neutral items",
			ImageData.GetItemTexture("item_spy_gadget"),
			undefined,
			0
		)
		neutralTree.IsHidden = true

		this.NeutralItems = neutralTree.AddImageSelector(
			"Neutral items",
			[],
			new Map(),
			"Select items for hide on panel"
		)

		this.HideAllRare.OnValue(call => {
			rareTree.IsHidden = call.value
			rareTree.Update()
			tree.Update()
		})
		this.HideAllCommon.OnValue(call => {
			commonTree.IsHidden = call.value
			commonTree.Update()
			tree.Update()
		})
		this.HideAllNeutral.OnValue(call => {
			neutralTree.IsHidden = call.value
			neutralTree.Update()
			tree.Update()
		})
	}

	public UnitAbilityDataUpdated() {
		this.CommonItems.values = this.getItemData(
			x =>
				x.Purchasable &&
				!x.ItemIsNeutralDrop &&
				!x.ItemIsNeutralActiveDrop &&
				this.isCommonItem(x)
		)
		this.CommonItems.Update()
		this.RareItems.values = this.getItemData(
			x =>
				x.Purchasable &&
				!x.ItemIsNeutralDrop &&
				!x.ItemIsNeutralActiveDrop &&
				this.isRareItem(x)
		)
		this.RareItems.Update()
		this.NeutralItems.values = this.getItemData(
			x => x.ItemIsNeutralDrop || x.ItemIsNeutralActiveDrop
		)
		this.NeutralItems.Update()
	}

	public IsEnabled(name: string, abilityData: AbilityData) {
		if (this.HideAllCommon.value && this.isCommonItem(abilityData)) {
			return true
		}
		if (this.HideAllRare.value && this.isRareItem(abilityData)) {
			return true
		}
		if (
			this.HideAllNeutral.value &&
			(abilityData.ItemIsNeutralDrop || abilityData.ItemIsNeutralActiveDrop)
		) {
			return true
		}
		return (
			this.RareItems.IsEnabled(name) ||
			this.CommonItems.IsEnabled(name) ||
			this.NeutralItems.IsEnabled(name)
		)
	}
	protected getItemData(call: (data: AbilityData, name: string) => boolean) {
		return Array.from(AbilityData.globalStorage.entries())
			.filter(
				([name, data]) =>
					data.IsItem && !name.startsWith("item_recipe_") && call(data, name)
			)
			.orderBy(([, x]) => x.Cost)
			.map(([name, _]) => name)
	}
	private isRareItem(abilityData: AbilityData) {
		return (
			abilityData.ItemQuality === "rare" ||
			abilityData.ItemQuality === "epic" ||
			abilityData.ItemQuality === "artifact"
		)
	}
	private isCommonItem(abilityData: AbilityData) {
		return (
			abilityData.ItemQuality === "common" ||
			abilityData.ItemQuality === "consumable" ||
			abilityData.ItemQuality === "secret_shop" ||
			abilityData.ItemQuality === "component" ||
			abilityData.ItemQuality === undefined
		)
	}
}
