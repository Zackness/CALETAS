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
; Alumno: _________________________  Seccion: ______  Fecha: __________
;==============================================================================

        LIST    P=18F4550
        #include <P18F4550.INC>

        CONFIG  FOSC = HS
        CONFIG  WDT  = OFF
        CONFIG  LVP  = OFF
        CONFIG  PBADEN = OFF

        cblock 0x20
            fase
            sentido
            btn0_prev
            dly
        endc

        ORG     0x0000
        GOTO    inicio

secuencia:
        DB      0x01, 0x02, 0x04, 0x08

;==============================================================================
inicio:
        MOVLW   0x0F
        MOVWF   ADCON1

        CLRF    LATC
        CLRF    fase
        CLRF    sentido
        BSF     btn0_prev, 0

        CLRF    TRISC
        BSF     TRISA, 0

bucle:
        CALL    revisar_sentido
        CALL    avanzar_fase
        CALL    aplicar_fase
        CALL    retardo_paso
        GOTO    bucle

;==============================================================================
aplicar_fase:
        MOVF    fase, W
        ADDLW   secuencia
        MOVWF   TBLPTRL
        MOVLW   HIGH(secuencia)
        MOVWF   TBLPTRH
        MOVLW   UPPER(secuencia)
        MOVWF   TBLPTRU
        TBLRD   *
        MOVF    TABLAT, W
        MOVWF   LATC
        RETURN

avanzar_fase:
        BTFSC   sentido, 0
        GOTO    retroceder
        INCF    fase, F
        MOVF    fase, W
        ANDLW   0x03
        MOVWF   fase
        RETURN
retroceder:
        DECF    fase, F
        MOVF    fase, W
        ANDLW   0x03
        MOVWF   fase
        RETURN

;==============================================================================
revisar_sentido:
        BTFSC   PORTA, 0
        GOTO    ra0_up
        BTFSC   btn0_prev, 0
        RETURN
        BCF     btn0_prev, 0
        MOVF    sentido, W
        XORLW   0x01
        MOVWF   sentido
        RETURN
ra0_up:
        BSF     btn0_prev, 0
        RETURN

retardo_paso:
        MOVLW   0x30
        MOVWF   dly
rp:
        DECFSZ  dly, F
        GOTO    rp
        RETURN

        END
