import { InputParameters } from "./input-parameters"

export type View = {
    strokeWidth: number
    viewBox: string
} | undefined

export function generateView(parameters: InputParameters): View {
    if(parameters.boardWidth.error || parameters.boardHeight.error || parameters.portDiameter.error) {
        return undefined
    }
    const [boardWidth, boardHeight, portDiameter] = [parameters.boardWidth.value, parameters.boardHeight.value, parameters.portDiameter.value]
    const view = computeViewParameters(boardWidth, boardHeight, portDiameter)
    return view
}

export function computeViewParameters(boardWidth: number, boardHeight: number, portDiameter: number) {

    const strokeWidth = portDiameter / 10
    const margin = strokeWidth / 2// + boardWidth / 40
    const viewBox = `${-margin} ${-margin} ${boardWidth + 2 * margin} ${boardHeight + 2 * margin}`

    return { strokeWidth, viewBox }

}