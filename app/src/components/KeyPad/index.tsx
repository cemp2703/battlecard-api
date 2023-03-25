import { PosBatalla } from '../../constants/celdabatalla'
import { useGameStore } from '../../hooks/useGameStore'
import classes from './styles.module.css'

export default function KeyPad () {
  const { buttons, message } = useGameStore(state => state.botonera)
  const colocarCartaClick = useGameStore(state => state.colocarCartaClick)
  const colocarEnAtaqueHandleClick = () => {
    colocarCartaClick(PosBatalla.ATAQUE)
  }
  const colocarEnDefensaHandleClick = () => {
    colocarCartaClick(PosBatalla.DEF_ABAJO)
  }
  return (
    <article className={classes.keyPad}>
      <p id="mensajeBotones">{message}</p>
      {buttons.colocarEnAtaque as boolean && <button id="btnColocarEnAtaque" className="btnColocarEnAtaque" onClick={colocarEnAtaqueHandleClick}>de ataque</button>}
      {buttons.colocarEnDefensa as boolean && <button id="btnColocarEnDefensa" className="btnColocarEnDefensa" onClick={colocarEnDefensaHandleClick}>de defensa</button>}
      {buttons.atacarCarta as boolean && <button id="btnAtacarCarta">Atacar carta</button>}
      {buttons.atacarBarrera as boolean && <button id="btnAtacarBarrera" className="btnAtacarBarrera">Atacar barrera</button>}
      {buttons.cambiarPosicion as boolean && <button id="btnCambiarPosicion">Cambiar posición</button>}
      {buttons.terminarTurno as boolean && <button id="btnTerminarTurno">Terminar turno</button>}
      {buttons.finDeTurno as boolean && <button id="btnFinDeJuego">Fin de Juego</button>}
    </article>
  )
}
