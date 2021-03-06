import { Projects, MapChipSelectedEvent, AutoTileSelectedEvent } from '@piyoppi/pico2map-editor'
import { TiledMap, MapChipImage, DefaultAutoTileImportStrategy } from '@piyoppi/pico2map-tiled'

// Get some elements
const mapCanvas = document.getElementById('mapCanvas') as HTMLInputElement
const mapChipSelector = document.getElementById('mapChipSelector') as HTMLInputElement
const autoTileSelector = document.getElementById('autoTileSelector') as HTMLInputElement
const loadButton = document.getElementById('load') as HTMLInputElement
const saveButton = document.getElementById('save') as HTMLInputElement
const rectangleRadioButton = document.getElementById('rectangle') as HTMLInputElement
const eraseRadioButton = document.getElementById('erase') as HTMLInputElement
const penRadioButton = document.getElementById('pen') as HTMLInputElement
const mapChipModeRadioButton = document.getElementById('mapChipMode') as HTMLInputElement
const coliderModeRadioButton = document.getElementById('coliderMode') as HTMLInputElement
const coliderGroup = document.getElementById('coliderGroup') as HTMLDivElement
const coliderTypeNoneRadioButton = document.getElementById('coliderTypeNone') as HTMLInputElement
const coliderTypeColiderRadioButton = document.getElementById('coliderTypeColider') as HTMLInputElement

function setProjectId(id: number) {
  mapChipSelector.setAttribute('projectId', id.toString())
  autoTileSelector.setAttribute('projectId', id.toString())
  mapCanvas.setAttribute('projectId', id.toString())
}

async function setMapChip(tiledMap: TiledMap, chipSize: {width: number, height: number}) {
  const mapChipImage = new MapChipImage("images/chip.png", 1)
  const autoTileImage = new MapChipImage("images/auto-tile-sample.png", 2)

  await mapChipImage.waitWhileLoading()
  await autoTileImage.waitWhileLoading()

  tiledMap.mapChipsCollection.push(mapChipImage)
  tiledMap.mapChipsCollection.push(autoTileImage)

  tiledMap.autoTiles.import(new DefaultAutoTileImportStrategy(autoTileImage, chipSize.width, chipSize.height))
}

async function initialize() {
  const chipSize = { width: 32, height: 32 }
  let tiledMap = new TiledMap(30, 30, chipSize.width, chipSize.height)

  await setMapChip(tiledMap, chipSize)

  const project = Projects.add(tiledMap)
  setProjectId(project.projectId)

  // Deserialze a data
  loadButton.onclick = async () => {
    const serializedData = localStorage.getItem('mapData')
    if (!serializedData) return
    tiledMap = TiledMap.fromObject(JSON.parse(serializedData))
    const newProject = Projects.add(tiledMap)
    setProjectId(newProject.projectId)
    await newProject.tiledMap.mapChipsCollection.waitWhileLoading()
    newProject.requestRenderAll()
  }

  // Serialize a tiled-map data and set to the localStorage
  saveButton.onclick = () => localStorage.setItem('mapData', JSON.stringify(tiledMap.toObject()))

  // Set a pen
  rectangleRadioButton.addEventListener('change', () => mapCanvas.setAttribute('brush', 'RectangleBrush'))
  penRadioButton.addEventListener('change', () => mapCanvas.setAttribute('brush', 'Pen'))

  // Set eraser arrangement
  // DefaultEraseArrangement put empty MapChips.
  eraseRadioButton.addEventListener('change', () => mapCanvas.setAttribute('arrangement', 'DefaultEraseArrangement'))

  mapChipModeRadioButton.addEventListener('change', e => {
    // Set arrangement map-chips mode
    mapCanvas.setAttribute('mode', 'mapChip')

    coliderGroup.style.display = coliderModeRadioButton.checked ? 'block' : 'none'
  })
  coliderModeRadioButton?.addEventListener('change', e => {
    // Set colider-edit mode
    mapCanvas.setAttribute('mode', 'colider')

    coliderGroup.style.display = coliderModeRadioButton.checked ? 'block' : 'none'
  })

  // Set an active colider type
  coliderTypeNoneRadioButton.addEventListener('change', () => mapCanvas?.setAttribute('coliderType', 'none'))
  coliderTypeColiderRadioButton.addEventListener('change', () => mapCanvas?.setAttribute('coliderType', 'colider'))

  autoTileSelector.addEventListener<any>('autotile-selected', (e: AutoTileSelectedEvent) => {
    // Set a AutoTileArrangement.
    // AutoTileArrangement arranges appropriate MapChips.
    mapCanvas.setAttribute('arrangement', 'AutoTileArrangement')
    mapCanvas.setAttribute('brush', 'RectangleBrush')

    // Set an active AutoTile
    mapCanvas.setAttribute('autoTileId', e.detail.id.toString())
    rectangleRadioButton.checked = true
  })

  mapChipSelector.addEventListener<any>('mapchip-selected', (e: MapChipSelectedEvent) => {
    // Set an active MapChip
    mapCanvas.setAttribute('arrangement', 'DefaultArrangement')
    mapCanvas.setAttribute('mapChipFragmentProperties', JSON.stringify(e.detail.selectedMapChipProperties))
  })

  penRadioButton.checked = true
}

initialize()
