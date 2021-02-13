import { LitElement, html, css, customElement, property } from 'lit-element'
import { GridImageGenerator } from '../GridImageGenerator'
import { CursorPositionCalculator } from './helpers/CursorPositionCalculator'
import { MapCanvas } from './../MapCanvas'
import { Projects, Project } from './../Projects'
import { ColiderCanvas } from '../ColiderCanvas'
import { EditorCanvas } from '../EditorCanvas'
import { MapChip, MapChipFragment, MapChipFragmentProperties } from '@piyoppi/tiled-map'

type EditMode = 'mapChip' | 'colider'

@customElement('map-canvas-component')
export class MapCanvasComponent extends LitElement {
  private gridImageSrc = ''
  private gridImageGenerator: GridImageGenerator = new GridImageGenerator()
  private cursorPositionCalculator = new CursorPositionCalculator()
  private _mapCanvas: MapCanvas | null = null
  private _coliderCanvas: ColiderCanvas | null = null
  private _project: Project | null = null
  private _canvasElement: HTMLCanvasElement | null = null
  private _secondaryCanvasElement: HTMLCanvasElement | null = null
  private _coliderCanvasElement : HTMLCanvasElement | null = null
  private _mode: EditMode = 'mapChip'

  @property({type: Number}) cursorChipX = 0
  @property({type: Number}) cursorChipY = 0

  private _projectId = -1
  @property({type: Number})
  get projectId(): number {
    return this._projectId
  }
  set projectId(value: number) {
    const oldValue = this._projectId
    this._projectId = value

    this._project = Projects.fromProjectId(value)

    this.setupMapCanvas()

    this.requestUpdate('projectId', oldValue);
  }

  private _brushName = ''
  @property({type: String})
  get brush() {
    return this._brushName
  }
  set brush(value: string) {
    const oldValue = this._brushName
    this._brushName = value

    this.setupMapCanvas()

    this.requestUpdate('brush', oldValue);
  }

  private _arrangementName = ''
  @property({type: String})
  get arrangement() {
    return this._arrangementName
  }
  set arrangement(value: string) {
    const oldValue = this._arrangementName
    this._arrangementName = value

    this.setupMapCanvas()

    this.requestUpdate('arrangement', oldValue);
  }

  @property({type: String})
  get mode() {
    return this._mode
  }
  set mode(value: EditMode) {
    const oldValue = this._mode
    this._mode = value

    this.requestUpdate('mode', oldValue);
  }

  @property({type: Number})
  get autoTileId() {
    return this._mapCanvas?.selectedAutoTile?.id || -1
  }
  set autoTileId(value: number) {
    const oldValue = value
    console.log(value)
    const autoTile = this._project?.tiledMap.autoTiles.fromId(value)

    if (autoTile) {
      this._mapCanvas?.setAutoTile(autoTile)
    }

    this.requestUpdate('autoTileId', oldValue);
  }

  @property({type: Object})
  get mapChipFragmentProperties() {
    return this._mapCanvas?.selectedMapChipFragment?.toObject() || null
  }
  set mapChipFragmentProperties(value: MapChipFragmentProperties) {
    const oldValue = value
    const mapChipFragment = MapChipFragment.fromObject(value)

    this._mapCanvas?.setMapChipFragment(mapChipFragment)

    this.requestUpdate('mapChipFragmentProperties', oldValue);
  }

  private get width() {
    return this.xCount * this.gridWidth
  }

  private get height() {
    return this.yCount * this.gridHeight
  }

  get xCount() {
    return this._project?.tiledMap.chipCountX || 0
  }

  get yCount() {
    return this._project?.tiledMap.chipCountY || 0
  }

  get gridWidth() {
    return this._project?.tiledMap.chipWidth || 0 
  }

  get gridHeight() {
    return this._project?.tiledMap.chipHeight || 0 
  }

  get cursorPosition() {
    return {
      x: this.cursorChipX * this.gridWidth,
      y: this.cursorChipY * this.gridHeight
    }
  }

  get currentEditorCanvas(): EditorCanvas {
    if (!this._coliderCanvas || !this._mapCanvas) throw new Error('EditorCanvas is not set.')

    switch (this._mode) {
      case 'colider':
        return this._coliderCanvas
      default:
        return this._mapCanvas
    }
  }

  private setupMapCanvas() {
    if (!this._project || !this._canvasElement || !this._secondaryCanvasElement || !this._coliderCanvasElement) return;

    if (!this._mapCanvas) {
      this._mapCanvas = new MapCanvas(this._project)
      this._mapCanvas.setCanvas(this._canvasElement, this._secondaryCanvasElement)
    }

    if (!this._coliderCanvas) {
      this._coliderCanvas = new ColiderCanvas(this._project, this._coliderCanvasElement, this._secondaryCanvasElement)
    }

    this._mapCanvas.setBrushFromName(this._brushName)
    this._mapCanvas.setArrangementFromName(this._arrangementName)
  }

  firstUpdated() {
    const element = this.shadowRoot?.getElementById('boundary')
    if (element) this.cursorPositionCalculator.setElement(element)

    this._canvasElement = this.shadowRoot?.getElementById('map-canvas') as HTMLCanvasElement
    this._secondaryCanvasElement = this.shadowRoot?.getElementById('secondary-canvas') as HTMLCanvasElement
    this._coliderCanvasElement = this.shadowRoot?.getElementById('colider-canvas') as HTMLCanvasElement
    this.setupMapCanvas()
  }

  mouseMove(e: MouseEvent) {
    const mouseCursorPosition = this.cursorPositionCalculator.getMouseCursorPosition(e.pageX, e.pageY)
    const cursor = this.currentEditorCanvas.mouseMove(mouseCursorPosition.x, mouseCursorPosition.y)
    this.cursorChipX = cursor.x
    this.cursorChipY = cursor.y
  }

  mouseDown(e: MouseEvent) {
    const mouseCursorPosition = this.cursorPositionCalculator.getMouseCursorPosition(e.pageX, e.pageY)
    this.currentEditorCanvas.mouseDown(mouseCursorPosition.x, mouseCursorPosition.y)
  }

  mouseUp(e: MouseEvent) {
    const mouseCursorPosition = this.cursorPositionCalculator.getMouseCursorPosition(e.pageX, e.pageY)
    this.currentEditorCanvas.mouseUp(mouseCursorPosition.x, mouseCursorPosition.y)
  }

  render() {
    this.gridImageGenerator.setGridSize(this.gridWidth, this.gridHeight)
    this.gridImageSrc = this.gridImageGenerator.generateLinePart().toDataURL()

    return html`
      <style>
        .grid {
          background-image: url("${this.gridImageSrc}");
        }

        #boundary {
          width: ${this.width + 1}px;
          height: ${this.height + 1}px;
        }

        .cursor {
          width: ${this.gridWidth}px;
          height: ${this.gridHeight}px;
          left: ${this.cursorPosition.x}px;
          top: ${this.cursorPosition.y}px;
        }

        .grid-image {
          background-position: 1px 1px
        }
      </style>

      <div id="boundary">
        <canvas
          id="colider-canvas"
          width="${this.width}"
          height="${this.height}"
        ></canvas>
        <canvas
          id="map-canvas"
          width="${this.width}"
          height="${this.height}"
        ></canvas>
        <canvas
          id="secondary-canvas"
          width="${this.width}"
          height="${this.height}"
        ></canvas>
        <div
          class="grid-image grid"
          @mousemove="${(e: MouseEvent) => this.mouseMove(e)}"
          @mousedown="${(e: MouseEvent) => this.mouseDown(e)}"
          @mouseup ="${(e: MouseEvent) => this.mouseUp(e)}"
        ></div>
        <div class="cursor"></div>
      </div>
    `;
  }

  static get styles() {
    return css`
      .grid-image {
        position: absolute;
        top: 0;
        left: 0;
        background-repeat: repeat;
        width: 100%;
        height: 100%;
      }

      .cursor {
        position: absolute;
        border-style: solid;
        box-sizing: border-box;
        border-color: red;
        pointer-events: none;
      }

      #boundary {
        position: relative;
      }

      #secondary-canvas, #colider-canvas {
        pointer-events: none;
        position: absolute;
        top: 0;
        left: 0;
      }
    `
  }
}
