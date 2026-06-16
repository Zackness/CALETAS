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
; Alumno: _________________________  Seccion: ______  Fecha: __________
;==============================================================================

        LIST    P=18F4550
        #include <P18F4550.INC>

        CONFIG  FOSC = HS
        CONFIG  WDT  = OFF
        CONFIG  LVP  = OFF
        CONFIG  PBADEN = OFF

        cblock 0x20
            dato_rx
        endc

        ORG     0x0000
        GOTO    inicio

;==============================================================================
inicio:
        MOVLW   0x0F
        MOVWF   ADCON1

        BSF     TRISC, 7            ; RX entrada
        BCF     TRISC, 6            ; TX salida

        CALL    uart_init
        CALL    enviar_saludo

bucle:
        BTFSS   PIR1, RCIF
        GOTO    bucle
        MOVFF   RCREG, dato_rx
        MOVF    dato_rx, W
        CALL    uart_tx
        GOTO    bucle

;==============================================================================
uart_init:
        BCF     TXSTA, SYNC
        BSF     TXSTA, BRGH
        MOVLW   D'129'
        MOVWF   SPBRG
        BSF     RCSTA, SPEN
        BSF     TXSTA, TXEN
        BSF     RCSTA, CREN
        RETURN

uart_tx:
        BTFSS   PIR1, TXIF
        GOTO    uart_tx
        MOVWF   TXREG
        RETURN

enviar_saludo:
        MOVLW   'P'
        CALL    uart_tx
        MOVLW   'I'
        CALL    uart_tx
        MOVLW   'C'
        CALL    uart_tx
        MOVLW   '1'
        CALL    uart_tx
        MOVLW   '8'
        CALL    uart_tx
        MOVLW   ' '
        CALL    uart_tx
        MOVLW   'U'
        CALL    uart_tx
        MOVLW   'A'
        CALL    uart_tx
        MOVLW   'R'
        CALL    uart_tx
        MOVLW   'T'
        CALL    uart_tx
        MOVLW   0x0D
        CALL    uart_tx
        MOVLW   0x0A
        CALL    uart_tx
        RETURN

        END
