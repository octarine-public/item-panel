import { Color } from "github.com/octarine-public/wrapper/index"

import { ItemModel } from "../Models/Items"

export interface IDrwableUnit {
	images: string
	isHero: boolean
	isEnemy: boolean
	playerColor: Color
	items: ItemModel[]
	ownerImages: string
	isCourier: boolean
}

export class DrwableUnit {
	constructor(protected readonly option: IDrwableUnit) {}

	public get Items() {
		return this.option.items
	}

	public get Textute() {
		return this.option.images
	}

	public get IsEnemy() {
		return this.option.isEnemy
	}

	public get IsHero() {
		return this.option.isHero
	}

	public get PlayerColor() {
		return this.option.playerColor
	}

	public get IsCourier() {
		return this.option.isCourier
	}

	public get OwnerTextute() {
		return this.option.ownerImages
	}

	public UpdateItems(newItems: ItemModel[]) {
		this.option.items = newItems
	}
}
