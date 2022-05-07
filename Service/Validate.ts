import { GameRules, GameState, LocalPlayer, Team } from "wrapper/Imports"
import { ItemPanelState } from "../menu"

export class IPValidate {
	public static get IsInGame() {
		return ItemPanelState.value
			&& GameRules !== undefined
			&& GameRules.IsInGame
			&& LocalPlayer !== undefined
			&& GameState.LocalTeam !== Team.Observer
	}
}
