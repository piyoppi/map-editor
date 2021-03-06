import { Project } from './Projects'
import { ColiderRenderer } from './ColiderRenderer'
import { ColiderTypes } from '@piyoppi/pico2map-tiled'
import { Pen } from './Brushes/Pen'
import { Brush } from './Brushes/Brush'
import { Arrangement, isColiderTypesRequired } from './Brushes/Arrangements/Arrangement'
import { ColiderArrangement } from './Brushes/Arrangements/ColiderArrangement'
import { EditorCanvas } from './EditorCanvas'

export class ColiderCanvas implements EditorCanvas {
  private _coliderCtx: CanvasRenderingContext2D | null = null
  private _secondaryCanvasCtx: CanvasRenderingContext2D | null = null
  private _secondaryCanvas: HTMLCanvasElement | null = null
  private _project: Project | null = null
  private _coliderRenderer: ColiderRenderer | null = null
  private _brush: Brush<ColiderTypes>
  private _arrangement: Arrangement<ColiderTypes> = new ColiderArrangement()
  private _isMouseDown = false
  private _lastMapChipPosition = {x: -1, y: -1}
  private _selectedColiderType: ColiderTypes = 'none'

  constructor() {
    this._brush = new Pen()
    this._setupBrush()
  }

  get selectedColiderType() {
    return this._selectedColiderType
  }

  get project() {
    if (!this._project) throw new Error('The project is not set')

    return this._project
  }

  get coliderCtx() {
    if (!this._coliderCtx) throw new Error('A canvas is not set')

    return this._coliderCtx
  }

  get secondaryCanvasCtx() {
    if (!this._secondaryCanvasCtx) throw new Error('A canvas is not set')

    return this._secondaryCanvasCtx
  }

  get coliderRenderer() {
    if (!this._coliderRenderer) throw new Error('The project is not set')

    return this._coliderRenderer
  }

  get secondaryCanvas() {
    if (!this._secondaryCanvas) throw new Error('A canvas is not set')

    return this._secondaryCanvas
  }

  setProject(project: Project) {
    this._project = project
    this._coliderRenderer = new ColiderRenderer(this._project.tiledMap)

    this._project.registerRenderAllCallback(() => {
      if (!this._coliderCtx) return
      this.coliderRenderer.renderAll(this._coliderCtx)
    })
  }

  setCanvas(canvas: HTMLCanvasElement, secondaryCanvas: HTMLCanvasElement) {
    this._coliderCtx = canvas.getContext('2d') as CanvasRenderingContext2D
    this._secondaryCanvasCtx = secondaryCanvas.getContext('2d') as CanvasRenderingContext2D
    this._secondaryCanvas = secondaryCanvas
  }

  setBrush(brush: Brush<ColiderTypes>) {
    this._brush = brush
    this._setupBrush()
  }

  setColiderType(value: ColiderTypes) {
    this._selectedColiderType = value
    this._setupBrush()
  }

  private _setupBrush() {
    this._brush.setArrangement(this._arrangement)

    if (isColiderTypesRequired(this._arrangement)) {
      this._arrangement.setColiderTypes(this._selectedColiderType)
    }
  }

  mouseDown(x: number, y: number) {
    this._isMouseDown = true

    const chipPosition = this.convertFromCursorPositionToChipPosition(x, y)
    this._brush.mouseDown(chipPosition.x, chipPosition.y)

    this._lastMapChipPosition = chipPosition
  }

  mouseMove(x: number, y: number): {x: number, y: number} {
    const chipPosition = this.convertFromCursorPositionToChipPosition(x, y)

    if (!this._isMouseDown) return chipPosition
    if (chipPosition.x === this._lastMapChipPosition.x && chipPosition.y === this._lastMapChipPosition.y) return chipPosition

    this.clearSecondaryCanvas()
    this._brush.mouseMove(chipPosition.x, chipPosition.y).forEach(paint => {
      const chip = paint.item
      this.coliderRenderer.putOrClearChipToCanvas(this.secondaryCanvasCtx, chip, paint.x, paint.y, true)
    })

    this._lastMapChipPosition = chipPosition

    return chipPosition
  }

  mouseUp(x: number, y: number) {
    this._isMouseDown = false

    const chipPosition = this.convertFromCursorPositionToChipPosition(x, y)

    this._brush.mouseUp(chipPosition.x, chipPosition.y).forEach(paint => {
      const chip = paint.item
      this.putChip(chip, paint.x, paint.y)
    })

    this.clearSecondaryCanvas()
    this._brush.cleanUp()
    this._lastMapChipPosition = {x: -1, y: -1}
  }

  putChip(coliderType: ColiderTypes, chipX: number, chipY: number) {
    this.project.tiledMap.coliders.put(coliderType, chipX, chipY)
    this.coliderRenderer.putOrClearChipToCanvas(this.coliderCtx, coliderType, chipX, chipY)
  }

  private clearSecondaryCanvas() {
    this.secondaryCanvasCtx.clearRect(0, 0, this.secondaryCanvas.width, this.secondaryCanvas.height)
  }

  public convertFromCursorPositionToChipPosition(x: number, y: number) {
    return {
      x: Math.max(0, Math.min(Math.floor(x / this.project.tiledMap.chipWidth), this.project.tiledMap.chipCountX - 1)),
      y: Math.max(0, Math.min(Math.floor(y / this.project.tiledMap.chipHeight), this.project.tiledMap.chipCountY - 1))
    }
  }
}
