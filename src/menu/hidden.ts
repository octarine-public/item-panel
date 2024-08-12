import { AbilityData, ImageData, Menu } from "github.com/octarine-public/wrapper/index"

export class HiddenItems {
	public readonly Cost: Menu.Slider
	public readonly Passive: Menu.Toggle
	public readonly NeutralItems: Menu.ImageSelector
	public readonly RareItems: Menu.ImageSelector
	public readonly CommonItems: Menu.ImageSelector

	constructor(menu: Menu.Node) {
		const tree = menu.AddNode(
			"Hide items",
			ImageData.Paths.Icons.icon_close_cross_eye_hidden
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
		this.NeutralItems = neutralTree.AddImageSelector(
			"Neutral items",
			[],
			new Map(),
			"Select items for hide on panel"
		)
	}

	public UnitAbilityDataUpdated() {
		this.CommonItems.values = this.getItemData(
			x =>
				x.Purchasable &&
				!x.ItemIsNeutralDrop &&
				(x.ItemQuality === "common" ||
					x.ItemQuality === "consumable" ||
					x.ItemQuality === "secret_shop" ||
					x.ItemQuality === "component" ||
					x.ItemQuality === undefined)
		)
		this.CommonItems.Update()
		this.RareItems.values = this.getItemData(
			x =>
				x.Purchasable &&
				!x.ItemIsNeutralDrop &&
				(x.ItemQuality === "rare" ||
					x.ItemQuality === "epic" ||
					x.ItemQuality === "artifact")
		)
		this.RareItems.Update()
		this.NeutralItems.values = this.getItemData(x => x.ItemIsNeutralDrop)
		this.NeutralItems.Update()
	}

	public IsEnabled(name: string) {
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
}
