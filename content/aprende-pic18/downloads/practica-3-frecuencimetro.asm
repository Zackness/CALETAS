;==============================================================================
; PRACTICA 3 — Frecuencimetro con displays 7 segmentos multiplexados
; Microcontrolador: PIC18F4550
; Curso: Microcontroladores — Ing. Mecatronica — UNEXPO
; Prof.: Ing. Yoel Pire
;
; Hardware (referencia segun diagrama UNEXPO):
;   Entrada de frecuencia -> RA4/T0CKI (Timer0 contador)
;   BCD al 74LS48        -> RD0-RD3
;   Seleccion de digito  -> RE0-RE3 (transistores)
;
; Medicion: ventana de 1 s (retardo calibrado), f = pulsos contados.
; Refresco multiplexado en bucle principal (4 digitos).
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
            dig0
            dig1
            dig2
            dig3
            digito_act
            tmr0h_snap
            tmr0l_snap
            dly
            tmp
        endc

        ORG     0x0000
        GOTO    inicio

;==============================================================================
inicio:
        MOVLW   0x0F
        MOVWF   ADCON1

        CLRF    LATE
        CLRF    LATD
        CLRF    TRISD
        CLRF    TRISE

        ; Timer0 contador externo en T0CKI (RA4)
        MOVLW   B'00111000'        ; T0CS=1 contador, 16-bit, TMR0ON
        MOVWF   T0CON
        CLRF    TMR0H
        CLRF    TMR0L

        CLRF    dig0
        CLRF    dig1
        CLRF    dig2
        CLRF    dig3

bucle:
        CALL    medir_frecuencia
        CALL    bin_a_bcd4
display_loop:
        CLRF    digito_act
        CALL    mostrar_digito
        CALL    retardo_corto
        INCF    digito_act, F
        MOVF    digito_act, W
        SUBLW   3
        BTFSS   STATUS, C
        GOTO    display_loop
        GOTO    bucle

;==============================================================================
medir_frecuencia:
        CLRF    TMR0H
        CLRF    TMR0L
        CALL    ventana_1s
        MOVF    TMR0H, W
        MOVWF   tmr0h_snap
        MOVF    TMR0L, W
        MOVWF   tmr0l_snap
        RETURN

ventana_1s:
        ; Calibrar en Proteus/placa (cristal 20 MHz HS)
        MOVLW   0x08
        MOVWF   dly
v1:
        MOVLW   0xFF
        MOVWF   tmp
v2:
        DECFSZ  tmp, F
        GOTO    v2
        DECFSZ  dly, F
        GOTO    v1
        RETURN

;==============================================================================
; Convierte valor 16-bit en tmr0l_snap/h a 4 digitos BCD en dig0..dig3
;==============================================================================
bin_a_bcd4:
        MOVF    tmr0l_snap, W
        MOVWF   dig0
        MOVF    tmr0h_snap, W
        MOVWF   dig1
        CLRF    dig2
        CLRF    dig3
        ; Rutina completa: dividir por 10 sucesivamente (simplificado en plantilla)
        RETURN

;==============================================================================
mostrar_digito:
        MOVF    digito_act, W
        ADDLW   dig0
        MOVWF   FSR0L
        MOVLW   HIGH(dig0)
        MOVWF   FSR0H
        MOVF    INDF0, W
        ANDLW   0x0F
        MOVWF   LATD
        MOVLW   0x0F
        MOVWF   LATE
        MOVF    digito_act, W
        INCF    digito_act, W
        DECF    digito_act, F
        ; seleccionar RE0..RE3 segun digito_act
        BTFSC   digito_act, 0
        BSF     LATE, 0
        BTFSC   digito_act, 1
        BSF     LATE, 1
        RETURN

retardo_corto:
        MOVLW   0x20
        MOVWF   dly
rc:
        DECFSZ  dly, F
        GOTO    rc
        RETURN

        END
