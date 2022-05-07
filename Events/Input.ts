import { DOTAGameUIState_t, GameState, Input, InputEventSDK, item_tpscroll, Vector2, VMouseKeys } from "wrapper/Imports"
import { ItemPanelData } from "../data"
import { GetItemPanelPos, ItemPanelPingClick } from "../menu"
import { RectangleX } from "../Service/Rectangle"
import { IPValidate } from "../Service/Validate"

const IsValidInput = (key: VMouseKeys) => {
	return IPValidate.IsInGame
		&& key === VMouseKeys.MK_LBUTTON
		&& GameState.UIState === DOTAGameUIState_t.DOTA_GAME_UI_DOTA_INGAME
}

InputEventSDK.on("MouseKeyUp", key => {
	if (!IsValidInput(key))
		return true

	/** TODO dirty position panel */

	if (!ItemPanelPingClick.value)
		return true
})

InputEventSDK.on("MouseKeyDown", key => {
	if (!IsValidInput(key))
		return

	/** TODO dirty position panel */

	if (!ItemPanelPingClick.value)
		return true

	const CursorOnScreen = Input.CursorOnScreen,
		BorderPosition = GetItemPanelPos(),
		ItemSize = ItemPanelData.ItemSize,
		HeroSize = ItemPanelData.HeroSize
	const SizePosition = new Vector2(
		HeroSize.x + ItemSize.x * 7,
		HeroSize.y * ItemPanelData.Units.length,
	)

	const Rectangle = new RectangleX(BorderPosition, SizePosition)
	if (!Rectangle.IsContains(CursorOnScreen))
		return true

	let flags = true
	ItemPanelData.Units.forEach(hero => {
		if (!hero.IsValid)
			return

		const vVector = new Vector2(
			BorderPosition.x + HeroSize.x - (HeroSize.y / 2),
			BorderPosition.y,
		)

		const Rectangle2 = new RectangleX(vVector, HeroSize)

		hero.Items.forEach(item => {
			if (item instanceof item_tpscroll || ItemPanelData.Sleeper.Sleeping(`PingItem`))
				return

			if (Rectangle2.SubtractSizeVector(4).IsContains(CursorOnScreen)) {
				item.PingAbility()
				ItemPanelData.Sleeper.Sleep(350, `PingItem`)
				flags = false
				return
			}

			Rectangle2.AddforThis(new Vector2(ItemSize.x, 0))
		})

		BorderPosition.AddScalarY(HeroSize.y)
	})

	return flags
})
