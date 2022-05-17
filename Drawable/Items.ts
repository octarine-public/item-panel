import { DrawItems } from "../ITypes"

export interface IDrwableUnit {
	images: string
	isHero: boolean,
	items: DrawItems[]
	ownerImages: string
	isCourier: boolean
}

export default class DrwableUnit {

	constructor(protected readonly option: IDrwableUnit) { }

	public get Items() {
		return this.option.items
	}

	public get Textute() {
		return this.option.images
	}

	public get IsHero() {
		return this.option.isHero
	}

	public get IsCourier() {
		return this.option.isCourier
	}

	public get OwnerTextute() {
		return this.option.ownerImages
	}

	public UpdateItems(newItems: DrawItems[]) {
		this.option.items = newItems
	}
}
