import { PanelIcons } from "./icons"

type ConfigObject = MenuSDK.ConfigObject

/**
 * One heading of a picker's popup: the qualities the shop files under it, and the colour the
 * heading wears there. The first heading of a list also takes whatever quality none of them names,
 * so an item the game grows after this was written still stands somewhere rather than nowhere.
 */
interface IItemSection {
	readonly title: string
	readonly accent: string
	readonly qualities: readonly Nullable<string>[]
}

/** The cheap side of the shop: an item the data gives no quality of its own is one of the common. */
const CommonSections: readonly IItemSection[] = [
	{ title: "Common", accent: "#b0b6c0", qualities: ["common", undefined] },
	{ title: "Consumable", accent: "#5f9e5e", qualities: ["consumable"] },
	{ title: "Component", accent: "#6a8fc0", qualities: ["component"] },
	{ title: "Secret shop", accent: "#b06fc8", qualities: ["secret_shop"] }
]

/** The expensive side, in the order the shop ranks it. */
const RareSections: readonly IItemSection[] = [
	{ title: "Rare", accent: "#4a90d9", qualities: ["rare"] },
	{ title: "Epic", accent: "#9b6fc8", qualities: ["epic"] },
	{ title: "Artifact", accent: "#e0a44b", qualities: ["artifact"] }
]

/** What the jungle drops when its tiers cannot be read: one heading, the data carries no tier. */
const NeutralSections: readonly IItemSection[] = [
	{ title: "Neutral", accent: "#c47b3f", qualities: [] }
]

/** Where the game files the jungle's drop pool, tier by tier. */
const NeutralTiersPath = "scripts/npc/neutral_items.txt"

/** The colour a tier's heading wears, lowest tier first; a tier past the last wears its colour. */
const TierAccents = ["#b0b6c0", "#5f9e5e", "#4a90d9", "#9b6fc8", "#e0a44b"]

/** The rows whose picks a config wrote under a page of their own, before the popup replaced it. */
const PickerRows = ["Rare items", "Common items", "Neutral items"]

/** The heading a quality stands under: the one naming it, else the first, which takes the rest. */
function sectionOf(
	sections: readonly IItemSection[],
	quality: Nullable<string>
): IItemSection {
	return sections.find(section => section.qualities.includes(quality)) ?? sections[0]
}

/** What a tile is called in the popup: the item's name, without the prefix the data files it under. */
function displayName(name: string): string {
	return name
		.slice("item_".length)
		.split("_")
		.map(word => word.charAt(0).toUpperCase() + word.slice(1))
		.join(" ")
}

/** The rows a config keeps under a page, or nothing when the value is not a page at all. */
function objectOf(value: unknown): Nullable<ConfigObject> {
	return typeof value === "object" && value !== null && !Array.isArray(value)
		? (value as ConfigObject)
		: undefined
}

/** The KV block under a key, or nothing when what stands there is not a block. */
function blockOf(value: Nullable<RecursiveMapValue>): Nullable<RecursiveMap> {
	return value instanceof Map ? value : undefined
}

/**
 * The tiers of the jungle's drop pool as the game files them: each tier's number and the
 * trinkets it holds, in the file's order. Nothing when the file is missing or laid out some
 * other way, which is the caller's cue to fall back.
 */
function readNeutralTiers(): [tier: string, names: string[]][] {
	if (!fexists(NeutralTiersPath)) {
		return []
	}
	const pool = blockOf(parseKV(NeutralTiersPath).get("neutral_items"))
	const tiers = blockOf(pool?.get("neutral_tiers"))
	if (tiers === undefined) {
		return []
	}
	return Array.from(tiers, ([tier, block]): [string, string[]] => [
		tier,
		Array.from(blockOf(blockOf(block)?.get("items"))?.keys() ?? [])
	])
}

/**
 * Carries the picks saved while every group had a page of its own onto the row that replaced it:
 * the page and the only row it held share a name, so what stood under both is the row's own now.
 * Idempotent, as a migration must be — a config already holding the row's value passes through.
 */
function migratePickers(stored: Nullable<ConfigObject>): void {
	if (stored === undefined) {
		return
	}
	for (const name of PickerRows) {
		const saved = objectOf(stored[name])?.[name]
		if (saved !== undefined) {
			stored[name] = saved
		}
	}
}

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
		const tree = menu.AddNode("Hide items", PanelIcons.HideItems)
		tree.SortNodes = false
		// every group stood on a page of its own before its row grew a popup of items
		MenuSDK.AddConfigMigration(raw =>
			migratePickers(MenuSDK.ConfigSubtreeOf(raw, tree.entry))
		)
		migratePickers(tree.entry.stored)

		this.Passive = tree.AddToggle(
			"Passive items",
			false,
			"Hide passive items that\nhave no cooldown",
			-1,
			PanelIcons.Passive
		)
		this.Cost = tree.AddSlider(
			"Hide by item cost",
			0,
			0,
			8000,
			0,
			"Hide an item if its cost is less"
		)
		this.Cost.IconPath = PanelIcons.Cost

		this.HideAllCommon = tree.AddToggle(
			"Hide all common items",
			false,
			"Hide all common items",
			-1,
			PanelIcons.Common
		)
		this.CommonItems = this.addPicker(tree, "Common items", PanelIcons.Common)

		this.HideAllRare = tree.AddToggle(
			"Hide all rare items",
			false,
			"Hide all rare items",
			-1,
			PanelIcons.Rare
		)
		this.RareItems = this.addPicker(tree, "Rare items", PanelIcons.Rare)

		this.HideAllNeutral = tree.AddToggle(
			"Hide all neutral items",
			false,
			"Hide all neutral items",
			-1,
			PanelIcons.Neutral
		)
		this.NeutralItems = this.addPicker(tree, "Neutral items", PanelIcons.Neutral)

		this.gate(this.HideAllCommon, this.CommonItems)
		this.gate(this.HideAllRare, this.RareItems)
		this.gate(this.HideAllNeutral, this.NeutralItems)
	}

	public UnitAbilityDataUpdated() {
		this.fill(
			this.CommonItems,
			CommonSections,
			data => this.isShopItem(data) && this.isCommonItem(data)
		)
		this.fill(
			this.RareItems,
			RareSections,
			data => this.isShopItem(data) && this.isRareItem(data)
		)
		this.fillNeutral()
	}

	public IsEnabled(name: string, abilityData: AbilityData) {
		if (this.HideAllCommon.value && this.isCommonItem(abilityData)) {
			return true
		}
		if (this.HideAllRare.value && this.isRareItem(abilityData)) {
			return true
		}
		if (this.HideAllNeutral.value && this.isNeutralItem(abilityData)) {
			return true
		}
		return (
			this.RareItems.IsEnabled(name) ||
			this.CommonItems.IsEnabled(name) ||
			this.NeutralItems.IsEnabled(name)
		)
	}

	/**
	 * One group's row: the items chosen out of it stand in the row itself, and the button beside
	 * them opens the popup the rest are chosen in — which is what keeps a whole shop one row tall.
	 */
	protected addPicker(tree: Menu.Node, name: string, iconPath: string) {
		const picker = tree.AddImageSelector(
			name,
			[],
			new Map(),
			"The items hidden on the panel.\nPress + to open the list and choose them"
		)
		picker.IconPath = iconPath
		picker.Variant = "item"
		return picker
	}

	/** Takes a group's picker off the page while the whole group is hidden anyway. */
	protected gate(hideAll: Menu.Toggle, picker: Menu.ImageSelector) {
		const sync = () => {
			picker.IsHidden = hideAll.value
		}
		hideAll.OnValue(sync)
		sync()
	}

	/**
	 * Hands one picker the items it chooses from. The item data arrives with the server rather than
	 * with the menu, and comes again on every connection, so the catalogue is built from it each
	 * time; nothing at all is data that never arrived, and what the picker carries is worth more.
	 */
	protected fill(
		picker: Menu.ImageSelector,
		sections: readonly IItemSection[],
		holds: (data: AbilityData) => boolean
	) {
		const catalogue = this.catalogueOf(sections, holds)
		if (catalogue.length !== 0) {
			picker.Catalogue = catalogue
		}
	}

	/**
	 * Hands the neutral picker the jungle's drop pool, a heading per tier in the order the game
	 * files them, each holding that tier's trinkets in the game's own order. Only what the pool
	 * holds today is listed, though the data still knows every trinket the jungle ever dropped;
	 * all of those stand under one heading only when the pool cannot be read.
	 */
	protected fillNeutral() {
		const catalogue = this.tierCatalogue()
		if (catalogue.length !== 0) {
			this.NeutralItems.Catalogue = catalogue
			return
		}
		this.fill(this.NeutralItems, NeutralSections, data => this.isNeutralItem(data))
	}

	/** The drop pool a heading per tier; a tier holding nothing the game knows is left out. */
	protected tierCatalogue(): MenuSDK.CatalogueSection[] {
		return readNeutralTiers()
			.map(([tier, names], index) => ({
				title: `Tier ${tier}`,
				accent: TierAccents[Math.min(index, TierAccents.length - 1)],
				values: names
					.filter(name => AbilityData.globalStorage.has(name))
					.map(name => ({ value: name, label: displayName(name) }))
			}))
			.filter(section => section.values.length !== 0)
	}

	/**
	 * The sections one picker's popup lists: every item the group holds, cheapest first, standing
	 * under the heading its quality belongs to. A heading nothing landed under is left out.
	 */
	protected catalogueOf(
		sections: readonly IItemSection[],
		holds: (data: AbilityData) => boolean
	) {
		const values = new Map<IItemSection, MenuSDK.CatalogueValue[]>()
		for (const [name, data] of this.itemsOf(holds)) {
			const section = sectionOf(sections, data.ItemQuality)
			let held = values.get(section)
			if (held === undefined) {
				held = []
				values.set(section, held)
			}
			held.push({ value: name, label: displayName(name) })
		}
		return sections
			.filter(section => values.has(section))
			.map(section => ({
				title: section.title,
				accent: section.accent,
				values: values.get(section) ?? []
			}))
	}

	/** Every item the game knows that a group gathers, cheapest first. */
	protected itemsOf(holds: (data: AbilityData) => boolean) {
		return Array.from(AbilityData.globalStorage.entries())
			.filter(
				([name, data]) =>
					data.IsItem && !name.startsWith("item_recipe_") && holds(data)
			)
			.orderBy(([, data]) => data.Cost)
	}

	/** Whether the shop sells this, as opposed to the jungle dropping it. */
	private isShopItem(abilityData: AbilityData) {
		return abilityData.Purchasable && !this.isNeutralItem(abilityData)
	}
	private isNeutralItem(abilityData: AbilityData) {
		return abilityData.ItemIsNeutralDrop || abilityData.ItemIsNeutralActiveDrop
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
