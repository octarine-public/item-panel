import { EntityManager, EventsSDK, Hero, npc_dota_hero_meepo, SpiritBear } from "wrapper/Imports"
import { ItemPanelData } from "../data"
import { ItemPanelAllyState } from "../menu"
import { IPValidate } from "../Service/Validate"

EventsSDK.on("Tick", () => {
	if (!IPValidate.IsInGame)
		return

	const filter = [
		...EntityManager.GetEntitiesByClass(Hero),
		...EntityManager.GetEntitiesByClass(SpiritBear).filter(unit => unit.IsAlive),
	]

	ItemPanelData.Units = filter.filter(unit => unit.IsValid
		&& !unit.IsIllusion
		&& !unit.IsTempestDouble
		&& (ItemPanelAllyState.value || unit.IsEnemy())
		&& !(unit instanceof npc_dota_hero_meepo && unit.IsClone)).sort()
})
