import { Color, Rectangle, RendererSDK, Vector2 } from "wrapper/Imports"

export class RectangleX extends Rectangle {

	public static OutlinedRect(rect: RectangleX, color?: Color) {
		RendererSDK.OutlinedRect(rect.pos1, rect.pos2, 1, color)
	}

	public static FilledRect(rect: RectangleX, color?: Color) {
		RendererSDK.FilledRect(rect.pos1, rect.pos2, color)
	}

	public static Image(path: string, rect: RectangleX, color?: Color, round: number = -1) {
		RendererSDK.Image(path, rect.pos1, round, rect.pos2, color)
	}

	public static Text(text: string, rectangle3: RectangleX) {
		const position = new Vector2(rectangle3.pos1.x, rectangle3.pos1.y + (rectangle3.pos2.y / 3.5))
			.AddScalarX((rectangle3.pos2.x - RendererSDK.GetTextSize(text.toString(),
				RendererSDK.DefaultFontName, rectangle3.pos2.y / 1.3).x) / 2)
		RendererSDK.Text(text, position, Color.White, RendererSDK.DefaultFontName, rectangle3.pos2.y / 1.3)
	}
	constructor(public pos1: Vector2, public pos2: Vector2) {
		super(pos1, pos2)
	}

	public get Bottom() {
		return this.pos1.y + this.pos2.y
	}

	public get Right() {
		return this.pos1.x + this.pos2.x
	}

	public set Right(value) {
		this.pos1.x = value
	}

	public IsContains(position: Vector2) {
		return position.x >= this.pos1.x && position.x <= this.Right && position.y >= this.pos1.y && position.y <= this.Bottom
	}

	public AddSizeVector(size: number) {
		this.pos1.SubtractScalarForThis(size)
		this.pos2.AddScalarForThis(size).MultiplyScalar(2)
		return this
	}

	public Clone() {
		return new RectangleX(this.pos1, this.pos2)
	}

	public AddPos1(location: Vector2) {
		return new RectangleX(new Vector2(this.pos1.x + location.x, this.pos1.y + location.y), this.pos2)
	}

	public AddforThis(location: Vector2) {
		this.pos1.AddForThis(location)
		return this
	}

	public SinkToBottomRight(pos2x: number, pos2y: number) {
		return this.SinkToBottomRight_(new Vector2(pos2x, pos2y))
	}

	public SubtractSizeVector(size: number) {
		return new RectangleX(new Vector2(this.pos1.x + size / 2, this.pos1.y + size / 2), new Vector2(this.pos2.x - size, this.pos2.y - size))
	}

	private SinkToBottomRight_(size: Vector2) {
		return new RectangleX(new Vector2(this.Right - size.x, this.Bottom - size.y), size)
	}
}
