import { ItemPanelData } from "../data"
import { ItemPanelToggleKey } from "../menu"

ItemPanelToggleKey.OnRelease(() =>
	ItemPanelData.ToggledByKey = !ItemPanelData.ToggledByKey)
