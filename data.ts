import {
	GameSleeper,
	GUIInfo,
	Hero, Item,
	item_black_king_bar, item_clarity,
	item_dust, item_enchanted_mango, item_flask,
	item_greater_mango, item_infused_raindrop, item_tango, item_tome_of_aghanim,
	item_tome_of_knowledge, item_ward_dispenser, item_ward_observer,
	item_ward_sentry, RendererSDK, SpiritBear, Vector2,
} from "wrapper/Imports"
import { ItemPanelSettingsSize } from "./menu"

export class ItemPanelData {

	public static ToggledByKey = true
	public static Sleeper = new GameSleeper()
	public static Units: (Hero | SpiritBear)[] = []
	public static get HeroSize() {
		const screen_size = RendererSDK.WindowSize
		return new Vector2(
			GUIInfo.ScaleWidth(ItemPanelSettingsSize.value * 1.6, screen_size),
			GUIInfo.ScaleHeight(ItemPanelSettingsSize.value, screen_size),
		)
	}
	public static get ItemSize() {
		const screen_size = RendererSDK.WindowSize
		return new Vector2(
			GUIInfo.ScaleWidth(ItemPanelSettingsSize.value, screen_size),
			GUIInfo.ScaleHeight(ItemPanelSettingsSize.value, screen_size),
		)
	}

	public static ItemDisplayingCharges(item: Item) {
		return item instanceof item_clarity
			|| item instanceof item_black_king_bar
			|| item instanceof item_tango
			|| item instanceof item_flask
			|| item instanceof item_tome_of_knowledge
			|| item instanceof item_ward_sentry
			|| item instanceof item_ward_dispenser
			|| item instanceof item_ward_observer
			|| item instanceof item_greater_mango
			|| item instanceof item_enchanted_mango
			|| item instanceof item_dust
			|| item instanceof item_infused_raindrop
			|| item instanceof item_tome_of_aghanim
	}

	public static Dispose() {
		this.Units = []
		this.Sleeper.FullReset()
	}
}
