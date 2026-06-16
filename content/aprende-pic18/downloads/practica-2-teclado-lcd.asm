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
; Alumno: _________________________  Seccion: ______  Fecha: __________
;==============================================================================

        LIST    P=18F4550
        #include <P18F4550.INC>

        CONFIG  FOSC = HS
        CONFIG  WDT  = OFF
        CONFIG  LVP  = OFF
        CONFIG  PBADEN = OFF

        cblock 0x20
            tecla
            nueva_tecla
            fila_idx
            col_idx
            lcd_tmp
            lcd_byte
            dly
        endc

        ORG     0x0000
        GOTO    inicio

        ORG     0x0008
        GOTO    isr_alta

; Tabla fila x columna (fila 0..3, col 0..3)
tabla_teclas:
        DB      '1','2','3','A'
        DB      '4','5','6','B'
        DB      '7','8','9','C'
        DB      '*','0','#','D'

;==============================================================================
inicio:
        MOVLW   0x0F
        MOVWF   ADCON1

        CLRF    nueva_tecla
        CLRF    LATD
        MOVLW   0xF0
        MOVWF   TRISB             ; columnas entrada, filas salida
        CLRF    TRISD

        CALL    lcd_init
        MOVLW   0x80
        CALL    lcd_cmd
        MOVLW   'T'
        CALL    lcd_dat
        MOVLW   'E'
        CALL    lcd_dat
        MOVLW   'C'
        CALL    lcd_dat
        MOVLW   'L'
        CALL    lcd_dat
        MOVLW   'A'
        CALL    lcd_dat
        MOVLW   ':'
        CALL    lcd_dat

        BCF     INTCON2, RBPU
        BSF     INTCON, RBIE
        BSF     INTCON, GIE

bucle:
        BTFSS   nueva_tecla, 0
        GOTO    bucle
        BCF     nueva_tecla, 0
        CALL    retardo_ms
        CALL    escanear_teclado
        MOVF    tecla, W
        BZ      bucle
        CALL    lcd_dat
        GOTO    bucle

;==============================================================================
escanear_teclado:
        CLRF    tecla
        CLRF    fila_idx
f_loop:
        MOVF    fila_idx, W
        CALL    poner_fila
        CALL    retardo_corto
        CLRF    col_idx
        BTFSC   PORTB, 4
        GOTO    try_c1
        MOVLW   0
        GOTO    key_found
try_c1:
        BTFSC   PORTB, 5
        GOTO    try_c2
        MOVLW   1
        GOTO    key_found
try_c2:
        BTFSC   PORTB, 6
        GOTO    try_c3
        MOVLW   2
        GOTO    key_found
try_c3:
        BTFSC   PORTB, 7
        GOTO    c_next
        MOVLW   3
        GOTO    key_found
key_found:
        MOVWF   col_idx
        MOVF    fila_idx, W
        MULLW   4
        MOVF    col_idx, W
        ADDWF   PRODL, W
        ADDLW   tabla_teclas
        MOVWF   TBLPTRL
        MOVLW   HIGH(tabla_teclas)
        MOVWF   TBLPTRH
        MOVLW   UPPER(tabla_teclas)
        MOVWF   TBLPTRU
        TBLRD   *
        MOVF    TABLAT, W
        MOVWF   tecla
        RETURN
c_next:
        INCF    fila_idx, F
        MOVF    fila_idx, W
        SUBLW   3
        BTFSS   STATUS, C
        GOTO    f_loop
        RETURN

poner_fila:
        ADDLW   0
        BTFSC   STATUS, Z
        GOTO    rf0
        ADDLW   -1
        BTFSC   STATUS, Z
        GOTO    rf1
        ADDLW   -1
        BTFSC   STATUS, Z
        GOTO    rf2
        MOVLW   0x07
        MOVWF   LATB
        RETURN
rf2:
        MOVLW   0x0B
        MOVWF   LATB
        RETURN
rf1:
        MOVLW   0x0D
        MOVWF   LATB
        RETURN
rf0:
        MOVLW   0x0E
        MOVWF   LATB
        RETURN

;==============================================================================
isr_alta:
        BCF     INTCON, RBIF
        MOVF    PORTB, W
        BSF     nueva_tecla, 0
        RETFIE

;==============================================================================
lcd_init:
        CALL    retardo_largo
        MOVLW   0x03
        CALL    lcd_nibble
        CALL    retardo_corto
        MOVLW   0x03
        CALL    lcd_nibble
        CALL    retardo_corto
        MOVLW   0x03
        CALL    lcd_nibble
        MOVLW   0x02
        CALL    lcd_nibble
        MOVLW   0x28
        CALL    lcd_cmd
        MOVLW   0x0C
        CALL    lcd_cmd
        MOVLW   0x01
        CALL    lcd_cmd
        RETURN

lcd_cmd:
        BCF     LATD, 2             ; RS = 0
        GOTO    lcd_write

lcd_dat:
        BSF     LATD, 2             ; RS = 1

lcd_write:
        MOVWF   lcd_byte
        SWAPF   lcd_byte, W
        CALL    lcd_nibble
        MOVF    lcd_byte, W
        CALL    lcd_nibble
        CALL    retardo_corto
        RETURN

lcd_nibble:
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
        CALL    retardo_corto
        BCF     LATD, 3
        RETURN

retardo_corto:
        MOVLW   0x30
        MOVWF   dly
d1:     DECFSZ  dly, F
        GOTO    d1
        RETURN

retardo_ms:
        MOVLW   0x20
        MOVWF   fila_idx
dms:    CALL    retardo_corto
        DECFSZ  fila_idx, F
        GOTO    dms
        RETURN

retardo_largo:
        MOVLW   0x08
        MOVWF   dly
dl:     CALL    retardo_ms
        DECFSZ  dly, F
        GOTO    dl
        RETURN

        END
