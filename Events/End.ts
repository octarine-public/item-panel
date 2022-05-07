import { EventsSDK } from "wrapper/Imports"
import { ItemPanelData } from "../data"

EventsSDK.on("GameEnded", () => {
	ItemPanelData.Dispose()
})
