;==============================================================================
; PRACTICA 6 — Motor paso a paso (secuencia full-step)
; Microcontrolador: PIC18F4550
; Curso: Microcontroladores — Ing. Mecatronica — UNEXPO
; Prof.: Ing. Yoel Pire
;
; Hardware:
;   Bobinas via ULN2003 -> RC0-RC3
;   Pulsador sentido     -> RA0
;
; Secuencia unipolar full-step: 0x01, 0x02, 0x04, 0x08
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
            fase
            sentido
            btn0_prev
            dly
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

SECUENCIA
        DB      0x01, 0x02, 0x04, 0x08

;==============================================================================
; PROGRAMA PRINCIPAL
;==============================================================================

INICIO
        MOVLW   0x0F
        MOVWF   ADCON1

        CLRF    LATC
        CLRF    fase
        CLRF    sentido
        BSF     btn0_prev, 0

        CLRF    TRISC
        BSF     TRISA, 0

BUCLE_PRINCIPAL
        CALL    REVISAR_SENTIDO
        CALL    AVANZAR_FASE
        CALL    APLICAR_FASE
        CALL    RETARDO_PASO
        GOTO    BUCLE_PRINCIPAL

;==============================================================================
; SUBRUTINAS
;==============================================================================

APLICAR_FASE
        MOVF    fase, W
        ADDLW   SECUENCIA
        MOVWF   TBLPTRL
        MOVLW   HIGH(SECUENCIA)
        MOVWF   TBLPTRH
        MOVLW   UPPER(SECUENCIA)
        MOVWF   TBLPTRU
        TBLRD   *
        MOVF    TABLAT, W
        MOVWF   LATC
        RETURN

AVANZAR_FASE
        BTFSC   sentido, 0
        GOTO    RETROCEDER
        INCF    fase, F
        MOVF    fase, W
        ANDLW   0x03
        MOVWF   fase
        RETURN
RETROCEDER
        DECF    fase, F
        MOVF    fase, W
        ANDLW   0x03
        MOVWF   fase
        RETURN

REVISAR_SENTIDO
        BTFSC   PORTA, 0
        GOTO    RA0_UP
        BTFSC   btn0_prev, 0
        RETURN
        BCF     btn0_prev, 0
        MOVF    sentido, W
        XORLW   0x01
        MOVWF   sentido
        RETURN
RA0_UP
        BSF     btn0_prev, 0
        RETURN

RETARDO_PASO
        MOVLW   0x30
        MOVWF   dly
RP
        DECFSZ  dly, F
        GOTO    RP
        RETURN

;==============================================================================
; RUTINAS DE INTERRUPCION
;==============================================================================

ISR_VACIA
        RETFIE

        END
