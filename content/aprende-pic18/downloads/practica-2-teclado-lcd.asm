;==============================================================================
; PRACTICA 2 — Teclado matricial 4x4 y LCD 16x2 (HD44780, bus 4 bit)
; Microcontrolador: PIC18F4550
; Curso: Microcontroladores — Ing. Mecatronica — UNEXPO
; Prof.: Ing. Yoel Pire
;
; Hardware:
;   LCD D4-D7 -> RD4-RD7, RS -> RD2, E -> RD3
;   Teclado filas RB0-RB3, columnas RB4-RB7 (pull-up)
;
; Teclas:
;   1 2 3 A
;   4 5 6 B
;   7 8 9 C
;   * 0 # D
;
; Interrupciones:
;   Timer0 genera una interrupcion periodica (~20 ms).
;   La lectura y antirrebote del teclado se realizan en la ISR.
;   El programa principal solo actualiza el LCD cuando hay tecla nueva.
;
; Estructura sandwich:
;   Vectores -> Programa principal -> Subrutinas -> Rutinas de interrupcion
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
; CONSTANTES
;==============================================================================

TMR0H_CARGA    EQU     0xFE        ; Preload Timer0 para ~20 ms @ 20 MHz
TMR0L_CARGA    EQU     0x59        ; 65536 - 391 = 0xFE59

;==============================================================================
; VARIABLES
;==============================================================================

        CBLOCK  0x20
            W_TEMP
            STATUS_TEMP
            BSR_TEMP

            tecla
            tecla_ant
            cont_debounce
            tecla_pendiente
            tecla_activa
            nueva_tecla
            fila_idx
            col_idx
            lcd_tmp
            lcd_byte
            dly
        ENDC

;==============================================================================
; VECTORES
;==============================================================================

        ORG     0x0000
        GOTO    INICIO

        ORG     0x0008
        GOTO    ISR_TMR0

        ORG     0x0018
        RETFIE

; Tabla fila x columna (fila 0..3, col 0..3)
TABLA_TECLAS
        DB      '1','2','3','A'
        DB      '4','5','6','B'
        DB      '7','8','9','C'
        DB      '*','0','#','D'

;==============================================================================
; PROGRAMA PRINCIPAL
;==============================================================================

INICIO
        MOVLW   0x0F
        MOVWF   ADCON1

        CLRF    nueva_tecla
        CLRF    tecla
        CLRF    tecla_ant
        CLRF    cont_debounce
        CLRF    tecla_pendiente
        CLRF    tecla_activa
        CLRF    LATD

        MOVLW   0xF0
        MOVWF   TRISB             ; columnas entrada, filas salida
        MOVLW   0x0F
        MOVWF   LATB              ; filas inactivas en alto

        CLRF    TRISD

        BCF     INTCON2, RBPU     ; Habilitar pull-up interno en PORTB

        CALL    LCD_INIT

        MOVLW   0x80
        CALL    LCD_CMD
        MOVLW   'T'
        CALL    LCD_DAT
        MOVLW   'E'
        CALL    LCD_DAT
        MOVLW   'C'
        CALL    LCD_DAT
        MOVLW   'L'
        CALL    LCD_DAT
        MOVLW   'A'
        CALL    LCD_DAT
        MOVLW   ':'
        CALL    LCD_DAT

        ;----------------------------------------------------------------------
        ; Timer0 como temporizador interno de 8 bits con prescaler 1:256
        ; Fosc = 20 MHz -> Fcy = 5 MHz -> Tcy = 0,2 us
        ; Tick con prescaler 256 = 51,2 us
        ; Cuentas para 20 ms: 20000 / 51,2 = 391
        ; Timer0 16 bits, prescaler 1:256, tick = 51,2 us
        ; 20 ms / 51,2 us = 391
        ; Preload 16 bits: 65536 - 391 = 65145 = 0xFE59
        ;----------------------------------------------------------------------

        MOVLW   B'00000111'        ; Timer0 apagado, 16 bits, prescaler 1:256
        MOVWF   T0CON

        CALL    CARGAR_TIMER0

        BCF     INTCON, TMR0IF
        BSF     INTCON, TMR0IE

        BCF     RCON, IPEN          ; Sin prioridades (modo PIC16)
        BSF     INTCON, GIE

        BSF     T0CON, TMR0ON       ; Encender Timer0

BUCLE_PRINCIPAL
        BTFSS   nueva_tecla, 0
        GOTO    BUCLE_PRINCIPAL

        BCF     nueva_tecla, 0
        MOVF    tecla_pendiente, W
        CALL    LCD_DAT
        CLRF    tecla_pendiente
        GOTO    BUCLE_PRINCIPAL

;==============================================================================
; SUBRUTINAS
;==============================================================================

CARGAR_TIMER0
        MOVLW   TMR0H_CARGA
        MOVWF   TMR0H
        MOVLW   TMR0L_CARGA
        MOVWF   TMR0L
        RETURN

ESCANEAR_TECLADO
        CLRF    tecla
        CLRF    fila_idx
F_LOOP
        MOVF    fila_idx, W
        CALL    PONER_FILA
        CALL    RETARDO_CORTO
        CLRF    col_idx

        BTFSC   PORTB, 4
        GOTO    TRY_C1
        MOVLW   0
        GOTO    KEY_FOUND
TRY_C1
        BTFSC   PORTB, 5
        GOTO    TRY_C2
        MOVLW   1
        GOTO    KEY_FOUND
TRY_C2
        BTFSC   PORTB, 6
        GOTO    TRY_C3
        MOVLW   2
        GOTO    KEY_FOUND
TRY_C3
        BTFSC   PORTB, 7
        GOTO    C_NEXT
        MOVLW   3
        GOTO    KEY_FOUND

KEY_FOUND
        MOVWF   col_idx
        MOVF    fila_idx, W
        MULLW   4
        MOVF    col_idx, W
        ADDWF   PRODL, W
        ADDLW   TABLA_TECLAS
        MOVWF   TBLPTRL
        MOVLW   HIGH(TABLA_TECLAS)
        MOVWF   TBLPTRH
        MOVLW   UPPER(TABLA_TECLAS)
        MOVWF   TBLPTRU
        TBLRD   *
        MOVF    TABLAT, W
        MOVWF   tecla
        MOVLW   0x0F
        MOVWF   LATB              ; filas inactivas
        RETURN

C_NEXT
        INCF    fila_idx, F
        MOVF    fila_idx, W
        SUBLW   3
        BTFSS   STATUS, C
        GOTO    F_LOOP

        MOVLW   0x0F
        MOVWF   LATB              ; filas inactivas
        RETURN

PONER_FILA
        ADDLW   0
        BTFSC   STATUS, Z
        GOTO    RF0
        ADDLW   -1
        BTFSC   STATUS, Z
        GOTO    RF1
        ADDLW   -1
        BTFSC   STATUS, Z
        GOTO    RF2
        MOVLW   0x07
        MOVWF   LATB
        RETURN
RF2
        MOVLW   0x0B
        MOVWF   LATB
        RETURN
RF1
        MOVLW   0x0D
        MOVWF   LATB
        RETURN
RF0
        MOVLW   0x0E
        MOVWF   LATB
        RETURN

PROCESAR_TECLADO
        CALL    ESCANEAR_TECLADO

        MOVF    tecla, W
        BZ      TECLA_LIBERADA

        MOVF    tecla, W
        XORWF   tecla_ant, W
        BTFSS   STATUS, Z
        GOTO    REINICIAR_DEBOUNCE

        INCF    cont_debounce, F
        MOVF    cont_debounce, W
        SUBLW   1                   ; Disparar cuando cont_debounce >= 2
        BTFSC   STATUS, C
        RETURN

        BTFSC   tecla_activa, 0
        RETURN

        MOVF    tecla, W
        MOVWF   tecla_pendiente
        BSF     tecla_activa, 0
        BSF     nueva_tecla, 0
        RETURN

REINICIAR_DEBOUNCE
        MOVF    tecla, W
        MOVWF   tecla_ant
        CLRF    cont_debounce
        RETURN

TECLA_LIBERADA
        CLRF    tecla_ant
        CLRF    cont_debounce
        CLRF    tecla_pendiente
        CLRF    tecla_activa
        RETURN

;--- LCD 4 bit -------------------------------------------------------------

LCD_INIT
        CALL    RETARDO_LARGO
        MOVLW   0x03
        CALL    LCD_NIBBLE
        CALL    RETARDO_CORTO
        MOVLW   0x03
        CALL    LCD_NIBBLE
        CALL    RETARDO_CORTO
        MOVLW   0x03
        CALL    LCD_NIBBLE
        MOVLW   0x02
        CALL    LCD_NIBBLE
        MOVLW   0x28
        CALL    LCD_CMD
        MOVLW   0x0C
        CALL    LCD_CMD
        MOVLW   0x01
        CALL    LCD_CMD
        RETURN

LCD_CMD
        BCF     LATD, 2             ; RS = 0
        GOTO    LCD_WRITE

LCD_DAT
        BSF     LATD, 2             ; RS = 1

LCD_WRITE
        MOVWF   lcd_byte
        SWAPF   lcd_byte, W
        CALL    LCD_NIBBLE
        MOVF    lcd_byte, W
        CALL    LCD_NIBBLE
        CALL    RETARDO_CORTO
        RETURN

LCD_NIBBLE
        ANDLW   0x0F
        MOVWF   lcd_tmp
        MOVF    lcd_tmp, W
        ADDWF   lcd_tmp, F
        ADDWF   lcd_tmp, F
        ADDWF   lcd_tmp, F
        ADDWF   lcd_tmp, F            ; nibble << 4
        MOVF    LATD, W
        ANDLW   0x0F
        IORWF   lcd_tmp, W
        MOVWF   LATD
        BSF     LATD, 3
        CALL    RETARDO_CORTO
        BCF     LATD, 3
        RETURN

RETARDO_CORTO
        MOVLW   0x30
        MOVWF   dly
D1
        DECFSZ  dly, F
        GOTO    D1
        RETURN

RETARDO_MS
        MOVLW   0x20
        MOVWF   fila_idx
DMS
        CALL    RETARDO_CORTO
        DECFSZ  fila_idx, F
        GOTO    DMS
        RETURN

RETARDO_LARGO
        MOVLW   0x08
        MOVWF   dly
DL
        CALL    RETARDO_MS
        DECFSZ  dly, F
        GOTO    DL
        RETURN

;==============================================================================
; RUTINAS DE INTERRUPCION
;==============================================================================

ISR_TMR0
        MOVFF   WREG, W_TEMP
        MOVFF   STATUS, STATUS_TEMP
        MOVFF   BSR, BSR_TEMP

        BTFSS   INTCON, TMR0IF
        GOTO    SALIR_ISR

        BCF     INTCON, TMR0IF
        CALL    CARGAR_TIMER0
        CALL    PROCESAR_TECLADO

SALIR_ISR
        MOVFF   BSR_TEMP, BSR
        MOVFF   STATUS_TEMP, STATUS
        MOVFF   W_TEMP, WREG
        RETFIE

        END
