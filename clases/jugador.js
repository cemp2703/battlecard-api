/* eslint-disable no-undef */
const Carta = require('./carta.js');
const CeldaBatalla = require('./celdaBatalla.js');

const ResultadoCojerUnaCarta = { MANO_LLENA: "MANO LLENA", DECK_VACIO: "DECK VACIO", EXITO: "EXITO" };
Object.freeze(ResultadoCojerUnaCarta);
const VeredictoAtaque = {
    EMPATE: "EMPATE",
    GANA_ATACANTE: "GANA ATACANTE",  //Gana Atacante contra carta en Zona de Batalla
    PIERDE_ATACANTE: "PIERDE ATACANTE", //Pierde Atacante
    BARRERA_DESTRUIDA: "BARRERA DESTRUIDA", //Destruye una barrera
    ENEMIGO_SIN_BARRERA: "ENEMIGO SIN BARRERA" //Termina el juego porque enemigo se quedo sin cartas de barrera (Termino 2)
}
Object.freeze(VeredictoAtaque);
const EstadoCarta = {
    ACTIVA: "ACTIVA", // Carta activa
    DESTRUIDA: "DESTRUIDA" // Carta destruida
}
Object.freeze(EstadoCarta);

class Jugador {
    static get MAX_ZONA_BATALLA_CARDS() { return 3 }
    static get MAX_BARRERA_CARDS() { return 5 }
    static get MAX_MANO_CARDS() { return 5 }
    static get MAX_DECK() { return Carta.MAX_VALOR_CARTA * Carta.NUMERO_ELEMENTOS_CARTAS }
    static get ResultadoCojerUnaCarta() { return ResultadoCojerUnaCarta; }
    static get VeredictoAtaque() { return VeredictoAtaque; }
    static get EstadoCarta() { return EstadoCarta; }
    /**
     * 
     * @param {string} nombre
     */
    constructor(nombre) {
        this.cartaColocada = false
        this.nAtaquesDisponibles = 0;
        this.nCambiosPosicionesDisponibles = 0;
        /**
         * @type {Array<CeldaBatalla>}
         */
        this.zonaBatalla = [];
        for (let i = 0; i < Jugador.MAX_ZONA_BATALLA_CARDS; i++) {
            this.zonaBatalla[i] = new CeldaBatalla();
            this.zonaBatalla[i].carta = null;
        }
        /**
         * @type {Array<Carta>}
         */
        this.barrera = [];
        /**
         * @type {Array<Carta>}
         */
        this.mano = [];
        /**
         * @type {Array<Carta>}
         */
        this.deck = [];
        this.nTurnos = 0;
        this.nombre = nombre;
        this.puedeColocarCartaEnZB = true;
        this.nCartasEnZB = 0; // revisa codigo por esto
    }
    //region Operaciones (Reglas)

    iniciarTurno() {
        this.nTurnos++;
        this.nAtaquesDisponibles = 0;
        this.nCambiosPosicionesDisponibles = 0;
        this.cartaColocada = false;
        for (let celdaBatalla of this.zonaBatalla) {
            if (celdaBatalla.carta != null) {
                if (celdaBatalla.posBatalla === CeldaBatalla.Estado.POS_BATALLA_ATAQUE) {
                    celdaBatalla.dispAtaque = CeldaBatalla.Estado.ATAQUE_DISPONIBLE;
                    this.nAtaquesDisponibles++;
                }
                else
                    celdaBatalla.dispAtaque = CeldaBatalla.Estado.ATAQUE_NO_DISPONIBLE;
                celdaBatalla.dispCambio = CeldaBatalla.Estado.CAMBIO_POS_DISPONIBLE;
                this.nCambiosPosicionesDisponibles++;
            }
        }
    }

    /**
     *  @returns {string}
     */
    cogerUnaCartaDelDeck() {
        if (this.mano.length === Jugador.MAX_MANO_CARDS)
            return ResultadoCojerUnaCarta.MANO_LLENA;
        const carta = this.deck.pop();
        if (carta === undefined) {
            //console.log("Fin del Juego!!!");
            //console.log(this.nombre + " se quedó sin cartas en el mazo!!");
            return ResultadoCojerUnaCarta.DECK_VACIO;
        }
        else {
            this.mano.push(carta);
            //console.log("Se coge una carta del deck a la mano");
            return ResultadoCojerUnaCarta.EXITO;
        }
    }
    /**
     * @param {number} idCartaZB 
     * @param {number} idCartaMano
     * @returns {boolean}
     */
    posibilidadColocarCartaEnPosicion(idCartaZB, idCartaMano) {
        if (!this.puedeColocarCartaEnZB)
            return 'No está habilitado para colocar carta';
        if (this.mano[idCartaMano] === null || this.mano[idCartaMano] === undefined)
            return 'No hay carta en la mano para esa posicion';
        if (this.zonaBatalla[idCartaZB].posBatalla !== CeldaBatalla.Estado.NO_HAY_CARTA)
            return 'Posición en zona de batalla está ocupada';
        return 'Posible';
    }

    /**
     * @param {number} idCartaZB 
     * @param {number} idCartaMano 
     * @param {string} posBatalla
     * @returns {boolean}
     */
    accionColocarCarta(idCartaZB, idCartaMano, posBatalla) {
        let respuesta = this.posibilidadColocarCartaEnPosicion(idCartaZB, idCartaMano);
        if (respuesta === 'Posible') {
            let carta = this.mano[idCartaMano];
            this.mano.splice(idCartaMano, 1);
            this.puedeColocarCartaEnZB = false;
            if (posBatalla === CeldaBatalla.Estado.POS_BATALLA_ATAQUE)
                this.nAtaquesDisponibles++;
            this.zonaBatalla[idCartaZB].agregarCarta(carta, posBatalla)
            this.nCartasEnZB++;
            //console.log("Carta Colocada!!");
        }
        return respuesta;
    }

    /**
     * @param {Jugador} jugadorAtacado
     * @returns {boolean}
     */
    puedeAtacarBarreras(jugadorAtacado) {
        if (this.nCartasEnZB === 0)
            return 'Sin cartas en zona de batalla';
        if (jugadorAtacado.nCartasEnZB > 0)
            return 'Hay cartas en zona de batalla enemiga';
        if (this.nAtaquesDisponibles === 0)
            return 'No le quedan ataques disponibles';
        if (this.nTurnos === 1)
            return 'En primer turno no se puede atacar';
        return 'Posible';
    }
    /**
     * @param {Jugador} jugadorAtacado 
     * @param {number} idCartaAtacante 
     * @returns {boolean}
     */
    posibilidadAtacarBarrera(jugadorAtacado, idCartaAtacante) {
        let resp = this.puedeAtacarBarreras(jugadorAtacado)
        if (resp !== 'Posible')
            return resp;
        if (this.zonaBatalla[idCartaAtacante].carta === null)
            return 'No hay carta en tu ubicación de zona de batalla';
        if (this.zonaBatalla[idCartaAtacante].posBatalla !== CeldaBatalla.Estado.POS_BATALLA_ATAQUE)
            return 'Carta atacante no está en posición de ataque';
        if (this.zonaBatalla[idCartaAtacante].dispAtaque === CeldaBatalla.Estado.ATAQUE_NO_DISPONIBLE)
            return 'Carta atacante no tiene ataque disponible';
        return 'Posible';
    }

    /**
     * 
     * @param {number} idCartaAtacante 
     */
    ataqueRealizado(idCartaAtacante) {
        this.nAtaquesDisponibles--;
        this.zonaBatalla[idCartaAtacante].ataqueRealizado()
    }

    /**
     * @param {Jugador} jugadorAtacado 
     * @param {number} idCartaAtacante
     * @returns {string}
     */
    accionAtacarBarrera(jugadorAtacado, idCartaAtacante) {
        let respuesta = this.posibilidadAtacarBarrera(jugadorAtacado, idCartaAtacante)
        if (respuesta === 'Posible') {
            jugadorAtacado.barrera.pop();
            this.ataqueRealizado(idCartaAtacante)
            if (jugadorAtacado.barrera.length > 0) {
                respuesta = VeredictoAtaque.BARRERA_DESTRUIDA;
                //console.log("Ataque Realizado!!");
                //console.log("Barrera Destruida");
            }
            else {
                respuesta = VeredictoAtaque.ENEMIGO_SIN_BARRERA;
                //console.log("Fin del Juego!!!\n");
                //console.log(jugadorAtacado.nombre + " se quedó sin barreras!!\n");
            }
        }
        return respuesta;
    }
    /**
     * @param {Jugador} jugadorAtacado
     * @returns {boolean}
     */
    puedeAtacarCartas(jugadorAtacado) {
        if (this.nCartasEnZB === 0)
            return 'Sin cartas en zona de batalla';
        if (jugadorAtacado.nCartasEnZB === 0)
            return 'No hay cartas en zona de batalla enemiga';
        if (this.nAtaquesDisponibles === 0)
            return 'No le quedan ataques disponibles';
        if (this.nTurnos === 1)
            return 'En primer turno no se puede atacar';
        if (jugadorAtacado.barrera.length === 0)
            return 'Jugador enemigo debe tener barreras';
        return 'Posible';
    }
    /**
     * @param {Jugador} jugadorAtacado 
     * @param {number} idCartaAtacada 
     * @param {number} idCartaAtacante
     * @returns {boolean}
     */
    posibilidadAtacarCarta(jugadorAtacado, idCartaAtacada, idCartaAtacante) {
        let resp = this.puedeAtacarCartas(jugadorAtacado)
        if (resp !== 'Posible')
            return resp;
        if (this.zonaBatalla[idCartaAtacante].carta === null)
            return 'No hay carta en tu ubicación de zona de batalla';
        if (jugadorAtacado.zonaBatalla[idCartaAtacada].carta === null)
            return 'No hay carta en ubicación de zona de batalla enemiga';
        if (this.zonaBatalla[idCartaAtacante].posBatalla !== CeldaBatalla.Estado.POS_BATALLA_ATAQUE)
            return 'Carta atacante no está en posición de ataque';
        if (this.zonaBatalla[idCartaAtacante].dispAtaque === CeldaBatalla.Estado.ATAQUE_NO_DISPONIBLE)
            return 'Carta atacante no tiene ataque disponible';
        return 'Posible';
    }

    /**
     * 
     * @param {Carta} cartaAtacante 
     * @param {Carta} cartaAtacada
     * @returns {{number,number}}
     */
    calculoValorAtaque(cartaAtacante, cartaAtacada){
        let calculoVAtacante = cartaAtacante.valor, calculoVAtacada = cartaAtacada.valor

        switch (cartaAtacante.elemento + ' ' + cartaAtacada.elemento) {
            case Carta.Elemento.ESPADA + ' ' + Carta.Elemento.TREBOL: calculoVAtacada += 6; break;
            case Carta.Elemento.TREBOL + ' ' + Carta.Elemento.ESPADA: calculoVAtacante += 6; break;
            case Carta.Elemento.ESPADA + ' ' + Carta.Elemento.CORAZON: calculoVAtacante += 2; break;
            case Carta.Elemento.CORAZON + ' ' + Carta.Elemento.ESPADA: calculoVAtacada += 2; break;
            case Carta.Elemento.COCO + ' ' + Carta.Elemento.TREBOL: calculoVAtacante += 4; break;
            case Carta.Elemento.TREBOL + ' ' + Carta.Elemento.COCO: calculoVAtacada += 4; break;
            case Carta.Elemento.ESPADA + ' ' + Carta.Elemento.COCO: calculoVAtacante += 4; break;
            case Carta.Elemento.COCO + ' ' + Carta.Elemento.ESPADA: calculoVAtacada += 4; break;
            case Carta.Elemento.CORAZON + ' ' + Carta.Elemento.TREBOL: calculoVAtacante += 2; break;
            case Carta.Elemento.TREBOL + ' ' + Carta.Elemento.CORAZON: calculoVAtacada += 2; break;
        }
        return {calculoVAtacante,calculoVAtacada}
    }

    /**
     * 
     * @param {Carta} cartaAtacante 
     * @param {Carta} cartaAtacada
     * @returns {VeredictoAtaque} VeredictoAtaque
     */
    obtenerVeredictoAtaque(cartaAtacante, cartaAtacada) {
        let {calculoVAtacante,calculoVAtacada} = this.calculoValorAtaque(cartaAtacante, cartaAtacada)

        if (calculoVAtacante > calculoVAtacada) {
            return VeredictoAtaque.GANA_ATACANTE;//gana
        }
        else if (calculoVAtacante < calculoVAtacada) {
            return VeredictoAtaque.PIERDE_ATACANTE;//pierde
        }
        else {
            return VeredictoAtaque.EMPATE;//empata
        }
    }

    /**
     * @param {Jugador} jugadorAtacado 
     * @param {number} idCartaAtacada 
     * @param {number} idCartaAtacante
     * @returns {ResultadoAtaque}
     */
    accionAtacarCarta(jugadorAtacado, idCartaAtacada, idCartaAtacante) {//Sistema de produccion
        let rsAtaque = {}
        rsAtaque.veredicto = this.posibilidadAtacarCarta(jugadorAtacado, idCartaAtacada, idCartaAtacante)
        if (rsAtaque.veredicto === 'Posible') {
            let posicionCartaAtacada
            rsAtaque.cartaAtacante = this.zonaBatalla[idCartaAtacante].carta
            rsAtaque.cartaAtacada =  jugadorAtacado.zonaBatalla[idCartaAtacada].carta

            //Obtener veredicto
            rsAtaque.veredicto = this.obtenerVeredictoAtaque(this.zonaBatalla[idCartaAtacante].carta, jugadorAtacado.zonaBatalla[idCartaAtacada].carta)

            //Setear resultados

            //Jugador Atacado en defensa cara abajo, se coloca cara arriba.
            if (jugadorAtacado.zonaBatalla[idCartaAtacada].posBatalla === CeldaBatalla.Estado.POS_BATALLA_DEF_ABAJO) {
                jugadorAtacado.zonaBatalla[idCartaAtacada].posBatalla = CeldaBatalla.Estado.POS_BATALLA_DEF_ARRIBA;
            }
            posicionCartaAtacada = jugadorAtacado.zonaBatalla[idCartaAtacada].posBatalla
            //Jugador Atacado al Ataque
            if (posicionCartaAtacada === CeldaBatalla.Estado.POS_BATALLA_ATAQUE) {
                if (rsAtaque.veredicto === VeredictoAtaque.GANA_ATACANTE) {//gana atacante
                    jugadorAtacado.zonaBatalla[idCartaAtacada].quitarCarta();
                    jugadorAtacado.barrera.pop();
                    jugadorAtacado.nCartasEnZB--;
                    rsAtaque.estadoCartaAtacante = EstadoCarta.ACTIVA;
                    rsAtaque.estadoCartaAtacada = EstadoCarta.DESTRUIDA;
                    rsAtaque.estadoBarrera = EstadoCarta.DESTRUIDA;
                }
                else if (rsAtaque.veredicto === VeredictoAtaque.PIERDE_ATACANTE) {//pierde atacante
                    this.zonaBatalla[idCartaAtacante].quitarCarta();
                    rsAtaque.estadoCartaAtacante = EstadoCarta.DESTRUIDA;
                    rsAtaque.estadoCartaAtacada = EstadoCarta.ACTIVA;
                    rsAtaque.estadoBarrera = EstadoCarta.ACTIVA;
                    this.nCartasEnZB--;
                }
                else {//Empate
                    jugadorAtacado.zonaBatalla[idCartaAtacada].quitarCarta();
                    this.zonaBatalla[idCartaAtacante].quitarCarta();
                    rsAtaque.estadoCartaAtacante = EstadoCarta.DESTRUIDA;
                    rsAtaque.estadoCartaAtacada = EstadoCarta.DESTRUIDA;
                    rsAtaque.estadoBarrera = EstadoCarta.ACTIVA;
                    jugadorAtacado.nCartasEnZB--;
                    this.nCartasEnZB--;
                }
            }
            else if (posicionCartaAtacada === CeldaBatalla.Estado.POS_BATALLA_DEF_ARRIBA) {//Jugador Atacado a la Defensa
                if (rsAtaque.veredicto === VeredictoAtaque.GANA_ATACANTE) {//gana atacante
                    jugadorAtacado.zonaBatalla[idCartaAtacada].quitarCarta();
                    rsAtaque.estadoCartaAtacante = EstadoCarta.ACTIVA;
                    rsAtaque.estadoCartaAtacada = EstadoCarta.DESTRUIDA;
                    rsAtaque.estadoBarrera = EstadoCarta.ACTIVA;
                    jugadorAtacado.nCartasEnZB--;
                }
                else if (rsAtaque.veredicto === VeredictoAtaque.PIERDE_ATACANTE) {//pierde atacante
                    this.zonaBatalla[idCartaAtacada].quitarCarta();
                    rsAtaque.estadoCartaAtacante = EstadoCarta.DESTRUIDA;
                    rsAtaque.estadoCartaAtacada = EstadoCarta.ACTIVA;
                    rsAtaque.estadoBarrera = EstadoCarta.ACTIVA;
                    this.nCartasEnZB--;
                }
                else {//Empate
                    rsAtaque.estadoCartaAtacante = EstadoCarta.ACTIVA;
                    rsAtaque.estadoCartaAtacada = EstadoCarta.ACTIVA;
                    rsAtaque.estadoBarrera = EstadoCarta.ACTIVA;
                }
            }

            this.nAtaquesDisponibles--;
            this.zonaBatalla[idCartaAtacante].ataqueRealizado()
            //console.log(ataqueCartaRealizadoDialogo(rsAtaque));
        }
        return rsAtaque;
    }
    /**
     * @returns {boolean}
     */
    puedeCambiarPosicion() {
        if (this.nCartasEnZB === 0)
            return 'Sin cartas en zona de batalla';
        if (this.nCambiosPosicionesDisponibles === 0)
            return 'Sin cambios de posición disponibles';
        return 'Posible';
    }
    /**
     * @param {number} idCarta
     * @returns {boolean}
     */
    posibilidadCambiarPosicionBatallaEnCarta(idCarta) {
        let resp = this.puedeCambiarPosicion()
        if (resp !== 'Posible')
            return resp;
        if (this.zonaBatalla[idCarta].carta === null)
            return 'No hay carta en posición de batalla indicada';
        if (this.zonaBatalla[idCarta].dispCambio === CeldaBatalla.Estado.CAMBIO_POS_NO_DISPONIBLE)
            return 'Carta indicada no tiene disponible el cambio de posición';
        return 'Posible';
    }

    /**
     * @param {number} idCarta
     * @returns {boolean}
     */
    cambiarPosicionBatalla(idCarta) {
        let respuesta = this.posibilidadCambiarPosicionBatallaEnCarta(idCarta)
        if (respuesta === 'Posible') {
            if (this.zonaBatalla[idCarta].posBatalla === CeldaBatalla.Estado.POS_BATALLA_DEF_ARRIBA ||
                this.zonaBatalla[idCarta].posBatalla == CeldaBatalla.Estado.POS_BATALLA_DEF_ABAJO) {
                this.zonaBatalla[idCarta].posBatalla = CeldaBatalla.Estado.POS_BATALLA_ATAQUE;
                this.zonaBatalla[idCarta].dispAtaque = CeldaBatalla.Estado.ATAQUE_DISPONIBLE;
            }
            else{
                this.zonaBatalla[idCarta].posBatalla = CeldaBatalla.Estado.POS_BATALLA_DEF_ARRIBA;
                this.zonaBatalla[idCarta].dispAtaque = CeldaBatalla.Estado.ATAQUE_NO_DISPONIBLE;
            }
            this.zonaBatalla[idCarta].dispCambio = CeldaBatalla.Estado.CAMBIO_POS_NO_DISPONIBLE;
            this.nCambiosPosicionesDisponibles--;
            respuesta = 'Posible';
            //logger.debug("Cambio de Posición Realizado!!\n");
        }
        return respuesta;
    }

    repartirCartas() {
        //console.log("repartirCartas");
        //console.log("Jugador: " + this.nombre);
        let cartasElegidas = [];
        let n, m, cartasRepartidas;

        for (let i = 0; i < Carta.NUMERO_ELEMENTOS_CARTAS; i++) {
            cartasElegidas.push([]);
            for (let j = 0; j < Carta.MAX_VALOR_CARTA; j++) {
                cartasElegidas[i][j] = false;
            }
        }

        cartasRepartidas = 0;

        while (cartasRepartidas < Jugador.MAX_DECK) {
            n = Math.floor(Math.random() * Carta.NUMERO_ELEMENTOS_CARTAS);
            m = Math.floor(Math.random() * Carta.MAX_VALOR_CARTA);

            if (!cartasElegidas[n][m]) {
                cartasElegidas[n][m] = true;

                cartasRepartidas++;
                let c = new Carta(m + 1, Object.values(Carta.Elemento)[n]);
                if (this.barrera.length < Jugador.MAX_BARRERA_CARDS) {
                    this.barrera.push(c);
                    //console.log("Barrera: " + c.valor + " " + c.elemento);
                }
                else if (this.mano.length < Jugador.MAX_MANO_CARDS) {
                    this.mano.push(c);
                    //console.log("Mano: " + c.valor + " " + c.elemento);
                }
                else {
                    this.deck.push(c);
                    //console.log("Deck: " + c.valor + " " + c.elemento);
                }

            }
        }
    }

    //TODO: separar funcionalidades zonabatalla en una clase zonabatalla que herede de la clase Array
}

module.exports = Jugador