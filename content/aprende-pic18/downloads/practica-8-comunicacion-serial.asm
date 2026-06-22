;==============================================================================
; PRACTICA 8 — Comunicacion serial EUSART
; Microcontrolador: PIC18F4550
; Curso: Microcontroladores — Ing. Mecatronica — UNEXPO
; Prof.: Ing. Yoel Pire
;
; Hardware:
;   TX -> RC6, RX -> RC7 (MAX232 hacia PC)
;   Baudios: 9600 @ 20 MHz (SPBRG = 129, BRGH = 1 segun Tema 10)
;
; Envia mensaje de bienvenida y hace eco de bytes recibidos.
;
; Estructura sandwich:
;   Vectores -> Programa principal -> Subrutinas -> Fin
;
; Alumno: _________________________  Seccion: ______  Fecha: __________
;==============================================================================

        LIST    P=18F4550
        #include <P18F4550.INC>

;==============================================================================
; CONFIGURACION
;==============================================================================

        CONFIG  FOSC = HS
        CONFIG  WDT  = OFF
        CONFIG  LVP  = OFF
        CONFIG  PBADEN = OFF

;==============================================================================
; VARIABLES
;==============================================================================

        CBLOCK  0x20
            dato_rx
        ENDC

;==============================================================================
; VECTORES
;==============================================================================

        ORG     0x0000
        GOTO    INICIO

        ORG     0x0008
        GOTO    ISR_VACIA

        ORG     0x0018
        RETFIE

;==============================================================================
; PROGRAMA PRINCIPAL
;==============================================================================

INICIO
        MOVLW   0x0F
        MOVWF   ADCON1

        BSF     TRISC, 7            ; RX entrada
        BCF     TRISC, 6            ; TX salida

        CALL    UART_INIT
        CALL    ENVIAR_SALUDO

BUCLE_PRINCIPAL
        BTFSS   PIR1, RCIF
        GOTO    BUCLE_PRINCIPAL
        MOVFF   RCREG, dato_rx
        MOVF    dato_rx, W
        CALL    UART_TX
        GOTO    BUCLE_PRINCIPAL

;==============================================================================
; SUBRUTINAS
;==============================================================================

UART_INIT
        BCF     TXSTA, SYNC
        BSF     TXSTA, BRGH
        MOVLW   D'129'
        MOVWF   SPBRG
        BSF     RCSTA, SPEN
        BSF     TXSTA, TXEN
        BSF     RCSTA, CREN
        RETURN

UART_TX
        BTFSS   PIR1, TXIF
        GOTO    UART_TX
        MOVWF   TXREG
        RETURN

ENVIAR_SALUDO
        MOVLW   'P'
        CALL    UART_TX
        MOVLW   'I'
        CALL    UART_TX
        MOVLW   'C'
        CALL    UART_TX
        MOVLW   '1'
        CALL    UART_TX
        MOVLW   '8'
        CALL    UART_TX
        MOVLW   ' '
        CALL    UART_TX
        MOVLW   'U'
        CALL    UART_TX
        MOVLW   'A'
        CALL    UART_TX
        MOVLW   'R'
        CALL    UART_TX
        MOVLW   'T'
        CALL    UART_TX
        MOVLW   0x0D
        CALL    UART_TX
        MOVLW   0x0A
        CALL    UART_TX
        RETURN

;==============================================================================
; RUTINAS DE INTERRUPCION
;==============================================================================

ISR_VACIA
        RETFIE

        END
