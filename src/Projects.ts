import { TiledMap } from './TiledMap'
import { MapChipSelector } from './MapChipSelector'
import { AutoTile } from './AutoTile/AutoTiles'

export class Project {
  private _mapChipSelector = new MapChipSelector(this._tiledMap)
  private _selectedAutoTile: AutoTile | null = null

  constructor(
    private _tiledMap: TiledMap,
    private _projectId: number
  ) {

  }

  get mapChipSelector() {
    return this._mapChipSelector
  }

  get projectId() {
    return this._projectId
  }

  get tiledMap() {
    return this._tiledMap
  }

  get selectedAutoTile(): AutoTile | null {
    return this._selectedAutoTile
  }

  set selectedAutoTile(val: AutoTile | null) {
    this._selectedAutoTile = val
  }
}

export class Projects {
  private static _idCounter = 0
  private static _items: Array<Project> = []

  static get items() {
    return Projects._items
  }

  static add(tiledMap: TiledMap, projectId: number = -1) {
    const id = projectId > 0 ? projectId : Projects.createId()
    Projects._items.push(new Project(tiledMap, id))
  }

  static clear() {
    this._items.length = 0
  }

  static fromProjectId(projectId: number): Project | null {
    return this._items.find( item => item.projectId === projectId ) || null
  }

  private static createId() {
    return Projects._idCounter++
  }
}