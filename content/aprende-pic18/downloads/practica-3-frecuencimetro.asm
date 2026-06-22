;==============================================================================
; PRACTICA 3 - FRECUENCIMETRO CON DISPLAYS 7 SEGMENTOS MULTIPLEXADOS
; Microcontrolador: PIC18F4550
; Oscilador: 20 MHz HS
; Curso: Microcontroladores - Ing. Mecatronica - UNEXPO
; Prof.: Ing. Yoel Pire
;
; Hardware segun diagrama de la practica:
;   Entrada de frecuencia: RA4/T0CKI
;   74LS48 BCD:
;       RD0 -> A
;       RD1 -> B
;       RD2 -> C
;       RD3 -> D
;   Seleccion de displays:
;       RD5 -> Q1 -> Unidades
;       RD6 -> Q2 -> Decenas
;       RD7 -> Q3 -> Centenas
;
; Funcionamiento:
;   Timer0 cuenta pulsos externos por RA4/T0CKI.
;   Timer1 genera interrupciones cada 50 ms.
;   20 interrupciones de Timer1 forman una ventana de medicion de 1 segundo.
;   Frecuencia = pulsos contados / 1 s.
;   Se muestra el resultado en tres displays: 000 a 999 Hz.
;   Si la frecuencia supera 999 Hz, se muestra 999.
;
; Estructura sandwich:
;   Vectores -> Programa principal -> Subrutinas -> Rutinas de interrupcion
;
; Alumno: _________________________
; Seccion: ______
; Fecha: __________
;==============================================================================

        LIST    P=18F4550
        #include <P18F4550.INC>

;==============================================================================
; CONFIGURACION
;==============================================================================

        CONFIG  FOSC = HS
        CONFIG  PWRT = ON
        CONFIG  BOR = OFF
        CONFIG  WDT = OFF
        CONFIG  MCLRE = ON
        CONFIG  PBADEN = OFF
        CONFIG  LVP = OFF
        CONFIG  XINST = OFF

;==============================================================================
; CONSTANTES
;==============================================================================

TMR1H_CARGA    EQU     0x85        ; Preload Timer1 para 50 ms
TMR1L_CARGA    EQU     0xEE        ; 0x85EE

MASK_UNIDAD    EQU     B'00100000' ; RD5 -> Q1
MASK_DECENA    EQU     B'01000000' ; RD6 -> Q2
MASK_CENTENA   EQU     B'10000000' ; RD7 -> Q3

;==============================================================================
; VARIABLES
;==============================================================================

        CBLOCK  0x20
            W_TEMP
            STATUS_TEMP
            BSR_TEMP

            FLAG_1S
            CNT_50MS

            CNTL
            CNTH

            TEMPL
            TEMPH

            UNIDADES
            DECENAS
            CENTENAS

            DLY1
            DLY2
        ENDC

;==============================================================================
; VECTORES
;==============================================================================

        ORG     0x0000
        GOTO    INICIO

        ORG     0x0008
        GOTO    ISR_TMR1

        ORG     0x0018
        RETFIE

;==============================================================================
; PROGRAMA PRINCIPAL
;==============================================================================

INICIO
        MOVLW   0x0F
        MOVWF   ADCON1              ; Todos los pines analogicos como digitales

        CLRF    LATA
        CLRF    LATD
        CLRF    LATE

        MOVLW   B'00110000'
        MOVWF   TRISA               ; RA4/T0CKI como entrada

        CLRF    TRISD               ; Puerto D completo como salida

        CLRF    FLAG_1S
        CLRF    CNTL
        CLRF    CNTH

        CLRF    UNIDADES
        CLRF    DECENAS
        CLRF    CENTENAS

        MOVLW   .20
        MOVWF   CNT_50MS            ; 20 x 50 ms = 1 segundo

        MOVLW   B'00101000'
        MOVWF   T0CON

        CLRF    TMR0H
        CLRF    TMR0L

        BSF     T0CON,7             ; Encender Timer0

        MOVLW   B'10110000'
        MOVWF   T1CON               ; Timer1 apagado, 16 bits, prescaler 1:8

        CALL    CARGAR_TIMER1

        BCF     PIR1,0              ; Limpiar bandera TMR1IF
        BSF     PIE1,0              ; Habilitar interrupcion Timer1

        BCF     RCON,7              ; Desactivar prioridades de interrupcion
        BSF     INTCON,6            ; PEIE = 1
        BSF     INTCON,7            ; GIE = 1

        BSF     T1CON,0             ; Encender Timer1

BUCLE_PRINCIPAL
        CALL    MOSTRAR_DISPLAY

        BTFSS   FLAG_1S,0
        GOTO    BUCLE_PRINCIPAL

        BCF     FLAG_1S,0
        CALL    BIN_BCD_3

        GOTO    BUCLE_PRINCIPAL

;==============================================================================
; SUBRUTINAS
;==============================================================================

CARGAR_TIMER1
        MOVLW   TMR1H_CARGA
        MOVWF   TMR1H

        MOVLW   TMR1L_CARGA
        MOVWF   TMR1L

        RETURN

BIN_BCD_3
        MOVF    CNTH,W
        SUBLW   0x03
        BTFSS   STATUS,C
        GOTO    SATURAR_999         ; Si CNTH > 3

        MOVF    CNTH,W
        XORLW   0x03
        BTFSS   STATUS,Z
        GOTO    CONVERTIR_VALOR     ; Si CNTH < 3

        MOVF    CNTL,W
        SUBLW   0xE7
        BTFSS   STATUS,C
        GOTO    SATURAR_999         ; Si CNT > 999

CONVERTIR_VALOR
        MOVF    CNTL,W
        MOVWF   TEMPL

        MOVF    CNTH,W
        MOVWF   TEMPH

        CLRF    CENTENAS
        CLRF    DECENAS
        CLRF    UNIDADES

CONV_CENTENAS
        MOVF    TEMPH,F
        BTFSS   STATUS,Z
        GOTO    RESTAR_100

        MOVLW   .100
        SUBWF   TEMPL,W
        BTFSS   STATUS,C
        GOTO    CONV_DECENAS

RESTAR_100
        MOVLW   .100
        SUBWF   TEMPL,F
        BTFSS   STATUS,C
        DECF    TEMPH,F

        INCF    CENTENAS,F
        GOTO    CONV_CENTENAS

CONV_DECENAS
        MOVLW   .10
        SUBWF   TEMPL,W
        BTFSS   STATUS,C
        GOTO    CARGAR_UNIDADES

        MOVLW   .10
        SUBWF   TEMPL,F

        INCF    DECENAS,F
        GOTO    CONV_DECENAS

CARGAR_UNIDADES
        MOVF    TEMPL,W
        MOVWF   UNIDADES
        RETURN

SATURAR_999
        MOVLW   .9
        MOVWF   CENTENAS
        MOVWF   DECENAS
        MOVWF   UNIDADES
        RETURN

MOSTRAR_DISPLAY
        CALL    MOSTRAR_CENTENA
        CALL    RETARDO_MUX
        CALL    APAGAR_DISPLAY

        CALL    MOSTRAR_DECENA
        CALL    RETARDO_MUX
        CALL    APAGAR_DISPLAY

        CALL    MOSTRAR_UNIDAD
        CALL    RETARDO_MUX
        CALL    APAGAR_DISPLAY

        RETURN

MOSTRAR_CENTENA
        CLRF    LATD
        MOVF    CENTENAS,W
        ANDLW   0x0F
        IORLW   MASK_CENTENA
        MOVWF   LATD
        RETURN

MOSTRAR_DECENA
        CLRF    LATD
        MOVF    DECENAS,W
        ANDLW   0x0F
        IORLW   MASK_DECENA
        MOVWF   LATD
        RETURN

MOSTRAR_UNIDAD
        CLRF    LATD
        MOVF    UNIDADES,W
        ANDLW   0x0F
        IORLW   MASK_UNIDAD
        MOVWF   LATD
        RETURN

APAGAR_DISPLAY
        CLRF    LATD
        RETURN

RETARDO_MUX
        MOVLW   .8
        MOVWF   DLY1

RMUX_1
        MOVLW   .250
        MOVWF   DLY2

RMUX_2
        DECFSZ  DLY2,F
        GOTO    RMUX_2

        DECFSZ  DLY1,F
        GOTO    RMUX_1

        RETURN

;==============================================================================
; RUTINAS DE INTERRUPCION
;==============================================================================

ISR_TMR1
        MOVFF   WREG,W_TEMP
        MOVFF   STATUS,STATUS_TEMP
        MOVFF   BSR,BSR_TEMP

        BTFSS   PIR1,0
        GOTO    SALIR_ISR

        BCF     PIR1,0
        CALL    CARGAR_TIMER1

        DECFSZ  CNT_50MS,F
        GOTO    SALIR_ISR

        MOVLW   .20
        MOVWF   CNT_50MS

        BCF     T0CON,7             ; Detener Timer0 para capturar el conteo

        MOVF    TMR0L,W
        MOVWF   CNTL

        MOVF    TMR0H,W
        MOVWF   CNTH

        CLRF    TMR0H
        CLRF    TMR0L

        BSF     T0CON,7             ; Reiniciar conteo de pulsos

        BSF     FLAG_1S,0           ; Avisar al programa principal

SALIR_ISR
        MOVFF   BSR_TEMP,BSR
        MOVFF   STATUS_TEMP,STATUS
        MOVFF   W_TEMP,WREG
        RETFIE

        END
